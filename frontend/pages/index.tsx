import { useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import GlassCube from '../components/GlassCube'
import CameraReelPlaceholder from '../components/CameraReelPlaceholder'

export default function Home() {
  const manifestoRef = useRef<HTMLElement>(null)
  const intelligenceRef = useRef<HTMLElement>(null)
  const syndicateRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const scrollTo = (section: 'manifesto' | 'intelligence' | 'syndicate') => {
    if (section === 'manifesto') manifestoRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (section === 'intelligence') intelligenceRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (section === 'syndicate') syndicateRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const dossierCards = [
    {
      id: '091',
      title: 'Ghostly Textures',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: '092',
      title: 'Void Aesthetics',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: '093',
      title: 'Lunar Minimalism',
      image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80'
    }
  ]

  const handleNav = (section: 'manifesto' | 'intelligence' | 'syndicate') => {
    scrollTo(section)
  }

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

  return (
    <>
      <Head>
        <title>ATRIQUET | Style Intelligence Atelier</title>
        <meta name="description" content="Algorithmic style intelligence in a brutalist editorial interface." />
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
            <button
              onClick={() => handleNav('manifesto')}
              className="site-nav-link font-mono text-[10px] uppercase tracking-[0.34em]"
            >
              ATRIQUET // 0.0
            </button>
            <div className="flex items-center gap-4 md:gap-10 font-mono text-[10px] uppercase tracking-[0.3em]">
              <Link href="/homepage" className="site-nav-link">Homepage</Link>
              <button onClick={() => handleNav('intelligence')} className="site-nav-link">Archive</button>
              <button onClick={() => handleNav('intelligence')} className="site-nav-link">Intelligence</button>
              <button onClick={() => handleNav('syndicate')} className="site-nav-link">Syndicate</button>
              <Link href="/vton" className="site-nav-link">VTON</Link>
            </div>
          </div>
        </nav>

        <main className="relative z-[1] pt-20">
          <section ref={manifestoRef} className="atelier-grid relative min-h-screen overflow-hidden border-b border-white/20 px-6 py-10 md:px-12">
              <div className="mx-auto grid h-full max-w-[1600px] grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="col-span-12 flex flex-col justify-center lg:col-span-8">
                  <motion.h1
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="font-display text-[min(24vw,180px)] italic leading-[0.83] text-white"
                  >
                    ATRIQUET
                  </motion.h1>
                  <div className="mt-5 h-px w-40 bg-gradient-to-r from-cyan-300/70 to-orange-400/80" />
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15 }}
                    className="mt-8 max-w-xl font-mono text-[10px] uppercase leading-6 tracking-[0.28em] text-white/74 md:text-xs"
                  >
                    Algorithmic style intelligence for luxury buyers and creative directors. No fluff. No trend theater. Only raw, uncompromising signal.
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="col-span-12 flex items-end justify-start lg:col-span-4 lg:justify-end"
                >
                  <button
                    onClick={() => scrollTo('intelligence')}
                    className="brutal-btn h-20 w-full max-w-[320px] font-heading text-xs uppercase tracking-[0.3em] md:w-[320px]"
                  >
                    Enter The Archive
                  </button>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.35 }}
                className="mx-auto mt-10 w-full max-w-[1600px] lg:mt-14"
              >
                <CameraReelPlaceholder />
              </motion.div>

              <div className="absolute bottom-8 left-6 hidden items-end gap-4 md:flex md:left-12">
                <div className="h-28 w-px bg-white/60" />
                <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/80 [writing-mode:vertical-rl]">
                  Coordinates: 48.8566 N, 2.3522 E
                </span>
              </div>
          </section>

          <section ref={intelligenceRef} className="border-b border-white/20 px-6 py-20 md:px-12">
              <div className="mx-auto max-w-[1600px]">
                <div className="mb-12 flex items-end justify-between border-b border-white/20 pb-5">
                  <h2 className="font-heading text-3xl uppercase tracking-[0.1em] md:text-5xl">The Intelligence</h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/80">[01] Archive</span>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {dossierCards.map((card, index) => (
                    <motion.article
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="group relative h-[560px] cursor-pointer overflow-hidden border border-white/30 bg-slate-950/50"
                    >
                      <img
                        alt={card.title}
                        src={card.image}
                        className="h-full w-full object-cover grayscale transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
                      />
                      <div className="absolute inset-0 bg-black/42 transition-colors duration-300 group-hover:bg-black/10" />
                      <div className="absolute left-6 top-6 z-10 font-mono text-[10px] uppercase tracking-[0.26em] text-white mix-blend-difference">
                        [ Report {card.id} ]
                      </div>
                      <h3 className="absolute bottom-16 left-6 z-10 border border-black/15 bg-white/95 px-3 py-2 font-display text-4xl italic leading-tight text-black transition-[color,background,border-color] duration-200 group-hover:border-orange-400/80 group-hover:bg-[#0b1220] group-hover:text-white md:text-5xl">
                        {card.title}
                      </h3>
                      <div className="absolute bottom-6 left-6 right-6 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.26em] text-white/85 mix-blend-difference">
                        <span>Archive // 2026</span>
                        <span>Open Dossier</span>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
          </section>

          <section ref={syndicateRef} className="px-6 py-20 md:px-12 md:py-24 flex flex-col items-center">
              <div className="text-center mb-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">The Syndicate</p>
                <h2 className="mt-4 font-display text-5xl italic leading-[0.9] md:text-7xl">Application For Clearance</h2>
                <p className="mt-6 max-w-lg mx-auto font-mono text-[10px] uppercase tracking-widest leading-relaxed text-white/50">
                  Submit your profile for algorithmic curation. This gate remains narrow by design.
                </p>
              </div>
              
              <GlassCube />
          </section>

        </main>

        <div className="ticker-wrap fixed bottom-0 left-0 z-50 w-full border-t border-white/20 bg-[#06080d]/70">
          <div className="ticker-track py-2 font-mono text-[10px] uppercase tracking-[0.27em] text-white/80">
            <span>Trend Velocity: +14.2%</span>
            <span>Current Sector: Neo-Monolith</span>
            <span>Atmospheric Density: 0.003kg/m3</span>
            <span>Signal Strength: Nominal</span>
            <span>Trend Velocity: +14.2%</span>
            <span>Current Sector: Neo-Monolith</span>
            <span>Atmospheric Density: 0.003kg/m3</span>
            <span>Signal Strength: Nominal</span>
          </div>
        </div>
      </div>
    </>
  )
}
