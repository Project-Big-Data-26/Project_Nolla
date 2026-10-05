import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import VerifyEmail from "./VerifyEmail";

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({ login: vi.fn() }),
}));

const makeJsonResponse = (data, ok = true, status = 200) => ({
    ok,
    status,
    json: async () => data,
});

beforeEach(() => {
    vi.stubGlobal(
        "fetch",
        vi.fn(() => new Promise(() => {})),
    );
});

afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
});

function renderWithRoutes(initialEntries) {
    const entries = initialEntries.map((entry) =>
        typeof entry === "string" && entry === "/verify-email"
            ? { pathname: entry, state: { email: "budi@example.com" } }
            : entry,
    );

    return render(
        <MemoryRouter initialEntries={entries}>
            <Routes>
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/topik" element={<div>Halaman Pilihan Bab</div>} />
                <Route path="/login" element={<div>Halaman Login</div>} />
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
        expect(screen.getByRole("heading", { name: "Verifikasi Kode OTP" })).toBeInTheDocument();
    });

    it("mengalihkan ke login kalau dibuka tanpa email dari alur sebelumnya", () => {
        renderWithRoutes([{ pathname: "/verify-email" }]);
        expect(screen.getByText("Halaman Login")).toBeInTheDocument();
    });

    it("menampilkan email dari location state kalau ada", () => {
        renderWithRoutes([
            { pathname: "/verify-email", state: { email: "budi@example.com" } },
        ]);
        expect(screen.getByText("budi@example.com")).toBeInTheDocument();
    });

    it("mengambil sisa cooldown dari backend saat halaman verify dibuka", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            makeJsonResponse({
                status: "success",
                data: { canResend: false, resendAfterSeconds: 42 },
            }),
        );
        vi.stubGlobal("fetch", fetchMock);

        renderWithRoutes([
            { pathname: "/verify-email", state: { email: "budi@example.com" } },
        ]);

        expect(await screen.findByRole("button", {
            name: "Kirim ulang OTP dalam 0:42",
        })).toBeDisabled();
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/api\/auth\/otp-resend-status$/),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    email: "budi@example.com",
                    type: "EMAIL_VERIFICATION",
                }),
            }),
        );
    });

    it("memulihkan email dan jenis verifikasi dari session storage setelah refresh", async () => {
        sessionStorage.setItem("otpVerificationEmail", "budi@example.com");
        sessionStorage.setItem("otpVerificationAction", "reset-password");
        const fetchMock = vi.fn().mockResolvedValue(
            makeJsonResponse({
                status: "success",
                data: { canResend: false, resendAfterSeconds: 12 },
            }),
        );
        vi.stubGlobal("fetch", fetchMock);

        renderWithRoutes([{ pathname: "/verify-email" }]);

        expect(screen.getByText("budi@example.com")).toBeInTheDocument();
        expect(await screen.findByRole("button", {
            name: "Kirim ulang OTP dalam 0:12",
        })).toBeDisabled();
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/api\/auth\/otp-resend-status$/),
            expect.objectContaining({
                body: JSON.stringify({
                    email: "budi@example.com",
                    type: "PASSWORD_RESET",
                }),
            }),
        );
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

    it("menampilkan pesan validasi kalau OTP belum lengkap", () => {
        renderWithRoutes(["/verify-email"]);

        fireEvent.click(screen.getByRole("button", { name: "Verifikasi OTP" }));

        expect(screen.getByText("Harap masukkan 6 digit kode OTP secara lengkap!")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Verifikasi Kode OTP" })).toBeInTheDocument();
    });

    it("mengirim ulang OTP dengan jenis reset dan menerapkan cooldown dari API", async () => {
        const fetchMock = vi.fn((url) =>
            url.endsWith("/otp-resend-status")
                ? Promise.resolve(
                    makeJsonResponse({
                        status: "success",
                        data: { canResend: true, resendAfterSeconds: 0 },
                    }),
                )
                : Promise.resolve(
                    makeJsonResponse({
                        status: "success",
                        data: { resendAfterSeconds: 60 },
                    }),
                ),
        );
        vi.stubGlobal("fetch", fetchMock);
        renderWithRoutes([{
            pathname: "/verify-email",
            state: { email: "budi@example.com", action: "reset-password" },
        }]);

        await waitFor(() =>
            expect(
                screen.getByRole("button", { name: "Kirim ulang OTP" }),
            ).toBeEnabled(),
        );
        fireEvent.click(screen.getByRole("button", { name: "Kirim ulang OTP" }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
            "http://localhost:5000/api/auth/send-otp",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ email: "budi@example.com", type: "PASSWORD_RESET" }),
            }),
        ));
        expect(await screen.findByRole("button", { name: "Kirim ulang OTP dalam 1:00" })).toBeDisabled();
    });

    it("menampilkan link kembali ke halaman login", () => {
        renderWithRoutes(["/verify-email"]);
        const backLink = screen.getByText("Kembali ke Login");
        expect(backLink.closest("a")).toHaveAttribute("href", "/login");
    });
});