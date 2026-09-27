import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react'

const MAX_PHOTO_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

const jenjangOptions = [
    { value: '', label: 'Belum Dipilih' },
    { value: 'sd', label: 'SD' },
    { value: 'smp', label: 'SMP' },
    { value: 'sma', label: 'SMA' },
]

// Data awal — nanti diganti dengan data user asli dari backend/auth
const currentUser = {
    name: 'Pelajar Tamu',
    email: 'guest@mathmentor.app',
    jenjang: '',
    photoUrl: null,
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function EditProfile() {
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(currentUser.photoUrl)
    const [name, setName] = useState(currentUser.name)
    const [email, setEmail] = useState(currentUser.email)
    const [jenjang, setJenjang] = useState(currentUser.jenjang)

    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')

    function handlePhotoChange(e) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!ALLOWED_TYPES.includes(file.type)) {
            setErrors((prev) => ({ ...prev, photo: 'Format file harus JPG atau PNG.' }))
            return
        }
        if (file.size > MAX_PHOTO_SIZE) {
            setErrors((prev) => ({ ...prev, photo: 'Ukuran file maksimal 2MB.' }))
            return
        }

        setErrors((prev) => ({ ...prev, photo: undefined }))
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }

    function validate() {
        const nextErrors = {}
        if (!name.trim()) nextErrors.name = 'Nama tidak boleh kosong.'
        if (!isValidEmail(email)) nextErrors.email = 'Format email tidak valid.'
        setErrors((prev) => ({ ...prev, ...nextErrors }))
        return Object.keys(nextErrors).length === 0
    }

    function handleCancel() {
        navigate('/profile')
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSaveError('')
        if (!validate()) return

        setSaving(true)
        try {
            // TODO: ganti dengan pemanggilan API asli ke backend
            await new Promise((resolve) => setTimeout(resolve, 800))
            navigate('/profile')
        } catch (err) {
            setSaveError('Gagal menyimpan perubahan. Coba lagi.')
        } finally {
            setSaving(false)
        }
    }

    const Avatar = ({ size }) =>
        photoPreview ? (
            <img src={photoPreview} alt="Foto profil" className={`${size} rounded-full object-cover`} />
        ) : (
            <div className={`${size} flex items-center justify-center rounded-full bg-primary text-2xl font-bold text-white`}>
                {(name || 'U').charAt(0).toUpperCase()}
            </div>
        )

    return (
        <div className="min-h-screen bg-neutral-bg">

            <header className="flex items-center gap-3 border-b border-neutral-border bg-neutral-card px-4 py-4 md:hidden">
                <button type="button" onClick={handleCancel} className="text-neutral-text">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="font-heading text-lg font-bold text-neutral-text">Edit Profil</h1>
            </header>

            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl p-4 md:p-8">
                <div className="rounded-2xl border border-neutral-border bg-neutral-card p-6 shadow-sm md:flex md:gap-8 md:p-8">

                    <div className="flex-1 space-y-5">
                        <h1 className="hidden font-heading text-lg font-bold text-neutral-text md:block">
                            Edit Profil
                        </h1>

                        <div className="flex flex-col items-center gap-2 md:hidden">
                            <div className="relative h-24 w-24">
                                <Avatar size="h-24 w-24" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-xs text-neutral-muted">JPG/PNG, maks. 2MB</p>
                            {errors.photo && <p className="text-xs text-danger">{errors.photo}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-neutral-text">Nama</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Masukkan nama lengkap"
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-neutral-text outline-none focus:border-primary ${
                                    errors.name ? 'border-danger' : 'border-neutral-border'
                                }`}
                            />
                            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-neutral-text">Email</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-neutral-text outline-none focus:border-primary ${
                                    errors.email ? 'border-danger' : 'border-neutral-border'
                                }`}
                            />
                            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-neutral-text">Jenjang</label>
                            <select
                                value={jenjang}
                                onChange={(e) => setJenjang(e.target.value)}
                                className="w-full rounded-xl border border-neutral-border px-4 py-2.5 text-sm text-neutral-text outline-none focus:border-primary"
                            >
                                {jenjangOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {saveError && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{saveError}</p>
                        )}

                        <div className="flex gap-3 md:hidden">
                            <button type="button" onClick={handleCancel} className="flex-1 rounded-xl border border-neutral-border py-3 text-sm font-medium text-neutral-text">
                                Batal
                            </button>
                            <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60">
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 hidden w-56 shrink-0 flex-col items-center gap-3 border-l border-neutral-border pl-8 md:flex md:mt-0">
                        <span className="text-xs font-medium text-neutral-muted">Preview</span>
                        <div className="relative h-24 w-24">
                            <Avatar size="h-24 w-24" />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-center text-sm font-semibold text-neutral-text">{name || 'Nama Pengguna'}</p>
                        <p className="text-xs text-neutral-muted">
                            {jenjang ? jenjangOptions.find((o) => o.value === jenjang)?.label : 'Belum pilih jenjang'}
                        </p>
                        {errors.photo && <p className="text-center text-[11px] text-danger">{errors.photo}</p>}

                        <div className="mt-4 flex w-full gap-2">
                            <button type="button" onClick={handleCancel} className="flex-1 rounded-xl border border-neutral-border py-2 text-sm font-medium text-neutral-text">
                                Batal
                            </button>
                            <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60">
                                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoChange}
                    className="hidden"
                />
            </form>
        </div>
    )
}