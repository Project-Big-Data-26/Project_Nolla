import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Register from "./Register";

function renderWithRouter(ui) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function fillValidForm() {
    fireEvent.change(screen.getByPlaceholderText("Nama Lengkap"), {
        target: { value: "Budi Santoso" },
    });
    fireEvent.change(screen.getByPlaceholderText("Alamat Email"), {
        target: { value: "budi@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Kata Sandi"), {
        target: { value: "Rahasia123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Konfirmasi Kata Sandi"), {
        target: { value: "Rahasia123" },
    });
}

describe("Register", () => {
    it("merender tanpa crash", () => {
        renderWithRouter(<Register />);
    });

    it("menampilkan judul halaman register", () => {
        renderWithRouter(<Register />);
        expect(screen.getByText("Buat Akun Baru")).toBeInTheDocument();
    });

    it("menampilkan tombol kembali ke landing page", () => {
        renderWithRouter(<Register />);
        const homeLink = screen.getByRole("link", { name: "Kembali ke Beranda" });
        expect(homeLink).toHaveAttribute("href", "/");
    });

    it("menampilkan 4 field: nama, email, password, konfirmasi password", () => {
        renderWithRouter(<Register />);
        expect(screen.getByPlaceholderText("Nama Lengkap")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Alamat Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Kata Sandi")).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText("Konfirmasi Kata Sandi")
        ).toBeInTheDocument();
    });

    it("mengisi field registrasi tanpa persetujuan syarat wajib", () => {
        renderWithRouter(<Register />);
        fillValidForm();

        expect(screen.getByPlaceholderText("Nama Lengkap")).toHaveValue(
            "Budi Santoso"
        );
        expect(screen.getByPlaceholderText("Alamat Email")).toHaveValue(
            "budi@example.com"
        );
        expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
        expect(screen.getByText(/Minimal 8 karakter/)).toBeInTheDocument();
    });

    it("password dan konfirmasi password tersembunyi secara default", () => {
        renderWithRouter(<Register />);
        expect(screen.getByPlaceholderText("Kata Sandi")).toHaveAttribute(
            "type",
            "password"
        );
        expect(
            screen.getByPlaceholderText("Konfirmasi Kata Sandi")
        ).toHaveAttribute("type", "password");
    });

    it("toggle show/hide untuk field password bekerja independen dari konfirmasi password", () => {
        renderWithRouter(<Register />);
        const passwordInput = screen.getByPlaceholderText("Kata Sandi");
        const confirmInput = screen.getByPlaceholderText("Konfirmasi Kata Sandi");
        const passwordToggle = passwordInput.parentElement.querySelector("button");
        const confirmToggle = confirmInput.parentElement.querySelector("button");

        fireEvent.click(passwordToggle);
        expect(passwordInput).toHaveAttribute("type", "text");
        expect(confirmInput).toHaveAttribute("type", "password"); // tidak ikut berubah

        fireEvent.click(confirmToggle);
        expect(confirmInput).toHaveAttribute("type", "text");
    });

    it("menampilkan alert dan TIDAK submit kalau password tidak cocok", () => {
        const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => { });
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });
        renderWithRouter(<Register />);

        // isi semua field required lainnya, biar validasi HTML5 (required)
        // tidak memblokir submit sebelum handleSubmit sempat jalan
        fireEvent.change(screen.getByPlaceholderText("Nama Lengkap"), {
            target: { value: "Budi Santoso" },
        });
        fireEvent.change(screen.getByPlaceholderText("Alamat Email"), {
            target: { value: "budi@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("Kata Sandi"), {
            target: { value: "Rahasia123" },
        });
        fireEvent.change(screen.getByPlaceholderText("Konfirmasi Kata Sandi"), {
            target: { value: "beda123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Daftar Akun" }));

        expect(screen.getByText("Kata sandi dan konfirmasi kata sandi tidak cocok!")).toBeInTheDocument();
        expect(consoleSpy).not.toHaveBeenCalled();

        alertSpy.mockRestore();
        consoleSpy.mockRestore();
    });

    it("menolak password yang tidak memiliki huruf besar", () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch");
        renderWithRouter(<Register />);

        fillValidForm();
        fireEvent.change(screen.getByPlaceholderText("Kata Sandi"), {
            target: { value: "rahasia123" },
        });
        fireEvent.change(screen.getByPlaceholderText("Konfirmasi Kata Sandi"), {
            target: { value: "rahasia123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Daftar Akun" }));

        expect(screen.getByText(/huruf besar, huruf kecil, serta angka/)).toBeInTheDocument();
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    it("menampilkan link menuju halaman login", () => {
        renderWithRouter(<Register />);
        const loginLink = screen.getByText("Masuk di sini");
        expect(loginLink).toBeInTheDocument();
        expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
    });
});