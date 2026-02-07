import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ImageUploadProps {
  onRecommendations: (data: any) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  occasion: string
  style: string
}

export default function ImageUpload({ onRecommendations, loading, setLoading, occasion, style }: ImageUploadProps) {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const handleSubmit = async () => {
    if (!image) {
      setError('Please upload an image')
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('image', image)
    formData.append('occasion', occasion || 'casual')
    formData.append('style', style || 'minimalist')
    formData.append('include_brands', 'false')

    try {
      const response = await axios.post(`${API_URL}/api/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000 // 5 minute timeout
      })

      onRecommendations(response.data)
    } catch (err: any) {
      console.error('Error:', err)
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to analyze image. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Upload Dropzone - Premium Glass */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
        {...getRootProps()}
        className={`
          upload-zone
          rounded-3xl p-12 cursor-pointer
          text-center relative overflow-hidden
          ${isDragActive ? 'glow-border-cyan' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Gradient Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

        <div className="relative z-10">
          {preview ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="relative w-full max-w-md mx-auto aspect-square rounded-2xl overflow-hidden glass-card">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-gray-400">
                Click or drag to change image
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Upload Icon with Gradient */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl"
              >
                📸
              </motion.div>

              <div className="space-y-2">
                <p className="text-2xl font-bold gradient-text">
                  {isDragActive ? 'Drop your photo here' : 'Upload your photo'}
                </p>
                <p className="text-gray-400">
                  Drag & drop or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports JPG, PNG up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Submit Button - Gradient with Glow */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={!image || loading}
        className={`
          w-full py-5 px-8 rounded-2xl font-bold text-lg
          transition-all duration-300 relative overflow-hidden
          ${!image || loading
            ? 'glass opacity-50 cursor-not-allowed'
            : 'glass-strong glow-border-gradient hover:shadow-2xl'
          }
        `}
      >
        {/* Gradient Background */}
        {!loading && image && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
        )}

        <span className="relative z-10 flex items-center justify-center gap-3">
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              <span className="gradient-text">Analyzing your style...</span>
            </>
          ) : (
            <span className="gradient-text">Get My Recommendations ✨</span>
          )}
        </span>
      </motion.button>

      {/* Error Message - Glass Card */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 border-red-500/30"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-400">Error</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
