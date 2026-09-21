import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import VerifyEmail from "./VerifyEmail";

function renderWithRoutes(initialEntries) {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <Routes>
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/dashboard" element={<div>Halaman Dashboard</div>} />
            </Routes>
        </MemoryRouter>
    );
}

function getOtpInputs() {
    // 6 kotak OTP adalah satu-satunya <input type="text"> di halaman ini
    return screen.getAllByRole("textbox");
}

describe("VerifyEmail", () => {
    it("merender tanpa crash", () => {
        renderWithRoutes(["/verify-email"]);
    });

    it("menampilkan judul halaman", () => {
        renderWithRoutes(["/verify-email"]);
        expect(
            screen.getByRole("heading", { name: "Verifikasi Email" })
        ).toBeInTheDocument();
    });

    it("menampilkan email default kalau tidak ada state yang dikirim", () => {
        renderWithRoutes(["/verify-email"]);
        expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("menampilkan email dari location state kalau ada", () => {
        renderWithRoutes([
            { pathname: "/verify-email", state: { email: "budi@example.com" } },
        ]);
        expect(screen.getByText("budi@example.com")).toBeInTheDocument();
    });

    it("menampilkan 6 kotak input OTP", () => {
        renderWithRoutes(["/verify-email"]);
        expect(getOtpInputs()).toHaveLength(6);
    });

    it("mengisi digit dan otomatis pindah fokus ke kotak berikutnya", () => {
        renderWithRoutes(["/verify-email"]);
        const inputs = getOtpInputs();

        fireEvent.change(inputs[0], { target: { value: "1" } });

        expect(inputs[0]).toHaveValue("1");
        expect(document.activeElement).toBe(inputs[1]);
    });

    it("menolak karakter non-angka", () => {
        renderWithRoutes(["/verify-email"]);
        const inputs = getOtpInputs();

        fireEvent.change(inputs[0], { target: { value: "a" } });

        expect(inputs[0]).toHaveValue("");
    });

    it("backspace di kotak kosong memindahkan fokus ke kotak sebelumnya", () => {
        renderWithRoutes(["/verify-email"]);
        const inputs = getOtpInputs();

        fireEvent.change(inputs[0], { target: { value: "1" } });
        // fokus sekarang otomatis di inputs[1] (kosong)
        fireEvent.keyDown(inputs[1], { key: "Backspace" });

        expect(document.activeElement).toBe(inputs[0]);
    });

    it("paste 6 digit sekaligus mengisi semua kotak", () => {
        renderWithRoutes(["/verify-email"]);
        const inputs = getOtpInputs();

        fireEvent.paste(inputs[0], {
            clipboardData: { getData: () => "123456" },
        });

        expect(inputs.map((input) => input.value).join("")).toBe("123456");
    });

    it("menampilkan alert kalau submit dengan OTP belum lengkap", () => {
        const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => { });
        renderWithRoutes(["/verify-email"]);

        fireEvent.click(screen.getByRole("button", { name: "Verifikasi Email" }));

        expect(alertSpy).toHaveBeenCalledWith(
            "Harap masukkan 6 digit kode OTP secara lengkap!"
        );
        // belum pindah halaman (pakai role "heading" biar tidak bentrok
        // dengan tombol submit yang teksnya juga "Verifikasi Email")
        expect(
            screen.getByRole("heading", { name: "Verifikasi Email" })
        ).toBeInTheDocument();

        alertSpy.mockRestore();
    });

    it("redirect ke /dashboard setelah OTP 6 digit lengkap disubmit", () => {
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });
        renderWithRoutes(["/verify-email"]);
        const inputs = getOtpInputs();

        fireEvent.paste(inputs[0], {
            clipboardData: { getData: () => "123456" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Verifikasi Email" }));

        expect(consoleSpy).toHaveBeenCalledWith(
            "Static OTP Verification:",
            expect.objectContaining({ otp: "123456" })
        );
        expect(screen.getByText("Halaman Dashboard")).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it("menampilkan link kembali ke halaman login", () => {
        renderWithRoutes(["/verify-email"]);
        const backLink = screen.getByText("Kembali ke Login");
        expect(backLink.closest("a")).toHaveAttribute("href", "/login");
    });
});