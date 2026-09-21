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

    it("BUG: prop `padding` TIDAK mengubah padding aktual — class selalu p-6 walau `padding` diisi beda", () => {
        // Developer bermaksud prop `padding` bisa override padding default (lihat
        // pemakaian di Dashboard.jsx: <SectionCard padding="p-5" ...>), tapi
        // implementasi saat ini hardcode "p-6" di className dan tidak pernah
        // membaca prop `padding` sama sekali. Akibatnya kartu manapun yang
        // mengirim prop `padding` (mis. "p-5") tetap dapat padding p-6, dan
        // prop tsb malah ikut ke-spread jadi atribut HTML asing lewat {...props}.
        // Test ini didokumentasikan sebagai bug, bukan perilaku yang diharapkan.
        const { container } = render(
            <SectionCard padding="p-5">
                <span>konten</span>
            </SectionCard>
        );

        expect(container.firstChild).toHaveClass("p-6");
        expect(container.firstChild).not.toHaveClass("p-5");
        // prop `padding` malah nyasar jadi atribut HTML di elemen, bukan class
        expect(container.firstChild).toHaveAttribute("padding", "p-5");
    });
});