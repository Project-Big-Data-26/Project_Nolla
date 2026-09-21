import React from "react";

/**
 * Kartu pilihan (icon + label [+ desc opsional]) dipakai di PersonalizationWizard.
 * Dibuat karena step 1 & step 2 di wizard punya markup tombol pilihan yang identik,
 * cuma beda ada/tidaknya `desc`.
 */
const WizardOptionCard = ({ icon: Icon, label, desc, selected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition ${selected
                ? "border-primary bg-blue-50"
                : "border-neutral-border hover:border-primary"
            }`}
    >
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-medium text-neutral-text">{label}</span>
        {desc && <span className="text-xs text-neutral-muted">{desc}</span>}
    </button>
);

export default WizardOptionCard;