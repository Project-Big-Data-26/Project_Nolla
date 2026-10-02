import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SectionCard from "./SectionCard";

describe("SectionCard", () => {
    it("merender children di dalamnya", () => {
        render(
            <SectionCard>
                <p>Isi konten</p>
            </SectionCard>
        );
        expect(screen.getByText("Isi konten")).toBeInTheDocument();
    });

    it("default merender sebagai <div>", () => {
        const { container } = render(
            <SectionCard>
                <span>konten</span>
            </SectionCard>
        );
        expect(container.firstChild.tagName).toBe("DIV");
    });

    it('prop "as" mengganti tag pembungkus (mis. "section")', () => {
        const { container } = render(
            <SectionCard as="section">
                <span>konten</span>
            </SectionCard>
        );
        expect(container.firstChild.tagName).toBe("SECTION");
    });

    it("menerapkan class dasar (rounded-2xl, border, bg-neutral-card, p-6, shadow-xs)", () => {
        const { container } = render(
            <SectionCard>
                <span>konten</span>
            </SectionCard>
        );
        expect(container.firstChild).toHaveClass(
            "rounded-2xl",
            "border",
            "border-neutral-border",
            "bg-neutral-card",
            "p-6",
            "shadow-xs"
        );
    });

    it("menggabungkan className tambahan dengan class dasar", () => {
        const { container } = render(
            <SectionCard className="relative overflow-hidden">
                <span>konten</span>
            </SectionCard>
        );
        expect(container.firstChild).toHaveClass(
            "rounded-2xl",
            "relative",
            "overflow-hidden"
        );
    });

    it("meneruskan prop lain (mis. data-testid, onClick) ke elemen pembungkus", () => {
        const { container } = render(
            <SectionCard data-testid="my-card" id="card-1">
                <span>konten</span>
            </SectionCard>
        );
        expect(container.firstChild).toHaveAttribute("data-testid", "my-card");
        expect(container.firstChild).toHaveAttribute("id", "card-1");
    });

    it("default padding adalah p-6 kalau prop `padding` tidak diisi", () => {
        const { container } = render(
            <SectionCard>
                <span>konten</span>
            </SectionCard>
        );
        expect(container.firstChild).toHaveClass("p-6");
    });

    it("prop `padding` meng-override padding default (mis. jadi p-5)", () => {
        // Fix untuk bug yang sempat ditemukan (2026-09-21): sebelumnya prop
        // `padding` tidak pernah dibaca oleh komponen, jadi kartu manapun yang
        // mengirim padding custom (lihat pemakaian di Dashboard.jsx:
        // <SectionCard padding="p-5" ...>) tetap dapat p-6. Sekarang prop
        // `padding` benar-benar menentukan class padding yang diterapkan.
        const { container } = render(
            <SectionCard padding="p-5">
                <span>konten</span>
            </SectionCard>
        );

        expect(container.firstChild).toHaveClass("p-5");
        expect(container.firstChild).not.toHaveClass("p-6");
        // prop `padding` tidak lagi nyasar jadi atribut HTML asing
        expect(container.firstChild).not.toHaveAttribute("padding");
    });
});