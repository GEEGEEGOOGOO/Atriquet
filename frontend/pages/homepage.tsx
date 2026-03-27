import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import ScrollFrameSequence from '../components/ScrollFrameSequence'

export default function HomepageExperience() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>ATRIQUET | Homepage Experience</title>
        <meta
          name="description"
          content="Scroll-controlled wardrobe opening sequence that reveals the project title frame by frame."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/20 bg-black/45 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-12">
            <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.34em]">
              ATRIQUET // 0.0
            </Link>
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.3em] md:gap-10">
              <span className="text-white/70">Homepage</span>
              <Link href="/" className="hover:text-[#ff0000]">
                Main Page
              </Link>
            </div>
          </div>
        </nav>

        <main className="pt-20">
          <ScrollFrameSequence
            frameCount={192}
            eyebrow="Wardrobe Opening Sequence"
            title="ATRIQUET"
            subtitle="Every scroll step advances the extracted frame sequence so the door opens gradually and reveals the project title with direct user control."
            ctaLabel="Continue"
            onCtaClick={() => router.push('/')}
          />

          <section className="border-t border-white/15 bg-black px-6 py-20 md:px-12">
            <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">Sequence Complete</p>
                <h2 className="mt-4 font-display text-4xl italic md:text-6xl">The doors are open. Continue into the main experience.</h2>
              </div>
              <button
                onClick={() => router.push('/')}
                className="border border-white bg-white px-8 py-4 font-heading text-xs uppercase tracking-[0.28em] text-black transition hover:border-[#00E5FF] hover:bg-[#00E5FF] hover:text-white"
              >
                Continue
              </button>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}
