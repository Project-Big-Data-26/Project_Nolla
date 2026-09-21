import React from "react";

/**
 * Card wrapper reusable buat section/box konten (form, stats, rekomendasi, dll).
 * Pakai prop `as` kalau butuh tag semantik beda (default "div"), misal "section".
 */
const SectionCard = ({ as: Tag = "div", className = "", children, ...props }) => (
    <Tag
        className={`rounded-2xl border border-neutral-border bg-neutral-card p-6 shadow-xs ${className}`}
        {...props}
    >
        {children}
    </Tag>
);

export default SectionCard;