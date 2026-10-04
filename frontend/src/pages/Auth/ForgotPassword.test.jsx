import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import ForgotPassword from "./ForgotPassword";

function renderWithRouter(ui) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// CATATAN PENTING:
// ForgotPassword.jsx punya bug: variable `API` dipakai di handleSubmit
// (baris ~21) tapi tidak pernah di-import. Developer sudah menandai ini
// dengan komentar TODO. Akibatnya, submit form SELALU gagal saat ini
// (ReferenceError tertangkap try/catch, muncul pesan error generic).
//
// Karena itu, test skenario "submit berhasil / kode OTP terkirim" belum
// bisa ditulis sampai bug ini diperbaiki (perlu import instance API/axios
// yang benar). Sudah dilaporkan terpisah ke tim.

describe("ForgotPassword", () => {
    it("merender tanpa crash", () => {
        renderWithRouter(<ForgotPassword />);
    });

    it("menampilkan judul halaman", () => {
        renderWithRouter(<ForgotPassword />);
        expect(screen.getByText("Lupa Kata Sandi")).toBeInTheDocument();
    });

    it("menampilkan field email", () => {
        renderWithRouter(<ForgotPassword />);
        expect(
            screen.getByPlaceholderText("Alamat Email Terdaftar")
        ).toBeInTheDocument();
    });

    it("mengisi field email saat diketik", () => {
        renderWithRouter(<ForgotPassword />);
        const emailInput = screen.getByPlaceholderText("Alamat Email Terdaftar");
        fireEvent.change(emailInput, { target: { value: "user@example.com" } });
        expect(emailInput).toHaveValue("user@example.com");
    });

    it("tombol submit menampilkan teks default sebelum disubmit", () => {
        renderWithRouter(<ForgotPassword />);
        expect(
            screen.getByRole("button", { name: "Kirim Kode OTP" })
        ).toBeInTheDocument();
    });

    it("menampilkan link kembali ke halaman login", () => {
        renderWithRouter(<ForgotPassword />);
        const backLink = screen.getByText("Kembali ke Login");
        expect(backLink).toBeInTheDocument();
        expect(backLink.closest("a")).toHaveAttribute("href", "/login");
    });

    // TODO (blocked): test untuk skenario submit sukses (loading state,
    // pesan sukses, redirect ke /reset-password) baru bisa ditulis setelah
    // bug import `API` yang hilang di ForgotPassword.jsx diperbaiki.
});