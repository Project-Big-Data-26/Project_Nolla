import React from "react";

/**
 * Kolom kanan halaman Auth: banner primary dengan mockup jendela browser +
 * judul/deskripsi opsional di bawahnya.
 * - `title`/`description`: opsional. Kalau `title` gak dikasih, blok teks
 *   bawah gak dirender sama sekali (dipakai di Login.jsx yang gak ada teks
 *   di kolom kanannya, beda dari ForgotPassword.jsx yang ada).
 * Cuma tampil di layar lg ke atas (hidden di mobile), sama seperti aslinya.
 */
const AuthBrandPanel = ({ title, description }) => (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-10 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
        <div />

        <div className="relative z-10 flex flex-col items-center justify-center my-auto">
            <div className="relative w-64 h-48 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="space-y-2">
                    <div className="h-3 bg-white/30 rounded-md w-3/4" />
                    <div className="h-2.5 bg-white/20 rounded-md w-1/2" />
                    <div className="h-2.5 bg-white/20 rounded-md w-5/6" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/30" />
                        <div className="h-2 bg-white/30 rounded w-16" />
                    </div>
                    <div className="h-4 w-12 bg-white/20 rounded-lg" />
                </div>
            </div>
        </div>

        {title && (
            <div className="relative z-10 text-center">
                <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
                <p className="mt-1 text-xs text-white/80 leading-relaxed">
                    {description}
                </p>
            </div>
        )}
    </div>
);

export default AuthBrandPanel;