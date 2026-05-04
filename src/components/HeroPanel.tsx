import React, { useState } from 'react'
import { OW_HEROES, ROLE_COLORS, ROLE_LABELS } from '../data/heroes'
import type { HeroRole, TeamSide } from '../types'

const SIZE_PRESETS = [
  { label: 'S',  value: 80  },
  { label: 'M',  value: 150 },
  { label: 'L',  value: 250 },
  { label: 'XL', value: 400 },
]

interface HeroPanelProps {
  team: TeamSide
  heroSize: number
  onTeamChange: (t: TeamSide) => void
  onHeroSizeChange: (size: number) => void
  onApplySizeToAll: (size: number) => void
}

export function HeroPanel({
  team, heroSize,
  onTeamChange, onHeroSizeChange, onApplySizeToAll,
}: HeroPanelProps) {
  const [search, setSearch] = useState('')
  const [expandedRoles, setExpandedRoles] = useState<Set<HeroRole>>(
    new Set(['tank', 'damage', 'support'])
  )

  const filtered = OW_HEROES.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.abbr.toLowerCase().includes(search.toLowerCase())
  )

  const roles: HeroRole[] = ['tank', 'damage', 'support']

  const toggleRole = (role: HeroRole) => {
    setExpandedRoles(prev => {
      const next = new Set(prev)
      next.has(role) ? next.delete(role) : next.add(role)
      return next
    })
  }

  const handleDragStart = (e: React.DragEvent, heroId: string) => {
    e.dataTransfer.setData('heroId', heroId)
    e.dataTransfer.setData('team', team)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-ow-border space-y-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Heroes</div>

        {/* Team toggle */}
        <div className="flex rounded overflow-hidden border border-ow-border">
          <button
            className={`flex-1 text-xs py-1 font-medium transition-colors ${team === 'ally' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-ow-hover'}`}
            onClick={() => onTeamChange('ally')}
          >Ally</button>
          <button
            className={`flex-1 text-xs py-1 font-medium transition-colors ${team === 'enemy' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-ow-hover'}`}
            onClick={() => onTeamChange('enemy')}
          >Enemy</button>
        </div>

        {/* Icon size control */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Icon size</span>
            <span className="text-[10px] font-mono text-ow-orange">{heroSize}px</span>
          </div>

          {/* Preset buttons */}
          <div className="flex gap-1 mb-1.5">
            {SIZE_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => onHeroSizeChange(p.value)}
                className={`flex-1 text-[10px] py-0.5 rounded border transition-colors font-medium ${
                  heroSize === p.value
                    ? 'border-ow-orange text-ow-orange bg-ow-orange/10'
                    : 'border-ow-border text-gray-500 hover:text-gray-300 hover:border-gray-500'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Slider */}
          <input
            type="range"
            min={40} max={600} step={10}
            value={heroSize}
            onChange={e => onHeroSizeChange(Number(e.target.value))}
            className="w-full h-1 accent-ow-orange cursor-pointer"
          />

          {/* Apply to all */}
          <button
            onClick={() => onApplySizeToAll(heroSize)}
            className="mt-1.5 w-full text-[10px] py-1 rounded border border-ow-border text-gray-400 hover:text-white hover:bg-ow-hover hover:border-gray-500 transition-colors"
          >
            Apply to all on map
          </button>
        </div>

        {/* Search */}
        <input
          className="w-full bg-ow-dark border border-ow-border rounded text-xs px-2 py-1.5 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-500"
          placeholder="Search hero…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Hero list */}
      <div className="flex-1 overflow-y-auto">
        {search ? (
          <div className="p-2 flex flex-wrap gap-1.5">
            {filtered.map(hero => (
              <HeroChip key={hero.id} hero={hero} team={team} onDragStart={handleDragStart} />
            ))}
          </div>
        ) : (
          roles.map(role => {
            const heroes = OW_HEROES.filter(h => h.role === role)
            const isOpen = expandedRoles.has(role)
            return (
              <div key={role}>
                <button
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-ow-hover text-left"
                  onClick={() => toggleRole(role)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS[role] }} />
                    <span className="text-xs font-semibold" style={{ color: ROLE_COLORS[role] }}>
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="text-xs text-gray-600">{heroes.length}</span>
                  </div>
                  <span className="text-gray-600 text-xs">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="px-2 pb-2 flex flex-wrap gap-1.5">
                    {heroes.map(hero => (
                      <HeroChip key={hero.id} hero={hero} team={team} onDragStart={handleDragStart} />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="px-3 py-2 border-t border-ow-border text-xs text-gray-600 text-center">
        Drag heroes onto map
      </div>
    </div>
  )
}

function HeroChip({
  hero, team, onDragStart,
}: {
  hero: typeof OW_HEROES[0]
  team: TeamSide
  onDragStart: (e: React.DragEvent, id: string) => void
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const ringColor = team === 'ally' ? '#3B82F6' : '#EF4444'

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, hero.id)}
      className="flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing group"
      title={hero.name}
    >
      <div
        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white select-none transition-transform group-hover:scale-110"
        style={{ background: hero.color, boxShadow: `0 0 0 2px ${ringColor}` }}
      >
        {!imgFailed ? (
          <img
            src={`/hero_pic/${hero.id}.png`}
            alt={hero.name}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
            draggable={false}
          />
        ) : (
          hero.abbr.slice(0, 3)
        )}
      </div>
      <span className="text-[9px] text-gray-500 group-hover:text-gray-300 text-center leading-tight max-w-[40px] truncate">
        {hero.name.split(' ')[0]}
      </span>
    </div>
  )
}
