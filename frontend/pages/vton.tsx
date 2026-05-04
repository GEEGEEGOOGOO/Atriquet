import { useCallback, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import { AnimatePresence, motion } from 'framer-motion'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type VtonResponse = {
  success: boolean
  image?: string
  message?: string
}

function normalizeGeneratedImageSrc(value?: string): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim().replace(/^"+|"+$/g, '')
  if (!trimmed) {
    return null
  }

  const unwrapNestedBase64 = (payload: string) => {
    let current = payload

    for (let i = 0; i < 2; i += 1) {
      try {
        const decoded = atob(current)
        const looksLikeBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(decoded)
        if (looksLikeBase64) {
          current = decoded.trim().replace(/^"+|"+$/g, '')
          continue
        }
      } catch {
        return current
      }

      return current
    }

    return current
  }

  const detectMime = (payload: string) => {
    if (payload.startsWith('/9j/')) return 'image/jpeg'
    if (payload.startsWith('iVBORw0KGgo')) return 'image/png'
    if (payload.startsWith('R0lGOD')) return 'image/gif'
    if (payload.startsWith('UklGR')) return 'image/webp'
    return 'image/png'
  }

  if (trimmed.startsWith('data:image/')) {
    const parts = trimmed.split(',', 2)
    if (parts.length === 2) {
      const normalizedPayload = unwrapNestedBase64(parts[1])
      const mime = detectMime(normalizedPayload)
      return `data:${mime};base64,${normalizedPayload}`
    }
    return trimmed
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  const normalizedPayload = unwrapNestedBase64(trimmed)
  const mime = detectMime(normalizedPayload)
  return `data:${mime};base64,${normalizedPayload}`
}

export default function VTONPage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLElement>(null)

  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [garmentImage, setGarmentImage] = useState<File | null>(null)
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null)
  const [outfitDescription, setOutfitDescription] = useState('Use the garment naturally fitted to the person and keep realistic fabric folds.')
  const [bodyType, setBodyType] = useState('average')
  const [skinTone, setSkinTone] = useState('medium')
  const [gender, setGender] = useState('person')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)

  const onDropPerson = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setError(null)
    }
  }, [])

  const onDropGarment = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setGarmentImage(file)
      setGarmentPreview(URL.createObjectURL(file))
      setError(null)
    }
  }, [])

  const { getRootProps: getPersonRootProps, getInputProps: getPersonInputProps, isDragActive: isPersonDragActive } = useDropzone({
    onDrop: onDropPerson,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  })

  const { getRootProps: getGarmentRootProps, getInputProps: getGarmentInputProps, isDragActive: isGarmentDragActive } = useDropzone({
    onDrop: onDropGarment,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  })

  const handleCanvasMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    canvasRef.current?.style.setProperty('--mx', `${x}px`)
    canvasRef.current?.style.setProperty('--my', `${y}px`)
  }

  const resetCanvasGlow = () => {
    canvasRef.current?.style.setProperty('--mx', '50%')
    canvasRef.current?.style.setProperty('--my', '35%')
  }

  const handleSubmit = async () => {
    if (!image) {
      setError('Please upload a person image first')
      return
    }

    if (!garmentImage) {
      setError('Please upload a garment image')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('garment_image', garmentImage)
      formData.append('outfit_description', outfitDescription)
      formData.append('body_type', bodyType)
      formData.append('skin_tone', skinTone)
      formData.append('gender', gender)

      const response = await axios.post<VtonResponse>(`${API_URL}/api/generate-outfit-on-person`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000
      })

      const generatedImage = normalizeGeneratedImageSrc(response.data?.image)
      if (!generatedImage) {
        throw new Error('No usable image returned by the server')
      }

      setResultImage(generatedImage)

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate VTON output')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>ATRIQUET | VTON Atelier</title>
        <meta name="description" content="Virtual try-on powered by Gemini image preview model." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div
        ref={canvasRef}
        className="interactive-canvas min-h-screen text-white"
        onMouseMove={handleCanvasMove}
        onMouseLeave={resetCanvasGlow}
      >
        <nav className="site-nav-shell fixed top-0 left-0 z-50 w-full">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-12">
            <Link href="/" className="site-nav-link font-mono text-[10px] uppercase tracking-[0.34em]">ATRIQUET // 0.0</Link>
            <div className="flex items-center gap-4 md:gap-10 font-mono text-[10px] uppercase tracking-[0.3em]">
              <Link href="/" className="site-nav-link">Manifesto</Link>
              <span className="text-white/84">VTON LAB</span>
            </div>
          </div>
        </nav>

        <main className="relative z-[1] px-6 pb-24 pt-28 md:px-12">
          <section className="border-panel mx-auto max-w-[1600px]">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-[#0b1323]/80 p-8 md:p-14">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/85">The VTON Dossier</p>
                <h1 className="mt-6 font-display text-5xl italic leading-[0.9] md:text-7xl">Virtual Try-On Clearance</h1>
                <p className="mt-8 max-w-md font-body text-base leading-relaxed text-white/80">
                  Submit one portrait and one outfit directive. The lab keeps identity, pose, and frame while replacing garment composition.
                </p>
                <div className="mt-12 h-px w-44 bg-gradient-to-r from-cyan-300/70 to-orange-400/80" />
                {preview && (
                  <div className="mt-10 border border-white/20 bg-white/5 p-4">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">Source Portrait</p>
                    <img src={preview} alt="Source" className="h-[360px] w-full object-cover" />
                  </div>
                )}
                {garmentPreview && (
                  <div className="mt-6 border border-white/20 bg-white/5 p-4">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">Garment Reference</p>
                    <img src={garmentPreview} alt="Garment" className="h-[360px] w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="bg-white p-8 text-slate-900 md:p-14">
                <div className="space-y-7">
                  <div>
                    <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.25em]">Upload Person Image</label>
                    <div
                      {...getPersonRootProps()}
                      className={`cursor-pointer border border-slate-900 p-8 text-center transition-colors duration-200 ${
                        isPersonDragActive ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                      }`}
                    >
                      <input {...getPersonInputProps()} />
                      <p className="font-heading text-lg uppercase tracking-[0.08em]">
                        {preview ? 'Replace portrait' : 'Drop portrait or click'}
                      </p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">JPG / PNG up to 10MB</p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.25em]">Upload Garment Image</label>
                    <div
                      {...getGarmentRootProps()}
                      className={`cursor-pointer border border-slate-900 p-8 text-center transition-colors duration-200 ${
                        isGarmentDragActive ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                      }`}
                    >
                      <input {...getGarmentInputProps()} />
                      <p className="font-heading text-lg uppercase tracking-[0.08em]">
                        {garmentPreview ? 'Replace garment reference' : 'Drop garment image or click'}
                      </p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">JPG / PNG up to 10MB</p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.25em]">Outfit Directive</label>
                    <textarea
                      value={outfitDescription}
                      onChange={(e) => setOutfitDescription(e.target.value)}
                      rows={5}
                      className="w-full border border-slate-900 p-4 font-body text-sm leading-relaxed outline-none transition-colors duration-200 focus:bg-slate-900 focus:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em]">Body Type</label>
                      <input
                        value={bodyType}
                        onChange={(e) => setBodyType(e.target.value)}
                        className="w-full border border-slate-900 p-3 font-body text-sm outline-none transition-colors duration-200 focus:bg-slate-900 focus:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em]">Skin Tone</label>
                      <input
                        value={skinTone}
                        onChange={(e) => setSkinTone(e.target.value)}
                        className="w-full border border-slate-900 p-3 font-body text-sm outline-none transition-colors duration-200 focus:bg-slate-900 focus:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em]">Gender</label>
                      <input
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full border border-slate-900 p-3 font-body text-sm outline-none transition-colors duration-200 focus:bg-slate-900 focus:text-white"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full border border-slate-900 bg-slate-900 px-8 py-5 font-heading text-xs uppercase tracking-[0.3em] text-white transition-colors duration-200 hover:bg-orange-500 hover:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Rendering VTON...' : 'Generate VTON'}
                  </button>

                  {error && (
                    <div className="border border-[#ff0000] bg-[#fff4f4] p-4 font-body text-sm text-[#b00000]">{error}</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {resultImage && (
              <motion.section
                ref={resultRef}
                initial={{ opacity: 0, y: -70, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -50, height: 0 }}
                transition={{
                  height: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.35 },
                  y: { type: 'spring', stiffness: 90, damping: 20 }
                }}
                className="overflow-hidden"
              >
                <div className="mx-auto mt-6 max-w-[1600px] border border-white/20 bg-white p-6 text-black md:p-12">
                  <div className="mb-8 flex items-center justify-between border-b border-black/20 pb-5">
                    <h2 className="font-heading text-3xl uppercase tracking-[0.12em] md:text-4xl">VTON Result</h2>
                    <button
                      onClick={() => setResultImage(null)}
                      className="border border-slate-900 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.24em] transition-colors duration-200 hover:bg-slate-900 hover:text-white"
                    >
                      Close Result
                    </button>
                  </div>
                  <img
                    src={resultImage}
                    alt="Generated VTON output"
                    className="max-h-[900px] w-full object-contain"
                    onError={() => {
                      setResultImage(null)
                      setError('Generated image could not be displayed. Please try again with a different garment photo.')
                    }}
                  />
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  )
}
