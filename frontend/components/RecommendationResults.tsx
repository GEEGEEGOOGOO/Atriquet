import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface RecommendationResultsProps {
  data: any
  onReset: () => void
}

// Helper function to format text with proper structure
function formatTextWithStructure(text: string) {
  if (!text) return null;

  // Split by common separators and format
  const lines = text
    .replace(/OUTFIT \d+:/gi, '\n**OUTFIT:**')
    .replace(/- Name:/gi, '\n• **Name:**')
    .replace(/- Description:/gi, '\n• **Description:**')
    .replace(/- Top:/gi, '\n• **Top:**')
    .replace(/- Bottom:/gi, '\n• **Bottom:**')
    .replace(/- Shoes:/gi, '\n• **Shoes:**')
    .replace(/- Colors:/gi, '\n• **Colors:**')
    .replace(/- Why it works:/gi, '\n• **Why it works:**')
    .replace(/However,/gi, '\n\nHowever,')
    .replace(/Since/gi, '\n\nSince')
    .split('\n')
    .filter(line => line.trim());

  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('•')) {
      return (
        <div key={idx} className="flex items-start gap-2 ml-4 my-1">
          <span className="text-cyan-400 mt-1">•</span>
          <span dangerouslySetInnerHTML={{
            __html: trimmed.substring(1).replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300">$1</strong>')
          }} />
        </div>
      );
    }
    if (trimmed.startsWith('**')) {
      return (
        <h5 key={idx} className="font-bold text-purple-300 mt-4 mb-2"
          dangerouslySetInnerHTML={{
            __html: trimmed.replace(/\*\*(.*?)\*\*/g, '$1')
          }} />
      );
    }
    return <p key={idx} className="my-2">{trimmed}</p>;
  });
}

export default function RecommendationResults({ data, onReset }: RecommendationResultsProps) {
  const [loadingImages, setLoadingImages] = useState<{ [key: number]: boolean }>({})
  const [clothingImages, setClothingImages] = useState<{ [key: number]: any }>({})

  const {
    recommendations,
    processing_time,
    used_api,
    is_appropriate,
    critique,
    improvement_suggestions,
  } = data || {}

  const processingText =
    typeof processing_time === 'number' ? `${processing_time.toFixed(2)}s` : null
  const apiText = typeof used_api === 'string' ? used_api.toUpperCase() : null

  const hasRecommendations = Array.isArray(recommendations) && recommendations.length > 0

  // Get the avatar from the first recommendation (only one is generated)
  const avatarUrl = hasRecommendations && recommendations[0]?.avatar_image_url

  // Function to fetch clothing images for a recommendation
  const fetchClothingImages = async (recIndex: number, rec: any) => {
    setLoadingImages(prev => ({ ...prev, [recIndex]: true }))

    try {
      const response = await fetch('http://localhost:8000/api/clothing-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          top: rec.top,
          bottom: rec.bottom,
          shoes: rec.shoes
        })
      })

      if (response.ok) {
        const images = await response.json()
        setClothingImages(prev => ({ ...prev, [recIndex]: images }))
      }
    } catch (error) {
      console.error('Failed to fetch clothing images:', error)
    } finally {
      setLoadingImages(prev => ({ ...prev, [recIndex]: false }))
    }
  }

  // Auto-fetch images: use backend-provided URLs first, then fetch missing ones
  useEffect(() => {
    if (!hasRecommendations) return

    recommendations.forEach((rec: any, idx: number) => {
      // If backend already returned image URLs, use them directly
      if (rec.top_image_url || rec.bottom_image_url || rec.shoes_image_url) {
        setClothingImages(prev => ({
          ...prev,
          [idx]: {
            top_image_url: rec.top_image_url || null,
            bottom_image_url: rec.bottom_image_url || null,
            shoes_image_url: rec.shoes_image_url || null,
          }
        }))
      } else {
        // Backend didn't return images – fetch them now
        fetchClothingImages(idx, rec)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4">
      {/* Header - Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Style Analysis</h2>
            {(processingText || apiText) && (
              <p className="text-gray-400 text-sm md:text-base">
                {processingText ? `Completed in ${processingText}` : 'Results generated'}
                {apiText ? ` • ${apiText} AI` : ''}
              </p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="px-6 py-3 glass-strong rounded-full font-semibold hover:glow-border-cyan transition-all duration-300"
          >
            ← Start Over
          </motion.button>
        </div>
      </motion.div>

      {/* Verdict Section */}
      {(critique || improvement_suggestions) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card rounded-3xl p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl md:text-4xl ${is_appropriate ? 'bg-green-500/20 glow-border-green' : 'bg-amber-500/20 glow-border-amber'
                }`}
            >
              {is_appropriate ? '✓' : '💡'}
            </motion.div>

            <div className="flex-1 space-y-4">
              <h3 className={`text-2xl md:text-3xl font-bold ${is_appropriate ? 'text-green-400' : 'text-amber-400'}`}>
                {is_appropriate ? 'Perfect Choice!' : 'Style Suggestion'}
              </h3>

              <div className="text-base md:text-lg text-white leading-relaxed">
                {formatTextWithStructure(critique || "Here is the analysis of your outfit.")}
              </div>

              {improvement_suggestions && (
                <div className="glass-strong rounded-2xl p-4 md:p-5 border border-cyan-400/20">
                  <div className="flex items-start gap-3">
                    <span className="text-xl md:text-2xl">💡</span>
                    <div className="flex-1">
                      <h4 className="font-semibold gradient-text mb-3">Styling Tips</h4>
                      <div className="text-gray-300 leading-relaxed text-sm md:text-base">
                        {formatTextWithStructure(improvement_suggestions)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* UNIFIED OUTFIT CARD - Single card with avatar and all 3 recommendations */}
      {hasRecommendations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <h3 className="text-2xl md:text-3xl font-bold gradient-text px-2">
            {is_appropriate ? 'Styling Enhancements' : 'Recommended Outfits'}
          </h3>

          {/* Single Unified Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
            className="glass-card rounded-3xl overflow-hidden relative group"
          >
            {/* Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10 grid md:grid-cols-[400px_1fr] gap-6 md:gap-8 p-6 md:p-8">
              {/* Left: Animated Avatar */}
              <div className="w-full">
                {avatarUrl ? (
                  <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden">
                    <motion.img
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8 }}
                      src={avatarUrl}
                      alt="Your Style Avatar"
                      className="w-full h-full object-cover avatar-idle"
                    />
                    {/* Gradient overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>

                    {/* Avatar Label */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="glass-strong rounded-xl p-3 text-center">
                        <p className="text-white font-semibold text-sm">Your Style Avatar</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="loading-spinner mx-auto"></div>
                      <p className="text-sm text-gray-400">Generating avatar...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: All 3 Recommendations */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 flex-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full"></div>
                  <span className="text-gray-400 text-sm font-semibold">TOP PICKS FOR YOU</span>
                  <div className="h-1 flex-1 bg-gradient-to-l from-cyan-500 via-purple-500 to-pink-500 rounded-full"></div>
                </div>

                {recommendations.map((rec: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                    className="glass-strong rounded-2xl p-5 md:p-6 space-y-4 hover:glow-border-cyan transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                        <h4 className="text-lg md:text-xl font-bold text-white">
                          {rec.outfit_name}
                        </h4>
                      </div>
                      {rec.match_score && (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="px-3 py-1.5 glass rounded-full"
                        >
                          <span className="gradient-text font-bold text-sm">
                            {rec.match_score}%
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Why it works */}
                    {rec.why_it_works && (
                      <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                        {rec.why_it_works}
                      </p>
                    )}

                    {/* Fetch Images Button (retry) */}
                    {!clothingImages[idx] && !loadingImages[idx] && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fetchClothingImages(idx, rec)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:from-cyan-400 hover:to-purple-400 transition-all"
                      >
                        🔄 Retry Fetching Images
                      </motion.button>
                    )}

                    {loadingImages[idx] && (
                      <div className="w-full py-4 glass rounded-xl flex items-center justify-center gap-3">
                        <div className="loading-spinner"></div>
                        <span className="text-gray-300">Searching for clothing images...</span>
                      </div>
                    )}

                    {/* Outfit Items with Images */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Top */}
                      <div className="glass rounded-xl p-3">
                        {clothingImages[idx]?.top_image_url && (
                          <div className="mb-3 rounded-lg overflow-hidden aspect-square bg-gray-800">
                            <img
                              src={clothingImages[idx].top_image_url}
                              alt={rec.top}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-cyan-400 text-sm">👕</span>
                          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Top</span>
                        </div>
                        <p className="text-white text-sm font-medium">{rec.top}</p>
                      </div>

                      {/* Bottom */}
                      <div className="glass rounded-xl p-3">
                        {clothingImages[idx]?.bottom_image_url && (
                          <div className="mb-3 rounded-lg overflow-hidden aspect-square bg-gray-800">
                            <img
                              src={clothingImages[idx].bottom_image_url}
                              alt={rec.bottom}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-purple-400 text-sm">👖</span>
                          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Bottom</span>
                        </div>
                        <p className="text-white text-sm font-medium">{rec.bottom}</p>
                      </div>

                      {/* Shoes */}
                      <div className="glass rounded-xl p-3">
                        {clothingImages[idx]?.shoes_image_url && (
                          <div className="mb-3 rounded-lg overflow-hidden aspect-square bg-gray-800">
                            <img
                              src={clothingImages[idx].shoes_image_url}
                              alt={rec.shoes}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-pink-400 text-sm">👞</span>
                          <span className="text-xs font-semibold text-pink-400 uppercase tracking-wide">Shoes</span>
                        </div>
                        <p className="text-white text-sm font-medium">{rec.shoes}</p>
                      </div>
                    </div>

                    {/* Color Palette */}
                    {rec.color_palette && rec.color_palette.length > 0 && (
                      <div className="pt-3 border-t border-gray-700/50">
                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Color Palette</p>
                        <div className="flex gap-2 flex-wrap">
                          {rec.color_palette.map((color: string, colorIdx: number) => (
                            <div
                              key={colorIdx}
                              className="px-3 py-1.5 rounded-full text-xs font-medium glass-strong"
                            >
                              {color}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {!hasRecommendations && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-3xl p-12 text-center"
        >
          <p className="text-gray-400 text-lg">No recommendations available.</p>
        </motion.div>
      )}
    </div>
  )
}
