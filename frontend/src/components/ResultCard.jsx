import { CheckCircle2, AlertTriangle, AlertOctagon, ShieldAlert, Zap, Info } from 'lucide-react'
import { getSeverityConfig, formatConfidence } from '../utils.js'
import { useNavigate } from 'react-router-dom'

const SEVERITY_ICONS = {
  'No DR': CheckCircle2,
  'Mild DR': Info,
  'Moderate DR': AlertTriangle,
  'Severe DR': AlertOctagon,
  'Proliferative DR': Zap,
}

const RECOMMENDATIONS = {
  'No DR': 'No signs of diabetic retinopathy detected. Continue regular annual eye examinations and maintain good blood sugar control.',
  'Mild DR': 'Early signs detected. Follow-up examination in 6–12 months is recommended. Maintain strict blood sugar control.',
  'Moderate DR': 'Referral to an ophthalmologist within 3–6 months. Strict control of diabetes, blood pressure, and lipids is essential.',
  'Severe DR': 'Urgent referral to a retinal specialist within 1 month. Laser treatment or other intervention may be necessary.',
  'Proliferative DR': 'Immediate referral to a retinal specialist required. Treatment may include laser photocoagulation or vitrectomy.',
}

export default function ResultCard({ result, confidence, patientId, onReset }) {
  const config = getSeverityConfig(result)
  const Icon = SEVERITY_ICONS[result] || Info
  const navigate = useNavigate()

  return (
    <div className="animate-slide-up space-y-4">
      {/* Main result */}
      <div className={`card p-6 border ${config.border} ${config.bg} glow-blue`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.bg} border ${config.border}`}>
            <Icon size={24} className={config.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-muted)] text-xs font-mono uppercase tracking-widest mb-1">
              Diagnosis Result
            </p>
            <h3 className={`font-display font-bold text-2xl ${config.color}`}>
              {result}
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              {config.description}
            </p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--text-muted)] text-xs font-mono uppercase tracking-wider">
              Model Confidence
            </span>
            <span className={`font-mono font-semibold text-sm ${config.color}`}>
              {formatConfidence(confidence)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full ${config.bar} progress-animated transition-all duration-1000`}
              style={{ '--target-width': `${confidence * 100}%`, width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Clinical recommendation */}
      <div className="card p-5">
        <p className="text-[var(--text-muted)] text-xs font-mono uppercase tracking-widest mb-3">
          Clinical Recommendation
        </p>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
          {RECOMMENDATIONS[result] || 'Please consult with a qualified ophthalmologist for further evaluation.'}
        </p>
      </div>

      {/* Patient ID badge */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/3 border border-[var(--border)]">
        <span className="text-[var(--text-muted)] text-xs">Patient ID</span>
        <span className="font-mono text-blue-400 text-sm font-semibold">#{String(patientId).padStart(4, '0')}</span>
        <span className="text-[var(--text-muted)] text-xs ml-auto">Saved to database</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="btn-secondary flex-1"
        >
          New Scan
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary flex-1"
        >
          View Dashboard
        </button>
      </div>
    </div>
  )
}
