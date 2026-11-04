import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchPayment, formatRupiah } from "../../api/subscription";
import PaymentSuccessModal from "../../components/PaymentSuccessModal";

const PaymentReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [state, setState] = useState({ status: "loading", payment: null });

  useEffect(() => {
    let current = true;
    let attempts = 0;
    let timer;

    const loadPayment = async () => {
      if (!orderId) {
        setState({ status: "missing", payment: null });
        return;
      }
      try {
        const payment = await fetchPayment(orderId);
        if (!current) return;
        setState({ status: "ready", payment });
        if (payment.status === "pending" && attempts < 30) {
          attempts += 1;
          timer = window.setTimeout(loadPayment, 2000);
        }
      } catch (error) {
        if (current) setState({ status: "error", payment: null });
      }
    };

    loadPayment();
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [orderId]);

  const status = state.payment?.status;
  const paid = status === "paid";

  if (paid) {
    const packageNames = {
      weekly: "Premium Mingguan",
      monthly: "Premium Bulanan",
      yearly: "Premium Tahunan",
    };
    const successPlan = {
      name: packageNames[state.payment.package] || "Paket Premium",
    };

    return (
      <>
        <div className="min-h-screen bg-slate-50" />
        <PaymentSuccessModal
          plan={successPlan}
          onClose={() => navigate("/paket", { replace: true })}
          onGoToTopics={() => navigate("/topik", { replace: true })}
        />
      </>
    );
  }

  const waiting = state.status === "loading" || status === "pending";
  const title = waiting
    ? "Menunggu konfirmasi pembayaran"
    : status === "expired"
      ? "Pembayaran kedaluwarsa"
      : status === "cancelled" || status === "failed"
        ? "Pembayaran belum berhasil"
        : "Status pembayaran tidak tersedia";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {state.payment && (
          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <p>{state.payment.package} · {formatRupiah(state.payment.amount)}</p>
            <p className="break-all text-xs text-slate-400">ID transaksi: {state.payment.order_id}</p>
          </div>
        )}
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {waiting
            ? "Kami sedang menunggu notifikasi resmi dari Midtrans. Halaman ini akan memperbarui status otomatis."
            : state.status === "error"
              ? "Transaksi tidak dapat ditemukan di akun ini. Coba muat ulang atau hubungi dukungan."
              : "Kamu dapat kembali ke daftar paket dan mencoba lagi."}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/topik" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
            Kembali ke topik
          </Link>
          {!paid && <Link to="/#paket" className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">Lihat paket</Link>}
        </div>
      </section>
    </main>
  );
};

export default PaymentReturn;
