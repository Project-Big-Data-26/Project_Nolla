import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import Navbar from "./Navbar";
import avatar2 from "../assets/avatar/avatar2.svg";

const mockedAuth = vi.hoisted(() => ({
  logout: vi.fn(),
  user: { name: "Siswa", avatar: "avatar_2" },
}));
const mockedToast = vi.hoisted(() => ({
  dismiss: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: mockedAuth.user, logout: mockedAuth.logout }),
}));

vi.mock("sonner", () => ({ toast: mockedToast }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("Navbar logout", () => {
  beforeEach(() => {
    mockedAuth.logout.mockReset();
    Object.values(mockedToast).forEach((mock) => mock.mockReset());
    localStorage.setItem("accessToken", "access-token");
    localStorage.setItem("refreshToken", "refresh-token");
  });

  it("menggunakan avatar dari AuthContext", () => {
    render(
      <MemoryRouter initialEntries={["/topik"]}>
        <Routes>
          <Route path="/topik" element={<Navbar />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("img", { name: "Avatar Siswa" })).toHaveAttribute(
      "src",
      avatar2,
    );
  });

  it("menampilkan message backend sebelum pindah ke halaman login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Logout berhasil" }),
      }),
    );

    render(
      <MemoryRouter initialEntries={["/topik"]}>
        <Routes>
          <Route path="/topik" element={<Navbar />} />
          <Route path="/login" element={<h1>Halaman Login</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTitle("Keluar"));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Ya, Keluar" }));

    await waitFor(() =>
      expect(mockedToast.success).toHaveBeenCalledWith("Logout berhasil"),
    );
    expect(mockedToast.dismiss).toHaveBeenCalled();
    expect(await screen.findByRole("heading", { name: "Halaman Login" })).toBeInTheDocument();
    expect(mockedAuth.logout).toHaveBeenCalledOnce();
  });
});
