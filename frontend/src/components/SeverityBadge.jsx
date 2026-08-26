import { getSeverityConfig } from '../utils.js'

export default function SeverityBadge({ result }) {
  const config = getSeverityConfig(result)
  return (
    <span className={`severity-badge ${config.color} ${config.bg} border ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} inline-block`} />
      {result}
    </span>
  )
}
