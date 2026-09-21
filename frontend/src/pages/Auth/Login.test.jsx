import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Login from "./Login";

function renderWithRouter(ui) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Login", () => {
    it("merender tanpa crash", () => {
        renderWithRouter(<Login />);
    });

    it("menampilkan judul halaman login", () => {
        renderWithRouter(<Login />);
        expect(screen.getByText("Masuk ke Akun Anda")).toBeInTheDocument();
    });

    it("menampilkan field email dan password", () => {
        renderWithRouter(<Login />);
        expect(screen.getByPlaceholderText("Alamat Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Kata Sandi")).toBeInTheDocument();
    });

    it("mengisi field email dan password saat diketik", () => {
        renderWithRouter(<Login />);
        const emailInput = screen.getByPlaceholderText("Alamat Email");
        const passwordInput = screen.getByPlaceholderText("Kata Sandi");

        fireEvent.change(emailInput, { target: { value: "user@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "rahasia123" } });

        expect(emailInput).toHaveValue("user@example.com");
        expect(passwordInput).toHaveValue("rahasia123");
    });

    it("password tersembunyi secara default (type=password)", () => {
        renderWithRouter(<Login />);
        const passwordInput = screen.getByPlaceholderText("Kata Sandi");
        expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("menampilkan password saat tombol mata diklik", () => {
        renderWithRouter(<Login />);
        const passwordInput = screen.getByPlaceholderText("Kata Sandi");
        // tombol toggle tidak punya accessible name, jadi ambil lewat query button di sebelah input
        const toggleButton = passwordInput.parentElement.querySelector("button");

        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute("type", "text");

        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("mencentang checkbox remember me saat diklik", () => {
        renderWithRouter(<Login />);
        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).not.toBeChecked();

        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
    });

    it("memanggil handler submit dengan data form saat form disubmit", () => {
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });
        renderWithRouter(<Login />);

        const emailInput = screen.getByPlaceholderText("Alamat Email");
        const passwordInput = screen.getByPlaceholderText("Kata Sandi");
        fireEvent.change(emailInput, { target: { value: "user@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "rahasia123" } });

        const submitButton = screen.getByRole("button", { name: "Masuk" });
        fireEvent.click(submitButton);

        expect(consoleSpy).toHaveBeenCalledWith(
            "Login Data:",
            expect.objectContaining({
                email: "user@example.com",
                password: "rahasia123",
            })
        );

        consoleSpy.mockRestore();
    });

    it("menampilkan link menuju halaman register", () => {
        renderWithRouter(<Login />);
        const registerLink = screen.getByText("Buat akun baru");
        expect(registerLink).toBeInTheDocument();
        expect(registerLink.closest("a")).toHaveAttribute("href", "/register");
    });
});