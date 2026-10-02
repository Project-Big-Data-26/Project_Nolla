import React from "react";

/**
 * Pembungkus luar untuk semua halaman Auth (Login, Register, Forgot/Reset
 * Password, Verify Email): full-screen center + kartu 2 kolom rounded.
 * Dibuat karena pola ini kemungkinan besar sama persis di semua halaman auth
 * lain — nanti tinggal reuse waktu kita modularin Login.jsx dkk.
 */
const AuthCard = ({ children }) => (
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg p-4 sm:p-6 font-sans text-neutral-text">
        <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-card shadow-lg border border-neutral-border">
            {children}
        </div>
    </div>
);

export default AuthCard;