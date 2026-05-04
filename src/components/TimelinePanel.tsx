import { Plus, Play, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { TimelineStep, CanvasShape } from '../types'

interface TimelinePanelProps {
  steps: TimelineStep[]
  currentStep: number
  onStepChange: (i: number) => void
  onAddStep: () => void
  onDeleteStep: (id: string) => void
  onRenameStep: (id: string, label: string) => void
  enabled: boolean
}

export function TimelinePanel({
  steps, currentStep, onStepChange, onAddStep, onDeleteStep, onRenameStep, enabled,
}: TimelinePanelProps) {
  if (!enabled) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-ow-panel border-t border-ow-border select-none overflow-x-auto">
      <span className="text-xs text-gray-500 flex-shrink-0 font-semibold uppercase tracking-wider">Steps</span>

      <button
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-ow-hover text-gray-400 hover:text-white disabled:opacity-30"
        disabled={currentStep === 0}
        onClick={() => onStepChange(currentStep - 1)}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-1 flex-1">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-0 flex-shrink-0">
            <button
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                i === currentStep
                  ? 'bg-ow-orange text-black font-semibold'
                  : 'bg-ow-hover text-gray-400 hover:text-white'
              }`}
              onClick={() => onStepChange(i)}
            >
              <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-bold">
                {i + 1}
              </span>
              <input
                className="bg-transparent outline-none w-16 cursor-pointer"
                value={step.label}
                onChange={e => onRenameStep(step.id, e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {steps.length > 1 && (
                <span
                  className="ml-1 opacity-0 hover:opacity-100 group-hover:opacity-100 text-xs"
                  onClick={e => { e.stopPropagation(); onDeleteStep(step.id) }}
                >×</span>
              )}
            </button>
            {i < steps.length - 1 && (
              <div className="w-4 h-px bg-gray-600 mx-0.5" />
            )}
          </div>
        ))}
      </div>

      <button
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-ow-hover text-gray-400 hover:text-white disabled:opacity-30"
        disabled={currentStep === steps.length - 1}
        onClick={() => onStepChange(currentStep + 1)}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      <button
        className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-ow-hover"
        onClick={onAddStep}
      >
        <Plus className="w-3 h-3" />
        Add Step
      </button>
    </div>
  )
}
