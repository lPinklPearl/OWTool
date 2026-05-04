import { useState, useCallback } from 'react'
import type { CanvasShape } from '../types'

const MAX_HISTORY = 60

export function useHistory(initializer: CanvasShape[] | (() => CanvasShape[])) {
  const [history, setHistory] = useState<CanvasShape[][]>(() => {
    const init = typeof initializer === 'function' ? initializer() : initializer
    return [init]
  })
  const [index, setIndex] = useState(0)

  const present = history[index]

  const push = useCallback((newShapes: CanvasShape[]) => {
    setHistory(h => {
      const trimmed = h.slice(0, index + 1)
      const next = [...trimmed, newShapes]
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
    })
    setIndex(i => Math.min(i + 1, MAX_HISTORY - 1))
  }, [index])

  const undo = useCallback(() => {
    setIndex(i => Math.max(0, i - 1))
  }, [])

  const redo = useCallback(() => {
    setIndex(i => Math.min(history.length - 1, i + 1))
  }, [history.length])

  const canUndo = index > 0
  const canRedo = index < history.length - 1

  return { present, push, undo, redo, canUndo, canRedo }
}
