export const SEVERITY_CONFIG = {
  'No DR': {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-400',
    label: 'Normal',
    description: 'No signs of diabetic retinopathy detected.',
  },
  'Mild DR': {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    bar: 'bg-yellow-500',
    dot: 'bg-yellow-400',
    label: 'Mild',
    description: 'Early signs present. Monitor closely.',
  },
  'Moderate DR': {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    bar: 'bg-orange-500',
    dot: 'bg-orange-400',
    label: 'Moderate',
    description: 'Moderate retinopathy detected. Ophthalmologist referral recommended.',
  },
  'Severe DR': {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    bar: 'bg-red-500',
    dot: 'bg-red-400',
    label: 'Severe',
    description: 'Severe retinopathy. Urgent specialist referral needed.',
  },
  'Proliferative DR': {
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    bar: 'bg-purple-500',
    dot: 'bg-purple-400',
    label: 'Critical',
    description: 'Vision-threatening condition. Immediate treatment required.',
  },
}

export function getSeverityConfig(result) {
  return SEVERITY_CONFIG[result] || {
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    bar: 'bg-slate-500',
    dot: 'bg-slate-400',
    label: 'Unknown',
    description: 'Result not recognized.',
  }
}

export function formatConfidence(confidence) {
  return `${(confidence * 100).toFixed(1)}%`
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
