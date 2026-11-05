import JSZip from 'jszip';
import { GraphicResource, GraphicResourceCategory, LayerKey } from '../types/exhibition';

export interface CategoryMetadata {
  id: GraphicResourceCategory;
  name: string;
  shortName: string;
  description: string;
  defaultLayer: LayerKey;
}

export const GRAPHIC_CATEGORIES: CategoryMetadata[] = [
  {
    id: 'restaurant_tables',
    name: 'Mesas de restaurante y cafetería',
    shortName: 'Mesas restaurante',
    description: 'Mesas para 2, 4 y 6 comensales, mesas bistró redondas, barras con taburetes y booths en planta y alzado',
    defaultLayer: 'furniture',
  },
  {
    id: 'decor_squares',
    name: 'Cuadrados de decoración e islas',
    shortName: 'Cuadrados decor.',
    description: 'Módulos cuadrados con decoración interior, plantas, cerámica, iluminación y bases expositivas',
    defaultLayer: 'decor',
  },
  {
    id: 'shelves',
    name: 'Repisas y estanterías',
    shortName: 'Repisas',
    description: 'Repisas flotantes con decoración, estanterías abiertas, nichos cuadrados y repisas galería',
    defaultLayer: 'decor',
  },
  {
    id: 'decor',
    name: 'Decoración, plantas y ambientación',
    shortName: 'Decoración',
    description: 'Plantas arquitectónicas, maceteros, lámparas, jarrones, alfombras y elementos de ambientación',
    defaultLayer: 'decor',
  },
  {
    id: 'furniture',
    name: 'Mobiliario y asientos',
    shortName: 'Mobiliario',
    description: 'Bancas de sala, sillones lounge, mesas de centro, postes separadores y mostradores',
    defaultLayer: 'furniture',
  },
  {
    id: 'vitrines',
    name: 'Vitrinas y expositores',
    shortName: 'Vitrinas',
    description: 'Vitrinas murales, exentas y mesas vitrina con campana acrílica/cristal',
    defaultLayer: 'objects',
  },
  {
    id: 'pedestals',
    name: 'Pedestales y bases',
    shortName: 'Pedestales',
    description: 'Peanas, plintos prismáticos y soportes para obra tridimensional',
    defaultLayer: 'objects',
  },
  {
    id: 'sculptures',
    name: 'Esculturas y objetos',
    shortName: 'Esculturas',
    description: 'Bustos, cerámica arqueológica recortada, piezas pétreas y relieves',
    defaultLayer: 'objects',
  },
  {
    id: 'people_standing',
    name: 'Personas y siluetas humanas',
    shortName: 'Personas de pie',
    description: 'Figuras humanas erguidas y en contemplación para referencia de escala arquitectónica',
    defaultLayer: 'people',
  },
  {
    id: 'people_seated',
    name: 'Personas sentadas y observando',
    shortName: 'Personas sentadas',
    description: 'Visitantes en bancas y descansos observando piezas expositivas',
    defaultLayer: 'people',
  },
  {
    id: 'people_wheelchair',
    name: 'Personas en silla de ruedas',
    shortName: 'Accesibilidad',
    description: 'Escalas humanas para verificación de alturas museográficas accesibles',
    defaultLayer: 'people',
  },
  {
    id: 'artworks',
    name: 'Fotografías y pinturas',
    shortName: 'Obras',
    description: 'Impresiones fotográficas fine-art, lienzos y piezas bidimensionales',
    defaultLayer: 'artworks',
  },
  {
    id: 'frames',
    name: 'Marcos y portarretratos',
    shortName: 'Marcos',
    description: 'Caja americana, marcos de madera, perfiles de aluminio y peanas traseras',
    defaultLayer: 'artworks',
  },
  {
    id: 'signage',
    name: 'Paneles informativos y señalética',
    shortName: 'Señalética',
    description: 'Textos de sala, vinilos de corte, cartelas técnicas y placas explicativas',
    defaultLayer: 'texts',
  },
  {
    id: 'architecture',
    name: 'Elementos arquitectónicos',
    shortName: 'Arquitectura',
    description: 'Rieles de iluminación con focos dirigidos, columnas, rodapiés y vigas',
    defaultLayer: 'architecture',
  },
];

export function mapCategoryToLayer(category: GraphicResourceCategory): LayerKey {
  const match = GRAPHIC_CATEGORIES.find((c) => c.id === category);
  return match ? match.defaultLayer : 'objects';
}

function svgToDataUrl(svgString: string): string {
  const cleaned = svgString.trim().replace(/\s+/g, ' ');
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
}

// -------------------------------------------------------------
// BUILT-IN PROFESSIONAL ARCHITECTURAL ELEVATION GRAPHICS
// -------------------------------------------------------------

// 1. Adult standing observing artwork (1.70m, front-3/4 profile)
const svgPersonStanding1 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 340" width="100" height="340">
  <g fill="currentColor" opacity="0.92">
    <!-- Head tilted slightly up towards wall -->
    <path d="M 52,14 C 43,14 36,22 36,32 C 36,41 42,48 50,50 C 50,56 46,62 38,68 C 28,76 25,92 25,110 L 25,175 C 25,182 29,188 36,190 L 36,255 L 34,330 C 34,336 38,340 44,340 C 50,340 52,336 52,330 L 53,260 L 57,260 L 59,330 C 59,336 63,340 69,340 C 75,340 78,336 78,330 L 76,255 L 76,190 C 82,187 86,180 86,172 L 86,110 C 86,92 82,76 72,68 C 65,62 61,56 61,50 C 67,47 71,41 71,32 C 71,22 62,14 52,14 Z"/>
    <!-- Folded coat / arm detail linework -->
    <path d="M 38,105 L 48,160 L 62,158 L 74,105" fill="none" stroke="#FAF8F5" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>`);

// 2. Observer with exhibition booklet / gallery guide (1.68m)
const svgPersonObserverBooklet = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 336" width="100" height="336">
  <g fill="currentColor" opacity="0.88">
    <ellipse cx="48" cy="28" rx="13" ry="16"/>
    <!-- Body profile looking at artwork -->
    <path d="M 46,47 C 36,52 30,66 30,86 L 28,170 C 28,178 33,184 40,186 L 41,250 L 38,326 C 38,332 42,336 48,336 C 54,336 56,332 56,326 L 57,250 L 62,250 L 64,326 C 64,332 68,336 74,336 C 80,336 83,332 83,326 L 80,250 L 78,186 C 84,183 88,176 88,168 L 86,86 C 86,66 78,52 68,47 Z"/>
    <!-- Exhibition booklet held in hand -->
    <polygon points="68,135 88,125 94,152 74,162" fill="#FAF8F5" stroke="currentColor" stroke-width="2"/>
    <line x1="78" y1="138" x2="88" y2="152" stroke="currentColor" stroke-width="1.5"/>
  </g>
</svg>`);

// 3. Couple dialoguing in gallery (1.75m wide composition)
const svgCoupleStanding = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 350" width="160" height="350">
  <g fill="currentColor" opacity="0.85">
    <!-- Person A -->
    <circle cx="48" cy="30" r="14"/>
    <path d="M 32,54 C 24,62 20,78 20,98 L 22,185 C 22,192 27,198 34,200 L 33,260 L 30,340 C 30,346 34,350 40,350 C 46,350 48,346 48,340 L 49,265 L 53,265 L 55,340 C 55,346 59,350 65,350 C 71,350 74,346 74,340 L 72,260 L 71,200 C 77,196 80,190 80,182 L 78,98 C 78,78 72,62 62,54 Z"/>
    <!-- Person B -->
    <circle cx="112" cy="38" r="13"/>
    <path d="M 98,62 C 90,70 87,84 87,102 L 89,182 C 89,189 94,194 100,196 L 98,255 L 95,340 C 95,346 99,350 105,350 C 111,350 113,346 113,340 L 114,260 L 119,260 L 121,340 C 121,346 125,350 131,350 C 137,350 140,346 140,340 L 138,255 L 136,196 C 142,193 145,187 145,180 L 143,102 C 143,84 137,70 128,62 Z"/>
  </g>
</svg>`);

// 4. Person seated on a museum bench observing (1.25m seated height)
const svgPersonSeated = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 250" width="130" height="250">
  <g fill="currentColor" opacity="0.88">
    <circle cx="45" cy="30" r="14"/>
    <!-- Torso leaning slightly forward -->
    <path d="M 32,54 C 24,64 22,82 22,106 L 24,152 C 24,158 28,164 34,166 L 34,175 L 85,175 C 92,175 96,170 96,164 L 96,155 L 68,155 L 66,106 C 66,82 62,64 54,54 Z"/>
    <!-- Legs from seat (height ~45cm = 90px from floor) -->
    <path d="M 85,175 L 85,242 C 85,247 88,250 93,250 C 98,250 101,247 101,242 L 101,175 Z"/>
    <path d="M 95,175 L 98,242 C 98,247 102,250 107,250 C 112,250 115,247 115,242 L 112,175 Z"/>
  </g>
</svg>`);

// 5. Visitor in wheelchair (1.25m height, 1.10m depth)
const svgWheelchairVisitor = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 250" width="170" height="250">
  <g fill="currentColor" opacity="0.88">
    <!-- Person Head -->
    <circle cx="82" cy="32" r="14"/>
    <!-- Torso -->
    <path d="M 70,54 C 62,64 60,80 60,105 L 62,154 L 112,154 C 118,154 122,150 122,144 L 122,136 L 98,136 L 96,105 C 96,80 92,64 86,54 Z"/>
    <!-- Lower leg to footrest -->
    <path d="M 112,154 L 118,212 L 138,212 L 138,218 L 112,218 C 108,218 106,215 105,210 L 100,154 Z"/>
    <!-- Wheelchair Frame & Wheels (Technical linework) -->
    <circle cx="70" cy="188" r="46" fill="none" stroke="currentColor" stroke-width="4"/>
    <circle cx="70" cy="188" r="38" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="70" cy="188" r="8" fill="currentColor"/>
    <!-- Spokes -->
    <line x1="70" y1="142" x2="70" y2="234" stroke="currentColor" stroke-width="1.5"/>
    <line x1="24" y1="188" x2="116" y2="188" stroke="currentColor" stroke-width="1.5"/>
    <line x1="38" y1="156" x2="102" y2="220" stroke="currentColor" stroke-width="1.5"/>
    <line x1="38" y1="220" x2="102" y2="156" stroke="currentColor" stroke-width="1.5"/>
    <!-- Front Caster Wheel -->
    <circle cx="132" cy="226" r="12" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle cx="132" cy="226" r="4" fill="currentColor"/>
    <!-- Backrest & Push Handle -->
    <path d="M 45,86 L 56,155 L 70,188 M 45,86 L 36,86" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`);

// 6. Wall Glass Vitrine with stainless steel frame (120x60x30 cm)
const svgWallVitrine = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120" width="240" height="120">
  <!-- Outer Technical Box -->
  <rect x="4" y="4" width="232" height="112" fill="#FAF8F5" stroke="#171717" stroke-width="2"/>
  <!-- Interior Glass Area with subtle cyan tint & specular glare -->
  <rect x="10" y="10" width="220" height="100" fill="#E8F4F8" fill-opacity="0.3" stroke="#2563EB" stroke-opacity="0.3" stroke-width="1"/>
  <!-- Specular Reflection Lines -->
  <line x1="24" y1="104" x2="90" y2="14" stroke="#FFFFFF" stroke-width="3" stroke-opacity="0.6"/>
  <line x1="42" y1="104" x2="108" y2="14" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.6"/>
  <!-- Glass Shelf -->
  <line x1="10" y1="64" x2="230" y2="64" stroke="#0284C7" stroke-width="2" stroke-opacity="0.5"/>
  <!-- Micro-spotlights on top rail -->
  <circle cx="40" cy="14" r="3" fill="#171717"/>
  <circle cx="120" cy="14" r="3" fill="#171717"/>
  <circle cx="200" cy="14" r="3" fill="#171717"/>
  <path d="M 36,17 L 25,48 M 44,17 L 55,48" stroke="#F59E0B" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.4"/>
  <path d="M 116,17 L 105,48 M 124,17 L 135,48" stroke="#F59E0B" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.4"/>
  <path d="M 196,17 L 185,48 M 204,17 L 215,48" stroke="#F59E0B" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.4"/>
</svg>`);

// 7. Freestanding Glass Vitrine on Dark Plinth (80x160 cm)
const svgFreestandingVitrine = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 320" width="160" height="320">
  <!-- Lower Plinth Base (h=90cm -> 180px) -->
  <rect x="15" y="140" width="130" height="176" fill="#1C1917" stroke="#171717" stroke-width="2"/>
  <line x1="15" y1="145" x2="145" y2="145" stroke="#44403C" stroke-width="2"/>
  <line x1="15" y1="312" x2="145" y2="312" stroke="#44403C" stroke-width="1.5"/>
  <!-- Glass Bell / Hood (h=70cm -> 140px) -->
  <rect x="20" y="8" width="120" height="132" fill="#E0F2FE" fill-opacity="0.28" stroke="#0284C7" stroke-width="1.8" stroke-opacity="0.6"/>
  <!-- Specular Reflection -->
  <polygon points="32,136 68,14 84,14 48,136" fill="#FFFFFF" fill-opacity="0.45"/>
  <!-- Acrylic Joint lines -->
  <line x1="20" y1="140" x2="140" y2="140" stroke="#0284C7" stroke-width="2.5"/>
</svg>`);

// 8. Sloped Document & Archival Display Table (100x95 cm)
const svgSlopedDocTable = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 190" width="200" height="190">
  <!-- Legs & Technical Underframe -->
  <rect x="18" y="100" width="8" height="88" fill="#171717"/>
  <rect x="174" y="100" width="8" height="88" fill="#171717"/>
  <line x1="22" y1="165" x2="178" y2="165" stroke="#171717" stroke-width="3"/>
  <!-- Lower apron -->
  <rect x="14" y="90" width="172" height="14" fill="#292524"/>
  <!-- Sloped Display Case Top -->
  <polygon points="10,90 190,90 186,40 14,24" fill="#FAF8F5" stroke="#171717" stroke-width="2"/>
  <!-- Glass Window on Slope -->
  <polygon points="18,84 182,84 178,44 22,30" fill="#E0F2FE" fill-opacity="0.32" stroke="#0284C7" stroke-width="1.2"/>
  <!-- Archival manuscript inside -->
  <rect x="40" y="44" width="45" height="30" fill="#FBF9F5" stroke="#78716C" stroke-width="1" transform="rotate(-4 40 44)"/>
  <rect x="110" y="46" width="48" height="28" fill="#FBF9F5" stroke="#78716C" stroke-width="1" transform="rotate(3 110 46)"/>
</svg>`);

// 9. Museum Pedestal Cube White (40x100 cm)
const svgPedestalWhite = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 200" width="80" height="200">
  <!-- Shadow on floor -->
  <ellipse cx="40" cy="198" rx="38" ry="2" fill="rgba(0,0,0,0.15)"/>
  <!-- Front Body -->
  <rect x="4" y="4" width="72" height="192" fill="#FFFFFF" stroke="#171717" stroke-width="1.8"/>
  <!-- Top Bevel Line -->
  <line x1="4" y1="12" x2="76" y2="12" stroke="#E5E5E5" stroke-width="1"/>
  <line x1="4" y1="190" x2="76" y2="190" stroke="#E5E5E5" stroke-width="1"/>
</svg>`);

// 10. Pedestal with Acrylic Hood (45x140 cm)
const svgPedestalWithHood = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 280" width="90" height="280">
  <!-- Pedestal Body (h=90cm -> 180px) -->
  <rect x="8" y="96" width="74" height="180" fill="#F5F5F4" stroke="#171717" stroke-width="1.8"/>
  <line x1="8" y1="104" x2="82" y2="104" stroke="#D6D3D1" stroke-width="1.2"/>
  <!-- Acrylic Glass Hood (h=48cm -> 96px) -->
  <rect x="12" y="4" width="66" height="92" fill="#E0F2FE" fill-opacity="0.3" stroke="#0284C7" stroke-width="1.5"/>
  <polygon points="18,90 38,10 48,10 28,90" fill="#FFFFFF" fill-opacity="0.4"/>
</svg>`);

// 11. Minimalist Architectural Gallery Bench (160x45 cm)
const svgMuseumBench = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 90" width="320" height="90">
  <!-- Steel Blade Legs -->
  <rect x="40" y="32" width="6" height="56" fill="#171717"/>
  <rect x="274" y="32" width="6" height="56" fill="#171717"/>
  <rect x="34" y="84" width="18" height="4" fill="#171717"/>
  <rect x="268" y="84" width="18" height="4" fill="#171717"/>
  <!-- Oak Wood Slat Cushion / Seat -->
  <rect x="10" y="10" width="300" height="22" rx="2" fill="#D9C3A4" stroke="#78350F" stroke-width="1.5"/>
  <line x1="12" y1="16" x2="308" y2="16" stroke="#C2A682" stroke-width="1.5"/>
  <line x1="12" y1="24" x2="308" y2="24" stroke="#C2A682" stroke-width="1"/>
</svg>`);

// 12. Stanchion / Barrier Post with Braided Cord (100x85 cm)
const svgBarrierPosts = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 170" width="200" height="170">
  <!-- Post 1 -->
  <ellipse cx="25" cy="165" rx="22" ry="4" fill="#171717"/>
  <rect x="22" y="24" width="6" height="142" fill="#404040"/>
  <circle cx="25" cy="22" r="7" fill="#171717"/>
  <!-- Post 2 -->
  <ellipse cx="175" cy="165" rx="22" ry="4" fill="#171717"/>
  <rect x="172" y="24" width="6" height="142" fill="#404040"/>
  <circle cx="175" cy="22" r="7" fill="#171717"/>
  <!-- Elastic Barrier Cord Catenary -->
  <path d="M 25,24 Q 100,75 175,24" fill="none" stroke="#171717" stroke-width="3.5"/>
</svg>`);

// 13. Classical Sculptural Bust on Plinth (38x55 cm)
const svgSculptureBust = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 110" width="76" height="110">
  <!-- Marble Pedestal Base -->
  <rect x="18" y="92" width="40" height="16" fill="#F5F5F4" stroke="#171717" stroke-width="1.5"/>
  <rect x="24" y="82" width="28" height="10" fill="#E7E5E4" stroke="#171717" stroke-width="1.2"/>
  <!-- Classical Bust Silhouette with marble linework -->
  <g fill="#E7E5E4" stroke="#171717" stroke-width="1.2">
    <!-- Chest / Draped Toga -->
    <path d="M 12,82 C 10,72 20,64 28,62 C 34,60 42,60 48,62 C 56,64 66,72 64,82 Z"/>
    <!-- Neck -->
    <rect x="32" y="48" width="12" height="16"/>
    <!-- Head & Curls -->
    <path d="M 26,34 C 26,20 34,10 40,10 C 48,10 54,20 52,34 C 52,44 46,48 38,48 C 30,48 26,44 26,34 Z"/>
    <!-- Hair volume -->
    <path d="M 24,24 C 22,14 32,6 40,6 C 48,6 58,14 56,26 C 54,22 48,18 40,18 C 32,18 26,22 24,24 Z" fill="#D6D3D1"/>
  </g>
</svg>`);

// 14. Greek/Archaeological Amphora Ceramic Vessel (32x45 cm)
const svgArchaeologicalVessel = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 90" width="64" height="90">
  <!-- Stand base -->
  <ellipse cx="32" cy="86" rx="12" ry="3" fill="#171717"/>
  <!-- Ceramic Body in Terracotta Tonal Hatching -->
  <g fill="#C26638" stroke="#171717" stroke-width="1.5">
    <path d="M 22,10 L 42,10 L 38,20 C 50,30 54,54 44,72 L 38,84 L 26,84 L 20,72 C 10,54 14,30 26,20 Z"/>
    <!-- Handles -->
    <path d="M 24,22 C 10,24 8,46 20,54" fill="none" stroke="#171717" stroke-width="2"/>
    <path d="M 40,22 C 54,24 56,46 44,54" fill="none" stroke="#171717" stroke-width="2"/>
    <!-- Decorative geometric meander band -->
    <path d="M 18,40 L 46,40 M 16,46 L 48,46" stroke="#171717" stroke-width="1.2"/>
  </g>
</svg>`);

// 15. Track Lighting Rail with Museum Spotlights (240x28 cm)
const svgLightingTrack = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 32" width="240" height="32">
  <!-- Continuous Electrified Ceiling Track -->
  <line x1="0" y1="6" x2="240" y2="6" stroke="#171717" stroke-width="4"/>
  <!-- Spotlights -->
  <!-- Spot 1 angled left -->
  <g transform="translate(45, 6) rotate(-22)">
    <rect x="-3" y="0" width="6" height="5" fill="#404040"/>
    <path d="M -6,5 L 6,5 L 9,18 L -9,18 Z" fill="#171717"/>
    <line x1="-9" y1="18" x2="9" y2="18" stroke="#F59E0B" stroke-width="1.5"/>
    <!-- Cone of light -->
    <polygon points="-8,19 8,19 45,95 -45,95" fill="#FEF3C7" fill-opacity="0.12"/>
  </g>
  <!-- Spot 2 angled center -->
  <g transform="translate(120, 6) rotate(6)">
    <rect x="-3" y="0" width="6" height="5" fill="#404040"/>
    <path d="M -6,5 L 6,5 L 9,18 L -9,18 Z" fill="#171717"/>
    <line x1="-9" y1="18" x2="9" y2="18" stroke="#F59E0B" stroke-width="1.5"/>
    <polygon points="-8,19 8,19 35,95 -35,95" fill="#FEF3C7" fill-opacity="0.12"/>
  </g>
  <!-- Spot 3 angled right -->
  <g transform="translate(195, 6) rotate(24)">
    <rect x="-3" y="0" width="6" height="5" fill="#404040"/>
    <path d="M -6,5 L 6,5 L 9,18 L -9,18 Z" fill="#171717"/>
    <line x1="-9" y1="18" x2="9" y2="18" stroke="#F59E0B" stroke-width="1.5"/>
    <polygon points="-8,19 8,19 50,95 -30,95" fill="#FEF3C7" fill-opacity="0.12"/>
  </g>
</svg>`);

// 16. Didactic Curatorial Wall Panel with Typography (60x90 cm)
const svgDidacticPanel = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180" width="120" height="180">
  <rect x="2" y="2" width="116" height="176" fill="#FAF8F5" stroke="#171717" stroke-width="1.5"/>
  <!-- Room Title -->
  <rect x="14" y="20" width="70" height="8" fill="#171717"/>
  <rect x="14" y="32" width="45" height="4" fill="#737373"/>
  <line x1="14" y1="44" x2="106" y2="44" stroke="#E5E5E5" stroke-width="1"/>
  <!-- 2 Column Body Text Mimic -->
  <g fill="#737373">
    <rect x="14" y="52" width="42" height="2"/>
    <rect x="14" y="57" width="40" height="2"/>
    <rect x="14" y="62" width="43" height="2"/>
    <rect x="14" y="67" width="38" height="2"/>
    <rect x="14" y="72" width="42" height="2"/>
    <rect x="14" y="77" width="28" height="2"/>

    <rect x="64" y="52" width="42" height="2"/>
    <rect x="64" y="57" width="41" height="2"/>
    <rect x="64" y="62" width="39" height="2"/>
    <rect x="64" y="67" width="42" height="2"/>
    <rect x="64" y="72" width="36" height="2"/>
  </g>
</svg>`);

// 17. Interior Architectural Plant (Ficus Lyrata in Minimalist Pot, 50x130 cm)
const svgArchitecturalPlant = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 260" width="100" height="260">
  <!-- Cylindrical Planter Pot -->
  <rect x="25" y="190" width="50" height="66" fill="#F5F5F4" stroke="#171717" stroke-width="1.8"/>
  <ellipse cx="50" cy="190" rx="25" ry="4" fill="#E7E5E4" stroke="#171717" stroke-width="1.2"/>
  <!-- Soil Base -->
  <ellipse cx="50" cy="192" rx="22" ry="3" fill="#292524"/>
  <!-- Plant Stems & Broad Leaves -->
  <g fill="#2D5A27" stroke="#171717" stroke-width="1.2">
    <!-- Main Stems -->
    <path d="M 50,192 Q 46,140 48,70" fill="none" stroke="#5C4033" stroke-width="4"/>
    <path d="M 48,150 Q 64,120 72,90" fill="none" stroke="#5C4033" stroke-width="3"/>
    <path d="M 49,120 Q 34,90 26,60" fill="none" stroke="#5C4033" stroke-width="2.5"/>
    <!-- Large Organic Leaves -->
    <ellipse cx="48" cy="56" rx="16" ry="24" transform="rotate(-6 48 56)"/>
    <ellipse cx="74" cy="80" rx="18" ry="22" transform="rotate(22 74 80)"/>
    <ellipse cx="22" cy="54" rx="18" ry="20" transform="rotate(-26 22 54)"/>
    <ellipse cx="36" cy="100" rx="17" ry="20" transform="rotate(-35 36 100)"/>
    <ellipse cx="66" cy="125" rx="18" ry="21" transform="rotate(30 66 125)"/>
  </g>
</svg>`);

// 18. Architectural Concrete Wall Column / Pilaster (40x260 cm)
const svgArchitecturalColumn = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 520" width="80" height="520">
  <rect x="2" y="2" width="76" height="516" fill="#E5E4E0" stroke="#171717" stroke-width="2"/>
  <!-- Concrete Texture & Reveal Joint lines -->
  <line x1="2" y1="130" x2="78" y2="130" stroke="#A8A29E" stroke-width="1.5"/>
  <line x1="2" y1="260" x2="78" y2="260" stroke="#A8A29E" stroke-width="1.5"/>
  <line x1="2" y1="390" x2="78" y2="390" stroke="#A8A29E" stroke-width="1.5"/>
  <!-- Concrete Form Tie Holes -->
  <circle cx="20" cy="65" r="3" fill="#78716C"/>
  <circle cx="60" cy="65" r="3" fill="#78716C"/>
  <circle cx="20" cy="195" r="3" fill="#78716C"/>
  <circle cx="60" cy="195" r="3" fill="#78716C"/>
  <circle cx="20" cy="325" r="3" fill="#78716C"/>
  <circle cx="60" cy="325" r="3" fill="#78716C"/>
  <circle cx="20" cy="455" r="3" fill="#78716C"/>
  <circle cx="60" cy="455" r="3" fill="#78716C"/>
</svg>`);

// -------------------------------------------------------------
// BANCO VIRTUAL CAD & MUSEOGRÁFICO: MESAS DE RESTAURANTE,
// CUADRADOS CON DECORACIÓN, REPISAS Y AMBIENTACIÓN
// -------------------------------------------------------------

// 19. Mesa de Restaurante Cuadrada 2 Personas (80x80 cm) - Vista Planta CAD
const svgTable2pPlan = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <!-- Silla Superior -->
  <path d="M 52,18 C 52,10 108,10 108,18 L 104,34 L 56,34 Z" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <path d="M 48,14 C 65,6 95,6 112,14" fill="none" stroke="#171717" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Silla Inferior -->
  <path d="M 52,142 C 52,150 108,150 108,142 L 104,126 L 56,126 Z" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <path d="M 48,146 C 65,154 95,154 112,146" fill="none" stroke="#171717" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Tablero de Mesa de Madera -->
  <rect x="30" y="30" width="100" height="100" rx="6" fill="#D9C3A4" stroke="#171717" stroke-width="2.5"/>
  <rect x="36" y="36" width="88" height="88" rx="3" fill="none" stroke="#8C6D46" stroke-width="1"/>
  <!-- Servicio de mesa: 2 platos, copas y florero central -->
  <circle cx="80" cy="54" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="80" cy="106" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="102" cy="58" r="4" fill="#E0F2FE" stroke="#171717" stroke-width="1"/>
  <circle cx="58" cy="102" r="4" fill="#E0F2FE" stroke="#171717" stroke-width="1"/>
  <!-- Centro de mesa / vela / florero -->
  <rect x="72" y="72" width="16" height="16" rx="3" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="80" cy="80" r="4.5" fill="#15803D"/>
</svg>`);

// 20. Mesa de Restaurante Cuadrada 4 Personas (110x110 cm) - Vista Planta CAD
const svgTable4pSquarePlan = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Silla Norte -->
  <rect x="70" y="14" width="60" height="22" rx="6" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <path d="M 66,10 Q 100,4 134,10" fill="none" stroke="#171717" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Silla Sur -->
  <rect x="70" y="164" width="60" height="22" rx="6" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <path d="M 66,190 Q 100,196 134,190" fill="none" stroke="#171717" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Silla Oeste -->
  <rect x="14" y="70" width="22" height="60" rx="6" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <path d="M 10,66 Q 4,100 10,134" fill="none" stroke="#171717" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Silla Este -->
  <rect x="164" y="70" width="22" height="60" rx="6" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <path d="M 190,66 Q 196,100 190,134" fill="none" stroke="#171717" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Tablero Cuadrado Restaurante -->
  <rect x="34" y="34" width="132" height="132" rx="6" fill="#D9C3A4" stroke="#171717" stroke-width="2.5"/>
  <rect x="42" y="42" width="116" height="116" rx="3" fill="none" stroke="#78350F" stroke-width="0.9" stroke-opacity="0.4"/>
  <!-- 4 Platos -->
  <circle cx="100" cy="58" r="13" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="100" cy="142" r="13" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="58" cy="100" r="13" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="142" cy="100" r="13" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <!-- Centro de mesa cuadrado con decoración -->
  <rect x="84" y="84" width="32" height="32" rx="4" fill="#FAF8F5" stroke="#171717" stroke-width="1.5"/>
  <circle cx="96" cy="96" r="6" fill="#15803D"/>
  <circle cx="106" cy="104" r="4.5" fill="#D97706"/>
</svg>`);

// 21. Mesa de Restaurante Redonda Bistró 4 Personas (Ø 110 cm) - Vista Planta CAD
const svgTable4pRoundPlan = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- 4 Sillas en diagonal -->
  <g transform="rotate(45 100 100)">
    <rect x="74" y="10" width="52" height="22" rx="8" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
    <rect x="74" y="168" width="52" height="22" rx="8" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
    <rect x="10" y="74" width="22" height="52" rx="8" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
    <rect x="168" y="74" width="22" height="52" rx="8" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  </g>
  <!-- Tablero Circular -->
  <circle cx="100" cy="100" r="64" fill="#D9C3A4" stroke="#171717" stroke-width="2.5"/>
  <circle cx="100" cy="100" r="56" fill="none" stroke="#8C6D46" stroke-width="1"/>
  <!-- 4 Platos -->
  <circle cx="70" cy="70" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="130" cy="70" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="70" cy="130" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="130" cy="130" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <!-- Centro florero -->
  <circle cx="100" cy="100" r="13" fill="#FAF8F5" stroke="#171717" stroke-width="1.5"/>
  <circle cx="100" cy="100" r="6" fill="#15803D"/>
</svg>`);

// 22. Mesa de Restaurante Rectangular 6 Personas (180x100 cm) - Vista Planta CAD
const svgTable6pRectPlan = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 180" width="280" height="180">
  <!-- Sillas Superiores (2) -->
  <rect x="65" y="12" width="52" height="22" rx="6" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <rect x="163" y="12" width="52" height="22" rx="6" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <!-- Sillas Inferiores (2) -->
  <rect x="65" y="146" width="52" height="22" rx="6" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <rect x="163" y="146" width="52" height="22" rx="6" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <!-- Sillas Cabeceras (Izquierda y Derecha) -->
  <rect x="12" y="64" width="22" height="52" rx="6" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <rect x="246" y="64" width="22" height="52" rx="6" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <!-- Tablero Rectangular -->
  <rect x="32" y="32" width="216" height="116" rx="6" fill="#D9C3A4" stroke="#171717" stroke-width="2.5"/>
  <!-- Camino de mesa decorativo central -->
  <rect x="52" y="76" width="176" height="28" rx="3" fill="#FAF8F5" stroke="#8C6D46" stroke-width="1"/>
  <circle cx="100" cy="90" r="7" fill="#15803D"/>
  <circle cx="140" cy="90" r="6" fill="#D97706"/>
  <circle cx="180" cy="90" r="7" fill="#15803D"/>
  <!-- 6 Platos -->
  <circle cx="91" cy="54" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="189" cy="54" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="91" cy="126" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="189" cy="126" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="54" cy="90" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="226" cy="90" r="12" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
</svg>`);

// 23. Barra de Restaurante / Cafetería con 4 Taburetes (220x85 cm)
const svgRestaurantBarCounter = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 140" width="320" height="140">
  <!-- Cuerpo de Barra de Madera y Mármol -->
  <rect x="12" y="14" width="296" height="72" rx="4" fill="#FAF8F5" stroke="#171717" stroke-width="2.5"/>
  <rect x="12" y="64" width="296" height="22" fill="#D9C3A4" stroke="#171717" stroke-width="1.8"/>
  <!-- Estación de Café / Vitrina sobre barra -->
  <rect x="30" y="24" width="58" height="32" rx="2" fill="#262626" stroke="#171717" stroke-width="1.5"/>
  <circle cx="45" cy="40" r="6" fill="#D97706"/>
  <circle cx="68" cy="40" r="6" fill="#737373"/>
  <!-- Vitrina de pastelería / tapas -->
  <rect x="115" y="22" width="90" height="36" rx="2" fill="#E0F2FE" fill-opacity="0.5" stroke="#0284C7" stroke-width="1.5"/>
  <circle cx="138" cy="40" r="7" fill="#FDE68A" stroke="#B45309" stroke-width="1"/>
  <circle cx="160" cy="40" r="7" fill="#FDE68A" stroke="#B45309" stroke-width="1"/>
  <circle cx="182" cy="40" r="7" fill="#FDE68A" stroke="#B45309" stroke-width="1"/>
  <!-- Planta decorativa en esquina de barra -->
  <circle cx="272" cy="38" r="15" fill="#15803D" stroke="#171717" stroke-width="1.5"/>
  <!-- 4 Taburetes de Barra -->
  <circle cx="56" cy="112" r="16" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <circle cx="126" cy="112" r="16" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <circle cx="196" cy="112" r="16" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
  <circle cx="266" cy="112" r="16" fill="#E7E5E4" stroke="#171717" stroke-width="2"/>
</svg>`);

// 24. Booth / Cabina Doble de Restaurante (160x120 cm)
const svgRestaurantBooth = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180">
  <!-- Banca Tapizada Izquierda -->
  <rect x="12" y="16" width="52" height="148" rx="6" fill="#B45309" fill-opacity="0.22" stroke="#171717" stroke-width="2.2"/>
  <rect x="12" y="16" width="18" height="148" rx="3" fill="#78350F" fill-opacity="0.35" stroke="#171717" stroke-width="1.5"/>
  <!-- Banca Tapizada Derecha -->
  <rect x="176" y="16" width="52" height="148" rx="6" fill="#B45309" fill-opacity="0.22" stroke="#171717" stroke-width="2.2"/>
  <rect x="210" y="16" width="18" height="148" rx="3" fill="#78350F" fill-opacity="0.35" stroke="#171717" stroke-width="1.5"/>
  <!-- Mesa Central -->
  <rect x="72" y="22" width="96" height="136" rx="5" fill="#D9C3A4" stroke="#171717" stroke-width="2.5"/>
  <!-- Platos y Centro -->
  <circle cx="94" cy="56" r="11" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="146" cy="56" r="11" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="94" cy="124" r="11" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="146" cy="124" r="11" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <rect x="108" y="78" width="24" height="24" rx="4" fill="#FAF8F5" stroke="#171717" stroke-width="1.2"/>
  <circle cx="120" cy="90" r="6" fill="#15803D"/>
</svg>`);

// 25. Mesa de Restaurante en Elevación con Sillas y Lámpara Colgante (140x95 cm)
const svgRestaurantTableElevation = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 190" width="280" height="190">
  <!-- Silla Izquierda -->
  <path d="M 32,72 L 32,186 M 76,128 L 76,186 M 30,128 L 80,128" stroke="#171717" stroke-width="4" stroke-linecap="round"/>
  <rect x="28" y="72" width="10" height="42" rx="3" fill="#78350F" stroke="#171717" stroke-width="1.5"/>
  <!-- Silla Derecha -->
  <path d="M 248,72 L 248,186 M 204,128 L 204,186 M 200,128 L 250,128" stroke="#171717" stroke-width="4" stroke-linecap="round"/>
  <rect x="242" y="72" width="10" height="42" rx="3" fill="#78350F" stroke="#171717" stroke-width="1.5"/>
  <!-- Mesa Central -->
  <rect x="64" y="96" width="152" height="10" rx="2" fill="#D9C3A4" stroke="#171717" stroke-width="2"/>
  <rect x="134" y="106" width="12" height="76" fill="#262626"/>
  <rect x="100" y="180" width="80" height="6" rx="2" fill="#171717"/>
  <!-- Florero y Copas sobre la mesa -->
  <path d="M 134,72 L 146,72 L 144,96 L 136,96 Z" fill="#C26638" stroke="#171717" stroke-width="1.5"/>
  <circle cx="140" cy="62" r="12" fill="#15803D" stroke="#171717" stroke-width="1.2"/>
  <path d="M 96,80 L 106,80 L 103,90 L 101,96 L 99,90 Z" fill="#E0F2FE" stroke="#171717" stroke-width="1.2"/>
  <path d="M 174,80 L 184,80 L 181,90 L 179,96 L 177,90 Z" fill="#E0F2FE" stroke="#171717" stroke-width="1.2"/>
</svg>`);

// 26. CUADRADO DONDE HAY DECORACIÓN: Módulo Cuadrado con Planta, Cerámica y Piedras (70x70 cm)
const svgDecorSquareBotanical = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <!-- Marco cuadrado arquitectónico con doble línea -->
  <rect x="8" y="8" width="144" height="144" rx="6" fill="#FAF8F5" stroke="#171717" stroke-width="3"/>
  <rect x="16" y="16" width="128" height="128" rx="3" fill="#F5F3ED" stroke="#78716C" stroke-width="1.2" stroke-dasharray="4,3"/>
  <!-- Base de madera/piedra interior -->
  <rect x="26" y="26" width="64" height="64" rx="4" fill="#E7E5E4" stroke="#171717" stroke-width="1.5"/>
  <!-- Planta tropical vista superior -->
  <circle cx="58" cy="58" r="24" fill="#DCFCE7" stroke="#15803D" stroke-width="1.5"/>
  <path d="M 58,58 L 40,40 M 58,58 L 76,40 M 58,58 L 78,62 M 58,58 L 42,74 M 58,58 L 62,80" stroke="#15803D" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="58" cy="58" r="6" fill="#166534"/>
  <!-- Pieza cerámica / escultura y piedras decorativas -->
  <circle cx="114" cy="54" r="16" fill="#FED7AA" stroke="#9A3412" stroke-width="2"/>
  <circle cx="114" cy="54" r="7" fill="#FAF8F5" stroke="#9A3412" stroke-width="1.2"/>
  <!-- Repisa / bloque decorativo inferior dentro del cuadrado -->
  <rect x="30" y="102" width="100" height="28" rx="3" fill="#D9C3A4" stroke="#171717" stroke-width="1.8"/>
  <rect x="40" y="107" width="24" height="18" fill="#FAF8F5" stroke="#171717" stroke-width="1"/>
  <circle cx="84" cy="116" r="7" fill="#FDE68A" stroke="#B45309" stroke-width="1.2"/>
  <circle cx="110" cy="116" r="6" fill="#A8A29E" stroke="#171717" stroke-width="1"/>
</svg>`);

// 27. CUADRADO DONDE HAY DECORACIÓN: Isla Cuadrada Expositora con Objetos y Luz (90x90 cm)
const svgDecorSquareDisplay = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <!-- Cuadrado exterior -->
  <rect x="8" y="8" width="164" height="164" rx="6" fill="#FAF8F5" stroke="#171717" stroke-width="3"/>
  <!-- Retícula 2x2 de nichos decorativos -->
  <line x1="90" y1="8" x2="90" y2="172" stroke="#171717" stroke-width="2"/>
  <line x1="8" y1="90" x2="172" y2="90" stroke="#171717" stroke-width="2"/>
  <!-- Cuadrante 1: Planta -->
  <circle cx="49" cy="49" r="24" fill="#BBF7D0" stroke="#15803D" stroke-width="1.8"/>
  <circle cx="49" cy="49" r="9" fill="#15803D"/>
  <!-- Cuadrante 2: Libros / Catálogos -->
  <rect x="104" y="26" width="48" height="36" rx="2" fill="#DBEAFE" stroke="#1D4ED8" stroke-width="1.5" transform="rotate(-6 128 44)"/>
  <rect x="110" y="34" width="44" height="32" rx="2" fill="#FAF8F5" stroke="#171717" stroke-width="1.2" transform="rotate(4 132 50)"/>
  <!-- Cuadrante 3: Luminaria cálida -->
  <circle cx="49" cy="131" r="22" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
  <circle cx="49" cy="131" r="10" fill="#F59E0B"/>
  <!-- Cuadrante 4: Escultura / Jarrón -->
  <rect x="108" y="108" width="46" height="46" rx="6" fill="#F5F5F4" stroke="#171717" stroke-width="1.5"/>
  <circle cx="131" cy="131" r="14" fill="#FDBA74" stroke="#9A3412" stroke-width="1.8"/>
</svg>`);

// 28. CUADRADO DECORATIVO: Jardinera Cuadrada Arquitectónica (65x65 cm)
const svgDecorSquarePlanter = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="150" height="150">
  <!-- Borde de concreto cuadrado -->
  <rect x="8" y="8" width="134" height="134" rx="5" fill="#E7E5E4" stroke="#171717" stroke-width="3"/>
  <rect x="20" y="20" width="110" height="110" rx="3" fill="#44403C" stroke="#171717" stroke-width="1.5"/>
  <!-- Follaje denso y flores decorativas -->
  <circle cx="52" cy="52" r="24" fill="#16A34A" stroke="#171717" stroke-width="1.5"/>
  <circle cx="96" cy="56" r="22" fill="#15803D" stroke="#171717" stroke-width="1.5"/>
  <circle cx="58" cy="96" r="22" fill="#22C55E" stroke="#171717" stroke-width="1.5"/>
  <circle cx="96" cy="96" r="24" fill="#166534" stroke="#171717" stroke-width="1.5"/>
  <circle cx="75" cy="75" r="20" fill="#4ADE80" stroke="#171717" stroke-width="1.5"/>
  <circle cx="75" cy="75" r="6" fill="#FACC15"/>
</svg>`);

// 29. REPISA FLOTANTE CON DECORACIÓN (Vista en Planta · 120x30 cm)
const svgShelfDecorPlan = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 68" width="240" height="68">
  <!-- Soportes traseros a muro -->
  <rect x="28" y="2" width="14" height="8" fill="#171717"/>
  <rect x="198" y="2" width="14" height="8" fill="#171717"/>
  <!-- Tablero de Repisa de Madera -->
  <rect x="6" y="8" width="228" height="52" rx="3" fill="#D9C3A4" stroke="#171717" stroke-width="2.5"/>
  <line x1="12" y1="20" x2="228" y2="20" stroke="#8C6D46" stroke-width="1" stroke-opacity="0.5"/>
  <!-- Objetos sobre la repisa: Planta, Libros apilados, Cerámica -->
  <circle cx="42" cy="34" r="16" fill="#86EFAC" stroke="#15803D" stroke-width="1.8"/>
  <circle cx="42" cy="34" r="6" fill="#15803D"/>
  <rect x="86" y="18" width="54" height="32" rx="2" fill="#FAF8F5" stroke="#171717" stroke-width="1.5"/>
  <line x1="94" y1="26" x2="132" y2="26" stroke="#2563EB" stroke-width="2"/>
  <line x1="94" y1="34" x2="124" y2="34" stroke="#737373" stroke-width="1.5"/>
  <circle cx="172" cy="34" r="13" fill="#FDBA74" stroke="#9A3412" stroke-width="1.8"/>
  <circle cx="204" cy="34" r="9" fill="#FEF08A" stroke="#CA8A04" stroke-width="1.5"/>
</svg>`);

// 30. REPISA FLOTANTE CON DECORACIÓN (Vista en Elevación · 120x45 cm)
const svgShelfDecorElevation = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" width="240" height="100">
  <!-- Libros apilados y verticales -->
  <rect x="26" y="34" width="10" height="44" fill="#2563EB" stroke="#171717" stroke-width="1.5"/>
  <rect x="36" y="38" width="12" height="40" fill="#D97706" stroke="#171717" stroke-width="1.5"/>
  <rect x="48" y="30" width="11" height="48" fill="#FAF8F5" stroke="#171717" stroke-width="1.5"/>
  <!-- Jarrón de cerámica con rama -->
  <path d="M 102,42 L 122,42 L 126,78 L 98,78 Z" fill="#C26638" stroke="#171717" stroke-width="1.5"/>
  <path d="M 112,42 Q 108,20 96,12 M 112,42 Q 118,18 130,14" fill="none" stroke="#15803D" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="96" cy="12" r="5" fill="#16A34A"/>
  <circle cx="130" cy="14" r="5" fill="#16A34A"/>
  <!-- Cuadro pequeño apoyado -->
  <rect x="148" y="24" width="38" height="54" fill="#FAF8F5" stroke="#171717" stroke-width="2"/>
  <circle cx="167" cy="48" r="10" fill="#FDE68A" stroke="#D97706" stroke-width="1.2"/>
  <!-- Planta en maceta con hojas colgantes -->
  <rect x="198" y="54" width="24" height="24" rx="2" fill="#E7E5E4" stroke="#171717" stroke-width="1.5"/>
  <circle cx="210" cy="46" r="12" fill="#16A34A" stroke="#171717" stroke-width="1.2"/>
  <path d="M 218,64 Q 226,80 222,96" fill="none" stroke="#15803D" stroke-width="3" stroke-linecap="round"/>
  <!-- Tablero de Repisa de Madera -->
  <rect x="8" y="78" width="224" height="10" rx="2" fill="#D9C3A4" stroke="#171717" stroke-width="2"/>
  <rect x="34" y="88" width="8" height="6" fill="#171717"/>
  <rect x="198" y="88" width="8" height="6" fill="#171717"/>
</svg>`);

// 31. ESTANTERÍA / REPISA MODULAR DE CUADRADOS CON DECORACIÓN (120x120 cm Elevación)
const svgModularCubeShelfElevation = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Marco exterior de madera/hierro 3x3 cuadrados -->
  <rect x="8" y="8" width="184" height="184" fill="#FAF8F5" stroke="#171717" stroke-width="4"/>
  <!-- Divisiones internas formando 9 cuadrados con decoración -->
  <line x1="69" y1="8" x2="69" y2="192" stroke="#171717" stroke-width="3"/>
  <line x1="131" y1="8" x2="131" y2="192" stroke="#171717" stroke-width="3"/>
  <line x1="8" y1="69" x2="192" y2="69" stroke="#171717" stroke-width="3"/>
  <line x1="8" y1="131" x2="192" y2="131" stroke="#171717" stroke-width="3"/>
  <!-- Decoración en los cuadrados -->
  <!-- Cubo 1: Planta -->
  <rect x="28" y="44" width="20" height="22" fill="#D97706" stroke="#171717" stroke-width="1.2"/>
  <circle cx="38" cy="34" r="14" fill="#16A34A" stroke="#171717" stroke-width="1.2"/>
  <!-- Cubo 2: Escultura / Esfera -->
  <circle cx="100" cy="44" r="16" fill="#FDE68A" stroke="#171717" stroke-width="1.5"/>
  <!-- Cubo 3: Libros -->
  <rect x="144" y="28" width="10" height="38" fill="#2563EB" stroke="#171717" stroke-width="1.2"/>
  <rect x="154" y="32" width="10" height="34" fill="#DC2626" stroke="#171717" stroke-width="1.2"/>
  <!-- Cubo 4: Jarrón -->
  <path d="M 30,90 L 46,90 L 50,128 L 26,128 Z" fill="#C26638" stroke="#171717" stroke-width="1.5"/>
  <!-- Cubo 5: Cuadrado iluminado con pieza -->
  <rect x="72" y="72" width="56" height="56" fill="#FEF3C7"/>
  <polygon points="100,82 118,122 82,122" fill="#D97706" stroke="#171717" stroke-width="1.5"/>
  <!-- Cubo 6: Planta colgante -->
  <circle cx="162" cy="96" r="15" fill="#15803D" stroke="#171717" stroke-width="1.2"/>
  <!-- Cubo 7: Caja decorativa -->
  <rect x="20" y="150" width="36" height="38" fill="#D9C3A4" stroke="#171717" stroke-width="1.5"/>
  <!-- Cubo 9: Cerámica -->
  <circle cx="162" cy="166" r="16" fill="#93C5FD" stroke="#1D4ED8" stroke-width="1.5"/>
</svg>`);

// 32. MESA DE CENTRO BAJA CUADRADA CON DECORACIÓN (90x90 cm)
const svgCoffeeTableSquarePlan = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect x="14" y="14" width="152" height="152" rx="8" fill="#D9C3A4" stroke="#171717" stroke-width="2.5"/>
  <rect x="24" y="24" width="132" height="132" rx="4" fill="#E7D8C1" stroke="#8C6D46" stroke-width="1"/>
  <!-- Bandeja cuadrada decorativa -->
  <rect x="42" y="42" width="54" height="54" rx="4" fill="#FAF8F5" stroke="#171717" stroke-width="1.5"/>
  <circle cx="69" cy="69" r="14" fill="#86EFAC" stroke="#15803D" stroke-width="1.5"/>
  <!-- Libros de arte -->
  <rect x="104" y="50" width="38" height="48" rx="2" fill="#1E3A8A" stroke="#171717" stroke-width="1.5"/>
  <rect x="52" y="110" width="76" height="32" rx="3" fill="#FEF3C7" stroke="#B45309" stroke-width="1.5"/>
</svg>`);

// 33. SILLÓN LOUNGE / POLTRONA DE DISEÑO (80x80 cm)
const svgLoungeArmchairPlan = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <!-- Cojín de asiento -->
  <rect x="28" y="34" width="104" height="96" rx="12" fill="#E7E5E4" stroke="#171717" stroke-width="2.2"/>
  <!-- Respaldo -->
  <rect x="20" y="16" width="120" height="28" rx="10" fill="#D6D3D1" stroke="#171717" stroke-width="2.5"/>
  <!-- Apoyabrazos izquierdo y derecho -->
  <rect x="14" y="30" width="22" height="104" rx="8" fill="#D6D3D1" stroke="#171717" stroke-width="2.2"/>
  <rect x="124" y="30" width="22" height="104" rx="8" fill="#D6D3D1" stroke="#171717" stroke-width="2.2"/>
  <!-- Cojín decorativo -->
  <rect x="54" y="46" width="52" height="24" rx="6" fill="#FDE68A" stroke="#B45309" stroke-width="1.5"/>
</svg>`);

// 34. MACETERO RECTANGULAR DIVISOR CON VEGETACIÓN (120x45 cm)
const svgPlanterDividerPlan = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90" width="240" height="90">
  <rect x="8" y="10" width="224" height="70" rx="5" fill="#E7E5E4" stroke="#171717" stroke-width="2.5"/>
  <rect x="16" y="18" width="208" height="54" rx="3" fill="#44403C" stroke="#171717" stroke-width="1.2"/>
  <!-- 4 Plantas alineadas -->
  <circle cx="46" cy="45" r="22" fill="#22C55E" stroke="#14532D" stroke-width="1.8"/>
  <circle cx="96" cy="45" r="24" fill="#16A34A" stroke="#14532D" stroke-width="1.8"/>
  <circle cx="148" cy="45" r="22" fill="#4ADE80" stroke="#14532D" stroke-width="1.8"/>
  <circle cx="196" cy="45" r="23" fill="#15803D" stroke="#14532D" stroke-width="1.8"/>
</svg>`);

// 35. ALFOMBRA / TAPETE DECORATIVO CON DISEÑO GEOMÉTRICO (200x140 cm)
const svgDecorativeRugPlan = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 200" width="280" height="200">
  <rect x="12" y="12" width="256" height="176" rx="4" fill="#F5F3ED" stroke="#78716C" stroke-width="2"/>
  <rect x="24" y="24" width="232" height="152" fill="none" stroke="#D97706" stroke-width="2"/>
  <polygon points="140,44 210,100 140,156 70,100" fill="#FEF3C7" fill-opacity="0.5" stroke="#B45309" stroke-width="1.5"/>
  <rect x="116" y="76" width="48" height="48" fill="#FDE68A" fill-opacity="0.5" stroke="#78350F" stroke-width="1.5"/>
</svg>`);

// 36. LÁMPARA DE PIE ARQUITECTÓNICA / LUMINARIA DE SALA (50x50 cm Planta / 185 cm Alto)
const svgFloorLampPlan = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="48" fill="#FEF3C7" fill-opacity="0.55" stroke="#F59E0B" stroke-width="1.8" stroke-dasharray="4,3"/>
  <circle cx="60" cy="60" r="26" fill="#FAF8F5" stroke="#171717" stroke-width="2.2"/>
  <line x1="34" y1="60" x2="86" y2="60" stroke="#171717" stroke-width="1.5"/>
  <line x1="60" y1="34" x2="60" y2="86" stroke="#171717" stroke-width="1.5"/>
  <circle cx="60" cy="60" r="8" fill="#F59E0B" stroke="#171717" stroke-width="1.5"/>
</svg>`);

export const INITIAL_GRAPHIC_LIBRARY: GraphicResource[] = [
  // =============================================================
  // 1. MESAS DE RESTAURANTE Y CAFETERÍA (Planta CAD y Alzado)
  // =============================================================
  {
    id: 'res-table-2p-square',
    name: 'Mesa de restaurante cuadrada (2 personas)',
    category: 'restaurant_tables',
    previewUrl: svgTable2pPlan,
    fileDataUrl: svgRestaurantTableElevation,
    planSvgUrl: svgTable2pPlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Restaurante',
    defaultWidthCm: 80,
    defaultHeightCm: 75,
    defaultDepthCm: 80,
    tags: ['mesa', 'restaurante', 'bistró', '2 personas', 'sillas', 'comedor', 'cafetería'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-table-4p-square',
    name: 'Mesa de restaurante cuadrada (4 personas)',
    category: 'restaurant_tables',
    previewUrl: svgTable4pSquarePlan,
    fileDataUrl: svgRestaurantTableElevation,
    planSvgUrl: svgTable4pSquarePlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Restaurante',
    defaultWidthCm: 110,
    defaultHeightCm: 75,
    defaultDepthCm: 110,
    tags: ['mesa', 'restaurante', 'cuadrada', '4 personas', 'sillas', 'comedor'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-table-4p-round',
    name: 'Mesa de restaurante redonda Bistró (4 personas)',
    category: 'restaurant_tables',
    previewUrl: svgTable4pRoundPlan,
    fileDataUrl: svgRestaurantTableElevation,
    planSvgUrl: svgTable4pRoundPlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Restaurante',
    defaultWidthCm: 110,
    defaultHeightCm: 75,
    defaultDepthCm: 110,
    tags: ['mesa', 'redonda', 'bistró', 'restaurante', '4 personas', 'café'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-table-6p-rect',
    name: 'Mesa de restaurante rectangular (6 personas)',
    category: 'restaurant_tables',
    previewUrl: svgTable6pRectPlan,
    fileDataUrl: svgRestaurantTableElevation,
    planSvgUrl: svgTable6pRectPlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Restaurante',
    defaultWidthCm: 180,
    defaultHeightCm: 75,
    defaultDepthCm: 100,
    tags: ['mesa', 'rectangular', '6 personas', 'restaurante', 'banquete', 'comedor'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-restaurant-bar-counter',
    name: 'Barra de restaurante / cafetería con taburetes',
    category: 'restaurant_tables',
    previewUrl: svgRestaurantBarCounter,
    fileDataUrl: svgRestaurantBarCounter,
    planSvgUrl: svgRestaurantBarCounter,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Gastronomía',
    defaultWidthCm: 220,
    defaultHeightCm: 105,
    defaultDepthCm: 85,
    tags: ['barra', 'cafetería', 'restaurante', 'taburetes', 'mostrador', 'bar'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-restaurant-booth',
    name: 'Booth / Cabina doble de restaurante',
    category: 'restaurant_tables',
    previewUrl: svgRestaurantBooth,
    fileDataUrl: svgRestaurantTableElevation,
    planSvgUrl: svgRestaurantBooth,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Restaurante',
    defaultWidthCm: 160,
    defaultHeightCm: 95,
    defaultDepthCm: 120,
    tags: ['booth', 'cabina', 'restaurante', 'bancas', 'mesa', 'comedor'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },

  // =============================================================
  // 2. CUADRADOS DONDE HAY DECORACIÓN E ISLAS CENTRALES
  // =============================================================
  {
    id: 'res-decor-square-botanical',
    name: 'Cuadrado con decoración, planta y cerámica',
    category: 'decor_squares',
    previewUrl: svgDecorSquareBotanical,
    fileDataUrl: svgDecorSquareBotanical,
    planSvgUrl: svgDecorSquareBotanical,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Interiorismo',
    defaultWidthCm: 75,
    defaultHeightCm: 90,
    defaultDepthCm: 75,
    tags: ['cuadrado', 'decoración', 'planta', 'cerámica', 'isla', 'bloque decorativo'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-decor-square-display',
    name: 'Cuadrado expositor con 4 nichos de decoración',
    category: 'decor_squares',
    previewUrl: svgDecorSquareDisplay,
    fileDataUrl: svgModularCubeShelfElevation,
    planSvgUrl: svgDecorSquareDisplay,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Museografía',
    defaultWidthCm: 90,
    defaultHeightCm: 110,
    defaultDepthCm: 90,
    tags: ['cuadrado', 'decoración', 'isla', 'expositor', 'nichos', 'libros', 'luz'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-decor-square-planter',
    name: 'Cuadrado jardinera arquitectónica con follaje',
    category: 'decor_squares',
    previewUrl: svgDecorSquarePlanter,
    fileDataUrl: svgArchitecturalPlant,
    planSvgUrl: svgDecorSquarePlanter,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Paisajismo',
    defaultWidthCm: 65,
    defaultHeightCm: 85,
    defaultDepthCm: 65,
    tags: ['cuadrado', 'jardinera', 'maceta', 'decoración', 'vegetación', 'planta'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-decor-square-coffee',
    name: 'Cuadrado mesa baja con libros de arte y florero',
    category: 'decor_squares',
    previewUrl: svgCoffeeTableSquarePlan,
    fileDataUrl: svgSlopedDocTable,
    planSvgUrl: svgCoffeeTableSquarePlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Interiorismo',
    defaultWidthCm: 85,
    defaultHeightCm: 45,
    defaultDepthCm: 85,
    tags: ['cuadrado', 'mesa de centro', 'decoración', 'libros', 'florero', 'sala'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },

  // =============================================================
  // 3. REPISAS Y ESTANTERÍAS (Planta y Elevación)
  // =============================================================
  {
    id: 'res-shelf-floating-decor',
    name: 'Repisa flotante con decoración, cerámica y libros',
    category: 'shelves',
    previewUrl: svgShelfDecorElevation,
    fileDataUrl: svgShelfDecorElevation,
    planSvgUrl: svgShelfDecorPlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Repisas',
    defaultWidthCm: 120,
    defaultHeightCm: 45,
    defaultDepthCm: 30,
    tags: ['repisa', 'estante', 'decoración', 'libros', 'cerámica', 'planta', 'pared'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-shelf-modular-cubes',
    name: 'Repisa modular de cuadrados / cubos con decoración',
    category: 'shelves',
    previewUrl: svgModularCubeShelfElevation,
    fileDataUrl: svgModularCubeShelfElevation,
    planSvgUrl: svgShelfDecorPlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Repisas',
    defaultWidthCm: 120,
    defaultHeightCm: 120,
    defaultDepthCm: 35,
    tags: ['repisa', 'estantería', 'cubos', 'cuadrados', 'decoración', 'divisor'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-shelf-gallery-ledge',
    name: 'Repisa lineal de galería para obras y objetos (150 cm)',
    category: 'shelves',
    previewUrl: svgShelfDecorPlan,
    fileDataUrl: svgShelfDecorElevation,
    planSvgUrl: svgShelfDecorPlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Repisas',
    defaultWidthCm: 150,
    defaultHeightCm: 35,
    defaultDepthCm: 22,
    tags: ['repisa', 'galería', 'cuadros', 'fotografías', 'objetos', 'madera'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },

  // =============================================================
  // 4. DECORACIÓN, PLANTAS Y MOBILIARIO DE AMBIENTACIÓN
  // =============================================================
  {
    id: 'res-planter-divider-long',
    name: 'Macetero rectangular divisor con plantas (120×45 cm)',
    category: 'decor',
    previewUrl: svgPlanterDividerPlan,
    fileDataUrl: svgArchitecturalPlant,
    planSvgUrl: svgPlanterDividerPlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Paisajismo',
    defaultWidthCm: 120,
    defaultHeightCm: 95,
    defaultDepthCm: 45,
    tags: ['macetero', 'divisor', 'plantas', 'vegetación', 'decoración', 'jardín'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-lounge-armchair',
    name: 'Sillón lounge / Poltrona de descanso',
    category: 'furniture',
    previewUrl: svgLoungeArmchairPlan,
    fileDataUrl: svgMuseumBench,
    planSvgUrl: svgLoungeArmchairPlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Mobiliario',
    defaultWidthCm: 80,
    defaultHeightCm: 78,
    defaultDepthCm: 80,
    tags: ['sillón', 'poltrona', 'lounge', 'asiento', 'sofá', 'mobiliario'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-decorative-rug',
    name: 'Alfombra / Tapete decorativo tejido (200×140 cm)',
    category: 'decor',
    previewUrl: svgDecorativeRugPlan,
    fileDataUrl: svgDecorativeRugPlan,
    planSvgUrl: svgDecorativeRugPlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Textil',
    defaultWidthCm: 200,
    defaultHeightCm: 5,
    defaultDepthCm: 140,
    tags: ['alfombra', 'tapete', 'textil', 'decoración', 'piso', 'sala'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-floor-lamp-arch',
    name: 'Lámpara de pie arquitectónica cálida',
    category: 'decor',
    previewUrl: svgFloorLampPlan,
    fileDataUrl: svgLightingTrack,
    planSvgUrl: svgFloorLampPlan,
    fileType: 'svg',
    sourceLicense: 'Banco Virtual CAD · Iluminación',
    defaultWidthCm: 55,
    defaultHeightCm: 185,
    defaultDepthCm: 55,
    tags: ['lámpara', 'iluminación', 'luz', 'decoración', 'esquina'],
    isVector: true,
    galleryName: 'Banco Virtual CAD y Decoración',
    createdAt: '2026-11-05',
  },
  {
    id: 'res-architectural-plant',
    name: 'Planta arquitectónica en maceta de sala',
    category: 'decor',
    previewUrl: svgArchitecturalPlant,
    fileDataUrl: svgArchitecturalPlant,
    planSvgUrl: svgDecorSquarePlanter,
    fileType: 'svg',
    sourceLicense: 'Paisajismo de interiores',
    defaultWidthCm: 55,
    defaultHeightCm: 130,
    defaultDepthCm: 55,
    tags: ['planta', 'ficus', 'maceta', 'vegetación', 'decoración', 'sala'],
    isVector: true,
    createdAt: '2026-11-04',
  },

  // =============================================================
  // 5. PERSONAS, VITRINAS, PEDESTALES Y ESCULTURAS MUSEOGRÁFICAS
  // =============================================================
  {
    id: 'res-person-standing-1',
    name: 'Visitante contemplando obra',
    category: 'people_standing',
    previewUrl: svgPersonStanding1,
    fileDataUrl: svgPersonStanding1,
    fileType: 'svg',
    sourceLicense: 'Estudio Spaguetty · Escala 1.70m',
    defaultWidthCm: 50,
    defaultHeightCm: 170,
    defaultDepthCm: 45,
    tags: ['persona', 'escala humana', 'visitante', 'adulto', 'pie', 'silueta'],
    isVector: true,
    defaultTintColor: '#171717',
    createdAt: '2026-11-04',
  },
  {
    id: 'res-person-observer-booklet',
    name: 'Visitante con libreta / catálogo',
    category: 'people_standing',
    previewUrl: svgPersonObserverBooklet,
    fileDataUrl: svgPersonObserverBooklet,
    fileType: 'svg',
    sourceLicense: 'Estudio Spaguetty · Escala 1.68m',
    defaultWidthCm: 50,
    defaultHeightCm: 168,
    defaultDepthCm: 45,
    tags: ['persona', 'catálogo', 'guía', 'estudio', 'visita', 'escala'],
    isVector: true,
    defaultTintColor: '#262626',
    createdAt: '2026-11-04',
  },
  {
    id: 'res-couple-standing',
    name: 'Pareja dialogando frente a muro',
    category: 'people_standing',
    previewUrl: svgCoupleStanding,
    fileDataUrl: svgCoupleStanding,
    fileType: 'svg',
    sourceLicense: 'Estudio Spaguetty · Escala 1.75m',
    defaultWidthCm: 80,
    defaultHeightCm: 175,
    defaultDepthCm: 50,
    tags: ['pareja', 'visitantes', 'diálogo', 'grupo', 'escala humana'],
    isVector: true,
    defaultTintColor: '#171717',
    createdAt: '2026-11-04',
  },
  {
    id: 'res-person-seated',
    name: 'Visitante sentado observando',
    category: 'people_seated',
    previewUrl: svgPersonSeated,
    fileDataUrl: svgPersonSeated,
    fileType: 'svg',
    sourceLicense: 'Estudio Spaguetty · Altura sentado 1.25m',
    defaultWidthCm: 65,
    defaultHeightCm: 125,
    defaultDepthCm: 65,
    tags: ['sentado', 'banca', 'descanso', 'observador', 'perfil'],
    isVector: true,
    defaultTintColor: '#171717',
    createdAt: '2026-11-04',
  },
  {
    id: 'res-wheelchair-visitor',
    name: 'Visitante en silla de ruedas',
    category: 'people_wheelchair',
    previewUrl: svgWheelchairVisitor,
    fileDataUrl: svgWheelchairVisitor,
    fileType: 'svg',
    sourceLicense: 'Estudio Spaguetty · Cota accesible 1.25m',
    defaultWidthCm: 85,
    defaultHeightCm: 125,
    defaultDepthCm: 110,
    tags: ['silla de ruedas', 'accesibilidad', 'cota accesible', 'inclusión'],
    isVector: true,
    defaultTintColor: '#171717',
    createdAt: '2026-11-04',
  },
  {
    id: 'res-wall-vitrine',
    name: 'Vitrina mural de acero y cristal',
    category: 'vitrines',
    previewUrl: svgWallVitrine,
    fileDataUrl: svgWallVitrine,
    planSvgUrl: svgShelfDecorPlan,
    fileType: 'svg',
    sourceLicense: 'Mobiliario técnico museo',
    defaultWidthCm: 120,
    defaultHeightCm: 60,
    defaultDepthCm: 35,
    tags: ['vitrina', 'pared', 'cristal', 'expositor', 'objetos'],
    isVector: true,
    createdAt: '2026-11-04',
  },
  {
    id: 'res-freestanding-vitrine',
    name: 'Vitrina exenta con campana acrílica',
    category: 'vitrines',
    previewUrl: svgFreestandingVitrine,
    fileDataUrl: svgFreestandingVitrine,
    planSvgUrl: svgDecorSquareDisplay,
    fileType: 'svg',
    sourceLicense: 'Mobiliario técnico museo',
    defaultWidthCm: 80,
    defaultHeightCm: 160,
    defaultDepthCm: 80,
    tags: ['vitrina exenta', 'campana', 'acrílico', 'plinto', 'expositor'],
    isVector: true,
    createdAt: '2026-11-04',
  },
  {
    id: 'res-sloped-doc-table',
    name: 'Mesa vitrina inclinada para documentos',
    category: 'vitrines',
    previewUrl: svgSlopedDocTable,
    fileDataUrl: svgSlopedDocTable,
    planSvgUrl: svgCoffeeTableSquarePlan,
    fileType: 'svg',
    sourceLicense: 'Mobiliario técnico archivo',
    defaultWidthCm: 100,
    defaultHeightCm: 95,
    defaultDepthCm: 65,
    tags: ['mesa vitrina', 'documentos', 'libros', 'archivo', 'inclinada'],
    isVector: true,
    createdAt: '2026-11-04',
  },
  {
    id: 'res-pedestal-white',
    name: 'Pedestal cubo blanco de galería',
    category: 'pedestals',
    previewUrl: svgPedestalWhite,
    fileDataUrl: svgPedestalWhite,
    planSvgUrl: svgDecorSquareDisplay,
    fileType: 'svg',
    sourceLicense: 'Mobiliario museográfico',
    defaultWidthCm: 45,
    defaultHeightCm: 100,
    defaultDepthCm: 45,
    tags: ['pedestal', 'peana', 'cubo', 'blanco', 'base escultura', 'cuadrado'],
    isVector: true,
    createdAt: '2026-11-04',
  },
  {
    id: 'res-pedestal-with-hood',
    name: 'Pedestal con campana de metacrilato',
    category: 'pedestals',
    previewUrl: svgPedestalWithHood,
    fileDataUrl: svgPedestalWithHood,
    planSvgUrl: svgDecorSquareDisplay,
    fileType: 'svg',
    sourceLicense: 'Mobiliario museográfico',
    defaultWidthCm: 50,
    defaultHeightCm: 140,
    defaultDepthCm: 50,
    tags: ['pedestal', 'campana', 'metacrilato', 'protección', 'objeto'],
    isVector: true,
    createdAt: '2026-11-04',
  },
  {
    id: 'res-museum-bench',
    name: 'Banca arquitectónica de roble y acero',
    category: 'furniture',
    previewUrl: svgMuseumBench,
    fileDataUrl: svgMuseumBench,
    planSvgUrl: svgShelfDecorPlan,
    fileType: 'svg',
    sourceLicense: 'Mobiliario museográfico',
    defaultWidthCm: 160,
    defaultHeightCm: 45,
    defaultDepthCm: 50,
    tags: ['banca', 'asiento', 'mobiliario', 'sala', 'madera', 'acero'],
    isVector: true,
    createdAt: '2026-11-04',
  },
  {
    id: 'res-barrier-posts',
    name: 'Postes catenaria de seguridad con cordón',
    category: 'furniture',
    previewUrl: svgBarrierPosts,
    fileDataUrl: svgBarrierPosts,
    fileType: 'svg',
    sourceLicense: 'Seguridad museográfica',
    defaultWidthCm: 100,
    defaultHeightCm: 85,
    defaultDepthCm: 35,
    tags: ['catenaria', 'postes', 'separador', 'seguridad', 'cordón'],
    isVector: true,
    createdAt: '2026-11-04',
  },
  {
    id: 'res-sculpture-bust',
    name: 'Busto clásico sobre peana',
    category: 'sculptures',
    previewUrl: svgSculptureBust,
    fileDataUrl: svgSculptureBust,
    fileType: 'svg',
    sourceLicense: 'Patrimonio escultórico clásico',
    defaultWidthCm: 40,
    defaultHeightCm: 55,
    defaultDepthCm: 40,
    tags: ['escultura', 'busto', 'mármol', 'pieza tridimensional'],
    isVector: true,
    createdAt: '2026-11-04',
  },
  {
    id: 'res-archaeological-vessel',
    name: 'Cerámica arqueológica / ánfora',
    category: 'sculptures',
    previewUrl: svgArchaeologicalVessel,
    fileDataUrl: svgArchaeologicalVessel,
    fileType: 'svg',
    sourceLicense: 'Colección arqueológica',
    defaultWidthCm: 35,
    defaultHeightCm: 45,
    defaultDepthCm: 35,
    tags: ['cerámica', 'ánfora', 'arqueología', 'vasija', 'objeto'],
    isVector: true,
    createdAt: '2026-11-04',
  },
  {
    id: 'res-didactic-panel',
    name: 'Panel didáctico textil con texto curatorial',
    category: 'signage',
    previewUrl: svgDidacticPanel,
    fileDataUrl: svgDidacticPanel,
    fileType: 'svg',
    sourceLicense: 'Gráfica de sala',
    defaultWidthCm: 60,
    defaultHeightCm: 90,
    defaultDepthCm: 10,
    tags: ['panel', 'texto de sala', 'didáctico', 'curatorial', 'cartela'],
    isVector: true,
    createdAt: '2026-11-04',
  },
  {
    id: 'res-lighting-track',
    name: 'Carril de iluminación con proyectores orientables',
    category: 'architecture',
    previewUrl: svgLightingTrack,
    fileDataUrl: svgLightingTrack,
    fileType: 'svg',
    sourceLicense: 'Instalación luminotécnica de museo',
    defaultWidthCm: 240,
    defaultHeightCm: 32,
    defaultDepthCm: 25,
    tags: ['iluminación', 'focos', 'carril', 'spotlight', 'luz de acento'],
    isVector: true,
    createdAt: '2026-11-04',
  },
  {
    id: 'res-architectural-column',
    name: 'Columna / pilastra lateral de hormigón',
    category: 'architecture',
    previewUrl: svgArchitecturalColumn,
    fileDataUrl: svgArchitecturalColumn,
    fileType: 'svg',
    sourceLicense: 'Estructura arquitectónica',
    defaultWidthCm: 40,
    defaultHeightCm: 260,
    defaultDepthCm: 40,
    tags: ['columna', 'pilastra', 'hormigón', 'estructura', 'remate'],
    isVector: true,
    createdAt: '2026-11-04',
  },
];

// -------------------------------------------------------------
// INDEXEDDB REPOSITORY FOR GRAPHIC RESOURCES
// -------------------------------------------------------------
const DB_NAME = 'SpaguettyHouseDB';
const DB_VERSION = 2;
const RESOURCE_STORE = 'graphic_resources';

function openGraphicDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects');
      }
      if (!db.objectStoreNames.contains(RESOURCE_STORE)) {
        db.createObjectStore(RESOURCE_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGraphicResourcesToDB(resources: GraphicResource[]): Promise<void> {
  try {
    const db = await openGraphicDB();
    const tx = db.transaction(RESOURCE_STORE, 'readwrite');
    const store = tx.objectStore(RESOURCE_STORE);
    for (const res of resources) {
      store.put(res);
    }
  } catch (err) {
    console.warn('Could not persist to graphic_resources IndexedDB:', err);
  }
}

export async function loadGraphicResourcesFromDB(): Promise<GraphicResource[]> {
  try {
    const db = await openGraphicDB();
    return new Promise((resolve) => {
      const tx = db.transaction(RESOURCE_STORE, 'readonly');
      const req = tx.objectStore(RESOURCE_STORE).getAll();
      req.onsuccess = () => {
        const stored = (req.result as GraphicResource[]) || [];
        resolve(stored);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export function guessCategoryFromFilename(filename: string): GraphicResourceCategory {
  const lower = filename.toLowerCase();
  if (lower.includes('mesa') || lower.includes('table') || lower.includes('restauran') || lower.includes('barra') || lower.includes('booth') || lower.includes('cafet')) return 'restaurant_tables';
  if (lower.includes('cuadrado') || lower.includes('isla') || lower.includes('square') || lower.includes('cubo')) return 'decor_squares';
  if (lower.includes('repisa') || lower.includes('estant') || lower.includes('shelf') || lower.includes('nicho')) return 'shelves';
  if (lower.includes('silla de ruedas') || lower.includes('wheelchair') || lower.includes('accesib')) return 'people_wheelchair';
  if (lower.includes('sentad') || lower.includes('seated')) return 'people_seated';
  if (lower.includes('person') || lower.includes('silueta') || lower.includes('humano') || lower.includes('figura')) return 'people_standing';
  if (lower.includes('vitrina') || lower.includes('display') || lower.includes('case')) return 'vitrines';
  if (lower.includes('pedestal') || lower.includes('plinto') || lower.includes('peana') || lower.includes('base')) return 'pedestals';
  if (lower.includes('banco') || lower.includes('banca') || lower.includes('sillon') || lower.includes('mueble') || lower.includes('catenaria') || lower.includes('poste') || lower.includes('barrera')) return 'furniture';
  if (lower.includes('escultura') || lower.includes('busto') || lower.includes('vasija') || lower.includes('ánfora') || lower.includes('objeto') || lower.includes('arqueol')) return 'sculptures';
  if (lower.includes('marco') || lower.includes('portarretrato') || lower.includes('frame')) return 'frames';
  if (lower.includes('panel') || lower.includes('cartela') || lower.includes('texto') || lower.includes('señal') || lower.includes('didactico')) return 'signage';
  if (lower.includes('columna') || lower.includes('foco') || lower.includes('iluminac') || lower.includes('riel') || lower.includes('techo') || lower.includes('arquit')) return 'architecture';
  if (lower.includes('planta') || lower.includes('decor') || lower.includes('flor') || lower.includes('maceta') || lower.includes('alfombra') || lower.includes('lampara')) return 'decor';
  return 'artworks';
}

/**
 * Unzips a user-uploaded ZIP file containing SVGs, PNGs, JPGs, or WEBPs
 * and converts them into imported GraphicResource items.
 */
export async function extractZipGraphicResources(zipFile: File): Promise<GraphicResource[]> {
  const zip = new JSZip();
  const loaded = await zip.loadAsync(zipFile);
  const results: GraphicResource[] = [];

  const validExts = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];

  for (const relativePath of Object.keys(loaded.files)) {
    const file = loaded.files[relativePath];
    if (file.dir) continue;
    const lower = relativePath.toLowerCase();
    const isImage = validExts.some((ext) => lower.endsWith(ext));
    if (!isImage) continue;

    const cleanBaseName = relativePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Recurso Importado';
    let fileType: 'svg' | 'png' | 'jpg' | 'webp' = 'png';
    if (lower.endsWith('.svg')) fileType = 'svg';
    else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) fileType = 'jpg';
    else if (lower.endsWith('.webp')) fileType = 'webp';

    let dataUrl = '';
    if (fileType === 'svg') {
      const text = await file.async('text');
      dataUrl = svgToDataUrl(text);
    } else {
      const base64 = await file.async('base64');
      const mime = fileType === 'jpg' ? 'image/jpeg' : `image/${fileType}`;
      dataUrl = `data:${mime};base64,${base64}`;
    }

    const category = guessCategoryFromFilename(cleanBaseName);
    const id = `res-zip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Default dimensions based on category
    let defaultW = 50;
    let defaultH = 70;
    if (category.startsWith('people')) {
      defaultW = 50;
      defaultH = 170;
    } else if (category === 'vitrines') {
      defaultW = 100;
      defaultH = 140;
    } else if (category === 'pedestals') {
      defaultW = 40;
      defaultH = 100;
    } else if (category === 'furniture') {
      defaultW = 140;
      defaultH = 45;
    }

    results.push({
      id,
      name: cleanBaseName,
      category,
      previewUrl: dataUrl,
      fileDataUrl: dataUrl,
      fileType,
      sourceLicense: `Paquete ZIP: ${zipFile.name}`,
      defaultWidthCm: defaultW,
      defaultHeightCm: defaultH,
      tags: [category, fileType, cleanBaseName.toLowerCase()],
      isVector: fileType === 'svg',
      defaultTintColor: fileType === 'svg' ? '#171717' : undefined,
      galleryName: zipFile.name.replace(/\.[^/.]+$/, ''),
      createdAt: new Date().toISOString().slice(0, 10),
    });
  }

  return results;
}
