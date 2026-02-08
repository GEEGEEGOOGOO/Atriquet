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
    <div className="space-y-5 w-full">
      {/* Upload Dropzone */}
      <div
        {...getRootProps()}
        className={`
          upload-zone rounded-xl p-10 cursor-pointer text-center
          transition-all duration-300
          ${isDragActive ? 'border-nexus-brown bg-nexus-beige/60' : ''}
        `}
      >
        <input {...getInputProps()} />

        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="relative w-full max-w-xs mx-auto aspect-[3/4] rounded-lg overflow-hidden shadow-md">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-nexus-gray">
              Click or drag to change image
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Upload Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-nexus-beige flex items-center justify-center">
              <svg className="w-8 h-8 text-nexus-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-serif text-nexus-text">
                {isDragActive ? 'Drop your photo here' : 'Upload your photo'}
              </p>
              <p className="text-nexus-gray text-sm">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-nexus-gray/60">
                JPG, PNG up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={!image || loading}
        className={`
          w-full py-4 px-8 rounded-sm text-xs font-bold tracking-widest uppercase
          transition-all duration-300
          ${!image || loading
            ? 'bg-nexus-beige text-nexus-gray cursor-not-allowed'
            : 'bg-[#A06448] hover:bg-[#8c563e] text-white shadow-md hover:shadow-lg'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <div className="loading-spinner"></div>
            <span>Analyzing your style...</span>
          </span>
        ) : (
          <span>GET MY RECOMMENDATIONS</span>
        )}
      </motion.button>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p className="font-semibold text-red-700 text-sm">Something went wrong</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
