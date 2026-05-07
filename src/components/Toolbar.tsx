import React from 'react'
import {
  MousePointer2, ArrowRight, Minus, Circle, Square,
  PenLine, Type, MapPin, Eraser, Hand,
  Slash,
} from 'lucide-react'
import type { DrawingTool, MarkerType } from '../types'
import { MARKER_COLORS, MARKER_LABELS } from '../types'

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#A855F7', '#EC4899', '#F9E1A0',
  '#FFFFFF', '#94A3B8', '#1E293B',
]

const STROKE_WIDTHS = [1, 2, 3, 5, 8]

const TOOLS: { id: DrawingTool; Icon: React.ComponentType<any>; tip: string }[] = [
  { id: 'select',   Icon: MousePointer2, tip: 'Select / Move (V)' },
  { id: 'pan',      Icon: Hand,          tip: 'Pan canvas (Space)' },
  { id: 'arrow',    Icon: ArrowRight,    tip: 'Arrow' },
  { id: 'line',     Icon: Minus,         tip: 'Line' },
  { id: 'dashed',   Icon: Slash,         tip: 'Dashed line' },
  { id: 'circle',   Icon: Circle,        tip: 'Circle / Ellipse' },
  { id: 'rect',     Icon: Square,        tip: 'Rectangle' },
  { id: 'freehand', Icon: PenLine,       tip: 'Freehand draw' },
  { id: 'text',     Icon: Type,          tip: 'Text label' },
  { id: 'marker',   Icon: MapPin,        tip: 'Marker' },
  { id: 'eraser',   Icon: Eraser,        tip: 'Eraser' },
]

const MARKER_TYPES: MarkerType[] = ['enemy', 'ally', 'flank', 'sniper', 'objective', 'retreat']

interface ToolbarProps {
  tool: DrawingTool
  color: string
  strokeWidth: number
  markerType: MarkerType
  onToolChange: (t: DrawingTool) => void
  onColorChange: (c: string) => void
  onStrokeChange: (w: number) => void
  onMarkerTypeChange: (m: MarkerType) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  editingShape?: boolean
}

export function Toolbar({
  tool, color, strokeWidth, markerType,
  onToolChange, onColorChange, onStrokeChange, onMarkerTypeChange,
  onUndo, onRedo, canUndo, canRedo,
  onZoomIn, onZoomOut, onZoomReset,
  editingShape = false,
}: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = React.useState(false)
  const [customColor, setCustomColor] = React.useState(color)

  // keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); onUndo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); onRedo() }
      if (e.key === 'v' || e.key === 'V') onToolChange('select')
      if (e.key === 'a' || e.key === 'A') onToolChange('arrow')
      if (e.key === 'l' || e.key === 'L') onToolChange('line')
      if (e.key === 'c' || e.key === 'C') onToolChange('circle')
      if (e.key === 'r' || e.key === 'R') onToolChange('rect')
      if (e.key === 'f' || e.key === 'F') onToolChange('freehand')
      if (e.key === 't' || e.key === 'T') onToolChange('text')
      if (e.key === 'm' || e.key === 'M') onToolChange('marker')
      if (e.key === 'e' || e.key === 'E') onToolChange('eraser')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onToolChange, onUndo, onRedo])

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-ow-panel border-b border-ow-border select-none flex-wrap">

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 mr-2">
        <button
          className={`toolbar-btn tooltip ${canUndo ? 'hover:bg-ow-hover text-gray-300' : 'opacity-30 cursor-not-allowed text-gray-500'}`}
          data-tip="Undo (Ctrl+Z)"
          onClick={onUndo} disabled={!canUndo}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 7h11a5 5 0 0 1 0 10H3" /><path d="M7 3l-4 4 4 4" />
          </svg>
        </button>
        <button
          className={`toolbar-btn tooltip ${canRedo ? 'hover:bg-ow-hover text-gray-300' : 'opacity-30 cursor-not-allowed text-gray-500'}`}
          data-tip="Redo (Ctrl+Y)"
          onClick={onRedo} disabled={!canRedo}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 7H10a5 5 0 0 0 0 10h11" /><path d="M17 3l4 4-4 4" />
          </svg>
        </button>
      </div>

      <div className="w-px h-6 bg-ow-border mx-1" />

      {/* Drawing tools */}
      {TOOLS.map(({ id, Icon, tip }) => (
        <button
          key={id}
          data-tip={tip}
          className={`toolbar-btn tooltip ${tool === id ? 'tool-active bg-ow-hover text-ow-orange' : 'hover:bg-ow-hover text-gray-400'}`}
          onClick={() => onToolChange(id)}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      <div className="w-px h-6 bg-ow-border mx-1" />

      {/* Stroke width */}
      <div className="flex items-center gap-1">
        {STROKE_WIDTHS.map(w => (
          <button
            key={w}
            data-tip={`Stroke ${w}px`}
            className={`tooltip w-7 h-7 flex items-center justify-center rounded ${strokeWidth === w ? 'bg-ow-hover ring-1 ring-ow-orange' : 'hover:bg-ow-hover'}`}
            onClick={() => onStrokeChange(w)}
          >
            <div className="bg-gray-300 rounded-full" style={{ width: `${w * 2 + 4}px`, height: `${w + 2}px` }} />
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-ow-border mx-1" />

      {/* Color presets */}
      {editingShape && (
        <span className="text-xs text-ow-orange font-medium px-1 py-0.5 rounded bg-orange-900/30 border border-ow-orange/30 mr-0.5">
          Shape
        </span>
      )}
      <div className="flex items-center gap-1">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
            style={{ background: c }}
            onClick={() => onColorChange(c)}
          />
        ))}
        {/* Custom color */}
        <div className="relative">
          <button
            className="w-6 h-6 rounded border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-400 hover:border-gray-300 text-xs"
            onClick={() => setShowColorPicker(p => !p)}
            title="Custom color"
          >+</button>
          {showColorPicker && (
            <div className="absolute top-8 left-0 z-50 bg-ow-panel border border-ow-border rounded p-2 shadow-xl">
              <input
                type="color"
                className="w-24 h-8 cursor-pointer rounded"
                value={customColor}
                onChange={e => { setCustomColor(e.target.value); onColorChange(e.target.value) }}
              />
              <button className="block w-full text-xs text-gray-400 mt-1 hover:text-white" onClick={() => setShowColorPicker(false)}>Close</button>
            </div>
          )}
        </div>
        <div className="w-5 h-5 rounded border border-ow-border" style={{ background: color }} />
      </div>

      <div className="w-px h-6 bg-ow-border mx-1" />

      {/* Marker type (only shown when marker tool active) */}
      {tool === 'marker' && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Marker:</span>
          {MARKER_TYPES.map(mt => (
            <button
              key={mt}
              data-tip={MARKER_LABELS[mt]}
              className={`tooltip w-6 h-6 rounded-full border-2 text-xs font-bold transition-transform hover:scale-110 ${markerType === mt ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ background: MARKER_COLORS[mt] }}
              onClick={() => onMarkerTypeChange(mt)}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1" style={{ color: MARKER_COLORS[markerType] }}>
            {MARKER_LABELS[markerType]}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button className="toolbar-btn hover:bg-ow-hover text-gray-400" onClick={onZoomOut}>−</button>
        <button className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-ow-hover" onClick={onZoomReset}>Reset</button>
        <button className="toolbar-btn hover:bg-ow-hover text-gray-400" onClick={onZoomIn}>+</button>
      </div>
    </div>
  )
}
