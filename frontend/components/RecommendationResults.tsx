import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface RecommendationResultsProps {
  data: any
  onReset: () => void
}

// Helper function to format text with proper structure
function formatTextWithStructure(text: string) {
  if (!text) return null;

  const lines = text
    .replace(/OUTFIT \d+:/gi, '\n**OUTFIT:**')
    .replace(/- Name:/gi, '\n- **Name:**')
    .replace(/- Description:/gi, '\n- **Description:**')
    .replace(/- Top:/gi, '\n- **Top:**')
    .replace(/- Bottom:/gi, '\n- **Bottom:**')
    .replace(/- Shoes:/gi, '\n- **Shoes:**')
    .replace(/- Colors:/gi, '\n- **Colors:**')
    .replace(/- Why it works:/gi, '\n- **Why it works:**')
    .replace(/However,/gi, '\n\nHowever,')
    .replace(/Since/gi, '\n\nSince')
    .split('\n')
    .filter(line => line.trim());

  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      return (
        <div key={idx} className="flex items-start gap-2 ml-4 my-1">
          <span className="text-nexus-brown mt-1 flex-shrink-0">•</span>
          <span dangerouslySetInnerHTML={{
            __html: trimmed.substring(1).replace(/\*\*(.*?)\*\*/g, '<strong class="text-nexus-brown font-semibold">$1</strong>')
          }} />
        </div>
      );
    }
    if (trimmed.startsWith('**')) {
      return (
        <h5 key={idx} className="font-serif font-bold text-nexus-text mt-4 mb-2"
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
    generated_avatars,
  } = data || {}

  const processingText =
    typeof processing_time === 'number' ? `${processing_time.toFixed(2)}s` : null
  const apiText = typeof used_api === 'string' ? used_api.toUpperCase() : null

  const hasRecommendations = Array.isArray(recommendations) && recommendations.length > 0
  const hasGeneratedOutfits = Array.isArray(generated_avatars) && generated_avatars.length > 0

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

  useEffect(() => {
    if (!hasRecommendations) return

    recommendations.forEach((rec: any, idx: number) => {
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
        fetchClothingImages(idx, rec)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-nexus-beige/50"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-nexus-text mb-2">Style Analysis</h2>
            {(processingText || apiText) && (
              <p className="text-nexus-gray text-sm">
                {processingText ? `Completed in ${processingText}` : 'Results generated'}
                {apiText ? ` • ${apiText} AI` : ''}
              </p>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="px-6 py-3 bg-nexus-beige/50 hover:bg-nexus-beige text-nexus-text rounded-sm text-xs font-bold tracking-widest uppercase transition-all duration-300"
          >
            ← New Analysis
          </motion.button>
        </div>
      </motion.div>

      {/* Verdict Section */}
      {(critique || improvement_suggestions) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-nexus-beige/50"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div
              className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${
                is_appropriate
                  ? 'bg-green-50 text-green-600 border-2 border-green-200'
                  : 'bg-amber-50 text-amber-600 border-2 border-amber-200'
              }`}
            >
              {is_appropriate ? '✓' : '💡'}
            </div>

            <div className="flex-1 space-y-4">
              <h3 className={`font-serif text-2xl md:text-3xl ${is_appropriate ? 'text-green-700' : 'text-amber-700'}`}>
                {is_appropriate ? 'Perfect Choice!' : 'Style Suggestion'}
              </h3>

              <div className="text-nexus-text leading-relaxed">
                {formatTextWithStructure(critique || "Here is the analysis of your outfit.")}
              </div>

              {improvement_suggestions && (
                <div className="bg-nexus-cream rounded-lg p-5 border border-nexus-beige">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <div className="flex-1">
                      <h4 className="font-serif font-semibold text-nexus-brown mb-3">Styling Tips</h4>
                      <div className="text-nexus-gray leading-relaxed text-sm">
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

      {/* OUTFIT RECOMMENDATIONS WITH VISUALIZATIONS */}
      {hasRecommendations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <h3 className="font-serif text-2xl md:text-3xl text-nexus-text">
            {is_appropriate ? 'Styling Enhancements' : 'Recommended Outfits'}
          </h3>

          <div className="space-y-6">
            {recommendations.map((rec: any, idx: number) => {
              const outfitVisualization = hasGeneratedOutfits
                ? generated_avatars.find((avatar: any) => avatar.outfit_index === idx + 1)
                : null

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-nexus-beige/50 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="grid md:grid-cols-[320px_1fr] gap-0">
                    {/* Left: Outfit Visualization */}
                    <div className="w-full">
                      {outfitVisualization?.image ? (
                        <div className="relative w-full aspect-[3/4] bg-nexus-beige/30">
                          <motion.img
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            src={outfitVisualization.image}
                            alt={`You wearing ${rec.outfit_name}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Label at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                            <p className="text-white font-serif text-lg">{rec.outfit_name}</p>
                            <p className="text-white/70 text-xs uppercase tracking-widest">Outfit {idx + 1}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full aspect-[3/4] bg-nexus-beige/20 flex items-center justify-center">
                          <div className="text-center space-y-3">
                            <div className="loading-spinner mx-auto"></div>
                            <p className="text-sm text-nexus-gray">Generating visualization...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Outfit Details */}
                    <div className="p-6 md:p-8 space-y-5">
                      {/* Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-nexus-brown flex items-center justify-center text-white font-bold text-sm">
                            {idx + 1}
                          </div>
                          <h4 className="font-serif text-xl md:text-2xl text-nexus-text">
                            {rec.outfit_name}
                          </h4>
                        </div>
                        {rec.match_score && (
                          <span className="px-3 py-1.5 bg-nexus-beige/50 rounded-sm text-xs font-bold tracking-wider text-nexus-brown">
                            {rec.match_score}% MATCH
                          </span>
                        )}
                      </div>

                      {/* Why it works */}
                      {rec.why_it_works && (
                        <div className="bg-nexus-cream rounded-lg p-4 border border-nexus-beige/50">
                          <p className="text-nexus-gray leading-relaxed text-sm">
                            {rec.why_it_works}
                          </p>
                        </div>
                      )}

                      {/* Retry button */}
                      {!clothingImages[idx] && !loadingImages[idx] && (
                        <button
                          onClick={() => fetchClothingImages(idx, rec)}
                          className="w-full py-3 px-4 bg-nexus-brown hover:bg-[#8c563e] rounded-sm text-white text-xs font-bold tracking-widest uppercase transition-all"
                        >
                          LOAD CLOTHING IMAGES
                        </button>
                      )}

                      {loadingImages[idx] && (
                        <div className="w-full py-3 bg-nexus-beige/30 rounded-lg flex items-center justify-center gap-3">
                          <div className="loading-spinner"></div>
                          <span className="text-nexus-gray text-sm">Finding clothing items...</span>
                        </div>
                      )}

                      {/* Outfit Items with Images */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Top */}
                        <div className="bg-nexus-cream rounded-lg p-3 border border-nexus-beige/30">
                          {clothingImages[idx]?.top_image_url && (
                            <div className="mb-3 rounded-md overflow-hidden aspect-square bg-white">
                              <img
                                src={clothingImages[idx].top_image_url}
                                alt={rec.top}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-nexus-brown uppercase tracking-widest">Top</span>
                          <p className="text-nexus-text text-sm font-medium mt-1">{rec.top}</p>
                        </div>

                        {/* Bottom */}
                        <div className="bg-nexus-cream rounded-lg p-3 border border-nexus-beige/30">
                          {clothingImages[idx]?.bottom_image_url && (
                            <div className="mb-3 rounded-md overflow-hidden aspect-square bg-white">
                              <img
                                src={clothingImages[idx].bottom_image_url}
                                alt={rec.bottom}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-nexus-brown uppercase tracking-widest">Bottom</span>
                          <p className="text-nexus-text text-sm font-medium mt-1">{rec.bottom}</p>
                        </div>

                        {/* Shoes */}
                        <div className="bg-nexus-cream rounded-lg p-3 border border-nexus-beige/30">
                          {clothingImages[idx]?.shoes_image_url && (
                            <div className="mb-3 rounded-md overflow-hidden aspect-square bg-white">
                              <img
                                src={clothingImages[idx].shoes_image_url}
                                alt={rec.shoes}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-nexus-brown uppercase tracking-widest">Shoes</span>
                          <p className="text-nexus-text text-sm font-medium mt-1">{rec.shoes}</p>
                        </div>
                      </div>

                      {/* Color Palette */}
                      {rec.color_palette && rec.color_palette.length > 0 && (
                        <div className="pt-4 border-t border-nexus-beige/50">
                          <p className="text-[10px] font-bold text-nexus-gray uppercase tracking-widest mb-2">Color Palette</p>
                          <div className="flex gap-2 flex-wrap">
                            {rec.color_palette.map((color: string, colorIdx: number) => (
                              <span
                                key={colorIdx}
                                className="px-3 py-1.5 rounded-sm text-xs font-medium bg-nexus-beige/40 text-nexus-text border border-nexus-beige"
                              >
                                {color}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {!hasRecommendations && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl p-12 text-center shadow-sm border border-nexus-beige/50"
        >
          <p className="text-nexus-gray text-lg font-serif">No recommendations available.</p>
        </motion.div>
      )}
    </div>
  )
}
