import { useState, useCallback, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const W = 500
const H = 750
const Z = W / 2

type OutfitRecommendation = {
  outfit_name: string
  description: string
  top: string
  bottom: string
  shoes?: string | null
  colors: string[]
  rationale: string
  styling_tips?: string[]
  why_it_works?: string | null
  match_score?: number | null
}

type RecommendationResponse = {
  success: boolean
  recommendations: OutfitRecommendation[]
  general_styling_tips?: string[]
  occasion: string
  style: string
  processing_time?: number
  used_api?: string
  is_appropriate: boolean
  critique?: string | null
  improvement_suggestions?: string | null
}

const ROTTARGETS = [0, -90, -180, -270]
const FACE_TRANSFORMS = [
  `rotateY(0deg) translateZ(${Z}px)`,
  `rotateY(90deg) translateZ(${Z}px)`,
  `rotateY(180deg) translateZ(${Z}px)`,
  `rotateY(270deg) translateZ(${Z}px)`,
]

function FaceWrapper({ title, step, onNext, children, isLocked, nextLabel = 'PROCEED ->' }: any) {
  return (
    <div className="monolith-face-inner relative flex h-full flex-col p-10 text-white">
      <div className="monolith-bg-number">{step}</div>

      <div className="relative z-10 flex items-start justify-between">
        <div className="monolith-eyebrow">{title}</div>
        <div className="monolith-step-chip">STEP //{step}</div>
      </div>

      <div className="relative z-10 mt-12 flex min-h-0 flex-1 flex-col">{children}</div>

      <button
        className={`monolith-cta-btn relative z-10 mt-4 shrink-0 ${isLocked ? 'pointer-events-none opacity-20' : ''}`}
        onClick={onNext}
      >
        {nextLabel}
      </button>
    </div>
  )
}

const OCCASIONS = [
  'Casual Day Out',
  'Formal Evening',
  'Business Professional',
  'Nightlife / Party',
  'Wedding Guest',
  'Weekend Brunch',
]

function OccasionFace({ occasion, setOccasion, onNext, rotateTo }: any) {
  return (
    <FaceWrapper title="SELECT_CONTEXT" step="01" onNext={onNext}>
      <h2 className="monolith-title">
        Select
        <br />
        Occasion
      </h2>
      <div className="monolith-divider" />
      <div className="mt-4 flex flex-1 flex-col">
        {OCCASIONS.map((item, idx) => (
          <button
            key={item}
            onClick={() => {
              setOccasion(item)
              rotateTo(1)
            }}
            className={`brutal-list-item ${occasion === item ? 'brutal-list-item--active' : ''}`}
          >
            <span className="w-8 font-mono text-[10px] opacity-40">0{idx + 1}</span>
            {item}
          </button>
        ))}
      </div>
    </FaceWrapper>
  )
}

const STYLES = [
  'Minimalist',
  'Cyber Brutalist',
  'Old Money / Luxury',
  'Techwear',
  'Avant-Garde',
  'Streetwear / Hype',
]

function StyleFace({ style, setStyle, onNext, rotateTo }: any) {
  return (
    <FaceWrapper title="STYLE_DIAL" step="02" onNext={onNext}>
      <h2 className="monolith-title text-[#00E5FF]">
        Style
        <br />
        Dial
      </h2>
      <div className="monolith-divider" />
      <div className="mt-4 flex flex-1 flex-col">
        {STYLES.map((item, idx) => (
          <button
            key={item}
            onClick={() => {
              setStyle(item)
              rotateTo(2)
            }}
            className={`brutal-list-item ${style === item ? 'brutal-list-item--active' : ''}`}
          >
            <span className="w-8 font-mono text-[10px] opacity-40">0{idx + 1}</span>
            {item}
          </button>
        ))}
      </div>
    </FaceWrapper>
  )
}

function DocumentFace({ onNext, file, setFile }: any) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) {
        setFile(accepted[0])
      }
    },
    [setFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
    maxFiles: 1,
  })

  const fileSizeMb = file ? (file.size / (1024 * 1024)).toFixed(2) : null
  const isImageFile = !!file && file.type.startsWith('image/')

  return (
    <FaceWrapper
      title="SUPPORTING_VISUALS"
      step="03"
      onNext={onNext}
      isLocked={!file}
      nextLabel={file ? 'EXECUTE ANALYSIS' : 'WAITING FOR INPUT'}
    >
      <h2 className="monolith-title">
        Upload
        <br />
        Input
      </h2>
      <div className="monolith-divider" />
      <div
        {...getRootProps()}
        className="relative mt-4 flex flex-1 cursor-pointer items-center justify-center overflow-hidden border border-dashed border-white/20 bg-black/40 transition-colors hover:border-[#00E5FF]/50"
      >
        <input {...getInputProps()} />
        {preview && isImageFile ? (
          <img
            src={preview}
            className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity transition-opacity hover:opacity-100"
            alt="preview"
          />
        ) : file ? (
          <div className="z-10 px-6 text-center">
            <div className="mb-4 font-mono text-[10px] tracking-[0.25em] text-[#00E5FF]">[ FILE_CAPTURED ]</div>
            <p className="mb-2 break-all font-sans text-sm uppercase tracking-wide text-white/90">{file.name}</p>
            <p className="font-mono text-[10px] text-white/45">
              {file.type || 'unknown'} / {fileSizeMb} MB
            </p>
          </div>
        ) : (
          <div className="text-center font-mono text-[10px] leading-[2] tracking-widest text-white/40 transition-colors hover:text-[#00E5FF]">
            {isDragActive ? '[ DROP_IMAGE_HERE ]' : '[ DROP_FULL_BODY_IMAGE ]'}
            <br />
            <br />
            PNG / JPG ONLY
          </div>
        )}
      </div>
    </FaceWrapper>
  )
}

function StatusFace({ loading, data, error, onReset, onRun, occasion, style, file }: any) {
  const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : []
  const tips = [
    ...(data?.improvement_suggestions ? [data.improvement_suggestions] : []),
    ...((data?.general_styling_tips || []).filter(Boolean)),
  ].slice(0, 3)

  return (
    <FaceWrapper title="ANALYSIS_OUTPUT" step="04" onNext={onReset} nextLabel="<- REBOOT SYSTEM">
      <h2 className="monolith-title shrink-0 text-[#00E5FF]">
        Analysis
        <br />
        Dossier
      </h2>
      <div className="monolith-divider shrink-0" />

      <div className="no-scrollbar relative mt-2 w-full flex-1 overflow-y-auto scroll-smooth shadow-[inset_0_-40px_30px_-20px_rgba(5,5,8,0.95)]">
        {loading ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[rgba(5,5,8,0.95)] text-center">
            <div className="mb-8 h-16 w-16 animate-spin rounded-full border-t-2 border-[#00E5FF]" />
            <div className="animate-pulse font-mono text-[10px] tracking-widest text-[#00E5FF]">PROC_NEURAL_VECTORS...</div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 z-20 flex flex-col justify-center bg-[rgba(5,5,8,0.95)]">
            <div className="mb-6 border-l-2 border-red-500 pl-4 font-mono text-[10px] leading-relaxed text-red-500">{error}</div>
            <button
              onClick={onRun}
              className="monolith-cta-btn border-red-500/50 bg-red-500/10 text-red-500 hover:border-red-500 hover:bg-red-500 hover:text-black"
            >
              RE-TRIGGER NETWORK
            </button>
          </div>
        ) : !data ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(5,5,8,0.95)]">
            <button onClick={onRun} className="monolith-cta-btn !border-[#00E5FF] !bg-[#00E5FF] !text-black hover:!bg-white">
              RUN SYSTEM ANALYSIS
            </button>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col pb-20 pr-2">
            <h3 className="mb-4 font-display text-2xl font-bold uppercase tracking-tight">Llama Recommendation Report</h3>

            <div className="mt-2 border-t border-white/10 pt-4">
              <div className="mb-6">
                <span className="mb-2 block font-mono text-[9px] text-[#00E5FF]">
                  [DOSSIER_ID: {Math.floor(Math.random() * 900000) + 100000}]
                </span>
                <p className="font-sans text-xs italic leading-relaxed opacity-80">
                  {data?.used_api ? `"${data.used_api} returned the final styling analysis."` : '"Style vectors converged. Final report generated."'}
                </p>
              </div>

              <div className="mb-5 border-l-2 border-[#00E5FF]/40 pl-4">
                <p className="mb-2 font-mono text-[10px] uppercase">
                  <span className="text-[#00E5FF] opacity-40">OCCASION:</span>
                  <br />
                  {occasion}
                </p>
                <p className="mb-2 font-mono text-[10px] uppercase">
                  <span className="text-[#00E5FF] opacity-40">STYLE:</span>
                  <br />
                  {style}
                </p>
                <p className="mb-2 font-mono text-[10px] uppercase">
                  <span className="text-[#00E5FF] opacity-40">INPUT_SOURCE:</span>
                  <br />
                  {file?.name || 'Local Buffer'}
                </p>
                <p className="mb-2 font-mono text-[10px] uppercase">
                  <span className="text-[#00E5FF] opacity-40">VERDICT:</span>
                  <br />
                  {data?.is_appropriate ? 'Appropriate' : 'Needs Refinement'}
                </p>
                <p className="font-mono text-[10px] uppercase">
                  <span className="text-[#00E5FF] opacity-40">PROCESSING:</span>
                  <br />
                  {typeof data?.processing_time === 'number' ? `${data.processing_time.toFixed(2)}s` : 'N/A'}
                </p>
              </div>

              <div className="mt-4 border border-white/10 bg-white/5 p-4">
                <p className="font-sans text-xs leading-relaxed text-white/90">{data?.critique || 'No critique returned.'}</p>
              </div>

              {tips.length > 0 && (
                <div className="mt-4 border border-white/10 bg-[#00E5FF]/[0.04] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#00E5FF]">Styling Tips</div>
                  <div className="mt-3 space-y-2">
                    {tips.map((tip: string, index: number) => (
                      <p key={`${tip}-${index}`} className="font-sans text-xs leading-relaxed text-white/85">
                        {tip}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="mt-5 space-y-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#00E5FF]">Recommended Looks</div>
                  {recommendations.map((recommendation: OutfitRecommendation, index: number) => (
                    <div key={`${recommendation.outfit_name}-${index}`} className="border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-heading text-sm uppercase tracking-[0.18em] text-white">{recommendation.outfit_name}</h4>
                          <p className="mt-2 font-sans text-xs leading-relaxed text-white/75">{recommendation.description}</p>
                        </div>
                        {recommendation.match_score ? (
                          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
                            {recommendation.match_score}% match
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="border border-white/10 p-3">
                          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00E5FF]">Top</div>
                          <p className="mt-2 font-sans text-xs leading-relaxed text-white/85">{recommendation.top}</p>
                        </div>
                        <div className="border border-white/10 p-3">
                          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00E5FF]">Bottom</div>
                          <p className="mt-2 font-sans text-xs leading-relaxed text-white/85">{recommendation.bottom}</p>
                        </div>
                      </div>

                      {recommendation.colors?.length ? (
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65">
                          Palette: {recommendation.colors.join(', ')}
                        </p>
                      ) : null}

                      <p className="mt-3 font-sans text-xs leading-relaxed text-white/72">
                        {recommendation.why_it_works || recommendation.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FaceWrapper>
  )
}

export default function GlassCube({ onRecommendations }: { onRecommendations?: (data: RecommendationResponse) => void }) {
  const [face, setFace] = useState(0)
  const [occasion, setOccasion] = useState(OCCASIONS[0])
  const [style, setStyle] = useState(STYLES[0])
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RecommendationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const controls = useAnimation()
  const [isRotating, setIsRotating] = useState(false)

  const rotateTo = async (n: number) => {
    if (isRotating) return
    setIsRotating(true)
    setFace(n)
    await controls.start({
      rotateY: ROTTARGETS[n],
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
    })
    setIsRotating(false)
  }

  const submitApplication = async () => {
    if (!file) return rotateTo(2)

    setLoading(true)
    setError(null)
    setData(null)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('occasion', occasion)
    formData.append('style', style)
    formData.append('include_brands', 'false')

    try {
      const res = await axios.post<RecommendationResponse>(`${API_URL}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      })

      setData(res.data)
      onRecommendations?.(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Submission failed. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setData(null)
    setError(null)
    setLoading(false)
    setFile(null)
    rotateTo(0)
  }

  const faces = [
    <OccasionFace key="f0" occasion={occasion} setOccasion={setOccasion} onNext={() => rotateTo(1)} rotateTo={rotateTo} />,
    <StyleFace key="f1" style={style} setStyle={setStyle} onNext={() => rotateTo(2)} rotateTo={rotateTo} />,
    <DocumentFace key="f2" onNext={() => rotateTo(3)} file={file} setFile={setFile} />,
    <StatusFace
      key="f3"
      loading={loading}
      data={data}
      error={error}
      onReset={handleReset}
      onRun={submitApplication}
      occasion={occasion}
      style={style}
      file={file}
    />,
  ]

  return (
    <div className="monolith-scene flex w-full flex-col items-center py-16">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        whileInView={{ scale: 1, opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', damping: 20, stiffness: 60 }}
        className="relative flex w-full items-center justify-center"
        style={{ height: 850 }}
      >
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
          className="relative flex h-full w-full items-center justify-center p-20 pointer-events-none"
        >
          <div
            style={{
              position: 'absolute',
              bottom: '5%',
              width: 500,
              height: 180,
              background: 'radial-gradient(ellipse at center, rgba(0, 229, 255, 0.2) 0%, transparent 60%)',
              filter: 'blur(30px)',
              transform: 'rotateX(75deg)',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 600,
              height: 600,
              background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 60%)',
              filter: 'blur(80px)',
              borderRadius: '50%',
            }}
          />

          <div style={{ perspective: '2000px', zIndex: 10 }}>
            <motion.div animate={controls} style={{ width: W, height: H, position: 'relative', transformStyle: 'preserve-3d' }}>
              {faces.map((Content, i) => {
                const isActive = face === i
                const isVisible = isActive || isRotating

                return (
                  <motion.div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: W,
                      height: H,
                      transform: FACE_TRANSFORMS[i],
                      backfaceVisibility: 'hidden',
                      backgroundColor: 'rgba(5, 5, 8, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: isActive ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: isActive
                        ? '0 30px 80px rgba(0,0,0,0.95), inset 0 0 20px rgba(0,229,255,0.05)'
                        : 'none',
                      display: isVisible ? 'flex' : 'none',
                      pointerEvents: isActive && !isRotating ? 'auto' : 'none',
                      opacity: isVisible ? 1 : 0,
                      transition: 'opacity 0.3s, border 0.5s, box-shadow 0.5s',
                      flexDirection: 'column',
                      isolation: 'isolate',
                    }}
                  >
                    {Content}

                    {isActive && (
                      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20 mix-blend-overlay" />
                    )}
                  </motion.div>
                )
              })}

              <div
                style={{
                  position: 'absolute',
                  width: W,
                  height: W,
                  top: 130,
                  transform: `rotateX(90deg) translateZ(${H / 2}px)`,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  pointerEvents: 'none',
                  display: isRotating ? 'block' : 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: W,
                  height: W,
                  top: 130,
                  transform: `rotateX(-90deg) translateZ(${H / 2}px)`,
                  background: 'rgba(0,229,255,0.02)',
                  border: '1px solid rgba(0,229,255,0.1)',
                  pointerEvents: 'none',
                  display: isRotating ? 'block' : 'none',
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <div className="relative z-20 mt-8 flex items-center gap-12 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">
        <button
          onClick={() => {
            if (!isRotating) rotateTo((Math.max(face, 0) + 3) % 4)
          }}
          className="relative z-20 transition-colors hover:text-[#00E5FF]"
        >
          Prev
        </button>
        <div className="flex gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-[2px] w-12 transition-all duration-500 ${face === i ? 'bg-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.6)]' : 'bg-white/10'}`}
            />
          ))}
        </div>
        <button
          onClick={() => {
            if (!isRotating) rotateTo((Math.max(face, 0) + 1) % 4)
          }}
          className="relative z-20 transition-colors hover:text-[#00E5FF]"
        >
          Next
        </button>
      </div>

      <style jsx global>{`
        .monolith-face-inner { isolation: isolate; }
        .monolith-bg-number {
          position: absolute;
          top: -30px;
          right: -20px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 320px;
          font-weight: 900;
          line-height: 0.8;
          color: transparent;
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.04);
          z-index: 0;
          pointer-events: none;
        }
        .monolith-eyebrow { font-family: monospace; font-size: 10px; letter-spacing: 0.4em; color: #00E5FF; text-shadow: 0 0 10px rgba(0,229,255,0.3); }
        .monolith-step-chip { font-family: monospace; font-size: 10px; padding: 4px 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); }
        .monolith-title { font-family: 'Space Grotesk', sans-serif; font-size: 3.8rem; line-height: 0.9; text-transform: uppercase; font-weight: 800; letter-spacing: -0.05em; z-index: 10; position: relative; }
        .monolith-divider { width: 60px; height: 3px; background: #00E5FF; margin: 24px 0; z-index: 10; position: relative; box-shadow: 0 0 10px rgba(0,229,255,0.5); }

        .brutal-list-item {
          display: flex;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.5);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          background: transparent;
          width: 100%;
          text-align: left;
          position: relative;
          z-index: 20;
        }
        .brutal-list-item:hover { color: #fff; border-bottom-color: rgba(0,229,255,0.4); padding-left: 12px; }
        .brutal-list-item--active { color: #00E5FF; border-bottom-color: #00E5FF; text-shadow: 0 0 10px rgba(0,229,255,0.3); }

        .monolith-cta-btn {
          width: 100%;
          padding: 24px;
          background: rgba(0, 229, 255, 0.02);
          border: 1px solid rgba(0,229,255,0.3);
          color: #00E5FF;
          font-family: monospace;
          font-size: 12px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          z-index: 20;
        }
        .monolith-cta-btn:hover { background: #00E5FF; color: #000; box-shadow: 0 0 20px rgba(0,229,255,0.4); }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
