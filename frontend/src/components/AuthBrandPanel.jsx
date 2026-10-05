import React from "react";
import whiteOrangeLogo from "../assets/white_orange.png";

/**
 * Kolom kanan halaman Auth: banner primary dengan mockup jendela browser +
 * judul/deskripsi opsional di bawahnya.
 * - `title`/`description`: opsional. Kalau `title` gak dikasih, blok teks
 *   bawah gak dirender sama sekali (dipakai di Login.jsx yang gak ada teks
 *   di kolom kanannya, beda dari ForgotPassword.jsx yang ada).
 * Cuma tampil di layar lg ke atas (hidden di mobile), sama seperti aslinya.
 */
const AuthBrandPanel = ({ title, description }) => (
    <div className="relative isolate hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden bg-primary p-10 text-white">
        <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(78%,440px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20"
        >
            <div className="absolute inset-[12%] rounded-full border border-white/[0.14]" />
            <div className="absolute inset-[25%] rounded-full border border-white/[0.10]" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
            <img
                src={whiteOrangeLogo}
                alt=""
                aria-hidden="true"
                className="h-28 w-28 object-contain"
            />
            <span className="mt-3 font-heading text-4xl font-semibold text-white">
                NOLLA
            </span>
            {title && (
                <div className="mt-8">
                    <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
                    {description && (
                        <p className="mt-1 text-xs text-white/80 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
            )}
        </div>
    </div>
);

export default AuthBrandPanel;