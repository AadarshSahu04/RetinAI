import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { User, Calendar, Send } from 'lucide-react'
import ImageDropzone from '../components/ImageDropzone.jsx'
import ResultCard from '../components/ResultCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { predictDR } from '../api.js'

const INITIAL_FORM = { name: '', age: '', gender: '' }

export default function UploadPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [imageError, setImageError] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleImageChange = useCallback((file, error) => {
    setImageFile(file)
    setImageError(error)
  }, [])

  const validate = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Patient name is required.'
    if (!form.age) errors.age = 'Age is required.'
    else if (Number(form.age) < 0 || Number(form.age) > 120) errors.age = 'Age must be 0–120.'
    if (!form.gender) errors.gender = 'Gender is required.'
    if (!imageFile) errors.image = 'Please upload a retinal image.'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate()
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      if (errors.image) setImageError(errors.image)
      toast.error('Please fix the errors before submitting.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name.trim())
      formData.append('age', form.age)
      formData.append('gender', form.gender)
      formData.append('image', imageFile)

      const data = await predictDR(formData)
      setResult(data)
      toast.success('Analysis complete!')
    } catch (err) {
      toast.error(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm(INITIAL_FORM)
    setImageFile(null)
    setImageError(null)
    setFormErrors({})
    setResult(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid lg:grid-cols-2 gap-10 items-start">

        {/* Left: info panel */}
        <div className="space-y-8 animate-fade-in">
          <div>
            <p className="text-blue-400 text-xs font-mono uppercase tracking-widest mb-3">
              AI-Powered Analysis
            </p>
            <h1 className="font-display font-bold text-4xl xl:text-5xl text-[var(--text-primary)] leading-tight">
              Retin AI<br />
              <span className="text-blue-400">An Eye for an Eye</span>
            </h1>
            
          </div>

          {/* Severity legend */}
          <div className="card p-5 space-y-3">
            <p className="text-[var(--text-muted)] text-xs font-mono uppercase tracking-widest">DR Severity Scale</p>
            {[
              ['No DR', 'bg-emerald-400', 'Normal — no signs detected'],
              ['Mild DR', 'bg-yellow-400', 'Early microaneurysms present'],
              ['Moderate DR', 'bg-orange-400', 'More pronounced vascular changes'],
              ['Severe DR', 'bg-red-400', 'Extensive damage, high risk'],
              ['Proliferative DR', 'bg-purple-400', 'Advanced, vision-threatening'],
            ].map(([label, dot, desc]) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                <span className="text-[var(--text-primary)] text-sm font-medium w-36">{label}</span>
                <span className="text-[var(--text-muted)] text-xs">{desc}</span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-[var(--text-muted)] text-xs leading-relaxed border-l-2 border-[var(--border)] pl-4">
            This tool is intended to assist clinicians, not replace professional diagnosis.
            All results should be reviewed by a qualified ophthalmologist.
            <br />
            <span className="text-blue-400">Developed By:- Vigya Gupta , Aadarsh sahu , Udit Maheshwari</span>
          </p>
        </div>

        {/* Right: form / result */}
        <div className="animate-slide-up">
          {result ? (
            <div className="card p-6">
              <h2 className="font-display font-semibold text-lg mb-5 text-[var(--text-primary)]">
                Analysis Result
              </h2>
              <ResultCard
                result={result.result}
                confidence={result.confidence}
                patientId={result.patient_id}
                onReset={handleReset}
              />
            </div>
          ) : (
            <div className="card p-6 glow-blue">
              <h2 className="font-display font-semibold text-lg mb-6 text-[var(--text-primary)]">
                New Patient Scan
              </h2>

              {loading ? (
                <LoadingSpinner />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* Name */}
                  <div>
                    <label className="label">
                      <User size={12} className="inline mr-1.5" />
                      Patient Name
                    </label>
                    <input
                      type="text"
                      className={`input-field ${formErrors.name ? 'border-red-500/60' : ''}`}
                      placeholder="e.g. Rajesh Kumar"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      autoComplete="off"
                    />
                    {formErrors.name && (
                      <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Age + Gender row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <Calendar size={12} className="inline mr-1.5" />
                        Age
                      </label>
                      <input
                        type="number"
                        className={`input-field ${formErrors.age ? 'border-red-500/60' : ''}`}
                        placeholder="e.g. 52"
                        min="0"
                        max="120"
                        value={form.age}
                        onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                      />
                      {formErrors.age && (
                        <p className="text-red-400 text-xs mt-1">{formErrors.age}</p>
                      )}
                    </div>
                    <div>
                      <label className="label">
                        Gender
                      </label>
                      <select
                        className={`input-field ${formErrors.gender ? 'border-red-500/60' : ''}`}
                        value={form.gender}
                        onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                      >
                        <option value="">Select…</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {formErrors.gender && (
                        <p className="text-red-400 text-xs mt-1">{formErrors.gender}</p>
                      )}
                    </div>
                  </div>

                  {/* Image upload */}
                  <ImageDropzone
                    file={imageFile}
                    onChange={handleImageChange}
                    error={imageError || formErrors.image}
                  />

                  {/* Submit */}
                  <button type="submit" className="btn-primary w-full mt-2">
                    <Send size={16} />
                    Analyze Retinal Image
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
