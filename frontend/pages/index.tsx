import { useState } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import ImageUpload from '../components/ImageUpload'
import RecommendationResults from '../components/RecommendationResults'
import FloatingNav from '../components/FloatingNav'

export default function Home() {
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(false)
  const [occasion, setOccasion] = useState('')
  const [style, setStyle] = useState('minimalist')

  const handleRecommendations = (data: any) => {
    setRecommendations(data)
  }

  const handleReset = () => {
    setRecommendations(null)
  }

  return (
    <>
      <Head>
        <title>ATRIQUET - AI Fashion Stylist</title>
        <meta name="description" content="Get personalized outfit recommendations powered by AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen relative">
        {/* Floating Navigation */}
        <FloatingNav
          occasion={occasion}
          style={style}
          onOccasionChange={setOccasion}
          onStyleChange={setStyle}
        />

        {!recommendations ? (
          /* Hero Section - Centered Layout */
          <main className="min-h-screen flex items-center justify-center px-6 pt-32 pb-20">
            <div className="max-w-3xl mx-auto w-full text-center">
              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6 mb-12"
              >
                <h1 className="text-6xl md:text-7xl font-bold leading-tight">
                  <span className="gradient-text">Get styled</span>
                  <br />
                  <span className="text-white">with AI</span>
                </h1>

                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  Upload your photo and receive personalized outfit recommendations
                  with AI-generated avatars showing you in each outfit
                </p>
              </motion.div>

              {/* Upload Component */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <ImageUpload
                  onRecommendations={handleRecommendations}
                  loading={loading}
                  setLoading={setLoading}
                  occasion={occasion}
                  style={style}
                />
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 pulse-glow"></div>
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 pulse-glow"></div>
                  <span>Avatar Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 pulse-glow"></div>
                  <span>Personalized</span>
                </div>
              </motion.div>
            </div>
          </main>
        ) : (
          /* Results View */
          <main className="min-h-screen pt-32 pb-20">
            <div className="container mx-auto px-6">
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
        )}

        {/* Decorative Elements */}
        <div className="fixed bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="fixed top-1/2 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </>
  )
}
