import { Users, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'

export default function StatsBar({ patients }) {
  const total = patients.length
  const normal = patients.filter(p => p.result === 'No DR').length
  const severe = patients.filter(p => ['Severe DR', 'Proliferative DR'].includes(p.result)).length
  const avgConf = total
    ? (patients.reduce((s, p) => s + p.confidence, 0) / total * 100).toFixed(1)
    : 0

  const stats = [
    {
      label: 'Total Patients',
      value: total,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'No DR',
      value: normal,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Severe / PDR',
      value: severe,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    {
      label: 'Avg. Confidence',
      value: `${avgConf}%`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
        <div key={label} className={`card p-4 border ${border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs">{label}</p>
              <p className={`font-display font-bold text-xl ${color}`}>{value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
