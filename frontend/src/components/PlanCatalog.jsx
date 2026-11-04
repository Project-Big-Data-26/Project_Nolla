import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchEntitlement, fetchPlans, formatDiscount, formatRupiah, markPremiumActivationNotice, startPlanCheckout, watchPaymentStatus } from "../api/subscription";
import { openSnapCheckout } from "../api/midtransSnap";
import PaymentConfirmationModal from "./PaymentConfirmationModal";
import PaymentSuccessModal from "./PaymentSuccessModal";

/**
 * Daftar paket Premium dari GET /subscription/plans (harga dari env backend).
 * Ditampilkan di konteks konten terkunci; transaksi dibuat oleh backend.
 */
const PlanCatalog = ({ onSubscriptionUpdated, onCloseSuccess }) => {
  const [state, setState] = useState({ status: "loading", data: null });
  const [entitlement, setEntitlement] = useState(null);
  const [checkoutCode, setCheckoutCode] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState(null);
  const [successCode, setSuccessCode] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const paymentWatchRef = useRef(null);
  const paymentSuccessHandledRef = useRef(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => () => paymentWatchRef.current?.(), []);

  const requestPurchaseConfirmation = (code) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setCheckoutError("");
    setCheckoutNotice("");
    setConfirmationCode(code);
  };

  const buyPlan = async () => {
    const code = confirmationCode;
    if (!code || checkoutCode) return;

    paymentWatchRef.current?.();
    paymentWatchRef.current = null;
    paymentSuccessHandledRef.current = false;
    setCheckoutCode(code);
    try {
      const checkout = await startPlanCheckout(code);
      const showPaymentSuccess = () => {
        if (paymentSuccessHandledRef.current) return;
        paymentSuccessHandledRef.current = true;
        paymentWatchRef.current?.();
        paymentWatchRef.current = null;
        setCheckoutCode(null);
        setConfirmationCode(null);
        setCheckoutNotice("");
        markPremiumActivationNotice();
        onSubscriptionUpdated?.();
        fetchEntitlement().then(setEntitlement).catch(() => {});
        try {
          window.snap?.hide?.();
        } finally {
          window.setTimeout(() => setSuccessCode(code), 300);
        }
      };
      if (checkout.order_id) {
        paymentWatchRef.current = watchPaymentStatus(checkout.order_id, {
          onPaid: showPaymentSuccess,
          onTerminal: () => {
            paymentWatchRef.current = null;
            setCheckoutCode(null);
            setConfirmationCode(null);
            setCheckoutNotice("");
            setCheckoutError("Transaksi belum berhasil. Silakan pilih paket dan coba lagi.");
          },
          onTimeout: () => {
            paymentWatchRef.current = null;
            setCheckoutCode(null);
            setConfirmationCode(null);
            setCheckoutNotice("Konfirmasi pembayaran belum diterima. Status akan diperbarui jika notifikasi Midtrans masuk.");
          },
        });
      }
      await openSnapCheckout(checkout, {
        onPending: () => {
          if (paymentSuccessHandledRef.current) return;
          setConfirmationCode(null);
          setCheckoutNotice("Pembayaran menunggu konfirmasi. Status akan diperbarui otomatis setelah Midtrans mengirim notifikasi.");
        },
        onSuccess: () => {
          if (paymentSuccessHandledRef.current) return;
          setConfirmationCode(null);
          setCheckoutNotice("Pembayaran diterima. Menunggu konfirmasi transaksi dari Midtrans...");
          window.snap?.hide?.();
        },
        onError: () => {
          if (paymentSuccessHandledRef.current) return;
          paymentWatchRef.current?.();
          paymentWatchRef.current = null;
          setCheckoutCode(null);
          setConfirmationCode(null);
          setCheckoutError("Pembayaran belum berhasil. Silakan coba lagi.");
        },
        onClose: () => {
          setConfirmationCode(null);
        },
      });
      setConfirmationCode(null);
    } catch (error) {
      paymentWatchRef.current?.();
      paymentWatchRef.current = null;
      setCheckoutError(error.response?.data?.message || "Checkout gagal dibuat. Silakan coba lagi.");
      setCheckoutCode(null);
      setConfirmationCode(null);
    }
  };

  useEffect(() => {
    let isCurrent = true;
    fetchPlans()
      .then((data) => {
        if (isCurrent) setState({ status: "ready", data });
      })
      .catch(() => {
        if (isCurrent) setState({ status: "error", data: null });
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    if (!isAuthenticated) {
      setEntitlement(null);
      return () => { isCurrent = false; };
    }
    fetchEntitlement()
      .then((value) => {
        if (isCurrent) setEntitlement(value);
      })
      .catch(() => {
        if (isCurrent) setEntitlement(null);
      });
    return () => { isCurrent = false; };
  }, [isAuthenticated]);

  if (state.status === "loading") {
    return <p className="text-xs text-slate-400">Memuat daftar paket...</p>;
  }
  if (state.status === "error") {
    return <p className="text-xs text-slate-500">Daftar paket gagal dimuat.</p>;
  }

  const plans = state.data?.plans || [];
  const activePackage = entitlement?.package;
  if (plans.length === 0) return null;
  const confirmationPlan = plans.find((plan) => plan.code === confirmationCode) ?? null;
  const successPlan = plans.find((plan) => plan.code === successCode) ?? null;

  // Container query: kartu baris ringkas di wadah sempit (ponsel, panel soal),
  // 3 kolom berdampingan bila wadah cukup lebar (modal di tablet/desktop).
  return (
    <div className="@container w-full">
      <ul className="grid grid-cols-1 gap-2 @xl:grid-cols-3 @xl:gap-3">
        {plans.map((plan) => {
          const discountLabel = formatDiscount(plan.discount);
          const isLoading = plan.code === checkoutCode;
          return (
            <li key={plan.code}>
              <div className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 @xl:gap-4 @xl:p-5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 @xl:text-base">
                    {plan.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {plan.duration_days} hari
                  </p>
                  {discountLabel && (
                    <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {discountLabel}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-end justify-between gap-3 @xl:items-start @xl:flex-col">
                  <div className="text-right @xl:text-left">
                  {plan.discount && (
                    <p className="text-xs text-slate-400 line-through">
                      {formatRupiah(plan.price)}
                    </p>
                  )}
                  <p className="text-base font-bold text-slate-900 tabular-nums @xl:text-xl">
                    {formatRupiah(plan.final_price)}
                  </p>
                  </div>
                  {state.data.purchasable && (
                    <button
                      type="button"
                      onClick={() => requestPurchaseConfirmation(plan.code)}
                      disabled={Boolean(checkoutCode) || Boolean(activePackage)}
                      className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {activePackage ? "Paket sedang aktif" : isLoading ? checkoutNotice ? "Menunggu konfirmasi..." : "Memproses..." : isAuthenticated ? "Beli paket" : "Masuk untuk membeli"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!state.data.purchasable && (
        <p className="mt-3 text-xs text-slate-500">
          Pembelian paket segera tersedia.
        </p>
      )}
      {activePackage && (
        <p role="status" className="mt-3 text-xs text-emerald-700">
          Paket Premium {activePackage} Anda masih aktif hingga {entitlement.active_until ? new Date(entitlement.active_until).toLocaleDateString("id-ID") : "masa aktif berakhir"}. Pembelian paket baru dinonaktifkan selama periode ini.
        </p>
      )}
      {checkoutError && <p role="alert" className="mt-3 text-xs text-red-600">{checkoutError}</p>}
      {checkoutNotice && <p role="status" className="mt-3 text-xs text-emerald-700">{checkoutNotice}</p>}
      <PaymentConfirmationModal
        plan={confirmationPlan}
        loading={Boolean(checkoutCode)}
        onCancel={() => {
          if (!checkoutCode) setConfirmationCode(null);
        }}
        onConfirm={buyPlan}
      />
      <PaymentSuccessModal
        plan={successPlan}
        onClose={() => {
          setSuccessCode(null);
          onCloseSuccess?.();
        }}
        onGoToTopics={() => {
          setSuccessCode(null);
          onCloseSuccess?.();
          navigate("/topik");
        }}
      />
    </div>
  );
};

export default PlanCatalog;
