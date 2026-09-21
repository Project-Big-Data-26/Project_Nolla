import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { School } from 'lucide-react'
import WizardOptionCard from '../components/WizardOptionCard'

const educationOptions = [
    { id: 'sd', label: 'SD', desc: 'Sekolah Dasar', icon: School },
    { id: 'smp', label: 'SMP', desc: 'Sekolah Menengah Pertama', icon: School },
    { id: 'sma', label: 'SMA', desc: 'Sekolah Menengah Atas', icon: School },
]

export default function PersonalizationWizard() {
    const navigate = useNavigate()
    const location = useLocation()
    const [educationLevel, setEducationLevel] = useState('')
    const [loading, setLoading] = useState(false)

    // Tangkap token dari URL jika dialihkan dari Google OAuth
    // --- PERBAIKAN DI SINI: Tangkap token dari URL Google OAuth dengan benar ---
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search)
        const tokenFromUrl = queryParams.get('accessToken')
        const refreshTokenFromUrl = queryParams.get('refreshToken')

        if (tokenFromUrl) {
            localStorage.setItem("accessToken", tokenFromUrl)
            if (refreshTokenFromUrl) {
                localStorage.setItem("refreshToken", refreshTokenFromUrl)
            }
            console.log("Token Google berhasil ditangkap dari URL:", tokenFromUrl);
            
            // Bersihkan URL dari parameter token agar bersih
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Fallback: Cek apakah token sudah ada di localStorage (misal dari login biasa)
            const existingToken = localStorage.getItem("accessToken");
            console.log("Token yang ada di localStorage:", existingToken);
        }
    }, [location])

    const handleSavePersonalization = async () => {
        if (!educationLevel) return
        setLoading(true)

        try {
            const token = localStorage.getItem("accessToken")
            console.log("Token yang dikirim:", token); // Cek apakah token ada atau null

            const response = await fetch("http://localhost:5000/api/personalization", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    educationLevel: educationLevel, // Cek apakah backend minta nama key ini
                }),
            })

            const result = await response.json()
            console.log("Respon dari backend personalisasi:", result); // Cek balasan server

            if (response.ok && result.status === "success") {
                alert("Jenjang pendidikan berhasil disimpan!")
                navigate("/dashboard")
            } else {
                alert(result.message || "Gagal menyimpan personalisasi.")
            }
        } catch (error) {
            console.error("Error detail koneksi server:", error) // Lihat error asli di console F12
            alert("Terjadi kesalahan pada koneksi server. Cek console browser (F12).")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-bg flex flex-col">
            <header className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
                        B
                    </div>
                    <span className="font-heading font-semibold text-neutral-text">Big Data</span>
                </div>

                <button 
                    onClick={() => navigate("/dashboard")} 
                    className="text-sm text-neutral-muted hover:text-neutral-text cursor-pointer"
                >
                    Lewati
                </button>
            </header>

            <main className="flex flex-1 items-center justify-center px-4">
                <div className="w-full max-w-xl rounded-2xl border border-neutral-border bg-neutral-card p-8 shadow-sm">
                    <h1 className="font-heading text-xl font-bold text-neutral-text">
                        Hai, kenalan dulu yuk!
                    </h1>
                    <p className="mt-1 text-sm text-neutral-muted">
                        Pilih jenjang pendidikanmu supaya kami bisa menyesuaikan materi belajar.
                    </p>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                        {educationOptions.map(({ id, label, desc, icon }) => (
                            <WizardOptionCard
                                key={id}
                                icon={icon}
                                label={label}
                                desc={desc}
                                selected={educationLevel === id}
                                onClick={() => setEducationLevel(id)}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        disabled={!educationLevel || loading}
                        onClick={handleSavePersonalization}
                        className="mt-6 w-full rounded-xl bg-primary py-3 font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                        {loading ? "Menyimpan..." : "Simpan & Masuk ke Dashboard →"}
                    </button>
                </div>
            </main>
        </div>
    )
}