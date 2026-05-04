import Head from 'next/head'
import Link from 'next/link'

export default function AtelierPage() {
  return (
    <>
      <Head>
        <title>ATRIQUET | Atelier</title>
        <meta
          name="description"
          content="ATRIQUET Atelier module under active design iteration."
        />
      </Head>

      <main className="interactive-canvas flex min-h-screen items-center justify-center px-6 py-24 text-white md:px-12">
        <section className="border-panel w-full max-w-3xl p-10 md:p-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/85">
            Atelier Module
          </p>
          <h1 className="mt-5 font-display text-5xl italic leading-[0.92] md:text-6xl">
            This surface is being refactored.
          </h1>
          <p className="mt-6 max-w-2xl font-body text-base leading-relaxed text-white/74">
            The design shell is now upgraded and ready for the next feature layer.
            Continue to the main manifesto or the VTON lab.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/" className="brutal-btn px-7 py-4 font-heading text-xs uppercase tracking-[0.26em]">
              Open Manifesto
            </Link>
            <Link href="/vton" className="brutal-btn px-7 py-4 font-heading text-xs uppercase tracking-[0.26em]">
              Open VTON Lab
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}