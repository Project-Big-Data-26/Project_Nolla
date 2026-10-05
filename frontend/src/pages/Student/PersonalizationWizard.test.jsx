import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import PersonalizationWizard from "./PersonalizationWizard";
import { AuthProvider } from "../../context/AuthContext";

const mockedNavigate = vi.fn();
const mockedToast = vi.hoisted(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockedNavigate };
});

vi.mock("sonner", () => ({
    toast: mockedToast,
    Toaster: () => null,
}));

function renderWizard() {
    return render(
        <AuthProvider>
            <MemoryRouter initialEntries={["/personalization"]}>
                <Routes>
                    <Route path="/personalization" element={<PersonalizationWizard />} />
                    <Route path="/topik" element={<h1>Halaman Topik</h1>} />
                </Routes>
            </MemoryRouter>
        </AuthProvider>
    );
}

function selectOption(label) {
    fireEvent.click(screen.getByText(label).closest("div[class*='cursor-pointer']"));
}

const mockFetch = (body, ok = true) =>
    vi.fn().mockResolvedValue({ ok, json: async () => body });

describe("PersonalizationWizard", () => {
    beforeEach(() => {
        mockedNavigate.mockReset();
        Object.values(mockedToast).forEach((fn) => fn.mockReset());
        localStorage.setItem("accessToken", "token-abc");
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorage.clear();
    });

    it("merender tanpa crash", () => {
        renderWizard();
    });

    it("menampilkan judul dan 3 pilihan jenjang pendidikan", () => {
        renderWizard();
        expect(screen.getByText("Pilih Jenjang Pendidikanmu")).toBeInTheDocument();
        expect(screen.getByText("Sekolah Dasar (SD)")).toBeInTheDocument();
        expect(screen.getByText("Kelas 1 - 6")).toBeInTheDocument();
        expect(screen.getByText("Kelas 7 - 9")).toBeInTheDocument();
        expect(screen.getByText("Kelas 10 - 12")).toBeInTheDocument();
        expect(screen.getAllByText("Sekolah Menengah (SMP)")).toHaveLength(1);
        expect(screen.getAllByText("Sekolah Menengah (SMA)")).toHaveLength(1);
    });

    it("menampilkan tombol Lewati dan tombol simpan", () => {
        renderWizard();
        expect(screen.getByRole("button", { name: "Lewati" })).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Simpan & Mulai Belajar →" })
        ).toBeInTheDocument();
    });

    it("mengalihkan pengguna yang sudah menyelesaikan personalisasi ke topik", () => {
        localStorage.setItem("user", JSON.stringify({ isProfileComplete: true }));
        renderWizard();

        expect(screen.getByRole("heading", { name: "Halaman Topik" })).toBeInTheDocument();
    });

    it("menampilkan peringatan dan tidak memanggil API bila belum memilih jenjang", () => {
        const fetchMock = mockFetch({ status: "success" });
        vi.stubGlobal("fetch", fetchMock);
        renderWizard();

        fireEvent.click(screen.getByRole("button", { name: "Simpan & Mulai Belajar →" }));

        expect(mockedToast.warning).toHaveBeenCalledWith(
            "Pilih Jenjang Pendidikan",
            expect.any(Object)
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("mengirim educationLevel yang dipilih lalu mengarahkan ke dashboard", async () => {
        const fetchMock = mockFetch({ status: "success" });
        vi.stubGlobal("fetch", fetchMock);
        renderWizard();

        selectOption("Sekolah Dasar (SD)");
        fireEvent.click(screen.getByRole("button", { name: "Simpan & Mulai Belajar →" }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toContain("/api/personalization");
        expect(options.headers.Authorization).toBe("Bearer token-abc");
        expect(JSON.parse(options.body)).toEqual({ educationLevel: "sd" });

        await waitFor(() => expect(mockedToast.success).toHaveBeenCalled());
        await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith("/"), {
            timeout: 2000,
        });
    });

    it("menampilkan error bila server menolak penyimpanan", async () => {
        vi.stubGlobal("fetch", mockFetch({ status: "error", message: "Gagal" }, false));
        renderWizard();

        selectOption("Sekolah Menengah (SMP)");
        fireEvent.click(screen.getByRole("button", { name: "Simpan & Mulai Belajar →" }));

        await waitFor(() => expect(mockedToast.error).toHaveBeenCalled());
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    it("Lewati mengirim skipAllJenjang lalu mengarahkan ke /topik", async () => {
        const fetchMock = mockFetch({ status: "success" });
        vi.stubGlobal("fetch", fetchMock);
        renderWizard();

        fireEvent.click(screen.getByRole("button", { name: "Lewati" }));

        await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith("/topik"));
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
            skipAllJenjang: true,
        });
    });
});
