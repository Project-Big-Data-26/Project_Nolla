import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import ResetPassword from "./ResetPassword";

// Untuk test yang perlu verifikasi navigate("/login") beneran terjadi,
// render dengan Routes supaya ada halaman "/login" tujuan yang bisa dicek.
function renderWithRoutes() {
    return render(
        <MemoryRouter initialEntries={[{
            pathname: "/reset-password",
            state: { email: "budi@example.com", resetToken: "valid-token" },
        }]}>
            <Routes>
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/login" element={<div>Halaman Login</div>} />
            </Routes>
        </MemoryRouter>
    );
}

function renderPlain() {
    return render(
        <MemoryRouter initialEntries={[{
            pathname: "/reset-password",
            state: { email: "budi@example.com", resetToken: "valid-token" },
        }]}>
            <ResetPassword />
        </MemoryRouter>
    );
}

describe("ResetPassword", () => {
    it("merender tanpa crash", () => {
        renderPlain();
    });

    it("menampilkan judul halaman", () => {
        renderPlain();
        expect(screen.getByText("Atur Ulang Kata Sandi")).toBeInTheDocument();
    });

    it("menampilkan field password baru dan konfirmasi", () => {
        renderPlain();
        expect(screen.getByPlaceholderText("Kata Sandi Baru")).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText("Konfirmasi Kata Sandi Baru")
        ).toBeInTheDocument();
    });

    it("mengisi kedua field saat diketik", () => {
        renderPlain();
        const newPasswordInput = screen.getByPlaceholderText("Kata Sandi Baru");
        const confirmInput = screen.getByPlaceholderText(
            "Konfirmasi Kata Sandi Baru"
        );

        fireEvent.change(newPasswordInput, { target: { value: "sandiBaru123" } });
        fireEvent.change(confirmInput, { target: { value: "sandiBaru123" } });

        expect(newPasswordInput).toHaveValue("sandiBaru123");
        expect(confirmInput).toHaveValue("sandiBaru123");
    });

    it("toggle show/hide bekerja independen untuk kedua field password", () => {
        renderPlain();
        const newPasswordInput = screen.getByPlaceholderText("Kata Sandi Baru");
        const confirmInput = screen.getByPlaceholderText(
            "Konfirmasi Kata Sandi Baru"
        );
        const newPasswordToggle =
            newPasswordInput.parentElement.querySelector("button");
        const confirmToggle = confirmInput.parentElement.querySelector("button");

        fireEvent.click(newPasswordToggle);
        expect(newPasswordInput).toHaveAttribute("type", "text");
        expect(confirmInput).toHaveAttribute("type", "password");

        fireEvent.click(confirmToggle);
        expect(confirmInput).toHaveAttribute("type", "text");
    });

    it("menampilkan error dan tetap berada di halaman jika password tidak cocok", () => {
        const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => { });
        renderWithRoutes();

        fireEvent.change(screen.getByPlaceholderText("Kata Sandi Baru"), {
            target: { value: "sandiBaru123" },
        });
        fireEvent.change(screen.getByPlaceholderText("Konfirmasi Kata Sandi Baru"), {
            target: { value: "beda456" },
        });
        fireEvent.click(
            screen.getByRole("button", { name: "Simpan Kata Sandi Baru" })
        );

        expect(screen.getByText("Konfirmasi kata sandi baru tidak cocok!")).toBeInTheDocument();
        expect(alertSpy).not.toHaveBeenCalled();
        // masih di halaman reset password, belum pindah ke login
        expect(screen.getByText("Atur Ulang Kata Sandi")).toBeInTheDocument();
        expect(screen.queryByText("Halaman Login")).not.toBeInTheDocument();

        alertSpy.mockRestore();
    });

    it("memvalidasi password sebelum mengirim perubahan", () => {
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });
        renderWithRoutes();

        fireEvent.change(screen.getByPlaceholderText("Kata Sandi Baru"), {
            target: { value: "sandiBaru123" },
        });
        fireEvent.change(screen.getByPlaceholderText("Konfirmasi Kata Sandi Baru"), {
            target: { value: "sandiBaru123" },
        });
        fireEvent.click(
            screen.getByRole("button", { name: "Simpan Kata Sandi Baru" })
        );

        expect(consoleSpy).not.toHaveBeenCalled();
        expect(screen.getByText(/Minimal 8 karakter/)).toBeInTheDocument();
        consoleSpy.mockRestore();
    });

    it("menampilkan link kembali ke halaman login", () => {
        renderPlain();
        const backLink = screen.getByText("Kembali ke Login");
        expect(backLink).toBeInTheDocument();
        expect(backLink.closest("a")).toHaveAttribute("href", "/login");
    });
});