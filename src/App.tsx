import { useRef, useState, useCallback, useEffect } from 'react'
import type Konva from 'konva'
import { v4 as uuid } from 'uuid'
import { MapCanvas } from './components/MapCanvas'
import { Toolbar } from './components/Toolbar'
import { HeroPanel } from './components/HeroPanel'
import { LayersPanel } from './components/LayersPanel'
import { MapSelector } from './components/MapSelector'
import { ExportPanel } from './components/ExportPanel'
import { AnimationPanel } from './components/AnimationPanel'
import { useHistory } from './hooks/useHistory'
import { useAnimation } from './hooks/useAnimation'
import { OW_MAPS } from './data/maps'
import type {
  CanvasShape, DrawingTool, MarkerType, LayersState,
  StageTransform, TeamSide, OWMap, HeroShape,
} from './types'
import { Film, ChevronLeft, ChevronRight } from 'lucide-react'

const DEFAULT_MAP = OW_MAPS[0]

function loadFromHash(): { shapes: CanvasShape[]; mapId: string } | null {
  try {
    const hash = window.location.hash
    if (!hash.startsWith('#state=')) return null
    const encoded = hash.slice(7)
    const json = decodeURIComponent(escape(atob(encoded)))
    const data = JSON.parse(json)
    if (!data.shapes || !data.mapId) return null
    return data
  } catch {
    return null
  }
}

export default function App() {
  const stageRef = useRef<Konva.Stage>(null)

  // ── Map ───────────────────────────────────────────────────────────
  const [selectedMap, setSelectedMap] = useState<OWMap>(() => {
    const shared = loadFromHash()
    if (shared) return OW_MAPS.find(m => m.id === shared.mapId) ?? DEFAULT_MAP
    return DEFAULT_MAP
  })

  // ── Canvas state ──────────────────────────────────────────────────
  const { present: shapes, push, undo, redo, canUndo, canRedo } = useHistory(() => {
    const shared = loadFromHash()
    return shared?.shapes ?? []
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ── Tools ─────────────────────────────────────────────────────────
  const [tool, setTool]             = useState<DrawingTool>('select')
  const [color, setColor]           = useState('#EF4444')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [markerType, setMarkerType] = useState<MarkerType>('enemy')
  const [team, setTeam]             = useState<TeamSide>('ally')
  const [heroSize, setHeroSize]     = useState(150)

  // ── Layers ───────────────────────────────────────────────────────
  const [layers, setLayers] = useState<LayersState>({ drawing: true, heroes: true, notes: true })
  const [fogOfWar, setFogOfWar]     = useState(false)
  const [showLabels, setShowLabels] = useState(true)

  // ── Transform ────────────────────────────────────────────────────
  const [transform, setTransform] = useState<StageTransform>({ x: 0, y: 0, scale: 1 })

  // ── Animation ────────────────────────────────────────────────────
  const [animEnabled, setAnimEnabled] = useState(false)
  const animation = useAnimation()

  // ── UI panels ────────────────────────────────────────────────────
  const [leftOpen, setLeftOpen]  = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  // Clean hash after loading
  useEffect(() => {
    if (window.location.hash.startsWith('#state=')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  // ── Shape mutations ───────────────────────────────────────────────
  const handleShapesChange = useCallback((newShapes: CanvasShape[]) => {
    push(newShapes)
  }, [push])

  // ── Derive toolbar display values from selected shape ─────────────
  const selectedShape = shapes.find(s => s.id === selectedId)
  const selectedHasColor = !!(selectedShape && 'color' in selectedShape)
  const selectedHasStroke = !!(selectedShape && 'strokeWidth' in selectedShape)
  const toolbarColor = selectedHasColor ? (selectedShape as any).color : color
  const toolbarStrokeWidth = selectedHasStroke ? (selectedShape as any).strokeWidth : strokeWidth

  // When color/stroke changes: update selected shape if it has those props, else save for next draw
  const handleColorChange = useCallback((c: string) => {
    setColor(c)
    if (selectedId) {
      const s = shapes.find(sh => sh.id === selectedId)
      if (s && 'color' in s) {
        push(shapes.map(sh => sh.id === selectedId ? { ...sh, color: c } : sh))
      }
    }
  }, [selectedId, shapes, push])

  const handleStrokeChange = useCallback((w: number) => {
    setStrokeWidth(w)
    if (selectedId) {
      const s = shapes.find(sh => sh.id === selectedId)
      if (s && 'strokeWidth' in s) {
        push(shapes.map(sh => sh.id === selectedId ? { ...sh, strokeWidth: w } : sh))
      }
    }
  }, [selectedId, shapes, push])

  const handleDropHero = useCallback((heroId: string, heroTeam: TeamSide, x: number, y: number) => {
    const hero: HeroShape = {
      id: uuid(),
      type: 'hero',
      layerName: 'heroes',
      x, y,
      heroId,
      team: heroTeam,
      size: heroSize,
      showLabel: showLabels,
      opacity: 1,
    }
    push([...shapes, hero])
  }, [shapes, push, showLabels, heroSize])

  const handleApplySizeToAll = useCallback((size: number) => {
    push(shapes.map(s => s.type === 'hero' ? { ...s, size } : s))
  }, [shapes, push])

  // Sync hero labels when showLabels changes
  useEffect(() => {
    const updated = shapes.map(s =>
      s.type === 'hero' ? { ...s, showLabel: showLabels } : s
    )
    if (updated.some((s, i) => (s as HeroShape).showLabel !== (shapes[i] as HeroShape).showLabel)) {
      push(updated)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLabels])

  const handleLoadJSON = useCallback((newShapes: CanvasShape[], mapId: string) => {
    const map = OW_MAPS.find(m => m.id === mapId)
    if (map) setSelectedMap(map)
    push(newShapes)
    setSelectedId(null)
  }, [push])

  // ── Animation: drag handler (creates keyframe instead of moving base shape) ──
  const handleAnimDrag = useCallback((id: string, x: number, y: number) => {
    if (animation.currentTime === 0) {
      // At time 0, update base position
      push(shapes.map(s => s.id === id ? { ...s, x, y } as CanvasShape : s))
    } else {
      animation.addOrUpdateKeyframe(id, x, y, animation.currentTime)
    }
  }, [animation, shapes, push])

  // ── Animation: freehand path drag → batch keyframes ──────────────
  const handleAnimPathDrag = useCallback((
    id: string,
    path: Array<{ x: number; y: number; t: number }>,
  ) => {
    if (path.length < 2) return
    const totalRealMs = Math.max(path[path.length - 1].t - path[0].t, 1)
    const remainingAnimTime = animation.duration - animation.currentTime
    // Map real drag duration to animation time; min 0.5s, max remaining duration
    const animDuration = Math.max(0.5, Math.min(remainingAnimTime, totalRealMs / 1000))

    const entries = path.map(pt => ({
      shapeId: id,
      x: pt.x,
      y: pt.y,
      time: animation.currentTime + ((pt.t - path[0].t) / totalRealMs) * animDuration,
    }))
    animation.addKeyframeBatch(entries)
  }, [animation])

  // ── Animation: "Add Keyframe" button ─────────────────────────────
  const handleAddKeyframe = useCallback(() => {
    if (!selectedId) return
    const displayShapes = animation.getDisplayShapes(shapes)
    const shape = displayShapes.find(s => s.id === selectedId)
    if (!shape || !('x' in shape) || !('y' in shape)) return
    animation.addOrUpdateKeyframe(
      selectedId,
      (shape as { x: number; y: number }).x,
      (shape as { x: number; y: number }).y,
      animation.currentTime,
    )
  }, [selectedId, shapes, animation])

  // ── Zoom controls ────────────────────────────────────────────────
  const zoom = (factor: number) => {
    setTransform(t => ({ ...t, scale: Math.max(0.15, Math.min(8, t.scale * factor)) }))
  }
  const zoomReset = () => setTransform({ x: 0, y: 0, scale: 1 })

  // Compute display shapes (interpolated when animation is on)
  const displayShapes = animEnabled
    ? animation.getDisplayShapes(shapes)
    : shapes

  return (
    <div className="flex flex-col h-screen bg-ow-dark text-white">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2 bg-ow-panel border-b border-ow-border flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-ow-orange to-orange-700 flex items-center justify-center text-black font-black text-sm">
            OW
          </div>
          <span className="font-semibold text-sm text-white hidden sm:block">Strategy Board</span>
        </div>

        <div className="w-px h-6 bg-ow-border" />

        {/* Map selector */}
        <MapSelector selectedMap={selectedMap} onChange={m => { setSelectedMap(m); push([]) }} />

        <div className="flex-1" />

        {/* Animation toggle */}
        <button
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            animEnabled
              ? 'bg-ow-orange text-black'
              : 'text-gray-400 hover:text-white hover:bg-ow-hover border border-ow-border'
          }`}
          onClick={() => {
            setAnimEnabled(p => !p)
            animation.pause()
            animation.seek(0)
          }}
        >
          <Film className="w-3.5 h-3.5" />
          Animate
        </button>
      </header>

      {/* Toolbar */}
      <Toolbar
        tool={tool}
        color={toolbarColor}
        strokeWidth={toolbarStrokeWidth}
        markerType={markerType}
        onToolChange={setTool}
        onColorChange={handleColorChange}
        onStrokeChange={handleStrokeChange}
        onMarkerTypeChange={setMarkerType}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onZoomIn={() => zoom(1.2)}
        onZoomOut={() => zoom(1/1.2)}
        onZoomReset={zoomReset}
        editingShape={selectedHasColor || selectedHasStroke}
      />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <div className={`flex flex-col bg-ow-panel border-r border-ow-border flex-shrink-0 transition-all duration-200 ${leftOpen ? 'w-48' : 'w-0 overflow-hidden'}`}>
          <div className="flex-1 min-h-0 overflow-hidden">
            <HeroPanel
              team={team}
              heroSize={heroSize}
              onTeamChange={setTeam}
              onHeroSizeChange={setHeroSize}
              onApplySizeToAll={handleApplySizeToAll}
            />
          </div>
        </div>

        {/* Collapse left button */}
        <button
          className="w-4 flex-shrink-0 bg-ow-panel border-r border-ow-border flex items-center justify-center hover:bg-ow-hover text-gray-600 hover:text-gray-300 transition-colors z-10"
          onClick={() => setLeftOpen(o => !o)}
          title={leftOpen ? 'Collapse heroes panel' : 'Expand heroes panel'}
        >
          {leftOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* Canvas */}
        <MapCanvas
          map={selectedMap}
          shapes={displayShapes}
          tool={animEnabled ? 'select' : tool}
          color={color}
          strokeWidth={strokeWidth}
          markerType={markerType}
          layers={layers}
          transform={transform}
          selectedId={selectedId}
          fogOfWar={fogOfWar}
          onShapesChange={handleShapesChange}
          onTransformChange={setTransform}
          onSelect={setSelectedId}
          onDropHero={handleDropHero}
          stageRef={stageRef}
          onAnimDrag={animEnabled ? handleAnimDrag : undefined}
          onAnimPathDrag={animEnabled ? handleAnimPathDrag : undefined}
          dragDisabled={animEnabled && animation.isPlaying}
        />

        {/* Collapse right button */}
        <button
          className="w-4 flex-shrink-0 bg-ow-panel border-l border-ow-border flex items-center justify-center hover:bg-ow-hover text-gray-600 hover:text-gray-300 transition-colors z-10"
          onClick={() => setRightOpen(o => !o)}
          title={rightOpen ? 'Collapse tools panel' : 'Expand tools panel'}
        >
          {rightOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Right sidebar */}
        <div className={`flex flex-col bg-ow-panel border-l border-ow-border flex-shrink-0 transition-all duration-200 overflow-hidden ${rightOpen ? 'w-44' : 'w-0'}`}>
          <div className="flex-1 overflow-y-auto">
            <LayersPanel
              layers={layers}
              fogOfWar={fogOfWar}
              showLabels={showLabels}
              onToggleLayer={key => setLayers(l => ({ ...l, [key]: !l[key] }))}
              onToggleFog={() => setFogOfWar(f => !f)}
              onToggleLabels={() => setShowLabels(l => !l)}
            />
            <div className="h-px bg-ow-border" />
            <ExportPanel
              stageRef={stageRef}
              shapes={shapes}
              selectedMap={selectedMap}
              transform={transform}
              onLoadJSON={handleLoadJSON}
              onClearAll={() => { push([]); setSelectedId(null) }}
            />
          </div>
        </div>
      </div>

      {/* Animation panel */}
      <AnimationPanel
        enabled={animEnabled}
        shapes={shapes}
        keyframes={animation.keyframes}
        currentTime={animation.currentTime}
        duration={animation.duration}
        isPlaying={animation.isPlaying}
        selectedId={selectedId}
        onSeek={animation.seek}
        onPlay={animation.play}
        onPause={animation.pause}
        onReset={() => { animation.pause(); animation.seek(0) }}
        onAddKeyframe={handleAddKeyframe}
        onDeleteKeyframe={animation.deleteKeyframe}
        onDurationChange={animation.setDuration}
      />

      {/* Credit footer */}
      <footer className="flex items-center justify-center py-1 bg-ow-panel border-t border-ow-border flex-shrink-0">
        <span className="text-xs text-gray-500">สร้างโดย <span className="text-ow-orange font-semibold">1PinkAP</span></span>
      </footer>
    </div>
  )
}
