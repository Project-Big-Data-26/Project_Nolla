import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { AuthProvider } from "../../context/AuthContext";
import Login from "./Login";

const mockedToast = vi.hoisted(() => ({
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
}));

vi.mock("sonner", () => ({
    toast: mockedToast,
    Toaster: () => null,
}));

function renderWithRouter(ui, initialEntries = ["/"]) {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
    );
}

afterEach(() => {
    vi.unstubAllGlobals();
    Object.values(mockedToast).forEach((fn) => fn.mockReset());
});

describe("Login", () => {
    it("merender tanpa crash", () => {
        renderWithRouter(<Login />);
    });

    it("menampilkan judul halaman login", () => {
        renderWithRouter(<Login />);
        expect(screen.getByText("Masuk ke Akun Anda")).toBeInTheDocument();
    });

    it("menampilkan pesan sukses login dari controller", async () => {
        localStorage.clear();
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                status: "success",
                message: "Login berhasil dari controller",
                data: {
                    accessToken: "access-token",
                    refreshToken: "refresh-token",
                    user: { isProfileComplete: true },
                },
            }),
        }));
        renderWithRouter(<Login />);

        fireEvent.change(screen.getByPlaceholderText("Alamat Email"), {
            target: { value: "user@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("Kata Sandi"), {
            target: { value: "rahasia123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

        await waitFor(() =>
            expect(mockedToast.success).toHaveBeenCalledWith(
                "Login berhasil dari controller",
            ),
        );
    });

    it("menampilkan tombol kembali ke landing page", () => {
        renderWithRouter(<Login />);
        const homeLink = screen.getByRole("link", { name: "Kembali ke Beranda" });
        expect(homeLink).toHaveAttribute("href", "/");
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

    it("mengirim pilihan ingat saya saat login", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ status: "error", message: "Login gagal" }),
        });
        vi.stubGlobal("fetch", fetchMock);
        renderWithRouter(<Login />);

        const emailInput = screen.getByPlaceholderText("Alamat Email");
        const passwordInput = screen.getByPlaceholderText("Kata Sandi");
        fireEvent.change(emailInput, { target: { value: "user@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "rahasia123" } });
        fireEvent.click(screen.getByRole("checkbox"));
        fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
                email: "user@example.com",
                password: "rahasia123",
                rememberMe: true,
            });
    });

    it("menampilkan link menuju halaman register", () => {
        renderWithRouter(<Login />);
        const registerLink = screen.getByText("Buat akun baru");
        expect(registerLink).toBeInTheDocument();
        expect(registerLink.closest("a")).toHaveAttribute("href", "/register");
    });
});
