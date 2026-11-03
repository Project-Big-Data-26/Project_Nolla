import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import API from "../api/axios";
import PlanCatalog from "./PlanCatalog";

vi.mock("../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

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
});

const row = (name) => screen.getByText(name).closest("li");

describe("PlanCatalog", () => {
  it("menampilkan harga dari server: harga coret hanya bila ada diskon", async () => {
    API.get.mockResolvedValueOnce({ data: { data: CATALOG } });
    render(<PlanCatalog />);

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

  it("kartu paket bisa dipilih satu per satu walau belum bisa dibeli", async () => {
    API.get.mockResolvedValueOnce({ data: { data: CATALOG } });
    render(<PlanCatalog />);
    const weekly = await screen.findByRole("button", { name: /Premium Mingguan/ });
    const yearly = screen.getByRole("button", { name: /Premium Tahunan/ });
    expect(weekly).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(weekly);
    expect(weekly).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(yearly);
    expect(yearly).toHaveAttribute("aria-pressed", "true");
    expect(weekly).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Pembelian paket segera tersedia.")).toBeInTheDocument();
  });

  it("katalog kosong tidak dirender; gagal memuat menampilkan pesan", async () => {
    API.get.mockResolvedValueOnce({ data: { data: { ...CATALOG, plans: [] } } });
    const { container, unmount } = render(<PlanCatalog />);
    expect(screen.getByText("Memuat daftar paket...")).toBeInTheDocument();
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
    unmount();

    API.get.mockRejectedValueOnce(new Error("network"));
    render(<PlanCatalog />);
    expect(await screen.findByText("Daftar paket gagal dimuat.")).toBeInTheDocument();
  });

  it("tanpa tombol beli nonaktif bila purchasable", async () => {
    API.get.mockResolvedValueOnce({ data: { data: { ...CATALOG, purchasable: true } } });
    render(<PlanCatalog />);
    await screen.findByText("Premium Tahunan");
    expect(screen.queryByText(/segera tersedia/)).not.toBeInTheDocument();
  });
});
