import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import EditProfile from "./EditProfile";

const mockedNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

function createLocalStorageMock() {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("EditProfile Component", () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("merender form Edit Profile dengan tombol panah kembali di dalam card dan tanpa tombol batal", () => {
    renderWithRouter(<EditProfile />);
    expect(screen.getByTitle("Kembali ke Profil")).toBeInTheDocument();
    expect(screen.getByText("Nama Lengkap")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Jenjang Belajar")).toBeInTheDocument();

    // Tombol Batal sudah dihapus
    expect(screen.queryByRole("button", { name: /^batal$/i })).not.toBeInTheDocument();

    // Awalnya tidak ada perubahan sehingga tombol Simpan Perubahan tidak muncul
    expect(screen.queryByRole("button", { name: /Simpan Perubahan/i })).not.toBeInTheDocument();
    expect(screen.getByText("Tidak ada perubahan data")).toBeInTheDocument();
  });

  it("menavigasi kembali ke /profile saat tombol panah kembali di pojok kiri atas card diklik", () => {
    renderWithRouter(<EditProfile />);
    const backBtn = screen.getByTitle("Kembali ke Profil");
    fireEvent.click(backBtn);
    expect(mockedNavigate).toHaveBeenCalledWith("/profile");
  });

  it("memunculkan tombol Simpan Perubahan hanya ketika ada perubahan data (nama, email, atau jenjang)", () => {
    renderWithRouter(<EditProfile />);
    const nameInput = screen.getByPlaceholderText(/Contoh: MD Rafi Islam/i);

    // Sebelum diubah, belum ada tombol Simpan Perubahan
    expect(screen.queryByRole("button", { name: /Simpan Perubahan/i })).not.toBeInTheDocument();

    // Ubah nama
    fireEvent.change(nameInput, { target: { value: "Ahmad Dahlan" } });

    // Tombol Simpan Perubahan sekarang muncul
    expect(screen.getByRole("button", { name: /Simpan Perubahan/i })).toBeInTheDocument();
  });

  it("memperbarui pratinjau jenjang secara real-time saat dropdown diubah dan memunculkan tombol simpan", () => {
    renderWithRouter(<EditProfile />);
    const selectEl = screen.getByLabelText("Jenjang Belajar");

    fireEvent.change(selectEl, { target: { value: "SMA" } });
    expect(screen.getByText("Siswa SMA")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Simpan Perubahan/i })).toBeInTheDocument();
  });

  it("menampilkan pesan error saat nama dikosongkan dan disubmit", async () => {
    renderWithRouter(<EditProfile />);
    const nameInput = screen.getByPlaceholderText(/Contoh: MD Rafi Islam/i);

    // Ubah nama menjadi kosong (terjadi perubahan sehingga tombol simpan muncul)
    fireEvent.change(nameInput, { target: { value: "" } });
    const submitBtn = screen.getByRole("button", { name: /Simpan Perubahan/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Nama tidak boleh kosong.")).toBeInTheDocument();
  });

  it("menampilkan pesan error saat format email tidak valid", async () => {
    renderWithRouter(<EditProfile />);
    const emailInput = screen.getByPlaceholderText(/nama@email.com/i);

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    const submitBtn = screen.getByRole("button", { name: /Simpan Perubahan/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(
        "Format email tidak valid (harus mengandung '@' dan domain yang valid)."
      )
    ).toBeInTheDocument();
  });

  it("menolak file foto dengan format tidak valid atau ukuran lebih dari 2MB", () => {
    renderWithRouter(<EditProfile />);
    const fileInput = document.getElementById("photo-file-input");

    // File pdf (format salah)
    const invalidFile = new File(["dummy"], "file.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    expect(screen.getByText("Format file harus JPG atau PNG.")).toBeInTheDocument();

    // File gambar > 2MB
    const bigFile = new File(["a".repeat(2.5 * 1024 * 1024)], "foto.png", {
      type: "image/png",
    });
    fireEvent.change(fileInput, { target: { files: [bigFile] } });
    expect(screen.getByText("Ukuran file maksimal 2MB.")).toBeInTheDocument();
  });

  it("menyimpan perubahan profil dan mengarahkan kembali ke /profile", async () => {
    renderWithRouter(<EditProfile />);
    const nameInput = screen.getByPlaceholderText(/Contoh: MD Rafi Islam/i);
    const emailInput = screen.getByPlaceholderText(/nama@email.com/i);
    const selectEl = screen.getByLabelText("Jenjang Belajar");

    fireEvent.change(nameInput, { target: { value: "Budi Santoso" } });
    fireEvent.change(emailInput, { target: { value: "budi@santoso.com" } });
    fireEvent.change(selectEl, { target: { value: "SMP" } });

    const submitBtn = screen.getByRole("button", { name: /Simpan Perubahan/i });
    fireEvent.click(submitBtn);

    await waitFor(
      () => {
        expect(
          screen.getByText(/Profil berhasil diperbarui!/i)
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(localStorage.getItem("user_name")).toBe("Budi Santoso");
    expect(localStorage.getItem("user_email")).toBe("budi@santoso.com");
    expect(localStorage.getItem("user_education_level")).toBe("SMP");
  });
});
