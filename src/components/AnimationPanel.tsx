import { useRef, useCallback } from 'react'
import { Play, Pause, Plus, RotateCcw, PenLine, Diamond } from 'lucide-react'
import type { Keyframe, CanvasShape } from '../types'
import { OW_HEROES } from '../data/heroes'

function getShapeName(shape: CanvasShape): string {
  if (shape.type === 'hero') {
    const hero = OW_HEROES.find(h => h.id === shape.heroId)
    const side = shape.team === 'ally' ? 'Ally' : 'Enemy'
    return `${hero?.name ?? shape.heroId} (${side})`
  }
  if (shape.type === 'marker') return shape.label || shape.markerType
  if (shape.type === 'text') return shape.text.slice(0, 14) || 'Text'
  return shape.type.charAt(0).toUpperCase() + shape.type.slice(1)
}

function formatTime(t: number): string {
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}

function isKeyframeable(shape: CanvasShape): boolean {
  return shape.type !== 'arrow' && shape.type !== 'line' && shape.type !== 'freehand'
}

export type AnimDragMode = 'keyframe' | 'freehand'

interface AnimationPanelProps {
  enabled: boolean
  shapes: CanvasShape[]
  keyframes: Keyframe[]
  currentTime: number
  duration: number
  isPlaying: boolean
  selectedId: string | null
  dragMode: AnimDragMode
  onSeek: (time: number) => void
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onAddKeyframe: () => void
  onDeleteKeyframe: (id: string) => void
  onDurationChange: (d: number) => void
  onDragModeChange: (mode: AnimDragMode) => void
}

export function AnimationPanel({
  enabled, shapes, keyframes, currentTime, duration, isPlaying, selectedId,
  dragMode,
  onSeek, onPlay, onPause, onReset, onAddKeyframe, onDeleteKeyframe, onDurationChange,
  onDragModeChange,
}: AnimationPanelProps) {
  if (!enabled) return null

  const scrubberRef = useRef<HTMLDivElement>(null)

  const seekFromEvent = useCallback((e: React.MouseEvent) => {
    const el = scrubberRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(t * duration)
  }, [duration, onSeek])

  const shapesWithKeyframes = shapes.filter(s => keyframes.some(k => k.shapeId === s.id))
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0

  const selectedShape = selectedId ? shapes.find(s => s.id === selectedId) : null
  const canAddKeyframe = selectedShape != null && isKeyframeable(selectedShape)

  return (
    <div className="bg-ow-panel border-t border-ow-border select-none">

      {/* Controls row */}
      <div className="flex items-center gap-2 px-3 py-1.5">

        {/* Drag mode toggle */}
        <div className="flex items-center rounded overflow-hidden border border-ow-border flex-shrink-0">
          <button
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors ${
              dragMode === 'keyframe'
                ? 'bg-ow-orange text-black'
                : 'text-gray-400 hover:text-white hover:bg-ow-hover'
            }`}
            onClick={() => onDragModeChange('keyframe')}
            title="Drag shape → single keyframe at current time"
          >
            <Diamond className="w-3 h-3" />
            KF
          </button>
          <button
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors ${
              dragMode === 'freehand'
                ? 'bg-ow-orange text-black'
                : 'text-gray-400 hover:text-white hover:bg-ow-hover'
            }`}
            onClick={() => onDragModeChange('freehand')}
            title="Drag shape → record full path as keyframes"
          >
            <PenLine className="w-3 h-3" />
            Free
          </button>
        </div>

        {/* Play / Pause */}
        <button
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded bg-ow-hover hover:bg-ow-orange hover:text-black text-gray-300 transition-colors"
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Reset */}
        <button
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-ow-hover text-gray-500 hover:text-gray-300 transition-colors"
          onClick={onReset}
          title="Reset to start"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        {/* Current time */}
        <span className="text-xs font-mono text-gray-300 flex-shrink-0 w-14 text-right">
          {formatTime(currentTime)}
        </span>

        {/* Timeline scrubber */}
        <div
          ref={scrubberRef}
          className="relative flex-1 h-6 bg-ow-dark border border-ow-border rounded cursor-pointer overflow-hidden"
          onClick={seekFromEvent}
          onMouseMove={e => { if (e.buttons === 1) seekFromEvent(e) }}
        >
          {/* Filled progress */}
          <div
            className="absolute left-0 top-0 h-full bg-ow-orange/15 pointer-events-none"
            style={{ width: `${playheadPct}%` }}
          />

          {/* All keyframe diamonds */}
          {keyframes.map(kf => {
            const pct = duration > 0 ? (kf.time / duration) * 100 : 0
            const isOwned = kf.shapeId === selectedId
            return (
              <div
                key={kf.id}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border cursor-pointer hover:scale-150 transition-transform z-10 ${
                  isOwned
                    ? 'bg-ow-orange border-orange-200'
                    : 'bg-gray-400 border-gray-300'
                }`}
                style={{ left: `${pct}%` }}
                onClick={e => { e.stopPropagation(); onDeleteKeyframe(kf.id) }}
                title={`${formatTime(kf.time)} — click to delete`}
              />
            )
          })}

          {/* Playhead line */}
          <div
            className="absolute top-0 h-full w-0.5 bg-ow-orange pointer-events-none z-20"
            style={{ left: `${playheadPct}%` }}
          />
        </div>

        {/* Total duration */}
        <span className="text-xs font-mono text-gray-500 flex-shrink-0">
          {formatTime(duration)}
        </span>

        {/* Duration selector */}
        <select
          className="text-xs bg-ow-dark border border-ow-border rounded px-1 py-0.5 text-gray-300 flex-shrink-0 cursor-pointer"
          value={duration}
          onChange={e => onDurationChange(Number(e.target.value))}
        >
          {[5, 10, 15, 20, 30, 60].map(d => (
            <option key={d} value={d}>{d}s</option>
          ))}
        </select>

        {/* Add keyframe button */}
        <button
          className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            canAddKeyframe
              ? 'bg-ow-orange text-black hover:bg-orange-500'
              : 'text-gray-600 bg-ow-hover cursor-not-allowed'
          }`}
          onClick={onAddKeyframe}
          disabled={!canAddKeyframe}
          title={canAddKeyframe ? 'Add keyframe for selected object at current time' : 'Select an object to add keyframe'}
        >
          <Plus className="w-3 h-3" />
          Add KF
        </button>
      </div>

      {/* Per-shape keyframe rows */}
      {shapesWithKeyframes.length > 0 && (
        <div className="border-t border-ow-border/40 pb-1 max-h-24 overflow-y-auto">
          {shapesWithKeyframes.map(shape => {
            const shapeKfs = keyframes
              .filter(k => k.shapeId === shape.id)
              .sort((a, b) => a.time - b.time)

            const isSelected = shape.id === selectedId

            return (
              <div
                key={shape.id}
                className={`flex items-center gap-2 px-3 h-6 ${isSelected ? 'bg-ow-hover/50' : ''}`}
              >
                {/* Shape name */}
                <span className={`text-[11px] w-28 flex-shrink-0 truncate ${isSelected ? 'text-ow-orange font-semibold' : 'text-gray-400'}`}>
                  {getShapeName(shape)}
                </span>

                {/* Track */}
                <div className="relative flex-1 h-4">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-700" />

                  {/* Playhead on row */}
                  <div
                    className="absolute top-0 h-full w-px bg-ow-orange/50 pointer-events-none"
                    style={{ left: `${playheadPct}%` }}
                  />

                  {/* Connecting line between keyframes */}
                  {shapeKfs.length > 1 && (() => {
                    const firstPct = duration > 0 ? (shapeKfs[0].time / duration) * 100 : 0
                    const lastPct  = duration > 0 ? (shapeKfs[shapeKfs.length - 1].time / duration) * 100 : 0
                    return (
                      <div
                        className="absolute top-1/2 h-px bg-ow-orange/40 pointer-events-none"
                        style={{ left: `${firstPct}%`, width: `${lastPct - firstPct}%` }}
                      />
                    )
                  })()}

                  {/* Keyframe diamonds */}
                  {shapeKfs.map(kf => {
                    const pct = duration > 0 ? (kf.time / duration) * 100 : 0
                    return (
                      <div
                        key={kf.id}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-ow-orange border border-orange-200 cursor-pointer hover:scale-125 transition-transform z-10"
                        style={{ left: `${pct}%` }}
                        onClick={() => onDeleteKeyframe(kf.id)}
                        title={`t=${kf.time.toFixed(2)}s — click to delete`}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
