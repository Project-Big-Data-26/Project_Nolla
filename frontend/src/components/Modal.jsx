import React from "react";
import { X } from "lucide-react";

/**
 * Wrapper modal generik (overlay gelap + kartu putih + tombol tutup X).
 * Dibuat karena Topics.jsx punya 8 modal yang markup pembungkusnya identik
 * persis (overlay, posisi tombol X, border, shadow) — cuma beda isi & lebar.
 *
 * Props:
 * - onClose: dipanggil saat tombol X diklik
 * - maxWidth: kelas Tailwind lebar kartu, default "max-w-md" (modal hasil pretest/posttest pakai "max-w-lg")
 * - scrollable: true untuk modal yang isinya panjang (perlu scroll internal), dipakai di modal hasil pretest/posttest
 */
const Modal = ({ onClose, maxWidth = "max-w-md", scrollable = false, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
        <div
            className={`bg-neutral-card border border-neutral-border rounded-2xl ${maxWidth} w-full p-6 shadow-2xl relative ${scrollable ? "max-h-[90vh] overflow-y-auto" : ""
                }`}
        >
            <button
                onClick={onClose}
                className="absolute right-4 top-4 p-1.5 text-neutral-muted hover:text-neutral-text rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            >
                <X className="w-5 h-5" />
            </button>

            {children}
        </div>
    </div>
);

export default Modal;