import { useEffect, useMemo, useRef, useState } from 'react'

type ScrollFrameSequenceProps = {
  frameCount: number
  title: string
  eyebrow?: string
  subtitle?: string
  ctaLabel?: string
  onCtaClick?: () => void
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export default function ScrollFrameSequence({
  frameCount,
  title,
  eyebrow,
  subtitle,
  ctaLabel,
  onCtaClick
}: ScrollFrameSequenceProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<(HTMLImageElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const targetProgressRef = useRef(0)
  const currentProgressRef = useRef(0)
  const renderedFrameRef = useRef(-1)
  const [loadedCount, setLoadedCount] = useState(0)
  const [displayProgress, setDisplayProgress] = useState(0)

  const frameSources = useMemo(
    () =>
      Array.from({ length: frameCount }, (_, index) => {
        const frame = String(index + 1).padStart(3, '0')
        return `/sequences/wardrobe/frame-${frame}.jpg`
      }),
    [frameCount]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    let isDisposed = false

    const drawImageCover = (image: HTMLImageElement) => {
      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr)
        canvas.height = Math.floor(height * dpr)
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
      }

      context.setTransform(1, 0, 0, 1, 0, 0)
      context.scale(dpr, dpr)
      context.clearRect(0, 0, width, height)

      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
      const drawWidth = image.naturalWidth * scale
      const drawHeight = image.naturalHeight * scale
      const dx = (width - drawWidth) / 2
      const dy = (height - drawHeight) / 2

      context.drawImage(image, dx, dy, drawWidth, drawHeight)
    }

    const renderFrame = (frameIndex: number) => {
      const image = imagesRef.current[frameIndex]
      if (!image || !image.complete) {
        return
      }

      drawImageCover(image)
      renderedFrameRef.current = frameIndex
    }

    const updateProgressTarget = () => {
      const section = sectionRef.current
      if (!section) {
        return
      }

      const start = section.offsetTop
      const scrollRange = Math.max(section.offsetHeight - window.innerHeight, 1)
      const progress = clamp((window.scrollY - start) / scrollRange, 0, 1)
      targetProgressRef.current = progress
    }

    const tick = () => {
      const nextProgress = currentProgressRef.current + (targetProgressRef.current - currentProgressRef.current) * 0.14
      const settledProgress =
        Math.abs(targetProgressRef.current - nextProgress) < 0.001 ? targetProgressRef.current : nextProgress
      const nextFrame = clamp(Math.round(settledProgress * (frameCount - 1)), 0, frameCount - 1)

      currentProgressRef.current = settledProgress

      if (nextFrame !== renderedFrameRef.current) {
        renderFrame(nextFrame)
      }

      setDisplayProgress(settledProgress)

      if (!isDisposed) {
        rafRef.current = window.requestAnimationFrame(tick)
      }
    }

    imagesRef.current = frameSources.map((src, index) => {
      const image = new Image()
      image.src = src
      image.decoding = 'async'
      image.loading = index < 12 ? 'eager' : 'lazy'
      image.onload = () => {
        if (isDisposed) {
          return
        }

        setLoadedCount((count) => count + 1)

        if (index === 0 || index === renderedFrameRef.current) {
          renderFrame(index)
        }
      }
      return image
    })

    const handleResize = () => {
      updateProgressTarget()
      const currentFrame = clamp(Math.round(targetProgressRef.current * (frameCount - 1)), 0, frameCount - 1)
      renderFrame(currentFrame)
    }

    updateProgressTarget()
    renderFrame(0)

    window.addEventListener('scroll', updateProgressTarget, { passive: true })
    window.addEventListener('resize', handleResize)
    rafRef.current = window.requestAnimationFrame(tick)

    return () => {
      isDisposed = true
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
      window.removeEventListener('scroll', updateProgressTarget)
      window.removeEventListener('resize', handleResize)
    }
  }, [frameCount, frameSources])

  const reveal = clamp((displayProgress - 0.56) / 0.3, 0, 1)

  return (
    <section ref={sectionRef} className="relative h-[420vh] min-h-[3200px] bg-black">
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <div className="sequence-overlay absolute inset-0" />

        <div className="relative z-10 flex h-full flex-col justify-between px-6 py-8 md:px-12 md:py-10">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-sm">
              {eyebrow ? (
                <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/70">{eyebrow}</p>
              ) : null}
            </div>
            <div className="rounded-full border border-white/20 bg-black/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/80 backdrop-blur">
              Scroll To Open
            </div>
          </div>

          <div
            className="max-w-5xl transition-all duration-300"
            style={{
              opacity: 0.2 + reveal * 0.8,
              transform: `translate3d(0, ${32 - reveal * 32}px, 0)`
            }}
          >
            <h1 className="font-display text-[min(18vw,10rem)] italic leading-[0.82] text-white">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-6 max-w-2xl font-mono text-[11px] uppercase leading-6 tracking-[0.3em] text-white/72 md:text-xs">
                {subtitle}
              </p>
            ) : null}
            {ctaLabel ? (
              <button
                onClick={onCtaClick}
                className="mt-10 border border-white bg-white px-7 py-4 font-heading text-xs uppercase tracking-[0.28em] text-black transition hover:border-[#00E5FF] hover:bg-[#00E5FF] hover:text-white"
              >
                {ctaLabel}
              </button>
            ) : null}
          </div>

          <div className="flex items-end justify-between gap-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/70">
              Sequence {Math.round(displayProgress * 100)}%
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">
              Frames Loaded {loadedCount}/{frameCount}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
