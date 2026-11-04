import React from "react";
import { Check, Minus } from "lucide-react";
import { Link } from "react-router-dom";

const BENEFITS = [
  {
    label: "Sesi kuis per subbab",
    free: "3 sesi",
    premium: "Tanpa batas",
    freeIncluded: true,
  },
  {
    label: "Akses bab pembelajaran",
    free: "Bab tertentu terkunci",
    premium: "Semua bab terbuka",
    freeIncluded: false,
  },
  {
    label: "Masa akses",
    free: "Gratis",
    premium: "Sesuai masa paket",
    freeIncluded: true,
  },
];

const PlanComparisonSection = ({ isAuthenticated = false }) => (
  <section className="bg-white px-4 py-12 sm:px-6 sm:py-16">
    <div className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full table-fixed border-collapse text-[#171923]">
          <colgroup>
            <col className="w-[46%] sm:w-[48%]" />
            <col className="w-[27%] sm:w-[26%]" />
            <col className="w-[27%] sm:w-[26%]" />
          </colgroup>
          <thead>
            <tr className="align-top">
              <th
                scope="col"
                className="px-3 py-4 text-left align-middle text-xl font-semibold tracking-tight text-[#1b1f3b] sm:px-6 sm:py-6 sm:text-3xl"
              >
                Bandingkan fitur
              </th>
              <th
                scope="col"
                className="border-l border-white bg-[#f1f4fa] p-2.5 text-left text-[#1b1f3b] sm:p-5"
              >
                <div className="mb-3 text-sm font-semibold sm:text-lg">
                  Free
                </div>
              </th>
              <th
                scope="col"
                className="border-l border-white bg-[#eaf1ff] p-2.5 text-left text-[#1b1f3b] sm:p-5"
              >
                <div className="mb-3 text-sm font-semibold sm:text-lg">
                  Premium
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th
                scope="colgroup"
                colSpan={3}
                className="bg-[#e9eef7] px-4 py-3 text-left text-sm font-semibold text-[#1b1f3b] sm:px-5 sm:py-4 sm:text-base"
              >
                Belajar dan latihan
              </th>
            </tr>
            {BENEFITS.map((benefit, index) => (
              <tr
                key={benefit.label}
                className={index % 2 === 0 ? "bg-white" : "bg-[#f6f8fc]"}
              >
                <th
                  scope="row"
                  className="px-3 py-4 text-left text-xs font-semibold leading-snug text-[#1b1f3b] sm:px-5 sm:py-5 sm:text-sm"
                >
                  {benefit.label}
                </th>
                <td className="border-l border-slate-200 px-1.5 py-4 text-center text-[10px] leading-snug text-[#4b556b] sm:px-4 sm:py-5 sm:text-sm">
                  <span className="inline-flex items-center justify-center gap-1.5">
                    {benefit.freeIncluded ? (
                      <Check
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-emerald-600 sm:h-5 sm:w-5"
                      />
                    ) : (
                      <Minus
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-slate-400 sm:h-5 sm:w-5"
                      />
                    )}
                    <span>{benefit.free}</span>
                  </span>
                </td>
                <td className="border-l border-slate-200 px-1.5 py-4 text-center text-[10px] leading-snug text-[#1b1f3b] sm:px-4 sm:py-5 sm:text-sm">
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Check
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-[#2563eb] sm:h-5 sm:w-5"
                    />
                    <span>{benefit.premium}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export default PlanComparisonSection;
