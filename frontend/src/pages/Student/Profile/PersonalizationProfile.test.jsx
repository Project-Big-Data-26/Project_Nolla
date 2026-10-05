import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../../context/AuthContext";
import API from "../../../api/axios";
import PersonalizationProfile from "./PersonalizationProfile";
import "@testing-library/jest-dom";

vi.mock("../../../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

// Navbar memanggil /profile sendiri; di-mock agar mock API hanya dipakai halaman ini.
vi.mock("../../../components/Navbar", () => ({ default: () => null }));

const createLocalStorageMock = () => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
};

const renderProfile = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <PersonalizationProfile />
      </AuthProvider>
    </MemoryRouter>,
  );

describe("PersonalizationProfile", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("sessionStorage", createLocalStorageMock());
    API.get.mockReset();
    API.post.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the displayed profile identity and avatar from the backend", async () => {
    localStorage.setItem("user_name", "Stale Local Name");
    localStorage.setItem("user_email", "stale@example.com");
    localStorage.setItem("user_education_level", "SD");
    localStorage.setItem("user_photo", "stale-photo.png");
    API.get.mockResolvedValue({
      data: {
        data: {
          name: "Server Profile Name",
          email: "server@example.com",
          allJenjang: false,
          jenjang_id: { name: "SMA" },
          avatar: "avatar_2",
        },
      },
    });

    renderProfile();

    await waitFor(() => expect(API.get).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Server Profile Name")).toBeInTheDocument();
    expect(screen.getByText("server@example.com")).toBeInTheDocument();
    expect(screen.getByText("SMA")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Foto Profil" }).getAttribute("src"))
      .not.toBe("stale-photo.png");
    expect(API.get).toHaveBeenCalledWith("/profile");
    expect(screen.queryByText("Stale Local Name")).not.toBeInTheDocument();
  });

  it("shows a server error and retries loading the profile", async () => {
    API.get
      .mockRejectedValueOnce({
        response: { data: { message: "Profil tidak dapat dimuat." } },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            name: "Recovered Profile",
            email: "recovered@example.com",
            allJenjang: true,
            jenjang_id: null,
            avatar: "avatar_1",
          },
        },
      });

    renderProfile();
  await waitFor(() => expect(API.get).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Profil tidak dapat dimuat.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(await screen.findByText("Recovered Profile")).toBeInTheDocument();
    expect(screen.getByText("Semua")).toBeInTheDocument();
    await waitFor(() => expect(API.get).toHaveBeenCalledTimes(2));
  });
});
