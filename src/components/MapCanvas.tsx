import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Stage, Layer, Rect, Circle, Ellipse, Line, Arrow, Text, Group,
  Transformer, Image as KonvaImage,
} from 'react-konva'
import type Konva from 'konva'
import useImage from 'use-image'
import { v4 as uuid } from 'uuid'
import type {
  CanvasShape, DrawingTool, MarkerType, TeamSide,
  ArrowShape, LineShape, CircleShape, RectShape,
  FreehandShape, TextShape, MarkerShape, HeroShape,
  LayersState, StageTransform, OWMap,
} from '../types'
import { MARKER_COLORS, MARKER_SYMBOLS } from '../types'
import { OW_HEROES } from '../data/heroes'

// ── helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

const ZOOM_MIN = 0.15
const ZOOM_MAX = 8

// ── Map image loader (hook) ────────────────────────────────────────────────

// Tries the explicit imageUrl first, then the _anno variant, then plain id.
export function useMapImage(map: OWMap) {
  const primary = map.imageUrl ?? `/map_pic/${map.id}.png`
  const anno    = primary.includes('_anno') ? '' : primary.replace('.png', '_anno.png')

  const [img1, s1] = useImage(primary, 'anonymous')
  const [img2, s2] = useImage(anno,    'anonymous')

  if (img1 && s1 === 'loaded') return img1
  if (img2 && s2 === 'loaded') return img2
  return null
}

// ── Map background ─────────────────────────────────────────────────────────

// Receives the already-resolved image so MapCanvas can read its dimensions.
function MapBackground({
  map, img, width, height,
}: {
  map: OWMap
  img: HTMLImageElement | null
  width: number
  height: number
}) {
  if (img) {
    // Render the image at its true pixel size — no scaling at all.
    return (
      <KonvaImage
        image={img}
        x={0} y={0}
        width={width}
        height={height}
      />
    )
  }

  // Gradient placeholder (no image available)
  return (
    <>
      <Rect
        width={width} height={height}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: width, y: height }}
        fillLinearGradientColorStops={[0, map.bgGradient[0], 1, map.bgGradient[1]]}
      />
      {Array.from({ length: Math.floor(height / 60) + 1 }, (_, i) => (
        <Line key={`h${i}`} points={[0, i * 60, width, i * 60]}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}
      {Array.from({ length: Math.floor(width / 60) + 1 }, (_, i) => (
        <Line key={`v${i}`} points={[i * 60, 0, i * 60, height]}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}
      <Text
        text={map.name}
        x={width / 2 - 200} y={height / 2 - 30}
        width={400} align="center"
        fontSize={36} fontStyle="bold"
        fill="rgba(255,255,255,0.07)"
        fontFamily="Inter, sans-serif"
      />
      <Text
        text={map.mode}
        x={width / 2 - 200} y={height / 2 + 16}
        width={400} align="center"
        fontSize={14}
        fill="rgba(255,255,255,0.05)"
        fontFamily="Inter, sans-serif"
      />
    </>
  )
}

// ── Hero icon renderer ─────────────────────────────────────────────────────

function HeroIcon({
  shape, selected, onSelect, onDragEnd, onDelete, onDragStart, onDragMove, draggable: draggableProp = true,
}: {
  shape: HeroShape
  selected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onDelete: (id: string) => void
  onDragStart?: (id: string, x: number, y: number) => void
  onDragMove?: (id: string, x: number, y: number) => void
  draggable?: boolean
}) {
  const hero = OW_HEROES.find(h => h.id === shape.heroId)
  if (!hero) return null

  const [heroImg] = useImage(`/hero_pic/${shape.heroId}.png`, 'anonymous')

  const r         = shape.size / 2
  const ringColor = shape.team === 'ally' ? '#3B82F6' : '#EF4444'
  const abbr      = hero.abbr.slice(0, 3)
  const fontSize  = r * 0.62

  // Clip function: circular mask for the hero portrait
  const clipCircle = (ctx: any) => {
    ctx.arc(0, 0, r, 0, Math.PI * 2, false)
  }

  return (
    <Group
      x={shape.x} y={shape.y}
      draggable={draggableProp}
      onClick={() => onSelect(shape.id)}
      onTap={() => onSelect(shape.id)}
      onDblClick={() => onDelete(shape.id)}
      onDragStart={onDragStart ? e => onDragStart(shape.id, e.target.x(), e.target.y()) : undefined}
      onDragMove={onDragMove ? e => onDragMove(shape.id, e.target.x(), e.target.y()) : undefined}
      onDragEnd={e => onDragEnd(shape.id, e.target.x(), e.target.y())}
      opacity={shape.opacity}
    >
      {/* Team colour ring */}
      <Circle radius={r + 3} fill={ringColor} />

      {/* Base fill (always drawn; hidden by image when loaded) */}
      <Circle radius={r} fill={hero.color} />

      {heroImg ? (
        /* Portrait clipped to circle */
        <Group clipFunc={clipCircle}>
          <KonvaImage
            image={heroImg}
            x={-r} y={-r}
            width={r * 2} height={r * 2}
          />
        </Group>
      ) : (
        /* Fallback abbreviation text */
        <Text
          text={abbr}
          fontSize={fontSize}
          fontStyle="bold"
          fontFamily="Inter, sans-serif"
          fill="#fff"
          x={-r} y={-fontSize / 2 - 1}
          width={r * 2}
          align="center"
        />
      )}

      {/* Selection highlight */}
      {selected && (
        <Circle radius={r + 5} stroke="#F99E1A" strokeWidth={2} fill="transparent" />
      )}

      {/* Name label below icon */}
      {shape.showLabel && (
        <Text
          text={hero.name}
          fontSize={10}
          fontFamily="Inter, sans-serif"
          fill="#E6EDF3"
          x={-40} y={r + 4}
          width={80}
          align="center"
        />
      )}
    </Group>
  )
}

// ── Shape renderer ─────────────────────────────────────────────────────────

// Bake drag delta into points for point-based shapes and reset node to (0,0).
function pointsDragEnd(
  e: Konva.KonvaEventObject<DragEvent>,
  id: string,
  onDragEnd: (id: string, x: number, y: number, isDelta: boolean) => void,
) {
  const dx = e.target.x()
  const dy = e.target.y()
  e.target.position({ x: 0, y: 0 })
  onDragEnd(id, dx, dy, true)
}

function ShapeNode({
  shape, selected, onSelect, onDragEnd, onDragStart, onDragMove, draggable: draggableProp = true,
}: {
  shape: CanvasShape
  selected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number, isDelta?: boolean) => void
  onDragStart?: (id: string, x: number, y: number) => void
  onDragMove?: (id: string, x: number, y: number) => void
  draggable?: boolean
}) {
  const commonProps = {
    opacity: shape.opacity,
    onClick: () => onSelect(shape.id),
    onTap:   () => onSelect(shape.id),
  }

  switch (shape.type) {
    case 'arrow':
      return (
        <Arrow
          id={shape.id}
          points={shape.points}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          fill={shape.color}
          pointerLength={12}
          pointerWidth={8}
          draggable={draggableProp}
          {...commonProps}
          onDragEnd={e => pointsDragEnd(e, shape.id, onDragEnd)}
        />
      )
    case 'line':
      return (
        <Line
          id={shape.id}
          points={shape.points}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          dash={shape.dashed ? [12, 8] : undefined}
          lineCap="round"
          lineJoin="round"
          draggable={draggableProp}
          {...commonProps}
          onDragEnd={e => pointsDragEnd(e, shape.id, onDragEnd)}
        />
      )
    case 'circle':
      return (
        <Ellipse
          id={shape.id}
          x={shape.x} y={shape.y}
          radiusX={shape.radiusX} radiusY={shape.radiusY}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          fill={shape.fill ? shape.color + '44' : 'transparent'}
          draggable={draggableProp}
          {...commonProps}
          onDragStart={onDragStart ? e => onDragStart(shape.id, e.target.x(), e.target.y()) : undefined}
          onDragMove={onDragMove ? e => onDragMove(shape.id, e.target.x(), e.target.y()) : undefined}
          onDragEnd={e => onDragEnd(shape.id, e.target.x(), e.target.y())}
        />
      )
    case 'rect':
      return (
        <Rect
          id={shape.id}
          x={shape.x} y={shape.y}
          width={shape.width} height={shape.height}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          fill={shape.fill ? shape.color + '33' : 'transparent'}
          draggable={draggableProp}
          {...commonProps}
          onDragStart={onDragStart ? e => onDragStart(shape.id, e.target.x(), e.target.y()) : undefined}
          onDragMove={onDragMove ? e => onDragMove(shape.id, e.target.x(), e.target.y()) : undefined}
          onDragEnd={e => onDragEnd(shape.id, e.target.x(), e.target.y())}
        />
      )
    case 'freehand':
      return (
        <Line
          id={shape.id}
          points={shape.points}
          stroke={shape.color}
          strokeWidth={shape.strokeWidth}
          tension={0.4}
          lineCap="round"
          lineJoin="round"
          draggable={draggableProp}
          {...commonProps}
          onDragEnd={e => pointsDragEnd(e, shape.id, onDragEnd)}
        />
      )
    case 'text': {
      const pad = 6
      return (
        <Group
          id={shape.id}
          x={shape.x} y={shape.y}
          draggable={draggableProp}
          {...commonProps}
          onDragStart={onDragStart ? e => onDragStart(shape.id, e.target.x(), e.target.y()) : undefined}
          onDragMove={onDragMove ? e => onDragMove(shape.id, e.target.x(), e.target.y()) : undefined}
          onDragEnd={e => onDragEnd(shape.id, e.target.x(), e.target.y())}
        >
          {shape.bgColor && (
            <Rect
              x={-pad} y={-pad}
              width={shape.text.length * shape.fontSize * 0.6 + pad * 2}
              height={shape.fontSize + pad * 2}
              fill={shape.bgColor}
              cornerRadius={4}
              opacity={0.85}
            />
          )}
          <Text
            text={shape.text}
            fontSize={shape.fontSize}
            fontStyle={shape.bold ? 'bold' : 'normal'}
            fontFamily="Inter, sans-serif"
            fill={shape.color}
          />
          {selected && (
            <Rect
              x={-pad - 1} y={-pad - 1}
              width={shape.text.length * shape.fontSize * 0.6 + pad * 2 + 2}
              height={shape.fontSize + pad * 2 + 2}
              stroke="#F99E1A"
              strokeWidth={1.5}
              fill="transparent"
              cornerRadius={4}
              dash={[4, 3]}
            />
          )}
        </Group>
      )
    }
    case 'marker': {
      const mc = MARKER_COLORS[shape.markerType]
      return (
        <Group
          id={shape.id}
          x={shape.x} y={shape.y}
          draggable={draggableProp}
          {...commonProps}
          onDragStart={onDragStart ? e => onDragStart(shape.id, e.target.x(), e.target.y()) : undefined}
          onDragMove={onDragMove ? e => onDragMove(shape.id, e.target.x(), e.target.y()) : undefined}
          onDragEnd={e => onDragEnd(shape.id, e.target.x(), e.target.y())}
        >
          <Circle radius={18} fill={mc} opacity={0.9} />
          <Circle radius={18} stroke={selected ? '#F99E1A' : 'rgba(255,255,255,0.3)'} strokeWidth={selected ? 2 : 1} fill="transparent" />
          <Text
            text={MARKER_SYMBOLS[shape.markerType]}
            fontSize={14}
            fontFamily="Inter, sans-serif"
            fill="#fff"
            x={-9} y={-10}
            width={18}
            align="center"
          />
          {shape.label && (
            <Text
              text={shape.label}
              fontSize={10}
              fontFamily="Inter, sans-serif"
              fill="#E6EDF3"
              x={-40} y={22}
              width={80}
              align="center"
            />
          )}
        </Group>
      )
    }
    default:
      return null
  }
}

// ── Preview shape while drawing ────────────────────────────────────────────

function PreviewShape({ shape }: { shape: CanvasShape | null }) {
  if (!shape) return null
  return (
    <ShapeNode
      shape={shape}
      selected={false}
      onSelect={() => {}}
      onDragEnd={() => {}}
    />
  )
}

// ── Main Canvas ────────────────────────────────────────────────────────────

interface MapCanvasProps {
  map: OWMap
  shapes: CanvasShape[]
  tool: DrawingTool
  color: string
  strokeWidth: number
  markerType: MarkerType
  layers: LayersState
  transform: StageTransform
  selectedId: string | null
  fogOfWar: boolean
  onShapesChange: (shapes: CanvasShape[]) => void
  onTransformChange: (t: StageTransform) => void
  onSelect: (id: string | null) => void
  onDropHero: (heroId: string, team: TeamSide, x: number, y: number) => void
  stageRef: React.RefObject<Konva.Stage>
  /** When animation mode is active, drags on x/y shapes call this instead of onShapesChange */
  onAnimDrag?: (id: string, x: number, y: number) => void
  /** When animation mode is active, freehand drag path calls this instead of onAnimDrag */
  onAnimPathDrag?: (id: string, path: Array<{ x: number; y: number; t: number }>) => void
  /** Disable all dragging (e.g. during animation playback) */
  dragDisabled?: boolean
}

export function MapCanvas({
  map, shapes, tool, color, strokeWidth, markerType, layers,
  transform, selectedId, fogOfWar,
  onShapesChange, onTransformChange, onSelect, onDropHero, stageRef,
  onAnimDrag, onAnimPathDrag, dragDisabled = false,
}: MapCanvasProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const drawingLayerRef = useRef<Konva.Layer>(null)

  // Track freehand drag path in animation mode (ref = no re-renders for recording)
  const animDragPathRef = useRef<{
    id: string
    points: Array<{ x: number; y: number; t: number }>
  } | null>(null)

  // Visual trail of the current animation drag (state = triggers canvas re-render)
  const [animPathPreview, setAnimPathPreview] = useState<number[] | null>(null)
  // Throttle preview state updates to every 3 points to limit re-renders
  const previewCountRef = useRef(0)

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [preview, setPreview]     = useState<CanvasShape | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 })
  const [textInput, setTextInput]   = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false })
  const [textValue, setTextValue]   = useState('')
  const textRef = useRef<HTMLInputElement>(null)

  // Load map image here so we can use its true dimensions across the whole canvas
  const mapImg = useMapImage(map)
  const MAP_W = mapImg ? mapImg.naturalWidth  : 1600
  const MAP_H = mapImg ? mapImg.naturalHeight : 900

  // Resize observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setStageSize({ width: el.clientWidth, height: el.clientHeight })
    })
    ro.observe(el)
    setStageSize({ width: el.clientWidth, height: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // Keyboard: space = pan, delete = remove selected
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !textInput.visible) { e.preventDefault(); setIsPanning(true) }
      if ((e.code === 'Delete' || e.code === 'Backspace') && selectedId && !textInput.visible) {
        onShapesChange(shapes.filter(s => s.id !== selectedId))
        onSelect(null)
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsPanning(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [selectedId, shapes, textInput.visible, onShapesChange, onSelect])

  // Attach transformer to selected shape
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return
    if (selectedId) {
      const node = stageRef.current.findOne('#' + selectedId) as Konva.Node
      if (node) {
        transformerRef.current.nodes([node])
        transformerRef.current.getLayer()?.batchDraw()
      }
    } else {
      transformerRef.current.nodes([])
    }
  }, [selectedId, shapes, stageRef])

  // Animation mode: record drag start and intermediate positions into a path
  const handleAnimShapeDragStart = useCallback((id: string, x: number, y: number) => {
    if (!onAnimDrag) return
    animDragPathRef.current = { id, points: [{ x, y, t: Date.now() }] }
    previewCountRef.current = 0
    setAnimPathPreview([x, y])
  }, [onAnimDrag])

  const handleAnimShapeDragMove = useCallback((id: string, x: number, y: number) => {
    const path = animDragPathRef.current
    if (!path || path.id !== id) return
    path.points.push({ x, y, t: Date.now() })
    // Update visual trail every 2 new points to limit re-renders
    previewCountRef.current += 1
    if (previewCountRef.current % 2 === 0) {
      setAnimPathPreview(path.points.flatMap(p => [p.x, p.y]))
    }
  }, [])

  const getPointerPos = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return { x: 0, y: 0 }
    const p = stage.getPointerPosition()
    if (!p) return { x: 0, y: 0 }
    return {
      x: (p.x - transform.x) / transform.scale,
      y: (p.y - transform.y) / transform.scale,
    }
  }, [stageRef, transform])

  // Wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const oldScale = transform.scale
    const pointer  = stage.getPointerPosition()!
    const factor   = e.evt.deltaY < 0 ? 1.1 : 0.9
    const newScale = clamp(oldScale * factor, ZOOM_MIN, ZOOM_MAX)
    const newX = pointer.x - (pointer.x - transform.x) * (newScale / oldScale)
    const newY = pointer.y - (pointer.y - transform.y) * (newScale / oldScale)
    onTransformChange({ x: newX, y: newY, scale: newScale })
  }, [transform, stageRef, onTransformChange])

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target
    const isStage = target === e.target.getStage()

    // Pan mode
    if (isPanning || tool === 'pan' || e.evt.button === 1) {
      setIsDrawing(true)
      setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY })
      return
    }

    // Select tool: deselect if clicking stage
    if (tool === 'select') {
      if (isStage) onSelect(null)
      return
    }

    // Eraser: handled per-shape
    if (tool === 'eraser') return

    if (tool === 'text') {
      const pos = getPointerPos()
      const stageBox = stageRef.current!.container().getBoundingClientRect()
      const screenX = pos.x * transform.scale + transform.x + stageBox.left
      const screenY = pos.y * transform.scale + transform.y + stageBox.top
      setTextInput({ x: pos.x, y: pos.y, visible: true })
      setTimeout(() => textRef.current?.focus(), 50)
      return
    }

    // Begin drawing
    const pos = getPointerPos()
    setIsDrawing(true)
    onSelect(null)

    const base = { id: '__preview', layerName: 'drawing' as const, opacity: 1 }

    if (tool === 'arrow') {
      setPreview({ ...base, type: 'arrow', points: [pos.x, pos.y, pos.x, pos.y], color, strokeWidth })
    } else if (tool === 'line' || tool === 'dashed') {
      setPreview({ ...base, type: 'line', points: [pos.x, pos.y, pos.x, pos.y], color, strokeWidth, dashed: tool === 'dashed' })
    } else if (tool === 'circle') {
      setPreview({ ...base, type: 'circle', x: pos.x, y: pos.y, radiusX: 0, radiusY: 0, color, strokeWidth, fill: false })
    } else if (tool === 'rect') {
      setPreview({ ...base, type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0, color, strokeWidth, fill: false })
    } else if (tool === 'freehand') {
      setPreview({ ...base, type: 'freehand', points: [pos.x, pos.y], color, strokeWidth })
    } else if (tool === 'marker') {
      const mc: MarkerShape = { ...base, id: uuid(), type: 'marker', x: pos.x, y: pos.y, markerType, label: '' }
      onShapesChange([...shapes, mc])
    }
  }, [isPanning, tool, color, strokeWidth, markerType, getPointerPos, onSelect, onShapesChange, shapes, transform, stageRef])

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return

    if (isPanning || tool === 'pan' || e.evt.button === 1) {
      const dx = e.evt.clientX - lastPanPos.x
      const dy = e.evt.clientY - lastPanPos.y
      onTransformChange({ ...transform, x: transform.x + dx, y: transform.y + dy })
      setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY })
      return
    }

    if (!preview) return
    const pos = getPointerPos()

    setPreview(prev => {
      if (!prev) return prev
      if (prev.type === 'arrow' || prev.type === 'line') {
        return { ...prev, points: [prev.points[0], prev.points[1], pos.x, pos.y] }
      }
      if (prev.type === 'circle') {
        const rx = Math.abs(pos.x - prev.x)
        const ry = Math.abs(pos.y - prev.y)
        return { ...prev, radiusX: rx, radiusY: ry }
      }
      if (prev.type === 'rect') {
        const x = Math.min(prev.x, pos.x)
        const y = Math.min(prev.y, pos.y)
        return { ...prev, x, y, width: Math.abs(pos.x - prev.x), height: Math.abs(pos.y - prev.y) }
      }
      if (prev.type === 'freehand') {
        return { ...prev, points: [...prev.points, pos.x, pos.y] }
      }
      return prev
    })
  }, [isDrawing, isPanning, tool, preview, getPointerPos, transform, lastPanPos, onTransformChange])

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (preview && preview.id === '__preview') {
      const final = { ...preview, id: uuid() }
      // Only add if shape has size
      let valid = true
      if (final.type === 'arrow' || final.type === 'line') {
        const dx = final.points[2] - final.points[0]
        const dy = final.points[3] - final.points[1]
        valid = Math.hypot(dx, dy) > 4
      }
      if (final.type === 'circle') valid = (final as CircleShape).radiusX > 4
      if (final.type === 'rect') {
        const r = final as RectShape
        valid = r.width > 4 && r.height > 4
      }
      if (final.type === 'freehand') valid = (final as FreehandShape).points.length > 4

      if (valid) onShapesChange([...shapes, final])
    }
    setPreview(null)
  }, [isDrawing, preview, shapes, onShapesChange])

  const handleShapeSelect = useCallback((id: string) => {
    if (tool === 'eraser') {
      onShapesChange(shapes.filter(s => s.id !== id))
      return
    }
    if (tool === 'select') onSelect(id)
  }, [tool, shapes, onShapesChange, onSelect])

  const commitAnimPath = useCallback((id: string, x: number, y: number) => {
    const path = animDragPathRef.current
    if (path && path.id === id && path.points.length > 2 && onAnimPathDrag) {
      path.points.push({ x, y, t: Date.now() })
      onAnimPathDrag(id, path.points)
    } else {
      onAnimDrag!(id, x, y)
    }
    animDragPathRef.current = null
    setAnimPathPreview(null)
  }, [onAnimDrag, onAnimPathDrag])

  const handleShapeDragEnd = useCallback((id: string, x: number, y: number, isDelta?: boolean) => {
    const shape = shapes.find(s => s.id === id)
    if (!shape) return
    // Point-based shapes always update base state
    const isPointBased = shape.type === 'arrow' || shape.type === 'line' || shape.type === 'freehand'
    if (!isPointBased && onAnimDrag) {
      commitAnimPath(id, x, y)
      return
    }
    animDragPathRef.current = null
    setAnimPathPreview(null)
    onShapesChange(shapes.map(s => {
      if (s.id !== id) return s
      if (isDelta && (s.type === 'arrow' || s.type === 'line' || s.type === 'freehand')) {
        const pts = s.points.map((p, i) => (i % 2 === 0 ? p + x : p + y))
        return { ...s, points: pts }
      }
      if (s.type === 'hero' || s.type === 'marker' || s.type === 'circle' ||
          s.type === 'text' || s.type === 'rect') {
        return { ...s, x, y }
      }
      return s
    }))
  }, [shapes, onShapesChange, onAnimDrag])

  const handleHeroDragEnd = useCallback((id: string, x: number, y: number) => {
    if (onAnimDrag) {
      commitAnimPath(id, x, y)
      return
    }
    onShapesChange(shapes.map(s => s.id === id ? { ...s, x, y } : s))
  }, [shapes, onShapesChange, onAnimDrag, commitAnimPath])

  const handleHeroDelete = useCallback((id: string) => {
    onShapesChange(shapes.filter(s => s.id !== id))
    onSelect(null)
  }, [shapes, onShapesChange, onSelect])

  // HTML5 drop from hero panel
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const heroId = e.dataTransfer.getData('heroId')
    const team   = (e.dataTransfer.getData('team') || 'ally') as TeamSide
    if (!heroId || !stageRef.current) return
    const stageBox = stageRef.current.container().getBoundingClientRect()
    const x = (e.clientX - stageBox.left - transform.x) / transform.scale
    const y = (e.clientY - stageBox.top  - transform.y) / transform.scale
    onDropHero(heroId, team, x, y)
  }, [stageRef, transform, onDropHero])

  const commitText = useCallback(() => {
    if (!textValue.trim()) { setTextInput(t => ({ ...t, visible: false })); setTextValue(''); return }
    const shape: TextShape = {
      id: uuid(),
      type: 'text',
      layerName: 'notes',
      x: textInput.x,
      y: textInput.y,
      text: textValue,
      fontSize: 16,
      color,
      bold: false,
      bgColor: 'rgba(0,0,0,0.6)',
      opacity: 1,
    }
    onShapesChange([...shapes, shape])
    setTextInput(t => ({ ...t, visible: false }))
    setTextValue('')
  }, [textValue, textInput, color, shapes, onShapesChange])

  const drawingShapes = shapes.filter(s => s.type !== 'hero' && s.layerName !== 'notes')
  const noteShapes    = shapes.filter(s => s.layerName === 'notes' || s.type === 'text')
  const heroShapes    = shapes.filter(s => s.type === 'hero') as HeroShape[]

  const cursorClass = isPanning || tool === 'pan'
    ? (isDrawing ? 'cursor-grabbing' : 'cursor-grab')
    : tool === 'select' ? 'cursor-select'
    : tool === 'text'   ? 'cursor-text'
    : ''

  // Text input screen position
  const textScreenX = textInput.x * transform.scale + transform.x
  const textScreenY = textInput.y * transform.scale + transform.y

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 bg-ow-dark overflow-hidden konvajs-content ${cursorClass}`}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={transform.x}
        y={transform.y}
        scaleX={transform.scale}
        scaleY={transform.scale}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown as any}
        onTouchMove={handleMouseMove as any}
        onTouchEnd={handleMouseUp}
      >
        {/* Map background */}
        <Layer>
          <MapBackground map={map} img={mapImg} width={MAP_W} height={MAP_H} />
        </Layer>

        {/* Drawing layer */}
        <Layer ref={drawingLayerRef} visible={layers.drawing}>
          {drawingShapes.map(shape => (
            <ShapeNode
              key={shape.id}
              shape={shape}
              selected={shape.id === selectedId}
              onSelect={handleShapeSelect}
              onDragEnd={handleShapeDragEnd}
              onDragStart={onAnimDrag ? handleAnimShapeDragStart : undefined}
              onDragMove={onAnimDrag ? handleAnimShapeDragMove : undefined}
              draggable={!dragDisabled}
            />
          ))}
          <PreviewShape shape={preview} />
          {/* Animation drag trail */}
          {animPathPreview && animPathPreview.length >= 4 && (
            <Line
              points={animPathPreview}
              stroke="#F99E1A"
              strokeWidth={2 / transform.scale}
              opacity={0.6}
              dash={[6 / transform.scale, 4 / transform.scale]}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          )}
        </Layer>

        {/* Heroes layer */}
        <Layer visible={layers.heroes}>
          {heroShapes.map(h => (
            <HeroIcon
              key={h.id}
              shape={h}
              selected={h.id === selectedId}
              onSelect={id => tool === 'eraser' ? handleHeroDelete(id) : onSelect(id)}
              onDragEnd={handleHeroDragEnd}
              onDelete={handleHeroDelete}
              onDragStart={onAnimDrag ? handleAnimShapeDragStart : undefined}
              onDragMove={onAnimDrag ? handleAnimShapeDragMove : undefined}
              draggable={!dragDisabled}
            />
          ))}
        </Layer>

        {/* Notes layer */}
        <Layer visible={layers.notes}>
          {noteShapes.map(shape => (
            <ShapeNode
              key={shape.id}
              shape={shape}
              selected={shape.id === selectedId}
              onSelect={handleShapeSelect}
              onDragEnd={handleShapeDragEnd}
              onDragStart={onAnimDrag ? handleAnimShapeDragStart : undefined}
              onDragMove={onAnimDrag ? handleAnimShapeDragMove : undefined}
              draggable={!dragDisabled}
            />
          ))}
        </Layer>

        {/* Transformer */}
        <Layer>
          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={['top-left','top-right','bottom-left','bottom-right']}
            borderStroke="#F99E1A"
            borderStrokeWidth={1.5}
            anchorFill="#F99E1A"
            anchorStroke="#0D1117"
            anchorSize={8}
            anchorCornerRadius={2}
          />
        </Layer>

        {/* Fog of war overlay */}
        {fogOfWar && (
          <Layer>
            <Rect width={MAP_W} height={MAP_H} fill="rgba(0,0,0,0.55)" globalCompositeOperation="source-over" />
          </Layer>
        )}
      </Stage>

      {/* Text input overlay */}
      {textInput.visible && (
        <input
          ref={textRef}
          className="absolute bg-ow-dark border border-ow-orange text-white text-sm px-2 py-1 rounded outline-none z-50 min-w-[140px]"
          style={{ left: textScreenX, top: textScreenY }}
          value={textValue}
          onChange={e => setTextValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitText()
            if (e.key === 'Escape') { setTextInput(t => ({ ...t, visible: false })); setTextValue('') }
          }}
          onBlur={commitText}
          placeholder="Type label…"
        />
      )}

      {/* Zoom badge */}
      <div className="absolute bottom-3 right-3 bg-ow-panel border border-ow-border rounded px-2 py-1 text-xs text-gray-400 font-mono select-none">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  )
}
