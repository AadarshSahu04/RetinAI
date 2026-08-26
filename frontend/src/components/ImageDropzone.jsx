import { useCallback, useState } from 'react'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'image/webp']
const MAX_SIZE_MB = 20

export default function ImageDropzone({ file, onChange, error }) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)

  const handleFile = useCallback((f) => {
    if (!f) return
    if (!ACCEPTED_TYPES.includes(f.type)) {
      onChange(null, 'Invalid file type. Please upload JPG, PNG, BMP, TIFF, or WEBP.')
      return
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      onChange(null, `File too large. Maximum size is ${MAX_SIZE_MB} MB.`)
      return
    }
    const url = URL.createObjectURL(f)
    setPreview(url)
    onChange(f, null)
  }, [onChange])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const onInputChange = useCallback((e) => {
    const f = e.target.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    onChange(null, null)
  }

  return (
    <div className="space-y-2">
      <label className="label">Retinal Fundus Image</label>

      {preview && file ? (
        <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] group">
          <img
            src={preview}
            alt="Retinal preview"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-white text-sm font-medium truncate max-w-[70%]">{file.name}</span>
            <button
              type="button"
              onClick={clearFile}
              className="bg-red-500/80 hover:bg-red-500 text-white rounded-lg p-1.5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {/* File info chip */}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-mono">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
      ) : (
        <label
          className={`
            relative flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed
            cursor-pointer transition-all duration-200
            ${dragging
              ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
              : error
                ? 'border-red-500/50 bg-red-500/5 hover:border-red-500/70'
                : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-blue-500/50 hover:bg-blue-500/5'
            }
          `}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            className="hidden"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={onInputChange}
          />
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200 ${
              dragging ? 'bg-blue-500/20' : 'bg-[var(--border)]'
            }`}>
              {dragging
                ? <Upload size={24} className="text-blue-400" />
                : <ImageIcon size={24} className="text-[var(--text-muted)]" />
              }
            </div>
            <div className="text-center">
              <p className="text-[var(--text-secondary)] text-sm font-medium">
                {dragging ? 'Drop image here' : 'Drop retinal image or click to browse'}
              </p>
              <p className="text-[var(--text-muted)] text-xs mt-1">
                JPG, PNG, BMP, TIFF, WEBP — max {MAX_SIZE_MB} MB
              </p>
            </div>
          </div>
        </label>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-red-400 text-xs">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
}
