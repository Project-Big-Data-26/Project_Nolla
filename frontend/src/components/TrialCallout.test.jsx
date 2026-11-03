import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import API from "../api/axios";
import TrialCallout from "./TrialCallout";

vi.mock("../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const freePlan = (trialAvailable = true) => ({
  plan: "free",
  is_trial: false,
  package: null,
  active_until: null,
  trial: { available: trialAvailable, started_at: null, ends_at: null },
  limits: { quiz_sessions_per_subbab: 3 },
});

const openConfirm = () =>
  fireEvent.click(screen.getByRole("button", { name: /Coba Premium 3 Hari Gratis/ }));

beforeEach(() => {
  API.post.mockReset();
});

describe("TrialCallout", () => {
  it("konfirmasi: tombol aktif hanya setelah centang, lalu trial diaktifkan", async () => {
    const activated = { ...freePlan(false), plan: "premium", is_trial: true };
    API.post.mockResolvedValueOnce({ data: { data: activated } });
    const onActivated = vi.fn();
    const onConfirmChange = vi.fn();
    render(
      <TrialCallout
        entitlement={freePlan()}
        onActivated={onActivated}
        onConfirmChange={onConfirmChange}
      />,
    );

    openConfirm();
    expect(onConfirmChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("heading", { name: "Coba Premium 3 Hari" })).toBeInTheDocument();
    expect(screen.getByText(/satu kali per akun/)).toBeInTheDocument();
    expect(screen.getByText(/3 hari \(72 jam\)/)).toBeInTheDocument();
    expect(API.post).not.toHaveBeenCalled();

    const activate = screen.getByRole("button", { name: /Aktifkan Trial/ });
    expect(activate).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /trial hanya sekali per akun/ }));
    expect(activate).toBeEnabled();

    fireEvent.click(activate);
    await waitFor(() => expect(onActivated).toHaveBeenCalledWith(activated));
    expect(API.post).toHaveBeenCalledWith("/subscription/trial");
  });

  it("Kembali menutup konfirmasi dan mereset centang", () => {
    const onConfirmChange = vi.fn();
    render(<TrialCallout entitlement={freePlan()} onConfirmChange={onConfirmChange} />);

    openConfirm();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Kembali" }));
    expect(onConfirmChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    openConfirm();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: /Aktifkan Trial/ })).toBeDisabled();
  });

  it("menampilkan pesan 409 tanpa memanggil onActivated", async () => {
    API.post.mockRejectedValueOnce(
      Object.assign(new Error("409"), {
        response: {
          status: 409,
          data: { code: "TRIAL_ALREADY_USED", message: "Trial premium sudah pernah digunakan." },
        },
      }),
    );
    const onActivated = vi.fn();
    render(<TrialCallout entitlement={freePlan()} onActivated={onActivated} />);
    openConfirm();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Aktifkan Trial/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Trial premium sudah pernah digunakan.");
    expect(onActivated).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Aktifkan Trial/ })).toBeEnabled();
  });

  it("trial terpakai: info tanpa tombol; premium/tanpa entitlement: kosong", () => {
    const { container, rerender } = render(<TrialCallout entitlement={freePlan(false)} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/Trial premium sudah digunakan/)).toBeInTheDocument();

    rerender(<TrialCallout entitlement={{ ...freePlan(), plan: "premium" }} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<TrialCallout entitlement={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
