export type DrawingTool =
  | 'select'
  | 'arrow'
  | 'line'
  | 'dashed'
  | 'circle'
  | 'rect'
  | 'freehand'
  | 'text'
  | 'marker'
  | 'eraser'
  | 'pan';

export type MarkerType = 'enemy' | 'ally' | 'flank' | 'sniper' | 'objective' | 'retreat';

export type LayerName = 'drawing' | 'heroes' | 'notes';

export type HeroRole = 'tank' | 'damage' | 'support';

export type TeamSide = 'ally' | 'enemy';

// ── Shape union ────────────────────────────────────────────────────

interface ShapeBase {
  id: string;
  layerName: LayerName;
  opacity: number;
}

export interface ArrowShape extends ShapeBase {
  type: 'arrow';
  points: number[];
  color: string;
  strokeWidth: number;
}

export interface LineShape extends ShapeBase {
  type: 'line';
  points: number[];
  color: string;
  strokeWidth: number;
  dashed: boolean;
}

export interface CircleShape extends ShapeBase {
  type: 'circle';
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color: string;
  strokeWidth: number;
  fill: boolean;
}

export interface RectShape extends ShapeBase {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  fill: boolean;
}

export interface FreehandShape extends ShapeBase {
  type: 'freehand';
  points: number[];
  color: string;
  strokeWidth: number;
}

export interface TextShape extends ShapeBase {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  bgColor: string | null;
}

export interface MarkerShape extends ShapeBase {
  type: 'marker';
  x: number;
  y: number;
  markerType: MarkerType;
  label: string;
}

export interface HeroShape extends ShapeBase {
  type: 'hero';
  x: number;
  y: number;
  heroId: string;
  team: TeamSide;
  size: number;
  showLabel: boolean;
}

export type CanvasShape =
  | ArrowShape
  | LineShape
  | CircleShape
  | RectShape
  | FreehandShape
  | TextShape
  | MarkerShape
  | HeroShape;

// ── Data models ────────────────────────────────────────────────────

export interface OWMap {
  id: string;
  name: string;
  mode: string;
  bgColor: string;
  bgGradient: [string, string];
  imageUrl?: string;
}

export interface OWHero {
  id: string;
  name: string;
  role: HeroRole;
  color: string;
  abbr: string;
}

// ── App state ──────────────────────────────────────────────────────

export interface LayersState {
  drawing: boolean;
  heroes: boolean;
  notes: boolean;
}

export interface StageTransform {
  x: number;
  y: number;
  scale: number;
}

export interface TimelineStep {
  id: string;
  label: string;
  shapes: CanvasShape[];
}

export const MARKER_COLORS: Record<MarkerType, string> = {
  enemy:     '#EF4444',
  ally:      '#3B82F6',
  flank:     '#EAB308',
  sniper:    '#A855F7',
  objective: '#F97316',
  retreat:   '#22C55E',
};

export const MARKER_LABELS: Record<MarkerType, string> = {
  enemy:     'Enemy',
  ally:      'Ally',
  flank:     'Flank',
  sniper:    'Sniper',
  objective: 'Objective',
  retreat:   'Retreat',
};

export const MARKER_SYMBOLS: Record<MarkerType, string> = {
  enemy:     '✕',
  ally:      '⬟',
  flank:     '◈',
  sniper:    '◎',
  objective: '★',
  retreat:   '↓',
};
