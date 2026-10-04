import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../../context/AuthContext";
import "@testing-library/jest-dom";
import EditProfile from "./EditProfile";
import API from "../../../api/axios";

vi.mock("../../../api/axios", () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

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
  return render(<MemoryRouter><AuthProvider>{ui}</AuthProvider></MemoryRouter>);
}

// Jenjang dipilih lewat dropdown kustom (tombol + popover), bukan <select>
function pilihJenjang(nama) {
  fireEvent.click(screen.getByRole("button", { name: /Jenjang Belajar/i }));
  fireEvent.click(screen.getByRole("button", { name: nama }));
}

describe("EditProfile Component", () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
    vi.stubGlobal("localStorage", createLocalStorageMock());
    // Profil dari server sama dengan data awal di localStorage (tidak ada perubahan)
    API.get.mockReset().mockImplementation(() => new Promise(() => {}));
    API.patch.mockReset();
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
    pilihJenjang("SMA");
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

  it("menetapkan email sebagai view-only (readOnly) dan tidak dapat diedit", () => {
    renderWithRouter(<EditProfile />);
    const emailInput = document.getElementById("email-input");
    expect(emailInput).toHaveAttribute("readonly");
    expect(emailInput).toHaveClass("cursor-not-allowed");
    expect(emailInput).toHaveAttribute("title", "Email akun bersifat permanen dan tidak dapat diubah");
  });

  it("dapat memilih avatar yang disediakan dari preset", () => {
    renderWithRouter(<EditProfile />);
    fireEvent.click(screen.getByRole("button", { name: "Ganti Avatar" }));
    expect(screen.getByText("Pilih Avatar Karakter")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Pilih Avatar 2"));
    fireEvent.click(screen.getByRole("button", { name: "Pilih Avatar" }));

    // Memunculkan tombol Simpan Perubahan karena foto berubah
    expect(screen.getByRole("button", { name: /Simpan Perubahan/i })).toBeInTheDocument();
  });

  it("menyediakan 8 avatar preset dan tidak ada input unggah file", () => {
    renderWithRouter(<EditProfile />);
    fireEvent.click(screen.getByRole("button", { name: "Ganti Avatar" }));

    for (let i = 1; i <= 8; i += 1) {
      expect(screen.getByTitle(`Pilih Avatar ${i}`)).toBeInTheDocument();
    }
    expect(document.getElementById("photo-file-input")).toBeNull();
  });

  it("menyimpan perubahan profil lewat API dan memperbarui localStorage", async () => {
    API.patch.mockResolvedValue({
      data: {
        data: {
          name: "Budi Santoso",
          email: "guest@mathmentor.app",
          allJenjang: false,
          jenjang_id: { name: "SMP" },
          avatar: "avatar_1",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });
    renderWithRouter(<EditProfile />);
    const nameInput = screen.getByPlaceholderText(/Contoh: MD Rafi Islam/i);

    fireEvent.change(nameInput, { target: { value: "Budi Santoso" } });
    pilihJenjang("SMP");

    fireEvent.click(screen.getByRole("button", { name: /Simpan Perubahan/i }));

    await waitFor(() => expect(API.patch).toHaveBeenCalledTimes(1));
    expect(API.patch).toHaveBeenCalledWith(
      "/profile",
      expect.objectContaining({
        name: "Budi Santoso",
        allJenjang: false,
        jenjang_id: "SMP",
      }),
    );

    await waitFor(() =>
      expect(localStorage.getItem("user_name")).toBe("Budi Santoso"),
    );
    expect(localStorage.getItem("user_education_level")).toBe("SMP");
    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith("/profile"), {
      timeout: 2000,
    });
  });
});
