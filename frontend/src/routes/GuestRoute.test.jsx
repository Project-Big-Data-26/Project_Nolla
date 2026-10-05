import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import { AuthProvider } from "../context/AuthContext";
import GuestRoute from "./GuestRoute";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const renderGuestRoute = (path = "/login") =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<h1>Form Login</h1>} />
            <Route path="/register" element={<h1>Form Registrasi</h1>} />
          </Route>
          <Route path="/topik" element={<h1>Halaman Topik</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe("GuestRoute", () => {
  it("menampilkan halaman login untuk pengguna yang belum login", () => {
    renderGuestRoute();

    expect(screen.getByRole("heading", { name: "Form Login" })).toBeInTheDocument();
  });

  it("mengalihkan pengguna yang sudah login ke halaman topik", () => {
    localStorage.setItem("accessToken", "valid-access-token");
    renderGuestRoute();

    expect(screen.getByRole("heading", { name: "Halaman Topik" })).toBeInTheDocument();
  });

  it("mengalihkan pengguna yang sudah login dari halaman registrasi", () => {
    localStorage.setItem("accessToken", "valid-access-token");
    renderGuestRoute("/register");

    expect(screen.getByRole("heading", { name: "Halaman Topik" })).toBeInTheDocument();
  });
});