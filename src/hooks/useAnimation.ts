import { useState, useCallback, useEffect, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import type { Keyframe, CanvasShape } from '../types'

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function interpolatePos(
  baseX: number,
  baseY: number,
  kfs: Keyframe[],
  time: number,
): { x: number; y: number } {
  if (kfs.length === 0) return { x: baseX, y: baseY }

  const sorted = [...kfs].sort((a, b) => a.time - b.time)

  if (time <= 0) return { x: baseX, y: baseY }

  const last = sorted[sorted.length - 1]
  if (time >= last.time) return { x: last.x, y: last.y }

  // Before first keyframe: interpolate from base to first keyframe
  if (time < sorted[0].time) {
    const t = time / sorted[0].time
    return { x: lerp(baseX, sorted[0].x, t), y: lerp(baseY, sorted[0].y, t) }
  }

  // Between two keyframes
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time <= sorted[i + 1].time) {
      const span = sorted[i + 1].time - sorted[i].time
      const t = span > 0 ? (time - sorted[i].time) / span : 0
      return {
        x: lerp(sorted[i].x, sorted[i + 1].x, t),
        y: lerp(sorted[i].y, sorted[i + 1].y, t),
      }
    }
  }

  return { x: baseX, y: baseY }
}

function isXYShape(shape: CanvasShape): shape is Extract<CanvasShape, { x: number; y: number }> {
  return shape.type !== 'arrow' && shape.type !== 'line' && shape.type !== 'freehand'
}

export function useAnimation() {
  const [keyframes, setKeyframes] = useState<Keyframe[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(10)
  const [isPlaying, setIsPlaying] = useState(false)

  const rafRef = useRef<number | null>(null)
  const startWallRef = useRef(0)
  const startAnimRef = useRef(0)
  const durationRef = useRef(duration)
  useEffect(() => { durationRef.current = duration }, [duration])

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isPlaying) {
      stopLoop()
      return
    }

    startWallRef.current = performance.now()
    startAnimRef.current = currentTime

    const tick = (now: number) => {
      const elapsed = (now - startWallRef.current) / 1000
      const next = startAnimRef.current + elapsed

      if (next >= durationRef.current) {
        setCurrentTime(durationRef.current)
        setIsPlaying(false)
        return
      }

      setCurrentTime(next)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return stopLoop
  // Only restart loop when isPlaying flips — not on every currentTime update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  const play = useCallback(() => setIsPlaying(true), [])

  const pause = useCallback(() => setIsPlaying(false), [])

  const seek = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(durationRef.current, time))
    setCurrentTime(clamped)
    // If playing, reset start refs so the loop continues from new position
    startWallRef.current = performance.now()
    startAnimRef.current = clamped
  }, [])

  const addOrUpdateKeyframe = useCallback((shapeId: string, x: number, y: number, time: number) => {
    const SNAP = 0.05 // snap within 50 ms
    setKeyframes(prev => {
      const existing = prev.find(k => k.shapeId === shapeId && Math.abs(k.time - time) <= SNAP)
      if (existing) {
        return prev.map(k => k.id === existing.id ? { ...k, x, y, time } : k)
      }
      return [...prev, { id: uuid(), shapeId, time, x, y }]
    })
  }, [])

  const deleteKeyframe = useCallback((id: string) => {
    setKeyframes(prev => prev.filter(k => k.id !== id))
  }, [])

  const deleteShapeKeyframes = useCallback((shapeId: string) => {
    setKeyframes(prev => prev.filter(k => k.shapeId !== shapeId))
  }, [])

  // Add many keyframes in one state update (for freehand path recording)
  const addKeyframeBatch = useCallback((entries: Array<{ shapeId: string; x: number; y: number; time: number }>) => {
    const SNAP = 0.05
    setKeyframes(prev => {
      let result = [...prev]
      for (const entry of entries) {
        const existing = result.find(k => k.shapeId === entry.shapeId && Math.abs(k.time - entry.time) <= SNAP)
        if (existing) {
          result = result.map(k => k.id === existing.id ? { ...k, x: entry.x, y: entry.y, time: entry.time } : k)
        } else {
          result.push({ id: uuid(), shapeId: entry.shapeId, time: entry.time, x: entry.x, y: entry.y })
        }
      }
      return result
    })
  }, [])

  const getDisplayShapes = useCallback((shapes: CanvasShape[]): CanvasShape[] => {
    return shapes.map(shape => {
      if (!isXYShape(shape)) return shape
      const shapeKfs = keyframes.filter(k => k.shapeId === shape.id)
      if (shapeKfs.length === 0) return shape
      const { x, y } = interpolatePos(shape.x, shape.y, shapeKfs, currentTime)
      return { ...shape, x, y }
    })
  }, [keyframes, currentTime])

  return {
    keyframes,
    currentTime,
    duration,
    isPlaying,
    seek,
    setDuration,
    play,
    pause,
    addOrUpdateKeyframe,
    addKeyframeBatch,
    deleteKeyframe,
    deleteShapeKeyframes,
    getDisplayShapes,
  }
}
