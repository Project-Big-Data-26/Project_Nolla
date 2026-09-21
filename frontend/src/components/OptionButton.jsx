import React from "react";

/**
 * Grid tombol pilihan (single-select), dipakai buat "Jenjang belajar", dll.
 * `gridClassName` dikasih manual (bukan interpolasi dinamis) biar aman dari Tailwind purge.
 */
const OptionButton = ({ options, selected, onSelect, gridClassName = "grid-cols-3" }) => (
    <div className={`mt-2 grid ${gridClassName} gap-2`}>
        {options.map((option) => (
            <button
                key={option}
                type="button"
                onClick={() => onSelect(option)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${selected === option
                        ? "border-primary text-primary bg-primary/5"
                        : "border-neutral-border text-neutral-muted hover:border-primary/40"
                    }`}
            >
                {option}
            </button>
        ))}
    </div>
);

export default OptionButton;