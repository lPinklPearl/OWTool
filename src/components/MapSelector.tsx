import { ChevronDown, Map } from 'lucide-react'
import { useState } from 'react'
import { OW_MAPS, MAP_MODES } from '../data/maps'
import type { OWMap } from '../types'

interface MapSelectorProps {
  selectedMap: OWMap
  onChange: (map: OWMap) => void
}

export function MapSelector({ selectedMap, onChange }: MapSelectorProps) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<string>('All')

  const filtered = filter === 'All' ? OW_MAPS : OW_MAPS.filter(m => m.mode === filter)

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-1.5 bg-ow-hover border border-ow-border rounded text-sm text-gray-300 hover:border-gray-500 transition-colors min-w-[200px]"
        onClick={() => setOpen(o => !o)}
      >
        <Map className="w-4 h-4 text-ow-orange flex-shrink-0" />
        <span className="flex-1 text-left truncate">{selectedMap.name}</span>
        <span className="text-xs text-gray-600 mr-1">{selectedMap.mode}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-ow-panel border border-ow-border rounded-lg shadow-2xl w-72 panel-in overflow-hidden">
          {/* Mode filter tabs */}
          <div className="flex gap-0 p-1 border-b border-ow-border overflow-x-auto">
            {['All', ...MAP_MODES].map(mode => (
              <button
                key={mode}
                className={`px-2.5 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                  filter === mode
                    ? 'bg-ow-orange text-black font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-ow-hover'
                }`}
                onClick={() => setFilter(mode)}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Map list */}
          <div className="overflow-y-auto max-h-72 py-1">
            {filtered.map(map => (
              <button
                key={map.id}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-ow-hover text-left transition-colors ${
                  map.id === selectedMap.id ? 'bg-ow-hover' : ''
                }`}
                onClick={() => { onChange(map); setOpen(false) }}
              >
                {/* Color swatch */}
                <div
                  className="w-6 h-6 rounded flex-shrink-0 border border-white/10"
                  style={{
                    background: `linear-gradient(135deg, ${map.bgGradient[0]}, ${map.bgGradient[1]})`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${map.id === selectedMap.id ? 'text-ow-orange font-medium' : 'text-gray-300'}`}>
                    {map.name}
                  </div>
                  <div className="text-xs text-gray-600">{map.mode}</div>
                </div>
                {map.id === selectedMap.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-ow-orange flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click-away backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}
