import { Eye, EyeOff, Layers } from 'lucide-react'
import type { LayersState } from '../types'

interface LayersPanelProps {
  layers: LayersState
  fogOfWar: boolean
  showLabels: boolean
  onToggleLayer: (layer: keyof LayersState) => void
  onToggleFog: () => void
  onToggleLabels: () => void
}

const LAYER_DEFS: { key: keyof LayersState; label: string; color: string }[] = [
  { key: 'drawing', label: 'Drawing',  color: '#F99E1A' },
  { key: 'heroes',  label: 'Heroes',   color: '#4FC1E9' },
  { key: 'notes',   label: 'Notes',    color: '#A8E6CF' },
]

export function LayersPanel({
  layers, fogOfWar, showLabels,
  onToggleLayer, onToggleFog, onToggleLabels,
}: LayersPanelProps) {
  return (
    <div className="flex flex-col gap-1 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layers</span>
      </div>

      {LAYER_DEFS.map(({ key, label, color }) => (
        <LayerRow
          key={key}
          label={label}
          color={color}
          visible={layers[key]}
          onToggle={() => onToggleLayer(key)}
        />
      ))}

      <div className="h-px bg-ow-border my-1" />

      <LayerRow
        label="Fog of War"
        color="#1E293B"
        icon="🌫️"
        visible={fogOfWar}
        onToggle={onToggleFog}
      />
      <LayerRow
        label="Hero Labels"
        color="#64748B"
        icon="🏷️"
        visible={showLabels}
        onToggle={onToggleLabels}
      />
    </div>
  )
}

function LayerRow({
  label, color, icon, visible, onToggle,
}: {
  label: string
  color: string
  icon?: string
  visible: boolean
  onToggle: () => void
}) {
  return (
    <button
      className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-ow-hover text-left group"
      onClick={onToggle}
    >
      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color, opacity: visible ? 1 : 0.3 }} />
      {icon && <span className="text-xs">{icon}</span>}
      <span className={`text-xs flex-1 ${visible ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
      {visible
        ? <Eye className="w-3 h-3 text-gray-500 group-hover:text-gray-300" />
        : <EyeOff className="w-3 h-3 text-gray-600" />
      }
    </button>
  )
}
