import { Eye } from 'lucide-react'

export default function LoadingSpinner({ message = 'Analyzing retinal image...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6 animate-fade-in">
      {/* Animated eye rings */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-blue-400/30 animate-spin-slow" />
        <div className="absolute inset-4 rounded-full border border-blue-300/20 animate-pulse-slow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Eye size={28} className="text-blue-400 animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-[var(--text-primary)] font-medium text-sm">{message}</p>
        <p className="text-[var(--text-muted)] text-xs mt-1">This may take a few seconds</p>
      </div>
      {/* Progress dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
