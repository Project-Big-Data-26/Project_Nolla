import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import API from "../../../api/axios";
import Topics from "./Topics";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});
vi.mock("../../../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../../../components/Navbar", () => ({ default: () => <div aria-hidden="true" /> }));
vi.mock("../../../components/TopHeader", () => ({ default: () => <div /> }));

const FREE = {
  plan: "free",
  is_trial: false,
  active_until: null,
  trial: { available: true, started_at: null, ends_at: null },
  limits: { quiz_sessions_per_subbab: 3 },
};
const TRIAL = {
  ...FREE,
  plan: "premium",
  is_trial: true,
  active_until: new Date(Date.now() + 72 * 3_600_000).toISOString(),
  trial: { available: false, started_at: new Date().toISOString(), ends_at: null },
  limits: { quiz_sessions_per_subbab: null },
};

const babList = (plan) => [
  {
    id: "bab-1",
    name: "Bab Satu",
    display_order: 1,
    has_pretest: false,
    locked: false,
    lock_reason: null,
    total_subbab: 1,
    progress: 0,
    subbab: [],
  },
  {
    id: "bab-2",
    name: "Bab Dua",
    display_order: 2,
    has_pretest: false,
    locked: plan.plan === "free",
    lock_reason: plan.plan === "free" ? "premium_required" : null,
    total_subbab: 1,
    progress: 0,
    subbab: [],
  },
];

let currentPlan;

beforeEach(() => {
  sessionStorage.clear();
  navigate.mockClear();
  currentPlan = FREE;
  API.get.mockReset();
  API.post.mockReset();
  API.get.mockImplementation((path) => {
    if (path === "/dashboard/classes") {
      return Promise.resolve({ data: { data: { classes: [{ name: "Kelas 7", nomor_kelas: 7 }] } } });
    }
    if (path === "/dashboard/bab") {
      return Promise.resolve({ data: { data: babList(currentPlan), entitlement: currentPlan } });
    }
    return Promise.reject(new Error(`unexpected ${path}`));
  });
});

const babCalls = () => API.get.mock.calls.filter(([path]) => path === "/dashboard/bab").length;

describe("Topics — paket", () => {
  it("free: tanpa banner paket di header, kunci premium pada bab terakhir", async () => {
    render(<MemoryRouter><Topics /></MemoryRouter>);

    const lockedCard = (await screen.findByText("Bab Dua")).closest("article");
    expect(screen.queryByText(/Paket Free/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Coba Premium/ })).not.toBeInTheDocument();
    expect(API.get).not.toHaveBeenCalledWith("/subscription/plans");
    expect(within(lockedCard).getByRole("heading", { name: "Bab Dua, terkunci" })).toBeInTheDocument();
    expect(within(lockedCard).queryByRole("button", { name: "Mulai Pretest" })).not.toBeInTheDocument();

    const openCard = screen.getByText("Bab Satu").closest("article");
    expect(within(openCard).getByRole("button", { name: "Mulai Pretest" })).toBeInTheDocument();
  });

  it("aktivasi trial dari modal bab terkunci memuat ulang kunci dari server", async () => {
    render(<MemoryRouter><Topics /></MemoryRouter>);
    const lockedCard = (await screen.findByText("Bab Dua")).closest("article");
    const callsBefore = babCalls();

    fireEvent.click(within(lockedCard).getByRole("button", { name: "Lihat Paket" }));
    expect(screen.getByRole("heading", { name: "Bab terkunci" })).toBeInTheDocument();
    expect(screen.getByText(/Bab Dua hanya tersedia dengan Premium/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lihat paket Premium" })).toBeInTheDocument();
    expect(API.get).not.toHaveBeenCalledWith("/subscription/plans");

    API.post.mockImplementationOnce(() => {
      currentPlan = TRIAL;
      return Promise.resolve({ data: { data: TRIAL } });
    });
    fireEvent.click(screen.getByRole("button", { name: /Coba Premium 3 Hari Gratis/ }));
    // Konfirmasi menggantikan isi modal yang sama.
    expect(screen.queryByRole("heading", { name: "Bab terkunci" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Coba Premium 3 Hari" })).toBeInTheDocument();
    expect(API.post).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Aktifkan Trial/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Aktifkan Trial/ }));

    await waitFor(() => expect(API.post).toHaveBeenCalledWith("/subscription/trial"));
    await waitFor(() => expect(babCalls()).toBeGreaterThan(callsBefore));
    await waitFor(() =>
      expect(
        within(screen.getByText("Bab Dua").closest("article")).getByRole("button", { name: "Mulai Pretest" }),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole("heading", { name: "Coba Premium 3 Hari" })).not.toBeInTheDocument();
    expect(screen.queryByText("Trial Premium aktif")).not.toBeInTheDocument();
    expect(API.post).toHaveBeenCalledWith("/subscription/trial");
  });

  it("modal bab terkunci mengarahkan pengguna ke halaman paket", async () => {
    render(<MemoryRouter><Topics /></MemoryRouter>);
    const lockedCard = (await screen.findByText("Bab Dua")).closest("article");
    fireEvent.click(within(lockedCard).getByRole("button", { name: "Lihat Paket" }));
    fireEvent.click(screen.getByRole("button", { name: "Lihat paket Premium" }));
    expect(navigate).toHaveBeenCalledWith("/paket");
    expect(API.post).not.toHaveBeenCalled();
  });

  it("respons lama tanpa entitlement tidak menampilkan banner paket", async () => {
    API.get.mockImplementation((path) =>
      path === "/dashboard/classes"
        ? Promise.resolve({ data: { data: { classes: [{ name: "Kelas 7", nomor_kelas: 7 }] } } })
        : Promise.resolve({ data: { data: babList(TRIAL) } }),
    );
    render(<MemoryRouter><Topics /></MemoryRouter>);
    await screen.findByText("Bab Dua");
    expect(screen.queryByText("Paket Free")).not.toBeInTheDocument();
    expect(screen.queryByText(/Premium aktif/)).not.toBeInTheDocument();
  });
});
