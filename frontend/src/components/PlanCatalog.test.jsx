import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import API from "../api/axios";
import PlanCatalog from "./PlanCatalog";
import { useAuth } from "../context/AuthContext";
import { openSnapCheckout } from "../api/midtransSnap";

vi.mock("../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../api/midtransSnap", () => ({ openSnapCheckout: vi.fn() }));

const CATALOG = {
  currency: "IDR",
  purchasable: false,
  plans: [
    { code: "weekly", name: "Premium Mingguan", duration_days: 7, price: 15000, discount: null, final_price: 15000 },
    {
      code: "monthly", name: "Premium Bulanan", duration_days: 30, price: 49900,
      discount: { type: "percentage", value: 12.5, amount: 6238 }, final_price: 43662,
    },
    {
      code: "yearly", name: "Premium Tahunan", duration_days: 365, price: 399000,
      discount: { type: "flat", value: 100000, amount: 100000 }, final_price: 299000,
    },
  ],
};

beforeEach(() => {
  API.get.mockReset();
  API.post.mockReset();
  openSnapCheckout.mockReset();
  openSnapCheckout.mockResolvedValue(undefined);
  useAuth.mockReturnValue({ isAuthenticated: false });
});

const row = (name) => screen.getByText(name).closest("li");
const renderCatalog = () => render(
  <MemoryRouter>
    <Routes>
      <Route path="/" element={<PlanCatalog />} />
      <Route path="/login" element={<p>Halaman masuk</p>} />
    </Routes>
  </MemoryRouter>,
);

const mockPurchasableCatalog = (entitlement = { plan: "free", package: null }) => {
  API.get.mockImplementation((path) => {
    if (path === "/subscription/plans") {
      return Promise.resolve({ data: { data: { ...CATALOG, purchasable: true } } });
    }
    if (path === "/subscription/me") return Promise.resolve({ data: { data: entitlement } });
    return Promise.reject(new Error(`Unexpected endpoint: ${path}`));
  });
};

describe("PlanCatalog", () => {
  it("menampilkan harga dari server: harga coret hanya bila ada diskon", async () => {
    API.get.mockResolvedValueOnce({ data: { data: CATALOG } });
    renderCatalog();

    expect(await screen.findByText("Premium Mingguan")).toBeInTheDocument();
    expect(API.get).toHaveBeenCalledWith("/subscription/plans");

    expect(within(row("Premium Mingguan")).getByText("7 hari")).toBeInTheDocument();
    expect(within(row("Premium Mingguan")).getByText("Rp15.000")).not.toHaveClass("line-through");
    expect(within(row("Premium Mingguan")).queryByText(/Hemat/)).not.toBeInTheDocument();

    expect(within(row("Premium Bulanan")).getByText("Rp49.900")).toHaveClass("line-through");
    expect(within(row("Premium Bulanan")).getByText("Rp43.662")).toBeInTheDocument();
    expect(within(row("Premium Bulanan")).getByText("Hemat 12,5%")).toBeInTheDocument();

    expect(within(row("Premium Tahunan")).getByText("Rp399.000")).toHaveClass("line-through");
    expect(within(row("Premium Tahunan")).getByText("Rp299.000")).toBeInTheDocument();
    expect(within(row("Premium Tahunan")).getByText("Hemat Rp100.000")).toBeInTheDocument();

    expect(screen.getByText("Pembelian paket segera tersedia.")).toBeInTheDocument();
  });

  it("katalog yang belum dapat dibeli hanya menampilkan informasi tanpa memulai checkout", async () => {
    API.get.mockResolvedValueOnce({ data: { data: CATALOG } });
    renderCatalog();
    await screen.findByText("Premium Mingguan");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(API.post).not.toHaveBeenCalled();
    expect(screen.getByText("Pembelian paket segera tersedia.")).toBeInTheDocument();
  });

  it("katalog kosong tidak dirender; gagal memuat menampilkan pesan", async () => {
    API.get.mockResolvedValueOnce({ data: { data: { ...CATALOG, plans: [] } } });
    const { container, unmount } = renderCatalog();
    expect(screen.getByText("Memuat daftar paket...")).toBeInTheDocument();
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
    unmount();

    API.get.mockRejectedValueOnce(new Error("network"));
    renderCatalog();
    expect(await screen.findByText("Daftar paket gagal dimuat.")).toBeInTheDocument();
  });

  it("pengunjung diarahkan ke login sebelum membeli paket", async () => {
    mockPurchasableCatalog();
    renderCatalog();
    await screen.findByText("Premium Tahunan");
    expect(screen.queryByText(/segera tersedia/)).not.toBeInTheDocument();
    fireEvent.click(within(row("Premium Tahunan")).getByRole("button", { name: "Masuk untuk membeli" }));
    expect(screen.getByText("Halaman masuk")).toBeInTheDocument();
    expect(API.post).not.toHaveBeenCalled();
  });

  it("checkout mengirim paket yang dipilih hanya setelah konfirmasi", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    mockPurchasableCatalog();
    API.post.mockResolvedValueOnce({ data: { data: {} } });
    renderCatalog();
    await screen.findByText("Premium Bulanan");
    fireEvent.click(within(row("Premium Bulanan")).getByRole("button", { name: "Beli paket" }));

    const confirmation = screen.getByRole("dialog", { name: "Lanjutkan ke pembayaran?" });
    expect(within(confirmation).getByText("Premium Bulanan")).toBeInTheDocument();
    expect(within(confirmation).getByText("Rp43.662")).toBeInTheDocument();
    expect(API.post).not.toHaveBeenCalled();
    fireEvent.click(within(confirmation).getByRole("button", { name: "Lanjut bayar" }));

    await waitFor(() => expect(API.post).toHaveBeenCalledExactlyOnceWith(
      "/subscription/payments/checkout", { package: "monthly" },
    ));
    expect(openSnapCheckout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("paket aktif menonaktifkan pembelian baru", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    mockPurchasableCatalog({
      plan: "premium", package: "monthly", active_until: "2026-12-31T00:00:00Z",
    });
    renderCatalog();
    const buttons = await screen.findAllByRole("button", { name: "Paket sedang aktif" });
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => expect(button).toBeDisabled());
    expect(API.post).not.toHaveBeenCalled();
  });
});
