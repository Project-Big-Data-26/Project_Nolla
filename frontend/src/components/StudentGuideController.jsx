import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EVENTS, Joyride } from "react-joyride";
import { useStudentGuide } from "../context/StudentGuideContext";
import { useAuth } from "../context/AuthContext";
import {
  studentGuideCompletedKey,
  studentGuideEnabledKey,
} from "../constants/studentGuide";

const waitForGuideTarget = (selector) =>
  new Promise((resolve) => {
    let observer;
    const finish = (found) => {
      window.clearTimeout(timeout);
      observer?.disconnect();
      resolve(found);
    };
    const checkTarget = () => {
      if (document.querySelector(selector)) finish(true);
    };
    const timeout = window.setTimeout(() => finish(false), 5000);

    observer = new MutationObserver(checkTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    checkTarget();
  });

const navigateAndWaitForTarget = (navigate, path, selector, currentPath) => {
  if (document.querySelector(selector)) return Promise.resolve();

  const targetReady = waitForGuideTarget(selector);
  if (currentPath.current !== path) navigate(path);
  return targetReady;
};

export default function StudentGuideController() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [run, setRun] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => window.innerWidth <= 640,
  );
  const activeTourRef = useRef(null);
  const currentPath = useRef(location.pathname);
  const { setDemoChapterStage, setIsDemoMode } = useStudentGuide();
  const userId = String(user?.id || user?._id || "");
  const pageId = {
    "/topik": "topics",
    "/hasil-pembelajaran": "results",
    "/profile": "profile",
  }[location.pathname];

  useEffect(() => {
    const updateViewport = () => setIsMobileViewport(window.innerWidth <= 640);
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    currentPath.current = location.pathname;
  }, [location.pathname]);

  const enterTopicsDemo = useCallback(
    (stage, selector) => {
      setIsDemoMode(true);
      setDemoChapterStage(stage);
      return navigateAndWaitForTarget(
        navigate,
        "/topik",
        selector,
        currentPath,
      );
    },
    [navigate, setDemoChapterStage, setIsDemoMode],
  );

  const enterResultsDemo = useCallback(
    (selector) => {
      setIsDemoMode(true);
      return navigateAndWaitForTarget(
        navigate,
        "/hasil-pembelajaran",
        selector,
        currentPath,
      );
    },
    [navigate, setIsDemoMode],
  );

  const steps = useMemo(
    () => [
      {
        target: '[data-tour="topics-home"]',
        title: "Bab Pembelajaran",
        content:
          "Pada halaman ini, Anda dapat melihat daftar bab dan subbab yang tersedia untuk dipelajari.",
        placement: "right",
      },
      {
        target: '[data-tour="topics-search"]',
        title: "Pencarian Bab atau Topik",
        content:
          "Masukkan kata kunci pada kolom ini untuk menemukan bab yang Anda butuhkan.",
        placement: "bottom",
        before: () => enterTopicsDemo("pretest", '[data-tour="topics-search"]'),
      },
      {
        target: '[data-tour="topics-filter"]',
        title: "Filter Kelas",
        content:
          "Gunakan filter ini untuk menyaring daftar bab berdasarkan kelas yang Anda pilih.",
        placement: "bottom",
        before: () => enterTopicsDemo("pretest", '[data-tour="topics-filter"]'),
      },
      {
        target: '[data-tour="demo-chapter-card"]',
        title: "Contoh Kartu Bab",
        content:
          "Kartu bab menampilkan informasi bab, progres belajar, dan tombol untuk memulai pembelajaran. Selama panduan ini, kartu tersebut menggunakan data demo sebagai contoh.",
        placement: "bottom",
        before: () =>
          enterTopicsDemo("pretest", '[data-tour="demo-chapter-card"]'),
      },
      {
        target: '[data-tour="demo-pretest-button"]',
        title: "Mulai Pretest",
        content:
          "Untuk memulai suatu bab, silakan pilih tombol Mulai Pretest. Pada panduan ini, Anda hanya diperlihatkan letak tombolnya tanpa menjalankan pretest.",
        placement: "bottom",
        before: () =>
          enterTopicsDemo("pretest", '[data-tour="demo-pretest-button"]'),
      },
      {
        target: '[data-tour="demo-subbab-toggle"]',
        title: "Lihat Subbab",
        content:
          "Setelah menyelesaikan pretest, pilih tombol Lihat Subbab untuk menampilkan daftar subbab dalam bab tersebut. Silakan lanjutkan panduan untuk melihat contoh daftar subbab.",
        placement: "bottom",
        before: () =>
          enterTopicsDemo("completed", '[data-tour="demo-subbab-toggle"]'),
      },
      {
        target: '[data-tour="demo-subbab-action"]',
        title: "Mulai Belajar",
        content:
          "Pilih tombol Mulai pada subbab untuk membuka sesi kuis. Baris ini menggunakan data demo agar Anda dapat mengetahui letak tombolnya.",
        placement: "bottom",
        before: () =>
          enterTopicsDemo("subbab", '[data-tour="demo-subbab-action"]'),
      },
      {
        target: '[data-tour="learning-results"]',
        title: "Menu Hasil Belajar",
        content:
          "Ini merupakan menu Hasil Belajar. Tekan Lanjut untuk melihat contoh tampilannya.",
        placement: "top",
      },
      {
        target: '[data-tour="learning-summary"]',
        title: "Ringkasan Progres",
        content:
          "Bagian ini menampilkan jumlah bab yang telah selesai dan yang sedang dipelajari. Angka pada panduan ini merupakan data demo. Setelah panduan selesai, halaman ini akan menampilkan progres belajar Anda.",
        placement: "bottom",
        before: () => enterResultsDemo('[data-tour="learning-summary"]'),
      },
      {
        target: '[data-tour="demo-learning-card"]',
        title: "Progres Setiap Bab",
        content:
          "Setiap kartu menampilkan jumlah subbab yang telah dimulai beserta persentase progres bab. Kartu ini menggunakan data demo sebagai contoh.",
        placement: "bottom",
      },
      {
        target: '[data-tour="results-filter"]',
        title: "Filter Hasil Belajar",
        content:
          "Gunakan filter ini untuk menampilkan seluruh bab, bab yang telah selesai, atau bab yang sedang dipelajari.",
        placement: "bottom",
        before: () => enterResultsDemo('[data-tour="results-filter"]'),
      },
      {
        target: '[data-tour="profile-nav"]',
        title: "Menu Profil",
        content:
          "Ini merupakan menu Profil. Tekan Lanjut untuk melihat bagian-bagian pada profil Anda.",
        placement: "top",
      },
      {
        target: '[data-tour="profile-information"]',
        title: "Informasi Pribadi",
        content:
          "Kartu ini memuat avatar, nama, email, dan jenjang belajar yang terhubung dengan akun Anda.",
        placement: "bottom",
        before: () =>
          navigateAndWaitForTarget(
            navigate,
            "/profile",
            '[data-tour="profile-information"]',
            currentPath,
          ),
      },
      {
        target: '[data-tour="profile-edit"]',
        title: "Edit Profil",
        content: "Tekan tombol ini untuk memperbarui informasi profil Anda.",
        placement: "bottom",
      },
      {
        target: '[data-tour="profile-package"]',
        title: "Paket Akun",
        content:
          "Bagian ini menampilkan status paket dan kuota kuis pada akun Anda.",
        placement: "bottom",
      },
      {
        target: '[data-tour="profile-package-action"]',
        title: "Pilihan Paket",
        content:
          "Tombol ini membuka halaman paket untuk melihat pilihan paket yang tersedia.",
        placement: "bottom",
        skipMissingElement: true,
      },
      {
        target: '[data-tour="profile-change-password"]',
        title: "Ganti Kata Sandi",
        content:
          "Pilih tombol ini untuk membuka halaman penggantian kata sandi akun Anda.",
        placement: "bottom",
      },
      {
        target: '[data-tour="profile-logout"]',
        title: "Keluar dari Akun",
        content: "Pilih tombol ini apabila Anda ingin keluar dari akun.",
        placement: "bottom",
      },
    ],
    [enterTopicsDemo, enterResultsDemo, navigate],
  );

  const stepsByPage = useMemo(
    () => ({
      topics: steps.slice(0, 7),
      results: steps.slice(7, 11),
      profile: steps.slice(11),
    }),
    [steps],
  );

  // Setiap halaman memiliki tur terpisah yang hanya dijalankan sekali per akun.
  useEffect(() => {
    if (
      !pageId ||
      !userId ||
      localStorage.getItem(studentGuideEnabledKey(userId)) !== "1" ||
      localStorage.getItem(studentGuideCompletedKey(userId, pageId)) === "1"
    ) {
      return undefined;
    }

    let cancelled = false;
    const startTour = async () => {
      const initialTarget = {
        topics: '[data-tour="demo-chapter-card"]',
        results: '[data-tour="learning-summary"]',
        profile: '[data-tour="profile-information"]',
      }[pageId];

      if (pageId === "topics") {
        setDemoChapterStage("pretest");
        setIsDemoMode(true);
      } else if (pageId === "results") {
        setIsDemoMode(true);
      }

      const targetFound = await waitForGuideTarget(initialTarget);
      if (cancelled) return;
      if (!targetFound) {
        if (pageId !== "profile") setIsDemoMode(false);
        return;
      }

      activeTourRef.current = { pageId, userId };
      setRun(true);
    };

    void startTour();

    return () => {
      cancelled = true;
      if (activeTourRef.current?.pageId === pageId) {
        activeTourRef.current = null;
        setRun(false);
        setIsDemoMode(false);
      }
      if (pageId !== "profile") setIsDemoMode(false);
    };
  }, [pageId, userId, setDemoChapterStage, setIsDemoMode]);

  const handleTourEvent = useCallback(
    (event) => {
      if (event.type === EVENTS.TOUR_END) {
        const activeTour = activeTourRef.current;
        if (activeTour) {
          localStorage.setItem(
            studentGuideCompletedKey(activeTour.userId, activeTour.pageId),
            "1",
          );
          activeTourRef.current = null;
        }
        setRun(false);
        setIsDemoMode(false);
        setDemoChapterStage("pretest");
      }
    },
    [setDemoChapterStage, setIsDemoMode],
  );

  return (
    <Joyride
      key={pageId || "inactive"}
      run={run}
      steps={stepsByPage[pageId] || []}
      continuous
      scrollToFirstStep
      onEvent={handleTourEvent}
      locale={{
        back: "Kembali",
        close: "Tutup",
        last: "Selesai",
        next: "Lanjut",
        nextWithProgress: "Lanjut ({current}/{total})",
        open: "Buka panduan",
        skip: "Lewati",
      }}
      options={{
        backgroundColor: "#ffffff",
        blockTargetInteraction: true,
        buttons: ["back", "primary", "skip"],
        closeButtonAction: "skip",
        overlayColor: "rgba(15, 23, 42, 0.56)",
        primaryColor: "#2563eb",
        scrollDuration: 300,
        scrollOffset: 24,
        showProgress: true,
        skipBeacon: true,
        targetWaitTimeout: 5000,
        textColor: "#334155",
        width: isMobileViewport
          ? "min(300px, calc(100vw - 32px))"
          : "min(360px, calc(100vw - 24px))",
        zIndex: 1000,
      }}
      styles={{
        tooltip: {
          boxSizing: "border-box",
          maxWidth: isMobileViewport
            ? "calc(100vw - 32px)"
            : "calc(100vw - 24px)",
        },
        tooltipContainer: {
          borderRadius: 16,
          padding: isMobileViewport ? 10 : 16,
        },
        tooltipContent: {
          fontSize: isMobileViewport ? 12 : 14,
          lineHeight: isMobileViewport ? 1.4 : 1.55,
          padding: isMobileViewport ? "6px 0 8px" : "8px 0 12px",
        },
        tooltipTitle: {
          fontSize: isMobileViewport ? 16 : 18,
        },
        buttonPrimary: {
          borderRadius: 7,
          fontSize: isMobileViewport ? 12 : 14,
          padding: isMobileViewport ? "7px 10px" : "8px 12px",
        },
        buttonSkip: {
          fontSize: isMobileViewport ? 12 : 14,
          padding: isMobileViewport ? "7px 8px" : "8px 10px",
        },
      }}
    />
  );
}
