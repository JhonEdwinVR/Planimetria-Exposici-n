import {
  BackgroundPlanSettings,
  ExhibitionProject,
  LayerState,
  LibraryImage,
  PendingVerification,
  PlanAnnotation,
  Vertex,
  Wall,
  WallItem,
  Zone,
} from '../types/exhibition';
import { INITIAL_GRAPHIC_LIBRARY } from './graphicLibrary';

/**
 * Generates a museum-grade minimalist fine-art SVG data URL for artworks
 * so every photograph renders crisply without external network dependencies.
 */
export function createArtworkSvgDataUrl(
  title: string,
  artist: string,
  variant: number,
  widthCm: number,
  heightCm: number
): string {
  const palettes = [
    { bg: '#EAE6DF', fg: '#1C1917', acc: '#78716C', mid: '#A8A29E' },
    { bg: '#DCD7CE', fg: '#292524', acc: '#57534E', mid: '#8C857B' },
    { bg: '#262626', fg: '#F5F5F4', acc: '#A3A3A3', mid: '#525252' },
    { bg: '#E5E5E5', fg: '#171717', acc: '#737373', mid: '#A3A3A3' },
    { bg: '#EFECE6', fg: '#27272A', acc: '#71717A', mid: '#D4D0C8' },
    { bg: '#1E242B', fg: '#E2E8F0', acc: '#64748B', mid: '#334155' },
  ];
  const p = palettes[variant % palettes.length];
  const w = Math.max(200, Math.round(widthCm * 4));
  const h = Math.max(200, Math.round(heightCm * 4));

  let motif = '';
  const mode = variant % 5;
  if (mode === 0) {
    // Architectural horizon & monolith
    motif = `
      <rect x="${w * 0.12}" y="${h * 0.15}" width="${w * 0.76}" height="${h * 0.7}" fill="${p.mid}" opacity="0.35"/>
      <line x1="0" y1="${h * 0.62}" x2="${w}" y2="${h * 0.62}" stroke="${p.fg}" stroke-width="2" opacity="0.6"/>
      <rect x="${w * 0.34}" y="${h * 0.26}" width="${w * 0.32}" height="${h * 0.36}" fill="${p.fg}" opacity="0.82"/>
      <circle cx="${w * 0.68}" cy="${h * 0.24}" r="${Math.min(w, h) * 0.06}" fill="${p.acc}" opacity="0.7"/>
    `;
  } else if (mode === 1) {
    // Chiaroscuro window shadow study
    motif = `
      <polygon points="0,${h} ${w * 0.75},${h * 0.18} ${w},${h * 0.18} ${w},${h}" fill="${p.mid}" opacity="0.45"/>
      <rect x="${w * 0.22}" y="${h * 0.22}" width="${w * 0.56}" height="${h * 0.56}" fill="none" stroke="${p.fg}" stroke-width="2.5" opacity="0.75"/>
      <line x1="${w * 0.5}" y1="${h * 0.22}" x2="${w * 0.5}" y2="${h * 0.78}" stroke="${p.fg}" stroke-width="1.5" opacity="0.5"/>
      <line x1="${w * 0.22}" y1="${h * 0.5}" x2="${w * 0.78}" y2="${h * 0.5}" stroke="${p.fg}" stroke-width="1.5" opacity="0.5"/>
    `;
  } else if (mode === 2) {
    // Organic botanical / portrait silhouette study
    motif = `
      <ellipse cx="${w * 0.5}" cy="${h * 0.46}" rx="${w * 0.28}" ry="${h * 0.32}" fill="${p.mid}" opacity="0.5"/>
      <path d="M ${w * 0.25} ${h * 0.82} Q ${w * 0.5} ${h * 0.45} ${w * 0.75} ${h * 0.82}" fill="${p.fg}" opacity="0.75"/>
      <circle cx="${w * 0.5}" cy="${h * 0.36}" r="${Math.min(w, h) * 0.11}" fill="${p.fg}" opacity="0.85"/>
    `;
  } else if (mode === 3) {
    // Geometric constructivist diptych
    motif = `
      <rect x="${w * 0.15}" y="${h * 0.18}" width="${w * 0.33}" height="${h * 0.64}" fill="${p.fg}" opacity="0.8"/>
      <rect x="${w * 0.52}" y="${h * 0.28}" width="${w * 0.33}" height="${h * 0.54}" fill="${p.acc}" opacity="0.6"/>
      <line x1="${w * 0.1}" y1="${h * 0.86}" x2="${w * 0.9}" y2="${h * 0.14}" stroke="${p.mid}" stroke-width="2"/>
    `;
  } else {
    // Minimalist landscape series
    motif = `
      <path d="M 0 ${h * 0.65} Q ${w * 0.35} ${h * 0.48} ${w * 0.65} ${h * 0.6} T ${w} ${h * 0.52} L ${w} ${h} L 0 ${h} Z" fill="${p.mid}" opacity="0.55"/>
      <path d="M 0 ${h * 0.76} Q ${w * 0.45} ${h * 0.64} ${w} ${h * 0.72} L ${w} ${h} L 0 ${h} Z" fill="${p.fg}" opacity="0.8"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="${p.bg}"/>
    ${motif}
    <rect x="8" y="8" width="${w - 16}" height="${h - 16}" fill="none" stroke="${p.fg}" stroke-opacity="0.15" stroke-width="1"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an architectural sketch overlay SVG representing the original floor plan drawing
 * with hand-drafted style reference lines and dimension callouts.
 */
export function createReferenceBlueprintDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 1300 950" width="1300" height="950">
    <defs>
      <pattern id="bp-grid" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#64748B" stroke-width="0.4" stroke-dasharray="2,2" opacity="0.4"/>
      </pattern>
    </defs>
    <rect x="-100" y="-100" width="1300" height="950" fill="url(#bp-grid)"/>
    <g stroke="#475569" stroke-width="2" fill="none" opacity="0.75" stroke-dasharray="6,4">
      <!-- Reference sketch perimeter matching Spaguetty House layout -->
      <path d="M 0,260 L 0,0 L 180,0 L 530,0 L 530,140 L 1080,140 L 1080,542 L 790,542 L 790,397 L 650,397 L 650,542 L 227,542 L 227,367 L 0,367 Z"/>
    </g>
    <g font-family="monospace" font-size="16" fill="#475569" opacity="0.85">
      <text x="20" y="-18">ENTRADA JHON EDWIN (1.80m · H:2.60m)</text>
      <text x="245" y="-18">PASILLO CATalina (3.50m + 1.40m retorno · 12 fotos)</text>
      <text x="680" y="122">SECTOR CARLOS (5.50m aprox · 5 fotos 50x70 sep 10cm)</text>
      <text x="1095" y="340" transform="rotate(90 1095,340)">CLARA (4.02m / cota 2.90m?)</text>
      <text x="640" y="382">VILLAMAGA (1.40m + 1.55m)</text>
      <text x="310" y="575">ANDREA (1.59m + Columna [?] + 2.19m)</text>
      <text x="25" y="352">TEXTO CURATORIAL (1.75m descripción / 1.55m dibujo)</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const initialZones: Zone[] = [
  {
    id: 'zone-jhon-edwin',
    name: 'jhon edwin Vasquez',
    participant: 'jhon edwin Vasquez',
    roleOrNote: 'Muro 1.80 m · Altura 2.60 m · 1 FOTO (1.00 × 1.50m) + Texto',
    color: '#2563EB',
    expanded: true,
    visible: true,
    locked: false,
    labelX: 2.1,
    labelY: 7.7,
    labelFontSize: 14,
    labelColor: '#171717',
  },
  {
    id: 'zone-pasillo-cata',
    name: 'Pasillo Cata (Pergamino)',
    participant: 'Catalina',
    roleOrNote: 'Muro 3.50 m + Retorno 1.40 m · 12 Fotografías sobre Papel Pergamino',
    color: '#0D9488',
    expanded: true,
    visible: true,
    locked: false,
    labelX: 1.75,
    labelY: 4.15,
    labelFontSize: 12,
    labelColor: '#171717',
  },
  {
    id: 'zone-jhon-villarraga',
    name: 'Jhon Villarraga',
    participant: 'Jhon Villarraga',
    roleOrNote: 'Muro vertical 1.40 m + Paso 1.55 m · 3 Fotos (45×30) + 6 Fotos (20×30)',
    color: '#059669',
    expanded: true,
    visible: true,
    locked: false,
    labelX: 5.25,
    labelY: 1.7,
    labelFontSize: 12,
    labelRotation: 270,
    labelColor: '#171717',
  },
  {
    id: 'zone-carlos',
    name: 'Carlos',
    participant: 'Carlos',
    roleOrNote: 'Muro 5.50 m aprox · 5 Fotos 50×70 cm (Distancia: 10 cm)',
    color: '#D97706',
    expanded: true,
    visible: true,
    locked: false,
    labelX: 7.6,
    labelY: 1.32,
    labelFontSize: 14,
    labelColor: '#171717',
  },
  {
    id: 'zone-andrea',
    name: 'Andrea',
    participant: 'Andrea',
    roleOrNote: 'Tramo 1.59 m + Hornacina + Tramo 2.19 m + Lateral 2.90 m · 5 Fotos + Texto (Opción Portarretratos)',
    color: '#3B82F6',
    expanded: true,
    visible: true,
    locked: false,
    labelX: 12.65,
    labelY: 2.45,
    labelFontSize: 14,
    labelColor: '#171717',
  },
  {
    id: 'zone-clarena',
    name: 'Clarena',
    participant: 'Clarena',
    roleOrNote: 'Muro 4.02 m · 5 Fotos (1.00m × 70cm) + Longitud Total',
    color: '#DB2777',
    expanded: true,
    visible: true,
    locked: false,
    labelX: 12.5,
    labelY: 6.85,
    labelFontSize: 14,
    labelColor: '#171717',
  },
];

/**
 * Connected vertex graph for Spaguetty House matching the architectural sketch layout.
 * Real scale coordinates in meters.
 */
const initialVertices: Vertex[] = [
  // Pasillo Cata & Return & Villarraga Step
  { id: 'v-pasillo-start', x: 0.0, y: 3.8, label: 'Inicio Pasillo Cata' },
  { id: 'v-pasillo-end', x: 3.5, y: 3.8, label: 'Esquina Pasillo Cata (3.50m)' },
  { id: 'v-retorno-end', x: 3.5, y: 2.4, label: 'Fin Retorno (1.40m)' },
  { id: 'v-step-end', x: 5.05, y: 2.4, label: 'Fin Paso Villarraga (1.55m)' },

  // Carlos & Andrea Top Line (y = 1.00 m)
  { id: 'v-carlos-start', x: 5.05, y: 1.0, label: 'Inicio Muro Carlos (5.05, 1.00)' },
  { id: 'v-carlos-end', x: 10.55, y: 1.0, label: 'Esquina Carlos / Divisorio (10.55, 1.00)' },
  { id: 'v-andrea-t1-end', x: 12.14, y: 1.0, label: 'Fin Tramo 1 Andrea (1.59m)' },
  { id: 'v-andrea-niche-1', x: 12.14, y: 1.6, label: 'Hornacina Andrea Fondo Izq' },
  { id: 'v-andrea-niche-2', x: 12.59, y: 1.6, label: 'Hornacina Andrea Fondo Der' },
  { id: 'v-andrea-t2-start', x: 12.59, y: 1.0, label: 'Inicio Tramo 2 Andrea' },
  { id: 'v-andrea-corner', x: 14.78, y: 1.0, label: 'Esquina Noreste Andrea (14.78, 1.00)' },
  { id: 'v-andrea-right-end', x: 14.78, y: 3.9, label: 'Fin Muro Lateral Andrea (2.90m)' },

  // Central Dividing Wall (Carlos/Andrea/Pasillo access)
  { id: 'v-div-top-end', x: 10.55, y: 3.4, label: 'Vano Divisorio Sup' },
  { id: 'v-div-bot-start', x: 10.55, y: 4.8, label: 'Vano Divisorio Inf' },
  { id: 'v-div-bot-end', x: 10.55, y: 7.4, label: 'Unión Divisorio / Clarena' },

  // Clarena Room & Enclosure
  { id: 'v-clarena-div-end', x: 14.57, y: 7.4, label: 'Fin Muro Clarena (4.02m)' },
  { id: 'v-clarena-right-start', x: 14.78, y: 4.7, label: 'Inicio Lateral Clarena' },
  { id: 'v-clarena-right-bottom', x: 14.78, y: 9.6, label: 'Esquina Sureste Clarena (14.78, 9.60)' },

  // Jhon Edwin & Left/Bottom Enclosure
  { id: 'v-jhon-corridor-start', x: 0.0, y: 6.4, label: 'Inicio Muro 1.80m Jhon' },
  { id: 'v-jhon-corridor-end', x: 1.8, y: 6.4, label: 'Fin Muro 1.80m Jhon' },
  { id: 'v-jhon-left-stub1', x: 0.0, y: 7.2, label: 'Acceso Izq Stub 1' },
  { id: 'v-jhon-left-stub2', x: 0.0, y: 8.4, label: 'Acceso Izq Stub 2' },
  { id: 'v-bottom-left', x: 0.0, y: 9.6, label: 'Esquina Suroeste (0.00, 9.60)' },
  { id: 'v-bottom-mid', x: 4.25, y: 9.6, label: 'Unión Central Inferior (4.25, 9.60)' },
  { id: 'v-mid-vert-top', x: 4.25, y: 7.4, label: 'Quiebre Muro Central (4.25, 7.40)' },
];

const initialWalls: Wall[] = [
  // 1. Pasillo Cata (Pergamino)
  {
    id: 'wall-pasillo-main',
    zoneId: 'zone-pasillo-cata',
    name: 'Muro 3.50 m – Pasillo Cata',
    participant: 'Catalina',
    startVertexId: 'v-pasillo-start',
    endVertexId: 'v-pasillo-end',
    lengthM: 3.5,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#EFECE4',
    material: 'parchment',
    visible: true,
    locked: false,
    orientation: 'horizontal',
    normalSide: 'bottom',
    defaultSpacingCm: 12,
    dimensionLabel: '3.50 m',
    dimOffset: 22,
    notes: '12 Fotografías (20×30 / 30×45) Montaje libre sobre Papel Pergamino.',
  },
  {
    id: 'wall-pasillo-return',
    zoneId: 'zone-pasillo-cata',
    name: 'Retorno 1.40 m – Pasillo Cata',
    participant: 'Catalina',
    startVertexId: 'v-pasillo-end',
    endVertexId: 'v-retorno-end',
    lengthM: 1.4,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#EFECE4',
    material: 'parchment',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'right',
    defaultSpacingCm: 10,
    dimensionLabel: '1.40 m',
    dimOffset: 20,
    notes: 'Retorno vertical de 1.40 m hacia el sector de Jhon Villarraga.',
  },

  // 2. Jhon Villarraga
  {
    id: 'wall-villarraga-step',
    zoneId: 'zone-jhon-villarraga',
    name: 'Paso Horizontal 1.55 m – Jhon Villarraga',
    participant: 'Jhon Villarraga',
    startVertexId: 'v-retorno-end',
    endVertexId: 'v-step-end',
    lengthM: 1.55,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#F4F4F5',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'horizontal',
    normalSide: 'bottom',
    defaultSpacingCm: 10,
    dimensionLabel: '1.55 m',
    dimOffset: 20,
    notes: '3 Fotos (45×30) + 6 Fotos (20×30).',
  },
  {
    id: 'wall-villarraga-main',
    zoneId: 'zone-jhon-villarraga',
    name: 'Muro Vertical Jhon Villarraga',
    participant: 'Jhon Villarraga',
    startVertexId: 'v-step-end',
    endVertexId: 'v-carlos-start',
    lengthM: 1.4,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#F4F4F5',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'right',
    defaultSpacingCm: 10,
    dimOffset: -20,
    notes: 'Muro vertical rotulado Jhon Villarraga.',
  },

  // 3. Carlos
  {
    id: 'wall-carlos-main',
    zoneId: 'zone-carlos',
    name: 'Muro 5.50 m aprox – Carlos',
    participant: 'Carlos',
    startVertexId: 'v-carlos-start',
    endVertexId: 'v-carlos-end',
    lengthM: 5.5,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 18,
    color: '#F8FAFC',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'horizontal',
    normalSide: 'bottom',
    defaultSpacingCm: 10,
    dimensionLabel: '5.50 m aprox',
    dimOffset: 24,
    notes: '5 Fotos 50×70 cm con separación de 10 cm.',
  },

  // 4. Andrea
  {
    id: 'wall-andrea-t1',
    zoneId: 'zone-andrea',
    name: 'Tramo 1 (1.59 m) – Andrea',
    participant: 'Andrea',
    startVertexId: 'v-carlos-end',
    endVertexId: 'v-andrea-t1-end',
    lengthM: 1.59,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#FAF8F5',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'horizontal',
    normalSide: 'bottom',
    defaultSpacingCm: 12,
    dimensionLabel: '1.59 m',
    dimOffset: 24,
    notes: 'Primer tramo de Andrea previo a hornacina.',
  },
  {
    id: 'wall-andrea-niche-down',
    zoneId: 'zone-andrea',
    name: 'Resalte Izquierdo Hornacina',
    participant: 'Andrea',
    startVertexId: 'v-andrea-t1-end',
    endVertexId: 'v-andrea-niche-1',
    lengthM: 0.6,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#FAF8F5',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'left',
    defaultSpacingCm: 10,
  },
  {
    id: 'wall-andrea-niche-bot',
    zoneId: 'zone-andrea',
    name: 'Fondo Hornacina (0.45 m)',
    participant: 'Andrea',
    startVertexId: 'v-andrea-niche-1',
    endVertexId: 'v-andrea-niche-2',
    lengthM: 0.45,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#FAF8F5',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'horizontal',
    normalSide: 'bottom',
    defaultSpacingCm: 10,
    notes: 'Hornacina para texto / portarretrato.',
  },
  {
    id: 'wall-andrea-niche-up',
    zoneId: 'zone-andrea',
    name: 'Resalte Derecho Hornacina',
    participant: 'Andrea',
    startVertexId: 'v-andrea-niche-2',
    endVertexId: 'v-andrea-t2-start',
    lengthM: 0.6,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#FAF8F5',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'right',
    defaultSpacingCm: 10,
  },
  {
    id: 'wall-andrea-t2',
    zoneId: 'zone-andrea',
    name: 'Tramo 2 (2.19 m) – Andrea',
    participant: 'Andrea',
    startVertexId: 'v-andrea-t2-start',
    endVertexId: 'v-andrea-corner',
    lengthM: 2.19,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#FAF8F5',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'horizontal',
    normalSide: 'bottom',
    defaultSpacingCm: 12,
    dimensionLabel: '2.19 m',
    dimOffset: 24,
    notes: 'Segundo tramo de Andrea hacia esquina derecha.',
  },
  {
    id: 'wall-andrea-right',
    zoneId: 'zone-andrea',
    name: 'Muro Lateral 2.90 m – Andrea',
    participant: 'Andrea',
    startVertexId: 'v-andrea-corner',
    endVertexId: 'v-andrea-right-end',
    lengthM: 2.9,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#FAF8F5',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'left',
    defaultSpacingCm: 12,
    dimensionLabel: '2.90 m',
    dimOffset: -24,
    notes: 'Muro lateral derecho de Andrea de 2.90 m.',
  },

  // 5. Divisores interiores Carlos / Andrea / Pasillo
  {
    id: 'wall-divider-top',
    zoneId: 'zone-carlos',
    name: 'Muro Divisorio Superior (2.40 m)',
    participant: 'Carlos',
    startVertexId: 'v-carlos-end',
    endVertexId: 'v-div-top-end',
    lengthM: 2.4,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#F8FAFC',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'left',
    defaultSpacingCm: 15,
    secondaryZoneId: 'zone-andrea',
    secondaryParticipant: 'Andrea',
  },
  {
    id: 'wall-divider-bot',
    zoneId: 'zone-clarena',
    name: 'Muro Divisorio Inferior (2.60 m)',
    participant: 'Clarena',
    startVertexId: 'v-div-bot-start',
    endVertexId: 'v-div-bot-end',
    lengthM: 2.6,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#F5F5F4',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'right',
    defaultSpacingCm: 15,
  },

  // 6. Clarena
  {
    id: 'wall-clarena-div',
    zoneId: 'zone-clarena',
    name: 'Muro 4.02 m – Clarena',
    participant: 'Clarena',
    startVertexId: 'v-div-bot-end',
    endVertexId: 'v-clarena-div-end',
    lengthM: 4.02,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 18,
    color: '#F5F5F4',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'horizontal',
    normalSide: 'bottom',
    defaultSpacingCm: 15,
    dimensionLabel: '4.02 m',
    dimOffset: 22,
    notes: '5 Fotos (1.00m × 70cm).',
  },
  {
    id: 'wall-clarena-right',
    zoneId: 'zone-clarena',
    name: 'Muro Lateral Clarena (4.90 m)',
    participant: 'Clarena',
    startVertexId: 'v-clarena-right-start',
    endVertexId: 'v-clarena-right-bottom',
    lengthM: 4.9,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#F5F5F4',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'left',
    defaultSpacingCm: 15,
  },

  // 7. Jhon Edwin Vasquez & Acceso Izquierdo
  {
    id: 'wall-entrance-span',
    zoneId: 'zone-jhon-edwin',
    name: 'Vano Acceso 2.60 m',
    participant: 'jhon edwin Vasquez',
    startVertexId: 'v-pasillo-start',
    endVertexId: 'v-jhon-corridor-start',
    lengthM: 2.6,
    heightM: 2.6,
    heightConfirmed: true,
    thicknessCm: 0, // Cota virtual y vano de acceso
    color: '#F5F5F4',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'right',
    defaultSpacingCm: 15,
    dimensionLabel: 'Vano 2.60 m',
    dimOffset: -22,
  },
  {
    id: 'wall-jhon-corridor',
    zoneId: 'zone-jhon-edwin',
    name: 'Muro 1.80 m – Jhon Edwin',
    participant: 'jhon edwin Vasquez',
    startVertexId: 'v-jhon-corridor-start',
    endVertexId: 'v-jhon-corridor-end',
    lengthM: 1.8,
    heightM: 2.6,
    heightConfirmed: true,
    thicknessCm: 15,
    color: '#F5F5F4',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'horizontal',
    normalSide: 'bottom',
    defaultSpacingCm: 15,
    dimensionLabel: '1.80 m',
    dimOffset: 22,
    notes: '1 FOTO (1.00 × 1.50m) + Texto.',
  },
  {
    id: 'wall-jhon-stub1',
    zoneId: 'zone-jhon-edwin',
    name: 'Muro Acceso Izquierdo (0.80 m)',
    participant: 'jhon edwin Vasquez',
    startVertexId: 'v-jhon-corridor-start',
    endVertexId: 'v-jhon-left-stub1',
    lengthM: 0.8,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#F5F5F4',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'right',
    defaultSpacingCm: 15,
  },
  {
    id: 'wall-jhon-stub2',
    zoneId: 'zone-jhon-edwin',
    name: 'Muro Inferior Izquierdo (1.20 m)',
    participant: 'jhon edwin Vasquez',
    startVertexId: 'v-jhon-left-stub2',
    endVertexId: 'v-bottom-left',
    lengthM: 1.2,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 15,
    color: '#F5F5F4',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'right',
    defaultSpacingCm: 15,
  },
  {
    id: 'wall-bottom-left',
    zoneId: 'zone-jhon-edwin',
    name: 'Muro Inferior Jhon Edwin (4.25 m)',
    participant: 'jhon edwin Vasquez',
    startVertexId: 'v-bottom-left',
    endVertexId: 'v-bottom-mid',
    lengthM: 4.25,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 18,
    color: '#F5F5F4',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'horizontal',
    normalSide: 'top',
    defaultSpacingCm: 15,
  },
  {
    id: 'wall-mid-vertical',
    zoneId: 'zone-jhon-edwin',
    name: 'Muro Vertical Derecho (2.20 m) – Jhon Edwin',
    participant: 'jhon edwin Vasquez',
    startVertexId: 'v-mid-vert-top',
    endVertexId: 'v-bottom-mid',
    lengthM: 2.2,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 18,
    color: '#F5F5F4',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'vertical',
    normalSide: 'left',
    defaultSpacingCm: 15,
    dimOffset: -20,
  },

  // 8. Cierre Inferior & Longitud Total
  {
    id: 'wall-bottom-total',
    zoneId: 'zone-clarena',
    name: 'Muro Inferior – Longitud Total (10.53 m)',
    participant: 'Clarena',
    startVertexId: 'v-bottom-mid',
    endVertexId: 'v-clarena-right-bottom',
    lengthM: 10.53,
    heightM: 2.6,
    heightConfirmed: false,
    thicknessCm: 18,
    color: '#F5F5F4',
    material: 'white',
    visible: true,
    locked: false,
    orientation: 'horizontal',
    normalSide: 'top',
    defaultSpacingCm: 15,
    dimensionLabel: 'Longitud Total',
    dimOffset: 24,
    notes: 'Cota de Longitud Total indicada en el borde inferior del croquis.',
  },
];

function buildInitialItems(): WallItem[] {
  const items: WallItem[] = [];

  // 1. jhon edwin Vasquez: 1 FOTO (1.00 × 1.50m) + Texto
  items.push(
    {
      id: 'item-jhon-photo-1',
      wallId: 'wall-jhon-corridor',
      zoneId: 'zone-jhon-edwin',
      name: '1 FOTO (1.00 × 1.50m)',
      code: 'JE-01',
      type: 'photo',
      widthCm: 100,
      heightCm: 150,
      xCm: 25,
      yCm: 65,
      rotation: 0,
      frameStyle: 'black',
      matWidthCm: 4,
      description: 'Fotografía principal de 1.00 × 1.50 m en el acceso de Spaguetty House.',
      imageUrl: createArtworkSvgDataUrl('Umbral I', 'jhon edwin Vasquez', 0, 100, 150),
      locked: false,
      visible: true,
      aspectRatioLocked: true,
    },
    {
      id: 'item-jhon-text-1',
      wallId: 'wall-jhon-corridor',
      zoneId: 'zone-jhon-edwin',
      name: 'Texto',
      code: 'JE-TXT',
      type: 'text',
      widthCm: 28,
      heightCm: 45,
      xCm: 135,
      yCm: 120,
      rotation: 0,
      frameStyle: 'none',
      matWidthCm: 0,
      description: 'Texto de sala introductorio de jhon edwin Vasquez.',
      textContent: 'UMBRAL Y MEMORIA\njhon edwin Vasquez\n\nFotografía inaugural (1.00 × 1.50 m).',
      locked: false,
      visible: true,
      aspectRatioLocked: false,
    }
  );

  // 2. Pasillo Cata (Pergamino): 12 Fotografías (20×30 / 30×45) Montaje libre sobre Papel Pergamino
  // 9 en Muro Principal (3.50m) y 3 en Retorno (1.40m)
  const cataMainSpecs = [
    { w: 30, h: 45, x: 20, y: 140 },
    { w: 20, h: 30, x: 58, y: 110 },
    { w: 20, h: 30, x: 86, y: 160 },
    { w: 30, h: 45, x: 116, y: 122 },
    { w: 20, h: 30, x: 158, y: 152 },
    { w: 30, h: 45, x: 190, y: 116 },
    { w: 20, h: 30, x: 232, y: 145 },
    { w: 20, h: 30, x: 262, y: 110 },
    { w: 30, h: 45, x: 295, y: 136 },
  ];
  cataMainSpecs.forEach((spec, idx) => {
    items.push({
      id: `item-cata-${idx + 1}`,
      wallId: 'wall-pasillo-main',
      zoneId: 'zone-pasillo-cata',
      name: `Pergamino #${idx + 1}`,
      code: `CAT-${String(idx + 1).padStart(2, '0')}`,
      type: 'photo',
      widthCm: spec.w,
      heightCm: spec.h,
      xCm: spec.x,
      yCm: spec.y,
      rotation: 0,
      frameStyle: 'parchment',
      matWidthCm: 1,
      description: `Montaje libre sobre Papel Pergamino (${spec.w}×${spec.h} cm).`,
      imageUrl: createArtworkSvgDataUrl(`Pergamino ${idx + 1}`, 'Catalina', idx + 1, spec.w, spec.h),
      locked: false,
      visible: true,
      aspectRatioLocked: true,
    });
  });

  const cataReturnSpecs = [
    { w: 20, h: 30, x: 18, y: 140 },
    { w: 30, h: 45, x: 48, y: 122 },
    { w: 20, h: 30, x: 92, y: 146 },
  ];
  cataReturnSpecs.forEach((spec, idx) => {
    const num = idx + 10;
    items.push({
      id: `item-cata-${num}`,
      wallId: 'wall-pasillo-return',
      zoneId: 'zone-pasillo-cata',
      name: `Pergamino #${num}`,
      code: `CAT-${num}`,
      type: 'photo',
      widthCm: spec.w,
      heightCm: spec.h,
      xCm: spec.x,
      yCm: spec.y,
      rotation: 0,
      frameStyle: 'parchment',
      matWidthCm: 1,
      description: `Retorno sobre papel pergamino (${spec.w}×${spec.h} cm).`,
      imageUrl: createArtworkSvgDataUrl(`Pergamino ${num}`, 'Catalina', num, spec.w, spec.h),
      locked: false,
      visible: true,
      aspectRatioLocked: true,
    });
  });

  // 3. Jhon Villarraga: 3 Fotos (45×30) + 6 Fotos (20×30)
  for (let i = 0; i < 3; i++) {
    items.push({
      id: `item-villarraga-45x30-${i + 1}`,
      wallId: 'wall-villarraga-step',
      zoneId: 'zone-jhon-villarraga',
      name: `Villarraga Foto 45×30 #${i + 1}`,
      code: `VIL-A${i + 1}`,
      type: 'photo',
      widthCm: 45,
      heightCm: 30,
      xCm: 6 + i * (45 + 5),
      yCm: 135,
      rotation: 0,
      frameStyle: 'black',
      matWidthCm: 2,
      description: 'Formato 45 × 30 cm sobre paso horizontal de 1.55 m.',
      imageUrl: createArtworkSvgDataUrl(`Villarraga Serie A ${i + 1}`, 'Jhon Villarraga', i + 2, 45, 30),
      locked: false,
      visible: true,
      aspectRatioLocked: true,
    });
  }

  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    items.push({
      id: `item-villarraga-20x30-${i + 1}`,
      wallId: 'wall-villarraga-main',
      zoneId: 'zone-jhon-villarraga',
      name: `Villarraga Foto 20×30 #${i + 1}`,
      code: `VIL-B${i + 1}`,
      type: 'photo',
      widthCm: 20,
      heightCm: 30,
      xCm: 28 + col * (20 + 8),
      yCm: row === 0 ? 152 : 114,
      rotation: 0,
      frameStyle: 'black',
      matWidthCm: 1.5,
      description: 'Formato vertical 20 × 30 cm en retícula.',
      imageUrl: createArtworkSvgDataUrl(`Villarraga Serie B ${i + 1}`, 'Jhon Villarraga', i + 4, 20, 30),
      locked: false,
      visible: true,
      aspectRatioLocked: true,
    });
  }

  // 4. Carlos: 5 Fotos 50×70 cm (Distancia: 10 cm) en muro de 5.50 m
  // Total grupo = 5*50 + 4*10 = 290 cm -> margen = (550 - 290) / 2 = 130 cm
  for (let i = 0; i < 5; i++) {
    items.push({
      id: `item-carlos-${i + 1}`,
      wallId: 'wall-carlos-main',
      zoneId: 'zone-carlos',
      name: `Carlos Foto 50×70 #${i + 1}`,
      code: `CAR-0${i + 1}`,
      type: 'photo',
      widthCm: 50,
      heightCm: 70,
      xCm: 130 + i * (50 + 10),
      yCm: 115,
      rotation: 0,
      frameStyle: 'wood',
      matWidthCm: 3,
      description: 'Fotografía 50 × 70 cm con separación de 10 cm.',
      imageUrl: createArtworkSvgDataUrl(`Carlos Serie ${i + 1}`, 'Carlos', i + 1, 50, 70),
      locked: false,
      visible: true,
      aspectRatioLocked: true,
    });
  }

  // 5. Andrea: 5 Fotos + Texto (Opción Portarretratos)
  for (let i = 0; i < 2; i++) {
    items.push({
      id: `item-andrea-t1-${i + 1}`,
      wallId: 'wall-andrea-t1',
      zoneId: 'zone-andrea',
      name: `Andrea Portarretrato #${i + 1}`,
      code: `AND-0${i + 1}`,
      type: 'portrait_stand',
      widthCm: 30,
      heightCm: 40,
      xCm: 22 + i * 44,
      yCm: 125,
      rotation: 0,
      frameStyle: 'portrait_stand',
      matWidthCm: 2,
      description: 'Opción Portarretrato en Tramo 1 (1.59 m).',
      imageUrl: createArtworkSvgDataUrl(`Andrea Memoria ${i + 1}`, 'Andrea', i + 2, 30, 40),
      locked: false,
      visible: true,
      aspectRatioLocked: true,
    });
  }

  items.push({
    id: 'item-andrea-text',
    wallId: 'wall-andrea-niche-bot',
    zoneId: 'zone-andrea',
    name: 'Texto Andrea',
    code: 'AND-TXT',
    type: 'text',
    widthCm: 32,
    heightCm: 42,
    xCm: 6,
    yCm: 125,
    rotation: 0,
    frameStyle: 'none',
    matWidthCm: 0,
    description: 'Texto de acompañamiento en hornacina.',
    textContent: 'OBJETOS Y AFECTO\nAndrea\n\n5 Fotos + Texto (Opción Portarretratos).',
    locked: false,
    visible: true,
    aspectRatioLocked: false,
  });

  for (let i = 0; i < 3; i++) {
    items.push({
      id: `item-andrea-t2-${i + 1}`,
      wallId: 'wall-andrea-t2',
      zoneId: 'zone-andrea',
      name: `Andrea Portarretrato #${i + 3}`,
      code: `AND-0${i + 3}`,
      type: 'portrait_stand',
      widthCm: 35,
      heightCm: 45,
      xCm: 32 + i * 54,
      yCm: 122,
      rotation: 0,
      frameStyle: 'portrait_stand',
      matWidthCm: 2,
      description: 'Opción Portarretrato en Tramo 2 (2.19 m).',
      imageUrl: createArtworkSvgDataUrl(`Andrea Memoria ${i + 3}`, 'Andrea', i + 5, 35, 45),
      locked: false,
      visible: true,
      aspectRatioLocked: true,
    });
  }

  // 6. Clarena: 5 Fotos (1.00m × 70cm) en Muro de 4.02 m
  for (let i = 0; i < 5; i++) {
    items.push({
      id: `item-clarena-${i + 1}`,
      wallId: 'wall-clarena-div',
      zoneId: 'zone-clarena',
      name: `Clarena 1.00m × 70cm #${i + 1}`,
      code: `CLA-0${i + 1}`,
      type: 'photo',
      widthCm: 70,
      heightCm: 100,
      xCm: 15 + i * (70 + 7),
      yCm: 110,
      rotation: 0,
      frameStyle: 'black',
      matWidthCm: 2,
      description: 'Fotografía formato 1.00 m × 70 cm en muro de 4.02 m.',
      imageUrl: createArtworkSvgDataUrl(`Clarena Topografía ${i + 1}`, 'Clarena', i + 3, 70, 100),
      locked: false,
      visible: true,
      aspectRatioLocked: true,
    });
  }

  return items;
}

const initialVerifications: PendingVerification[] = [
  {
    id: 'ver-carlos-550',
    title: 'Muro Carlos: 5.50 m aprox',
    description: 'Verificar en sitio la cota aproximada de 5.50 m del muro de Carlos.',
    wallId: 'wall-carlos-main',
    parameter: 'lengthM',
    currentValue: 5.5,
    unit: 'm',
    options: [
      { label: 'Usar 5.50 m (Plano actual)', value: 5.5, description: 'Longitud de referencia indicada en el plano' },
      { label: 'Ajustar a 5.60 m', value: 5.6, description: 'Margen de tolerancia adicional' },
    ],
    resolved: false,
  },
  {
    id: 'ver-andrea-col',
    title: 'Hornacina / Columna en Sector Andrea',
    description: 'Ancho y profundidad exactos de la hornacina entre tramos de 1.59 m y 2.19 m.',
    wallId: 'wall-andrea-niche-bot',
    parameter: 'lengthM',
    currentValue: 0.45,
    unit: 'm',
    options: [
      { label: 'Hornacina 0.45 m (Estándar)', value: 0.45, description: 'Hueco interior de 45 cm' },
      { label: 'Hornacina 0.60 m (Amplia)', value: 0.6, description: 'Espacio más amplio para portarretratos' },
    ],
    resolved: false,
  },
];

const initialLibrary: LibraryImage[] = [
  {
    id: 'lib-1',
    name: '1 FOTO (1.00 × 1.50m) – jhon edwin',
    participant: 'jhon edwin Vasquez',
    dataUrl: createArtworkSvgDataUrl('Umbral I', 'jhon edwin Vasquez', 0, 100, 150),
    defaultWidthCm: 100,
    defaultHeightCm: 150,
    galleryName: 'Galería Spaguetty House',
    tags: ['jhon edwin', 'gran formato', 'monumental'],
    createdAt: '2026-11-04',
  },
  {
    id: 'lib-2',
    name: 'Pergamino – Pasillo Cata',
    participant: 'Catalina',
    dataUrl: createArtworkSvgDataUrl('Pergamino', 'Catalina', 1, 30, 45),
    defaultWidthCm: 30,
    defaultHeightCm: 45,
    galleryName: 'Galería Spaguetty House',
    tags: ['catalina', 'pergamino', 'serie'],
    createdAt: '2026-11-04',
  },
  {
    id: 'lib-3',
    name: '50×70 cm – Carlos',
    participant: 'Carlos',
    dataUrl: createArtworkSvgDataUrl('Carlos 50x70', 'Carlos', 2, 50, 70),
    defaultWidthCm: 50,
    defaultHeightCm: 70,
    galleryName: 'Galería Spaguetty House',
    tags: ['carlos', '50x70', 'fotografia'],
    createdAt: '2026-11-04',
  },
  {
    id: 'lib-4',
    name: '45×30 cm – Jhon Villarraga',
    participant: 'Jhon Villarraga',
    dataUrl: createArtworkSvgDataUrl('Villarraga 45x30', 'Jhon Villarraga', 3, 45, 30),
    defaultWidthCm: 45,
    defaultHeightCm: 30,
    galleryName: 'Galería Spaguetty House',
    tags: ['villarraga', '45x30', 'horizontal'],
    createdAt: '2026-11-04',
  },
  {
    id: 'lib-5',
    name: 'Portarretrato – Andrea',
    participant: 'Andrea',
    dataUrl: createArtworkSvgDataUrl('Andrea Memoria', 'Andrea', 4, 35, 45),
    defaultWidthCm: 35,
    defaultHeightCm: 45,
    galleryName: 'Galería Spaguetty House',
    tags: ['andrea', 'portarretrato', 'hornacina'],
    createdAt: '2026-11-04',
  },
  {
    id: 'lib-6',
    name: '1.00m × 70cm – Clarena',
    participant: 'Clarena',
    dataUrl: createArtworkSvgDataUrl('Clarena 1.00x70', 'Clarena', 5, 70, 100),
    defaultWidthCm: 70,
    defaultHeightCm: 100,
    galleryName: 'Galería Spaguetty House',
    tags: ['clarena', 'vertical', 'fotografia'],
    createdAt: '2026-11-04',
  },
];

const initialAnnotations: PlanAnnotation[] = [
  {
    id: 'ann-cata-pergamino',
    text: '12 Fotografías (20×30 / 30×45)\nMontaje libre sobre Papel Pergamino',
    xM: 1.75,
    yM: 3.2,
    fontSize: 9.5,
    color: '#6366F1',
    rotation: 0,
    locked: false,
    visible: true,
    zoneId: 'zone-pasillo-cata',
  },
  {
    id: 'ann-villarraga-fotos',
    text: '3 Fotos (45×30)\n+ 6 Fotos (20×30)',
    xM: 4.3,
    yM: 1.95,
    fontSize: 9.5,
    color: '#059669',
    rotation: 0,
    locked: false,
    visible: true,
    zoneId: 'zone-jhon-villarraga',
  },
  {
    id: 'ann-carlos-sep',
    text: '50×70 cm (Distancia: 10 cm)',
    xM: 8.0,
    yM: 1.62,
    fontSize: 9.5,
    color: '#B45309',
    rotation: 0,
    locked: false,
    visible: true,
    zoneId: 'zone-carlos',
  },
  {
    id: 'ann-andrea-fotos',
    text: '5 Fotos + Texto\n(Opción Portarretratos)',
    xM: 12.4,
    yM: 1.82,
    fontSize: 9,
    color: '#2563EB',
    rotation: 0,
    locked: false,
    visible: true,
    zoneId: 'zone-andrea',
  },
  {
    id: 'ann-clarena-fotos',
    text: '5 Fotos (1.00m × 70cm)',
    xM: 12.5,
    yM: 7.95,
    fontSize: 9.5,
    color: '#DB2777',
    rotation: 0,
    locked: false,
    visible: true,
    zoneId: 'zone-clarena',
  },
  {
    id: 'ann-jhon-foto',
    text: '1 FOTO (1.00 × 1.50m)',
    xM: 1.75,
    yM: 5.75,
    fontSize: 9,
    color: '#B45309',
    rotation: 0,
    locked: false,
    visible: true,
    zoneId: 'zone-jhon-edwin',
  },
  {
    id: 'ann-jhon-texto',
    text: 'Texto',
    xM: 1.55,
    yM: 6.95,
    fontSize: 9,
    color: '#64748B',
    rotation: 0,
    locked: false,
    visible: true,
    zoneId: 'zone-jhon-edwin',
  },
];

const builtItems = buildInitialItems();

export const INITIAL_LAYER_STATES: LayerState[] = [
  { id: 'backgroundPlan', name: 'Plano original de fondo', visible: true, locked: false, opacity: 0.25, isStructural: true, order: 1 },
  { id: 'walls', name: 'Muros y estructura', visible: true, locked: false, isStructural: true, order: 2 },
  { id: 'zoneLabels', name: 'Nombres de espacios', visible: true, locked: false, isStructural: true, order: 3 },
  { id: 'dimensions', name: 'Cotas y dimensiones', visible: true, locked: false, isStructural: true, order: 4 },
  { id: 'artworks', name: 'Fotografías y obras', visible: true, locked: false, isStructural: true, order: 5 },
  { id: 'people', name: 'Personas y ambientación', visible: true, locked: false, isStructural: true, order: 6 },
  { id: 'furniture', name: 'Mobiliario museográfico', visible: true, locked: false, isStructural: true, order: 7 },
  { id: 'texts', name: 'Textos y anotaciones', visible: true, locked: false, isStructural: true, order: 8 },
  { id: 'references', name: 'Elementos de referencia', visible: true, locked: false, isStructural: true, order: 9 },
];

export const DEFAULT_BACKGROUND_PLAN: BackgroundPlanSettings = {
  imageUrl: '/assets/aistudio/image_fcfb1bb8.png',
  visible: true,
  locked: false,
  opacity: 0.35,
  scale: 1,
  xOffsetM: 0,
  yOffsetM: 0,
  rotationDeg: 0,
  calibratedDistanceM: 5.5,
};

export const INITIAL_PROJECT: ExhibitionProject = {
  projectName: 'Spaguetty House',
  subtitle: 'Estudio Digital de Montaje Expositivo',
  version: '2.3.0',
  updatedAt: '2026-01-01T00:00:00.000Z',
  zones: initialZones,
  vertices: initialVertices,
  walls: initialWalls,
  items: builtItems,
  verifications: initialVerifications,
  library: initialLibrary,
  graphicLibrary: INITIAL_GRAPHIC_LIBRARY,
  layerStates: INITIAL_LAYER_STATES,
  referenceImageUrl: '/assets/aistudio/image_fcfb1bb8.png',
  referenceOpacity: 0.35,
  backgroundPlan: DEFAULT_BACKGROUND_PLAN,
  annotations: initialAnnotations,
  trash: [],
  snapshots: [
    {
      id: 'snap-croquis',
      name: 'Plano Fiel al Croquis Arquitectónico',
      createdAt: '2026-11-04 19:50',
      description: 'Distribución milimétrica según croquis con 6 zonas, cotas rojas exactas y notas museográficas.',
      vertices: initialVertices,
      walls: initialWalls,
      items: builtItems,
    },
  ],
};
