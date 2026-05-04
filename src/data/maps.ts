import type { OWMap } from '../types'

// Naming convention for map_pic folder:
//   map_pic/[mapid].png        ← preferred
//   map_pic/[mapid]_anno.png   ← annotated variant (also auto-detected)
// Drop any image with one of these names and it will load automatically.

function mp(id: string, override?: string): string {
  return `/map_pic/${override ?? id}.png`
}

export const OW_MAPS: OWMap[] = [
  // Escort
  { id: 'dorado',        name: 'Dorado',               mode: 'Escort',     bgColor: '#1a2a1a', bgGradient: ['#1B3A2A', '#0D1F17'], imageUrl: mp('dorado') },
  { id: 'junkertown',    name: 'Junkertown',            mode: 'Escort',     bgColor: '#2a1f0d', bgGradient: ['#3B2A0E', '#1A1208'], imageUrl: mp('junkertown') },
  { id: 'havana',        name: 'Havana',                mode: 'Escort',     bgColor: '#603169', bgGradient: ['#603169', '#603169'], imageUrl: mp('havana') },
  { id: 'rialto',        name: 'Rialto',                mode: 'Escort',     bgColor: '#0d1a2a', bgGradient: ['#0E2235', '#071119'], imageUrl: mp('rialto') },
  { id: 'route66',       name: 'Route 66',              mode: 'Escort',     bgColor: '#2a1a0d', bgGradient: ['#3A2010', '#1A0F07'], imageUrl: mp('route66') },
  { id: 'gibraltar',     name: 'Watchpoint: Gibraltar', mode: 'Escort',     bgColor: '#1a1a2a', bgGradient: ['#1C2040', '#0C101F'], imageUrl: mp('watchpointgibraltar_anno') },
  { id: 'shambali',      name: 'Shambali Monastery',    mode: 'Escort',     bgColor: '#1a0d2a', bgGradient: ['#25133A', '#100919'], imageUrl: mp('shambali') },
  // Hybrid
  { id: 'blizzardworld', name: 'Blizzard World',        mode: 'Hybrid',     bgColor: '#0d1a2a', bgGradient: ['#0E2030', '#07101A'], imageUrl: mp('blizzardworld') },
  { id: 'eichenwalde',   name: 'Eichenwalde',           mode: 'Hybrid',     bgColor: '#0d1a0d', bgGradient: ['#0F231A', '#07100B'], imageUrl: mp('eichenwalde') },
  { id: 'hollywood',     name: 'Hollywood',             mode: 'Hybrid',     bgColor: '#2a1a0d', bgGradient: ['#3A1E0A', '#1A0F07'], imageUrl: mp('hollywood') },
  { id: 'kingsrow',      name: "King's Row",            mode: 'Hybrid',     bgColor: '#14141e', bgGradient: ['#1A1A2E', '#0C0C18'], imageUrl: mp('kingsrow') },
  { id: 'midtown',       name: 'Midtown',               mode: 'Hybrid',     bgColor: '#1a1420', bgGradient: ['#22193A', '#100D1A'], imageUrl: mp('midtown') },
  { id: 'numbani',       name: 'Numbani',               mode: 'Hybrid',     bgColor: '#0d1f0d', bgGradient: ['#0D2B1B', '#071410'], imageUrl: mp('numbani') },
  { id: 'paraiso',       name: 'Paraíso',               mode: 'Hybrid',     bgColor: '#1a2a0d', bgGradient: ['#1E3010', '#0F180B'], imageUrl: mp('paraiso') },
  // Control
  { id: 'antarctic',     name: 'Antarctic Peninsula',   mode: 'Control',    bgColor: '#0d1e2a', bgGradient: ['#102535', '#07121A'], imageUrl: mp('antarctic') },
  { id: 'busan',         name: 'Busan',                 mode: 'Control',    bgColor: '#0d1a22', bgGradient: ['#0E2030', '#071018'], imageUrl: mp('busan', 'busan_anno') },
  { id: 'ilios',         name: 'Ilios',                 mode: 'Control',    bgColor: '#0d1a2a', bgGradient: ['#102540', '#061320'], imageUrl: mp('ilios') },
  { id: 'lijiangtower',  name: 'Lijiang Tower',         mode: 'Control',    bgColor: '#1a0d1a', bgGradient: ['#201025', '#100812'], imageUrl: mp('lijiangtower') },
  { id: 'nepal',         name: 'Nepal',                 mode: 'Control',    bgColor: '#1a140d', bgGradient: ['#251A0E', '#120D07'], imageUrl: mp('nepal') },
  { id: 'oasis',         name: 'Oasis',                 mode: 'Control',    bgColor: '#0d1a14', bgGradient: ['#0E2218', '#07110C'], imageUrl: mp('oasis') },
  { id: 'samoa',         name: 'Samoa',                 mode: 'Control',    bgColor: '#0d1e18', bgGradient: ['#0E2820', '#07140F'], imageUrl: mp('samoa') },
  // Push
  { id: 'esperanca',     name: 'Esperança',             mode: 'Push',       bgColor: '#1a0d14', bgGradient: ['#250F1A', '#12080D'], imageUrl: mp('esperanca') },
  { id: 'newqueenst',    name: 'New Queen Street',      mode: 'Push',       bgColor: '#0d1a1a', bgGradient: ['#0E2525', '#071212'], imageUrl: mp('newqueenst') },
  { id: 'colosseo',      name: 'Colosseo',              mode: 'Push',       bgColor: '#2a1a0d', bgGradient: ['#35200E', '#1A1007'], imageUrl: mp('colosseo') },
  // Flashpoint
  { id: 'suravasa',      name: 'Suravasa',              mode: 'Flashpoint', bgColor: '#1a1a0d', bgGradient: ['#25250E', '#121207'], imageUrl: mp('suravasa') },
  { id: 'newjunkcity',   name: 'New Junk City',         mode: 'Flashpoint', bgColor: '#1a100d', bgGradient: ['#251410', '#120A07'], imageUrl: mp('newjunkcity') },
  // Clash
  { id: 'hanaoka',       name: 'Hanaoka',               mode: 'Clash',      bgColor: '#200d14', bgGradient: ['#2A0F1C', '#14080E'], imageUrl: mp('hanaoka') },
  { id: 'runasapi',      name: 'Runasapi',              mode: 'Clash',      bgColor: '#0d1420', bgGradient: ['#0E1A2A', '#070D14'], imageUrl: mp('runasapi') },
]

export const MAP_MODES = [...new Set(OW_MAPS.map(m => m.mode))]
