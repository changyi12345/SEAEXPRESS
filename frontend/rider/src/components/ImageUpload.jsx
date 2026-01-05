import { useState } from 'react'
import axios from 'axios'

export default function ImageUpload({ onUpload, existingImage, label = 'Upload Image' }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(existingImage || null)
  const [error, setError] = useState('')

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setError('')
    setUploading(true)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload file
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await axios.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (res.data.success) {
        // Get full URL (backend URL + path)
        const baseURL = axios.defaults.baseURL || 'http://localhost:5000'
        const imageUrl = baseURL.replace('/api', '') + res.data.url
        onUpload(imageUrl)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError(error.response?.data?.message || 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mb-4">
      <label className="block mb-2 font-semibold">{label}</label>
      <div className="flex items-center space-x-4">
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded border"
            />
            {existingImage && preview === existingImage && (
              <span className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded">
                Current
              </span>
            )}
          </div>
        )}
        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer disabled:opacity-50"
          />
          {uploading && (
            <p className="text-sm text-blue-600 mt-1">Uploading...</p>
          )}
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}

