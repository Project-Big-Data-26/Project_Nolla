import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import API from "../../../api/axios";
import { track } from "../../../analytics/client";
import Topics from "./Topics";

vi.mock("../../../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../../../analytics/client", () => ({ track: vi.fn() }));
vi.mock("../../../components/Navbar", () => ({ default: () => <div /> }));
vi.mock("../../../components/TopHeader", () => ({ default: () => <div /> }));

const classes = [6, 9, 10, 12].map((grade) => ({ name: `Kelas ${grade}`, nomor_kelas: grade }));
const chapter = (id, name) => ({ id, name, has_pretest: false, subbab: [] });
const babByKelas = {
  6: [chapter("bab-6", "Peluang kelas 6")],
  9: [chapter("bab-9", "Peluang dan Pemilihan Sampel")],
  10: [chapter("bab-10", "Peluang kelas 10")],
  12: [chapter("bab-12-1", "Peluang"), chapter("bab-12-2", "Analisis Data dan Peluang")],
};
const response = (chapters) => ({ data: { data: chapters } });
const defaultGet = (path, config) => {
  if (path === "/dashboard/classes") return Promise.resolve({ data: { data: { classes } } });
  if (path === "/dashboard/bab") return Promise.resolve(response(babByKelas[config?.params?.kelas] ?? []));
  return Promise.reject(new Error(`Unexpected API request: ${path}`));
};
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};
const filterEvents = () => track.mock.calls
  .filter(([name]) => name === "topic_filter_changed")
  .map(([, options]) => options.properties);
const expectFilterEvents = (expected) => waitFor(() => expect(filterEvents()).toEqual(expected));
const selectGrade = (label) => {
  fireEvent.click(screen.getByTitle("Filter Berdasarkan Kelas"));
  fireEvent.click(screen.getByRole("button", { name: label, exact: true }));
};
const renderLoaded = async ({ strict = false } = {}) => {
  const tree = <MemoryRouter><Topics /></MemoryRouter>;
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(5));
  fireEvent.change(screen.getByPlaceholderText(/search bab/i), { target: { value: "Peluang" } });
  return view;
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
  API.get.mockImplementation(defaultGet);
});
afterEach(cleanup);

describe("event analytics filter kelas", () => {
  it("menunggu hasil request kelas aktif sebelum mengirim event", async () => {
    await renderLoaded();
    const pending = deferred();
    API.get.mockImplementation((path, config) => (
      path === "/dashboard/bab" && config?.params?.kelas === 12
        ? pending.promise : defaultGet(path, config)
    ));
    selectGrade("Kelas 12");
    const premature = filterEvents().slice();
    await act(async () => pending.resolve(response(babByKelas[12])));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    expect(premature, "Data kelas baru belum tersedia saat request masih tertunda").toEqual([]);
    await expectFilterEvents([{ filter_name: "kelas", filter_value: "kelas_12", result_count: 2 }]);
  });

  it("jumlah hasil event sama dengan kartu akhir setelah pencarian dan filter", async () => {
    await renderLoaded();
    selectGrade("Kelas 12");
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    await expectFilterEvents([{
      filter_name: "kelas", filter_value: "kelas_12", result_count: screen.getAllByRole("article").length,
    }]);
  });

  it("respons lama yang terlambat tidak menghasilkan event untuk pilihan yang tergantikan", async () => {
    await renderLoaded();
    const old = deferred();
    const current = deferred();
    API.get.mockImplementation((path, config) => {
      if (path === "/dashboard/bab" && config?.params?.kelas === 12) return old.promise;
      if (path === "/dashboard/bab" && config?.params?.kelas === 9) return current.promise;
      return defaultGet(path, config);
    });
    selectGrade("Kelas 12");
    selectGrade("Kelas 9");
    await act(async () => current.resolve(response(babByKelas[9])));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(1));
    await act(async () => old.resolve(response(babByKelas[12])));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Peluang dan Pemilihan Sampel" })).toBeInTheDocument();
    await expectFilterEvents([{ filter_name: "kelas", filter_value: "kelas_9", result_count: 1 }]);
  });

  it("pergantian cepat A ke B ke A hanya memakai generasi request A yang terbaru", async () => {
    await renderLoaded();
    const firstA = deferred(), b = deferred(), latestA = deferred();
    let callsA = 0;
    API.get.mockImplementation((path, config) => {
      if (path === "/dashboard/bab" && config?.params?.kelas === 12) return ++callsA === 1 ? firstA.promise : latestA.promise;
      if (path === "/dashboard/bab" && config?.params?.kelas === 9) return b.promise;
      return defaultGet(path, config);
    });
    selectGrade("Kelas 12");
    selectGrade("Kelas 9");
    selectGrade("Kelas 12");
    await act(async () => {
      firstA.resolve(response([chapter("old-a", "Peluang lama")]));
      b.resolve(response(babByKelas[9]));
    });
    const beforeLatest = filterEvents().slice();
    await act(async () => latestA.resolve(response(babByKelas[12])));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    expect(beforeLatest, "Respons A lama bukan bukti hasil untuk aksi A terbaru").toEqual([]);
    await expectFilterEvents([{ filter_name: "kelas", filter_value: "kelas_12", result_count: 2 }]);
  });

  it("hasil kosong menghasilkan satu event dengan result_count nol", async () => {
    await renderLoaded();
    API.get.mockImplementation((path, config) => (
      path === "/dashboard/bab" && config?.params?.kelas === 12
        ? Promise.resolve(response([])) : defaultGet(path, config)
    ));
    selectGrade("Kelas 12");
    await screen.findByText("Tidak ada BAB yang cocok");
    await expectFilterEvents([{ filter_name: "kelas", filter_value: "kelas_12", result_count: 0 }]);
  });

  it("request gagal tidak dicatat sebagai hasil filter sukses", async () => {
    await renderLoaded();
    API.get.mockImplementation((path, config) => (
      path === "/dashboard/bab" && config?.params?.kelas === 12
        ? Promise.reject({ response: { data: { message: "Simulated fetch failure" } } })
        : defaultGet(path, config)
    ));
    selectGrade("Kelas 12");
    await screen.findByText("Simulated fetch failure");
    expect(filterEvents()).toEqual([]);
  });

  it("mount awal, render ulang, dan memilih kelas yang sama tidak menambah event", async () => {
    const view = await renderLoaded();
    expect(filterEvents()).toEqual([]);
    selectGrade("Semua Kelas (Default)");
    view.rerender(<MemoryRouter><Topics /></MemoryRouter>);
    expect(filterEvents()).toEqual([]);
    selectGrade("Kelas 12");
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    await waitFor(() => expect(filterEvents()).toHaveLength(1));
    const count = filterEvents().length;
    expect(count).toBe(1);
    selectGrade("Kelas 12");
    view.rerender(<MemoryRouter><Topics /></MemoryRouter>);
    expect(filterEvents()).toHaveLength(count);
  });

  it("kembali ke kelas yang pernah dimuat tetap menunggu hasil request baru", async () => {
    await renderLoaded();
    selectGrade("Kelas 12");
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    await expectFilterEvents([{ filter_name: "kelas", filter_value: "kelas_12", result_count: 2 }]);
    track.mockClear();
    const oldB = deferred(), latestA = deferred();
    API.get.mockImplementation((path, config) => {
      if (path === "/dashboard/bab" && config?.params?.kelas === 9) return oldB.promise;
      if (path === "/dashboard/bab" && config?.params?.kelas === 12) return latestA.promise;
      return defaultGet(path, config);
    });
    selectGrade("Kelas 9");
    selectGrade("Kelas 12");
    await act(async () => oldB.resolve(response(babByKelas[9])));
    const premature = filterEvents().slice();
    await act(async () => latestA.resolve(response([babByKelas[12][0]])));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(1));
    expect(premature).toEqual([]);
    await expectFilterEvents([{ filter_name: "kelas", filter_value: "kelas_12", result_count: 1 }]);
  });

  it("jumlah hasil mengikuti pencarian terbaru saat request filter masih berjalan", async () => {
    await renderLoaded();
    const pending = deferred();
    API.get.mockImplementation((path, config) => (
      path === "/dashboard/bab" && config?.params?.kelas === 12
        ? pending.promise : defaultGet(path, config)
    ));
    selectGrade("Kelas 12");
    fireEvent.change(screen.getByPlaceholderText(/search bab/i), { target: { value: "Analisis" } });
    await act(async () => pending.resolve(response(babByKelas[12])));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(1));
    await expectFilterEvents([{ filter_name: "kelas", filter_value: "kelas_12", result_count: 1 }]);
    expect(screen.getByRole("heading", { name: "Analisis Data dan Peluang" })).toBeInTheDocument();
  });

  it("filter yang gagal dapat dipilih ulang setelah pilihan lain tanpa event sukses palsu", async () => {
    await renderLoaded();
    let fail = true;
    API.get.mockImplementation((path, config) => (
      fail && path === "/dashboard/bab" && config?.params?.kelas === 12
        ? Promise.reject({ response: { data: { message: "Simulated retry failure" } } })
        : defaultGet(path, config)
    ));
    selectGrade("Kelas 12");
    await screen.findByText("Simulated retry failure");
    expect(filterEvents()).toEqual([]);
    selectGrade("Kelas 9");
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(1));
    fail = false;
    selectGrade("Kelas 12");
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    await expectFilterEvents([
      { filter_name: "kelas", filter_value: "kelas_9", result_count: 1 },
      { filter_name: "kelas", filter_value: "kelas_12", result_count: 2 },
    ]);
  });

  it("kembali ke Semua Kelas mencatat jumlah hasil akhir sekali", async () => {
    await renderLoaded();
    selectGrade("Kelas 12");
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    selectGrade("Semua Kelas (Default)");
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(5));
    await expectFilterEvents([
      { filter_name: "kelas", filter_value: "kelas_12", result_count: 2 },
      { filter_name: "kelas", filter_value: "semua_kelas", result_count: 5 },
    ]);
  });

  it("StrictMode tidak menggandakan event untuk satu perubahan filter", async () => {
    await renderLoaded({ strict: true });
    selectGrade("Kelas 12");
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    await expectFilterEvents([{ filter_name: "kelas", filter_value: "kelas_12", result_count: 2 }]);
  });

  it("respons setelah halaman ditinggalkan tidak mencatat hasil filter", async () => {
    const view = await renderLoaded();
    const pending = deferred();
    API.get.mockImplementation((path, config) => (
      path === "/dashboard/bab" && config?.params?.kelas === 12
        ? pending.promise : defaultGet(path, config)
    ));
    selectGrade("Kelas 12");
    view.unmount();
    await act(async () => pending.resolve(response(babByKelas[12])));
    expect(filterEvents()).toEqual([]);
  });
});
