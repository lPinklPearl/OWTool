import { useRef, useState, useCallback, useEffect } from 'react'
import type Konva from 'konva'
import { v4 as uuid } from 'uuid'
import { MapCanvas } from './components/MapCanvas'
import { Toolbar } from './components/Toolbar'
import { HeroPanel } from './components/HeroPanel'
import { LayersPanel } from './components/LayersPanel'
import { MapSelector } from './components/MapSelector'
import { ExportPanel } from './components/ExportPanel'
import { TimelinePanel } from './components/TimelinePanel'
import { useHistory } from './hooks/useHistory'
import { OW_MAPS } from './data/maps'
import type {
  CanvasShape, DrawingTool, MarkerType, LayersState,
  StageTransform, TeamSide, TimelineStep, OWMap, HeroShape,
} from './types'
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react'

const DEFAULT_MAP = OW_MAPS[0]

// Decode share-link state from URL hash
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

  // ── Timeline ─────────────────────────────────────────────────────
  const [timelineEnabled, setTimelineEnabled] = useState(false)
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([
    { id: uuid(), label: 'Step 1', shapes: [] },
  ])
  const [currentStep, setCurrentStep] = useState(0)

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

  // ── Timeline mutations ────────────────────────────────────────────
  const addTimelineStep = useCallback(() => {
    const newStep: TimelineStep = { id: uuid(), label: `Step ${timelineSteps.length + 1}`, shapes: [...shapes] }
    setTimelineSteps(s => [...s, newStep])
    setCurrentStep(timelineSteps.length)
  }, [timelineSteps, shapes])

  const deleteTimelineStep = useCallback((id: string) => {
    setTimelineSteps(s => {
      const next = s.filter(st => st.id !== id)
      return next.length ? next : s
    })
    setCurrentStep(i => Math.max(0, i - 1))
  }, [])

  const renameTimelineStep = useCallback((id: string, label: string) => {
    setTimelineSteps(s => s.map(st => st.id === id ? { ...st, label } : st))
  }, [])

  const handleStepChange = useCallback((i: number) => {
    // Save current shapes to current step before switching
    setTimelineSteps(prev =>
      prev.map((s, idx) => idx === currentStep ? { ...s, shapes } : s)
    )
    setCurrentStep(i)
    push(timelineSteps[i].shapes)
  }, [currentStep, shapes, timelineSteps, push])

  // ── Zoom controls ────────────────────────────────────────────────
  const zoom = (factor: number) => {
    setTransform(t => ({ ...t, scale: Math.max(0.15, Math.min(8, t.scale * factor)) }))
  }
  const zoomReset = () => setTransform({ x: 0, y: 0, scale: 1 })

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

        {/* Timeline toggle */}
        <button
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            timelineEnabled ? 'bg-ow-orange text-black' : 'text-gray-400 hover:text-white hover:bg-ow-hover border border-ow-border'
          }`}
          onClick={() => setTimelineEnabled(p => !p)}
        >
          <Clock className="w-3.5 h-3.5" />
          Timeline
        </button>
      </header>

      {/* Toolbar */}
      <Toolbar
        tool={tool}
        color={color}
        strokeWidth={strokeWidth}
        markerType={markerType}
        onToolChange={setTool}
        onColorChange={setColor}
        onStrokeChange={setStrokeWidth}
        onMarkerTypeChange={setMarkerType}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onZoomIn={() => zoom(1.2)}
        onZoomOut={() => zoom(1/1.2)}
        onZoomReset={zoomReset}
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
          shapes={shapes}
          tool={tool}
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

      {/* Timeline bar */}
      <TimelinePanel
        steps={timelineSteps}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        onAddStep={addTimelineStep}
        onDeleteStep={deleteTimelineStep}
        onRenameStep={renameTimelineStep}
        enabled={timelineEnabled}
      />
    </div>
  )
}
