import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PersonalizationWizard from "./PersonalizationWizard";

function selectOption(label) {
    fireEvent.click(screen.getByText(label).closest("button"));
}

function goToStep2() {
    selectOption("SD");
    fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));
}

describe("PersonalizationWizard", () => {
    it("merender tanpa crash", () => {
        render(<PersonalizationWizard onFinish={() => { }} />);
    });

    it("step 1: menampilkan judul dan 3 pilihan jenjang pendidikan", () => {
        render(<PersonalizationWizard onFinish={() => { }} />);
        expect(
            screen.getByText("Hai, kenalan dulu yuk!")
        ).toBeInTheDocument();
        expect(screen.getByText("SD")).toBeInTheDocument();
        expect(screen.getByText("SMP")).toBeInTheDocument();
        expect(screen.getByText("SMA")).toBeInTheDocument();
    });

    it("step 1: indikator step 1 aktif (highlighted), step 2 belum", () => {
        render(<PersonalizationWizard onFinish={() => { }} />);
        expect(screen.getByText("1 Jenjang Pendidikan")).toHaveClass(
            "text-primary"
        );
        expect(screen.getByText("2 Tujuan Belajar")).not.toHaveClass(
            "text-primary"
        );
    });

    it('tombol "Lanjut →" disabled sebelum memilih jenjang pendidikan', () => {
        render(<PersonalizationWizard onFinish={() => { }} />);
        expect(screen.getByRole("button", { name: "Lanjut →" })).toBeDisabled();
    });

    it('tombol "Lanjut →" aktif setelah memilih salah satu jenjang', () => {
        render(<PersonalizationWizard onFinish={() => { }} />);
        selectOption("SMA");
        expect(
            screen.getByRole("button", { name: "Lanjut →" })
        ).not.toBeDisabled();
    });

    it("pindah ke step 2 setelah klik Lanjut, menampilkan judul dan 5 pilihan tujuan belajar", () => {
        render(<PersonalizationWizard onFinish={() => { }} />);
        goToStep2();

        expect(screen.getByText("Apa tujuan belajarmu?")).toBeInTheDocument();
        expect(screen.getByText("Meningkatkan nilai")).toBeInTheDocument();
        expect(screen.getByText("Belajar hal baru")).toBeInTheDocument();
        expect(screen.getByText("Persiapan ujian")).toBeInTheDocument();
        expect(screen.getByText("Memahami materi sulit")).toBeInTheDocument();
        expect(screen.getByText("Persiapan karier")).toBeInTheDocument();

        // step 1 sudah tidak dirender lagi
        expect(
            screen.queryByText("Hai, kenalan dulu yuk!")
        ).not.toBeInTheDocument();
    });

    it("step 2: indikator step 2 yang aktif setelah pindah step", () => {
        render(<PersonalizationWizard onFinish={() => { }} />);
        goToStep2();

        expect(screen.getByText("2 Tujuan Belajar")).toHaveClass("text-primary");
        expect(screen.getByText("1 Jenjang Pendidikan")).not.toHaveClass(
            "text-primary"
        );
    });

    it('step 2: tombol "Lanjut →" (finish) disabled sebelum memilih tujuan belajar', () => {
        render(<PersonalizationWizard onFinish={() => { }} />);
        goToStep2();

        expect(screen.getByRole("button", { name: "Lanjut →" })).toBeDisabled();
    });

    it('tombol "← Kembali" mengembalikan ke step 1', () => {
        render(<PersonalizationWizard onFinish={() => { }} />);
        goToStep2();

        fireEvent.click(screen.getByRole("button", { name: "← Kembali" }));

        expect(screen.getByText("Hai, kenalan dulu yuk!")).toBeInTheDocument();
        expect(
            screen.queryByText("Apa tujuan belajarmu?")
        ).not.toBeInTheDocument();
    });

    it("memanggil onFinish dengan educationLevel dan learningGoal yang dipilih", () => {
        const onFinish = vi.fn();
        render(<PersonalizationWizard onFinish={onFinish} />);

        goToStep2();
        selectOption("Persiapan ujian");
        fireEvent.click(screen.getByRole("button", { name: "Lanjut →" }));

        expect(onFinish).toHaveBeenCalledWith({
            educationLevel: "sd",
            learningGoal: "exams",
        });
    });

    it("menampilkan tombol Lewati", () => {
        render(<PersonalizationWizard onFinish={() => { }} />);
        expect(screen.getByRole("button", { name: "Lewati" })).toBeInTheDocument();
    });
});