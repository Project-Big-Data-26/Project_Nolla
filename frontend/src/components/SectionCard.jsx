import React from "react";

/**
 * Card wrapper reusable buat section/box konten (form, stats, rekomendasi, dll).
 * Pakai prop `as` kalau butuh tag semantik beda (default "div"), misal "section".
 * Pakai prop `padding` kalau butuh override padding default (default "p-6"),
 * contoh: <SectionCard padding="p-5">.
 */
const SectionCard = ({
    as: Tag = "div",
    padding = "p-6",
    className = "",
    children,
    ...props
}) => (
    <Tag
        className={`rounded-2xl border border-neutral-border bg-neutral-card ${padding} shadow-xs ${className}`}
        {...props}
    >
        {children}
    </Tag>
);

export default SectionCard;