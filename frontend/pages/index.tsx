import { useState, useRef } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import ImageUpload from '../components/ImageUpload'
import RecommendationResults from '../components/RecommendationResults'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function Home() {
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(false)
  const [occasion, setOccasion] = useState('casual')
  const [style, setStyle] = useState('minimalist')
  const uploadRef = useRef<HTMLDivElement>(null)

  const handleRecommendations = (data: any) => {
    setRecommendations(data)
    // Scroll to results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReset = () => {
    setRecommendations(null)
  }

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleNavigate = (section: string) => {
    if (section === 'upload') {
      if (recommendations) {
        handleReset()
      }
      setTimeout(() => scrollToUpload(), 100)
    } else if (section === 'home') {
      handleReset()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <Head>
        <title>ATRIQUET - Style Journal</title>
        <meta name="description" content="Your personal AI-powered style canvas. Upload your photo to begin your curated fashion journey." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-nexus-cream">
        {/* Header */}
        <Header onNavigate={handleNavigate} />

        {recommendations ? (
          /* ── RESULTS VIEW ── */
          <main className="min-h-screen">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <RecommendationResults
                  data={recommendations}
                  onReset={handleReset}
                />
              </motion.div>
            </div>
          </main>
        ) : (
          /* ── HOME VIEW ── */
          <main>
            {/* ── HERO SECTION ── */}
            <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden hero-section">
              {/* Background Image */}
              <img
                alt="Fashion style"
                className="absolute inset-0 w-full h-full object-cover object-top"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAb8rH6aU56zHEXkiGL8QAKsK7oLuqHGnUZnsK2JGbYLGg8EouKD7ou0ZPMFsjCuXFpW9_bE-dDre4rmw9S-QJXj26_PjbGgRZ2M6iwm9NjXsUaAhzGRIQLEsAG99hbQ2z8So-u9htvpp-nAOOf0-ZhnxKxBuH1pMWb8nnMq2k2og5R-OgWlurbatLAIqRELOKilbT2BX9_zqdQPpgujr4_7NA0VAOxf1myweapcbgnV6bMVveRXQvrYhLBnIoJ7DYuqqQTsy5PCKwG"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

              {/* Content */}
              <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center">
                <div className="max-w-lg text-white">
                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="font-serif text-5xl md:text-6xl leading-tight mb-6"
                  >
                    YOUR PERSONAL<br />STYLE CANVAS
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-base md:text-lg font-light mb-8 leading-relaxed opacity-90 max-w-md"
                  >
                    Upload your photo to begin your curated fashion journey. Our AI crafts your unique style story.
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    onClick={scrollToUpload}
                    className="bg-[#A06448] hover:bg-[#8c563e] text-white text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-sm transition duration-300"
                  >
                    UPLOAD PHOTO
                  </motion.button>
                </div>
              </div>
            </section>

            {/* ── UPLOAD SECTION ── */}
            <section ref={uploadRef} className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left: Text */}
                <div className="pr-0 lg:pr-12">
                  <span className="block text-xs font-bold tracking-widest text-nexus-gray mb-4 uppercase">
                    Style AI
                  </span>
                  <h3 className="font-serif text-4xl md:text-5xl text-nexus-text mb-6 leading-tight">
                    Discover Your<br />Perfect Look
                  </h3>
                  <p className="text-nexus-gray text-lg leading-relaxed mb-8">
                    Upload a photo of your current outfit and our AI will analyze your style, provide expert feedback, and recommend new looks — complete with visualizations of you wearing each outfit.
                  </p>

                  {/* Occasion & Style Selectors */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-bold tracking-widest text-nexus-gray mb-2 uppercase">
                        Occasion
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['casual', 'formal', 'business', 'party', 'wedding'].map((occ) => (
                          <button
                            key={occ}
                            onClick={() => setOccasion(occ)}
                            className={`px-4 py-2 rounded-sm text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                              occasion === occ
                                ? 'bg-nexus-brown text-white'
                                : 'bg-nexus-beige/50 text-nexus-text hover:bg-nexus-beige'
                            }`}
                          >
                            {occ}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold tracking-widest text-nexus-gray mb-2 uppercase">
                        Style
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['minimalist', 'classic', 'trendy', 'bohemian', 'streetwear'].map((st) => (
                          <button
                            key={st}
                            onClick={() => setStyle(st)}
                            className={`px-4 py-2 rounded-sm text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                              style === st
                                ? 'bg-nexus-brown text-white'
                                : 'bg-nexus-beige/50 text-nexus-text hover:bg-nexus-beige'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Upload Component */}
                <div className="h-auto rounded-xl overflow-hidden">
                  <ImageUpload
                    onRecommendations={handleRecommendations}
                    loading={loading}
                    setLoading={setLoading}
                    occasion={occasion}
                    style={style}
                  />
                </div>
              </div>
            </section>

            {/* ── LATEST LOOKS (Placeholder Showcase) ── */}
            <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
              {/* Section Header */}
              <div className="flex justify-between items-end mb-8">
                <h3 className="font-serif text-2xl md:text-3xl uppercase tracking-wide text-nexus-text">
                  STYLE STORIES
                </h3>
                <div className="flex gap-4">
                  <button className="text-nexus-gray hover:text-nexus-text transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button className="text-nexus-text hover:text-nexus-brown transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <article className="group cursor-pointer" onClick={scrollToUpload}>
                  <div className="overflow-hidden rounded-md mb-3 aspect-[3/4]">
                    <img
                      alt="Business Redefined"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDE5wGGD9AWeNGjEzPCtrt8bUXhmsmIB2k1PNRfVVnwXLOaQ7xPtxDij4tNN3T05pnuID2e67V43jbDOBQWOHaE-gZqrp0CSe33OYGYDKAowS8A_0txv_jJjemLnPwZACH6jDZ6pIH67Soc5F46XEeXTSvPjvUonWHxo2GTlURlY33a66KzNTY1WybRDx-w5ZR7UAzNHxqZtWQljx5btoadEpsrssN4xTzDiq1EflAa3Y-yYWKSzudUyuEGP0nZNMmwVCEhzfSlOVUm"
                    />
                  </div>
                  <p className="text-sm font-medium text-nexus-text">Business Casual Redefined</p>
                </article>

                {/* Card 2 */}
                <article className="group cursor-pointer" onClick={scrollToUpload}>
                  <div className="overflow-hidden rounded-md mb-3 aspect-[3/4]">
                    <img
                      alt="Evening Gown"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuALn_TM5J06am7wFzwaxNxBUs5EpHvNNYXYXV_uQbVmVNMLBxakocfjrBTqKOdDyir5yEasaXZigGVQsZHt0ALHPbzwbDf2FEsOW_rSFDd4REKeub9x6sMDiR6UfoCMIBFz1Fwp2D28tOuO0vPevcQbm68gQxsacTnYqkDeIppv0qPh91wQ8pRg5SzcslNlWgO_5ip7qrBARSQvIhRAqO0jGwdV_JDEs9rWLCaRddpO6NzpRWDkss9FooExPRLVNlvZHpLFm5eAplyL"
                    />
                  </div>
                  <p className="text-sm font-medium text-nexus-text">Evening Elegance</p>
                </article>

                {/* Card 3 */}
                <article className="group cursor-pointer" onClick={scrollToUpload}>
                  <div className="overflow-hidden rounded-md mb-3 aspect-[3/4]">
                    <img
                      alt="Weekend Casual"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_7NsxJpsSQeKSluUuAtAdXpWq17UGD5fgetbNA6m7OGFsTsBvKavl0zWmEoBFx_mFazOrY_j100eFFEbS6xAePaoaZs240TH3J9YfKTUlxJwwvl5PkzSAPTkK4W1ptOd43_hqcgg-KoxZDYGyEn95Bf4sV0WlB3162ekMkZbs_fnq8RVMI6dZwFNaU2fUb57-4jaa9ksLWcj1MqK0kZxcuQnHgGfJA8v8fGjCAr4_CGkHHEPlYvaVH27gKuN7SKVBvMJW47pb_V8W"
                    />
                  </div>
                  <p className="text-sm font-medium text-nexus-text">Weekend Redefined</p>
                </article>
              </div>
            </section>

            {/* ── STYLE STORY: Business ── */}
            <section className="max-w-7xl mx-auto px-6 md:px-12 pb-16 md:pb-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <div className="order-2 lg:order-1 pr-0 lg:pr-12">
                  <span className="block text-xs font-bold tracking-widest text-nexus-gray mb-4 uppercase">
                    Style Story
                  </span>
                  <h3 className="font-serif text-4xl md:text-5xl text-nexus-text mb-6 leading-tight">
                    Business Casual Redefined
                  </h3>
                  <p className="text-nexus-gray text-lg leading-relaxed mb-8">
                    Elevate your workday with warm earth tones and relaxed tailoring. Perfect for the modern professional.
                  </p>
                  <button
                    onClick={scrollToUpload}
                    className="bg-[#A06448] hover:bg-[#8c563e] text-white text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-sm transition duration-300"
                  >
                    TRY THIS STYLE
                  </button>
                </div>

                {/* Image Content */}
                <div className="order-1 lg:order-2 h-[500px] lg:h-[600px] rounded-xl overflow-hidden shadow-lg">
                  <img
                    alt="Business Casual Style"
                    className="w-full h-full object-cover object-center"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXXeIcuehBc5BPOZqSFF6kGuuF5yaMweEfdTTt4gy5lqkj34Bz7H8zURddkY-JB5LFKW9HjguBXz5DRnYpUVChUrRzH6xPtupDad-zA6oNDiKnNne_AtMh3o5KV83NWFWywNzTNSGjg1KoWZBZq31TQOZenO-BGeMMXaGbVHn8RLB19xHZwI15BU1nM_9jcMb1ox_O_t_tSaUT1AxXF3RBiNUTH7cmMvdOVISBfOp6E7d3ckjo-11Mzk9pj3Uy8XM_Vcw01QxcMs1Y"
                  />
                </div>
              </div>
            </section>

            {/* ── STYLE STORY: Evening Gala ── */}
            <section className="max-w-7xl mx-auto px-6 md:px-12 pb-16 md:pb-24">
              <div className="bg-[#3E332B] rounded-xl overflow-hidden shadow-2xl flex flex-col lg:flex-row w-full">
                {/* Image Column */}
                <div
                  className="w-full lg:w-1/2 min-h-[400px] lg:min-h-[500px] bg-cover bg-center"
                  style={{
                    backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuB_oD71R4Tor8Xlyk2K4N0aCFfFaYRmYQqq3qElaRPBINx1fY60qyYoB1Wgdc0R2SetNcZH6xnVEL8vH9J4gHITvgk0yMxkHEjcv3PlP2kt75B4mrIzSaC1Cv1bHWUglW8m-AUvvop3X4bocc2NK3TtUSMOkXimlAeM0swWTCGBSbDLoIqYE50_DQcFi3YlMH9HpboK4AHNtjVRHH1S6gidonw4z59moSnIGU0twJsjHgoTov6tmAJjiAqx49bS4A_SOGCYpwGsn147)'
                  }}
                />

                {/* Text Column */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-16 text-left">
                  <span className="block text-xs font-bold tracking-widest text-white/70 mb-4 uppercase">
                    Style Story
                  </span>
                  <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-6 leading-tight">
                    Evening Gala Elegance
                  </h3>
                  <p className="text-white/90 text-lg leading-relaxed mb-8">
                    Step into the spotlight with breathtaking silhouettes and rich textures. Our curated evening collection ensures you shine at every occasion with timeless grace and cinematic flair.
                  </p>
                  <div>
                    <button
                      onClick={scrollToUpload}
                      className="bg-[#A6684F] hover:bg-[#8c563e] text-white text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-sm transition duration-300"
                    >
                      TRY THIS STYLE
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </main>
        )}

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}
