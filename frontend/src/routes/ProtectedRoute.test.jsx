import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const renderProtectedRoute = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<h1>Profil privat</h1>} />
          </Route>
          <Route path="/login" element={<h1>Form Login</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe("ProtectedRoute", () => {
  it("redirects to login when there is no token", () => {
    renderProtectedRoute();

    expect(screen.getByRole("heading", { name: "Form Login" })).toBeInTheDocument();
  });

  it("redirects and clears stored auth credentials when the session expires", async () => {
    localStorage.setItem("accessToken", "expired-access");
    localStorage.setItem("token", "legacy-access");
    localStorage.setItem("refreshToken", "expired-refresh");
    localStorage.setItem("user", JSON.stringify({ id: "user-1" }));

    renderProtectedRoute();
    expect(
      screen.getByRole("heading", { name: "Profil privat" }),
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("auth:expired"));
    });

    expect(
      await screen.findByRole("heading", { name: "Form Login" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
