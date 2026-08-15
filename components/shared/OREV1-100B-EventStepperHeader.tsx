// THIS FILE GOES IN: components/shared/OREV1-100B-EventStepperHeader.tsx (NEW FILE)
'use client'
import { useTheme } from '@/lib/ThemeContext'

type Props = { steps: string[]; currentStep: number; maxReachedStep: number; onStepClick: (step: number) => void }

const ICONS = ['🏷️', '📋', '📝', '🖼️', '📍', '📅', '🎟️', '✅']

export default function OREV1100BEventStepperHeader({ steps, currentStep, maxReachedStep, onStepClick }: Props) {
  const { theme } = useTheme()
  const doneColor = '#22c55e'
  const currentColor = theme?.btn_bg || '#1e3a8a'
  const upcomingColor = theme?.btn_disabled_bg || '#e5e7eb'

  return (
    <div className="flex items-center overflow-x-auto pb-2 mb-6 -mx-2 px-2">
      {steps.map((label, idx) => {
        const stepNum = idx + 1
        const isDone = stepNum < currentStep
        const isCurrent = stepNum === currentStep
        const isClickable = stepNum <= maxReachedStep
        const circleColor = isDone ? doneColor : isCurrent ? currentColor : upcomingColor
        const textColor = isDone ? doneColor : isCurrent ? currentColor : (theme?.color_text_muted || '#9ca3af')

        return (
          <div key={label} className="flex items-center shrink-0">
            <button
              onClick={() => isClickable && onStepClick(stepNum)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-1.5 px-2 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: circleColor }}>
                {isDone ? '✓' : ICONS[idx] || stepNum}
              </span>
              <span className="text-xs font-medium whitespace-nowrap" style={{ color: textColor }}>{label}</span>
            </button>
            {idx < steps.length - 1 && <div className="h-0.5 w-8 sm:w-12 mx-1" style={{ backgroundColor: isDone ? doneColor : upcomingColor }} />}
          </div>
        )
      })}
    </div>
  )
}
