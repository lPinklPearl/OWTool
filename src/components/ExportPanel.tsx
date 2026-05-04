import { useState } from 'react'
import { Download, Save, Share2, Upload, Trash2, Check } from 'lucide-react'
import type Konva from 'konva'
import type { CanvasShape, OWMap, StageTransform } from '../types'

interface ExportPanelProps {
  stageRef: React.RefObject<Konva.Stage>
  shapes: CanvasShape[]
  selectedMap: OWMap
  transform: StageTransform
  onLoadJSON: (shapes: CanvasShape[], mapId: string) => void
  onClearAll: () => void
}

export function ExportPanel({
  stageRef, shapes, selectedMap, transform, onLoadJSON, onClearAll,
}: ExportPanelProps) {
  const [copied, setCopied] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const exportPNG = () => {
    const stage = stageRef.current
    if (!stage) return

    // Read the true map dimensions from the background image node
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bgImage = stage.getLayers()[0]?.findOne('Image') as any
    const mapW: number = bgImage ? bgImage.width() : 1600
    const mapH: number = bgImage ? bgImage.height() : 900

    // Reset transform so the export starts at (0,0) at 1:1 scale
    const oldX = stage.x()
    const oldY = stage.y()
    const oldScale = stage.scaleX()
    stage.x(0); stage.y(0); stage.scale({ x: 1, y: 1 })
    stage.batchDraw()

    // Pass explicit width/height so Konva renders the full map area
    const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png', width: mapW, height: mapH })

    stage.x(oldX); stage.y(oldY); stage.scale({ x: oldScale, y: oldScale })
    stage.batchDraw()

    const link = document.createElement('a')
    link.download = `${selectedMap.id}-strategy.png`
    link.href = dataUrl
    link.click()
  }

  const saveJSON = () => {
    const data = {
      version: '1.0',
      mapId: selectedMap.id,
      shapes,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${selectedMap.id}-strategy.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  const loadJSON = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (!data.shapes || !data.mapId) throw new Error('Invalid file')
        onLoadJSON(data.shapes, data.mapId)
      } catch {
        alert('Failed to load JSON — invalid strategy file.')
      }
    }
    input.click()
  }

  const copyShareLink = () => {
    const data = { mapId: selectedMap.id, shapes }
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))))
    const url = `${window.location.origin}${window.location.pathname}#state=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return }
    onClearAll()
    setConfirmClear(false)
  }

  return (
    <div className="flex flex-col gap-1 p-3">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Export</div>

      <PanelButton icon={<Download className="w-3.5 h-3.5" />} label="Export PNG" onClick={exportPNG} />
      <PanelButton icon={<Save className="w-3.5 h-3.5" />}     label="Save JSON" onClick={saveJSON} />
      <PanelButton icon={<Upload className="w-3.5 h-3.5" />}   label="Load JSON" onClick={loadJSON} />
      <PanelButton
        icon={copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
        label={copied ? 'Copied!' : 'Copy Share Link'}
        onClick={copyShareLink}
        accent={copied}
      />

      <div className="h-px bg-ow-border my-1" />

      <button
        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors ${
          confirmClear
            ? 'bg-red-900/50 text-red-300 border border-red-700'
            : 'hover:bg-red-900/30 text-gray-500 hover:text-red-400'
        }`}
        onClick={handleClear}
      >
        <Trash2 className="w-3.5 h-3.5" />
        {confirmClear ? 'Click again to confirm' : 'Clear All'}
      </button>

      {/* Stats */}
      <div className="mt-2 text-xs text-gray-600 space-y-0.5">
        <div>Shapes: {shapes.length}</div>
        <div>Heroes: {shapes.filter(s => s.type === 'hero').length}</div>
      </div>
    </div>
  )
}

function PanelButton({
  icon, label, onClick, accent,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <button
      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors ${
        accent ? 'text-green-400' : 'text-gray-400 hover:text-gray-200 hover:bg-ow-hover'
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}
