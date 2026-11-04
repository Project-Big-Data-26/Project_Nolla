import React, { useEffect, useRef, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchEntitlement, fetchPlans, markPremiumActivationNotice, startPlanCheckout, watchPaymentStatus } from "../../api/subscription";
import { openSnapCheckout } from "../../api/midtransSnap";
import PremiumPackagesSection from "../../components/PremiumPackagesSection";
import PlanComparisonSection from "../../components/PlanComparisonSection";
import PaymentConfirmationModal from "../../components/PaymentConfirmationModal";
import PaymentSuccessModal from "../../components/PaymentSuccessModal";
import nollaMain from "../../assets/nolla_main.png";
import whiteOrangeLogo from "../../assets/white_orange.png";

const PackagesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [planCatalog, setPlanCatalog] = useState({ status: "loading", data: null });
  const [entitlement, setEntitlement] = useState(null);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [confirmationPlanCode, setConfirmationPlanCode] = useState(null);
  const [successPlanCode, setSuccessPlanCode] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const paymentWatchRef = useRef(null);
  const paymentSuccessHandledRef = useRef(false);

  useEffect(() => () => paymentWatchRef.current?.(), []);

  useEffect(() => {
    let isCurrent = true;
    fetchPlans()
      .then((data) => {
        if (isCurrent) setPlanCatalog({ status: "ready", data });
      })
      .catch(() => {
        if (isCurrent) setPlanCatalog({ status: "error", data: null });
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
      .then((value) => { if (isCurrent) setEntitlement(value); })
      .catch(() => { if (isCurrent) setEntitlement(null); });
    return () => { isCurrent = false; };
  }, [isAuthenticated]);

  const requestPlanConfirmation = (planCode) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setCheckoutError("");
    setCheckoutNotice("");
    setConfirmationPlanCode(planCode);
  };

  const handleCheckout = async () => {
    const planCode = confirmationPlanCode;
    if (!planCode || checkoutPlan) return;

    paymentWatchRef.current?.();
    paymentWatchRef.current = null;
    paymentSuccessHandledRef.current = false;
    setCheckoutPlan(planCode);
    try {
      const checkout = await startPlanCheckout(planCode);
      const showPaymentSuccess = () => {
        if (paymentSuccessHandledRef.current) return;
        paymentSuccessHandledRef.current = true;
        paymentWatchRef.current?.();
        paymentWatchRef.current = null;
        setCheckoutPlan(null);
        setConfirmationPlanCode(null);
        setCheckoutNotice("");
        markPremiumActivationNotice();
        fetchEntitlement().then(setEntitlement).catch(() => {});
        try {
          window.snap?.hide?.();
        } finally {
          window.setTimeout(() => setSuccessPlanCode(planCode), 300);
        }
      };
      if (checkout.order_id) {
        paymentWatchRef.current = watchPaymentStatus(checkout.order_id, {
          onPaid: showPaymentSuccess,
          onTerminal: () => {
            paymentWatchRef.current = null;
            setCheckoutPlan(null);
            setConfirmationPlanCode(null);
            setCheckoutNotice("");
            setCheckoutError("Transaksi belum berhasil. Silakan pilih paket dan coba lagi.");
          },
          onTimeout: () => {
            paymentWatchRef.current = null;
            setCheckoutPlan(null);
            setConfirmationPlanCode(null);
            setCheckoutNotice("Konfirmasi pembayaran belum diterima. Status akan diperbarui jika notifikasi Midtrans masuk.");
          },
        });
      }
      await openSnapCheckout(checkout, {
        onPending: () => {
          if (paymentSuccessHandledRef.current) return;
          setConfirmationPlanCode(null);
          setCheckoutNotice("Pembayaran menunggu konfirmasi. Status akan diperbarui otomatis setelah Midtrans mengirim notifikasi.");
        },
        onSuccess: () => {
          if (paymentSuccessHandledRef.current) return;
          setConfirmationPlanCode(null);
          setCheckoutNotice("Pembayaran diterima. Menunggu konfirmasi transaksi dari Midtrans...");
          window.snap?.hide?.();
        },
        onError: () => {
          paymentWatchRef.current?.();
          paymentWatchRef.current = null;
          setCheckoutPlan(null);
          setConfirmationPlanCode(null);
          setCheckoutError("Pembayaran belum berhasil. Silakan coba lagi.");
        },
        onClose: () => {
          setConfirmationPlanCode(null);
        },
      });
      setConfirmationPlanCode(null);
    } catch (error) {
      paymentWatchRef.current?.();
      paymentWatchRef.current = null;
      setCheckoutError(error.response?.data?.message || "Checkout gagal dibuat. Silakan coba lagi.");
      setCheckoutPlan(null);
      setConfirmationPlanCode(null);
    }
  };

  const confirmationPlan = planCatalog.data?.plans?.find((plan) => plan.code === confirmationPlanCode) ?? null;
  const successPlan = planCatalog.data?.plans?.find((plan) => plan.code === successPlanCode) ?? null;

  return (
    <div className="min-h-screen overflow-x-clip bg-white font-['Poppins',sans-serif] text-[#1b1f3b] antialiased">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="inline-flex items-center gap-2.5">
            <img src={nollaMain} alt="" aria-hidden="true" className="h-8 w-auto object-contain sm:h-9 md:h-10" />
            <span className="translate-y-0.5 font-heading text-xl font-semibold text-[#1b1f3b] sm:text-2xl">NOLLA</span>
          </div>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate("/topik")}
              className="rounded-full bg-gradient-to-r from-[#2563eb] to-[#0284c7] px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Buka Topik Belajar
            </button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/login" className="rounded-full border-2 border-[#ff8a1f] px-3 py-2 text-xs font-bold text-[#ff8a1f] transition-colors hover:bg-[#ff8a1f] hover:text-white sm:px-5 sm:text-sm">
                Masuk
              </Link>
              <Link to="/register" className="rounded-full bg-[#009bf2] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1e3a8a] sm:px-5 sm:py-2.5 sm:text-sm">
                Daftar Sekarang
              </Link>
            </div>
          )}
        </div>
      </header>

      <main>
        <PremiumPackagesSection
          planCatalog={planCatalog}
          checkoutPlan={checkoutPlan}
          checkoutError={checkoutError}
          checkoutNotice={checkoutNotice}
          isAuthenticated={isAuthenticated}
          entitlement={entitlement}
          onCheckout={requestPlanConfirmation}
        />
        <PlanComparisonSection isAuthenticated={isAuthenticated} />
      </main>

      <PaymentConfirmationModal
        plan={confirmationPlan}
        loading={Boolean(checkoutPlan)}
        onCancel={() => {
          if (!checkoutPlan) setConfirmationPlanCode(null);
        }}
        onConfirm={handleCheckout}
      />
      <PaymentSuccessModal
        plan={successPlan}
        onClose={() => setSuccessPlanCode(null)}
        onGoToTopics={() => {
          setSuccessPlanCode(null);
          navigate("/topik");
        }}
      />

      <footer className="border-t border-[#2b3fd6]/40 bg-[#1b1f3b] pt-8 text-sm text-white/80 sm:pt-12">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 pb-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:px-10">
          <div>
            <div className="mb-4 inline-flex items-center gap-2">
              <img src={whiteOrangeLogo} alt="" aria-hidden="true" className="h-7 w-auto object-contain" />
              <span className="translate-y-0.5 font-heading text-lg font-semibold text-white">NOLLA</span>
            </div>
            <p className="mb-5 max-w-sm text-xs leading-relaxed text-white/75">
              Skill drill matematika adaptif untuk siswa SD–SMA. Melatih intuisi dan keterampilan berhitung secara bertahap dan menyenangkan.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/75">
              <a href="https://www.instagram.com/nolla.academy/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#ff8a1f]">Instagram @nolla.academy</a>
              <a href="https://www.tiktok.com/@nolla.academy" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#ff8a1f]">TikTok @nolla.academy</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 text-xs sm:gap-x-8 lg:grid-cols-3">
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-white sm:text-sm">RESOURCES</h2>
              <a href="https://buku.kemendikdasmen.go.id/" target="_blank" rel="noopener noreferrer" className="text-white/75 transition-colors hover:text-[#ff8a1f]">SIBI (Sistem Informasi Perbukuan Indonesia)</a>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-white sm:text-sm">INFORMATION</h2>
              <ul className="space-y-2 text-white/75">
                <li><Link to="/terms-and-conditions" className="transition-colors hover:text-[#ff8a1f]">Terms and Conditions</Link></li>
                <li><Link to="/privacy-policy" className="transition-colors hover:text-[#ff8a1f]">Privacy</Link></li>
              </ul>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-white sm:text-sm">CONTACT</h2>
              <ul className="space-y-3 text-white/75">
                <li className="flex items-center gap-2"><Mail aria-hidden="true" className="h-4 w-4 shrink-0" /><a href="mailto:nollaacademy@gmail.com" className="transition-colors hover:text-[#ff8a1f]">nollaacademy@gmail.com</a></li>
                <li className="flex items-center gap-2"><Phone aria-hidden="true" className="h-4 w-4 shrink-0" /><a href="tel:+6282140394969" className="transition-colors hover:text-[#ff8a1f]">+62 821-4039-4969</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/20">
          <div className="mx-auto w-full max-w-7xl px-5 py-3 text-center text-xs leading-tight text-white/70 sm:px-8 lg:px-10">
            © 2026 NOLLA. Hak cipta dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PackagesPage;
