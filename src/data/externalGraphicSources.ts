/**
 * External Architectural & Museographic Libraries Catalog
 * Directly referenced in Spaguetty House Exhibition Planner.
 */

export interface ExternalGraphicSource {
  id: string;
  name: string;
  category: 'people' | 'museum' | 'restaurant' | 'general' | 'open_access';
  categoryLabel: string;
  description: string;
  formats: ('DWG' | 'DXF' | 'SVG' | 'PNG' | 'JPG')[];
  freeTier: string;
  recommendedUse: string;
  url: string;
  featured?: boolean;
}

export const EXTERNAL_GRAPHIC_SOURCES: ExternalGraphicSource[] = [
  // --- PERSONAS Y VISITANTES ---
  {
    id: 'cadblock-people',
    name: 'CADBlock.org · Personas y Escalas',
    category: 'people',
    categoryLabel: 'Personas y Visitantes',
    description: '183 bloques CAD de figuras humanas de pie, sentadas, caminando y en grupos, disponibles en planta y elevación.',
    formats: ['DWG', 'DXF', 'SVG', 'PNG'],
    freeTier: 'Descarga gratuita sin registro obligatorio.',
    recommendedUse: 'Escala humana arquitectónica en muros de elevación (1.60m - 1.80m) y distribución de público en planta.',
    url: 'https://cadblock.org/people/',
    featured: true,
  },
  {
    id: 'cadfigures',
    name: 'CAD Figures · Siluetas Arquitectónicas',
    category: 'people',
    categoryLabel: 'Personas y Visitantes',
    description: 'Más de 80 personas en vector para elevaciones arquitectónicas: niños, adultos mayores, diversidad funcional y accesibilidad.',
    formats: ['DWG', 'SVG'],
    freeTier: 'Gratuito con cuenta básica.',
    recommendedUse: 'Alzados limpios con trazo vectorial de alta fidelidad para verificar líneas de visión y alturas inclusivas.',
    url: 'https://cadfigures.com/',
    featured: true,
  },
  {
    id: 'archstudent-people',
    name: 'ArchStudent · Cutout People',
    category: 'people',
    categoryLabel: 'Personas y Visitantes',
    description: 'Siluetas de personas recortadas con fondo transparente en formato SVG y PNG de alta resolución.',
    formats: ['SVG', 'PNG'],
    freeTier: 'Descarga libre directa.',
    recommendedUse: 'Referencia visual ligera que no satura el dibujo técnico de las obras.',
    url: 'https://archstudent.com/resources/cutout-people/',
    featured: false,
  },

  // --- MUSEOGRAFÍA, GALERÍAS Y EXPOSICIÓN ---
  {
    id: 'cadxchange-gallery',
    name: 'CADXChange · Gallery & Art Studio',
    category: 'museum',
    categoryLabel: 'Galerías y Museografía',
    description: '136 bloques técnicos para museos y galerías: vitrinas de campana, pedestales, muros modulares, marcos, bancos y señalética.',
    formats: ['DWG', 'DXF'],
    freeTier: 'Descarga gratuita directa en DWG/DXF.',
    recommendedUse: 'Equipamiento museográfico formal, peanas escultóricas y protección de obras con vitrinas.',
    url: 'https://cadxchange.net/resources/symbol-libraries/gallery-art-studio-layout-symbols',
    featured: true,
  },
  {
    id: 'cadxchange-restaurant',
    name: 'CADXChange · Restaurant & Bar',
    category: 'restaurant',
    categoryLabel: 'Restaurante y Cafetería',
    description: 'Mobiliario para hostelería y áreas gastronómicas: mesas cuadradas y redondas, booths, barras con taburetes y estaciones de servicio.',
    formats: ['DWG', 'DXF'],
    freeTier: 'Descarga gratuita en DWG/DXF.',
    recommendedUse: 'Zonificación de la cafetería de la galería y mesas bistró en planta 2D y elevación.',
    url: 'https://cadxchange.net/resources/symbol-libraries/restaurant-bar-layout-symbols',
    featured: true,
  },
  {
    id: 'cadtorial-artgallery',
    name: 'Cadtorial · Art Gallery CAD Blocks',
    category: 'museum',
    categoryLabel: 'Galerías y Museografía',
    description: '52 bloques CAD especializados en museografía: vitrinas iluminadas, rieles de proyectores, cordones catenaria y cartelas.',
    formats: ['DWG'],
    freeTier: 'Descarga directa libre de bloques individuales.',
    recommendedUse: 'Iluminación superior dirigida y barreras de distanciamiento para obras delicadas.',
    url: 'https://cadtorial.com/blocks/art-gallery',
    featured: false,
  },

  // --- MODELADO Y VECTORES GENERALES ---
  {
    id: 'sketchup-3dwarehouse',
    name: 'SketchUp 3D Warehouse',
    category: 'general',
    categoryLabel: 'Mobiliario y 3D',
    description: 'Millones de modelos de mobiliario de diseño, mamparas, vitrinas comerciales y personas en 2D/3D.',
    formats: ['DWG', 'PNG', 'JPG'],
    freeTier: 'Acceso gratuito con cuenta Trimble.',
    recommendedUse: 'Importación de vistas frontales de mobiliario contemporáneo y piezas especiales.',
    url: 'https://3dwarehouse.sketchup.com/',
    featured: false,
  },
  {
    id: 'svgrepo-vectors',
    name: 'SVG Repo · Vectores Abiertos',
    category: 'general',
    categoryLabel: 'Iconografía y Vectores',
    description: 'Más de 500,000 vectores limpios monocromáticos en SVG optimizado bajo licencias abiertas (CC0 / MIT).',
    formats: ['SVG'],
    freeTier: 'Completamente gratuito sin atribución obligatoria.',
    recommendedUse: 'Iconos de señalética de sala, flechas direccionales, pictogramas de accesibilidad y símbolos de sala.',
    url: 'https://www.svgrepo.com/',
    featured: false,
  },

  // --- MUSEOS Y PATRIMONIO DE DOMINIO PÚBLICO (OPEN ACCESS) ---
  {
    id: 'met-open-access',
    name: 'The Met · Open Access Collection',
    category: 'open_access',
    categoryLabel: 'Obras de Dominio Público',
    description: 'Más de 492,000 imágenes de alta resolución de obras de arte libres de derechos (CC0) del Museo Metropolitano de Arte.',
    formats: ['JPG', 'PNG'],
    freeTier: 'Dominio Público (Creative Commons Zero - CC0).',
    recommendedUse: 'Incorporación de pinturas maestras, marcos históricos y piezas de referencia para montajes museográficos.',
    url: 'https://www.metmuseum.org/art/collection/search?showOnly=openAccess',
    featured: true,
  },
  {
    id: 'smithsonian-open-access',
    name: 'Smithsonian Open Access',
    category: 'open_access',
    categoryLabel: 'Obras de Dominio Público',
    description: '4.5 millones de imágenes 2D y modelos 3D de colecciones históricas, científicas y artísticas de los museos Smithsonian.',
    formats: ['JPG', 'PNG', 'SVG'],
    freeTier: 'CC0 Dominio Público libre para cualquier uso.',
    recommendedUse: 'Objetos etnográficos, esculturas, especímenes y piezas para vitrinas y pedestales.',
    url: 'https://www.si.edu/openaccess',
    featured: false,
  },
  {
    id: 'artic-open-access',
    name: 'Art Institute of Chicago · Open Access',
    category: 'open_access',
    categoryLabel: 'Obras de Dominio Público',
    description: 'Miles de obras icónicas de arte impresionista, moderno y fotografía con descargas en alta definición.',
    formats: ['JPG'],
    freeTier: 'CC0 Dominio Público.',
    recommendedUse: 'Fotografías históricas y obras clave para exposiciones temáticas.',
    url: 'https://www.artic.edu/collection?is_public_domain=1',
    featured: false,
  },
];
