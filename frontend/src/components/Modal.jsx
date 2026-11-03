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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-in fade-in sm:p-4">
        <div
            className={`bg-neutral-card border border-neutral-border rounded-xl sm:rounded-2xl ${maxWidth} w-full p-4 sm:p-6 shadow-2xl relative ${scrollable ? "max-h-[calc(100dvh-1.5rem)] overflow-y-auto sm:max-h-[90vh]" : ""
                }`}
        >
            <button
                type="button"
                aria-label="Tutup"
                onClick={onClose}
                className="absolute right-3 top-3 p-1 text-neutral-muted hover:text-neutral-text rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer sm:right-4 sm:top-4 sm:p-1.5"
            >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {children}
        </div>
    </div>
);

export default Modal;
