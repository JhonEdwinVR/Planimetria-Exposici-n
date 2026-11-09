export type WallMaterial =
  | 'white'
  | 'gray'
  | 'black'
  | 'concrete'
  | 'brick'
  | 'parchment'
  | 'wood'
  | 'custom';

export type ItemType =
  | 'photo'
  | 'text'
  | 'title'
  | 'description'
  | 'frame'
  | 'portrait_stand'
  | 'decor'
  | 'reference';

export type FrameStyle =
  | 'none'
  | 'black'
  | 'white'
  | 'wood'
  | 'aluminum'
  | 'parchment'
  | 'portrait_stand';

export type DecorKind = 'lamp' | 'pedestal' | 'bench' | 'plant' | 'vinyl_cut';

export type ViewMode =
  | 'plan'
  | 'elevation'
  | 'presentation'
  | 'compare'
  | 'inventory';

export interface Vertex {
  id: string;
  x: number; // meters from origin (left)
  y: number; // meters from origin (top)
  label?: string;
}

export interface BackgroundPlanSettings {
  imageUrl?: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 1
  scale: number; // Scale multiplier (1.0 default)
  xOffsetM: number; // Offset in meters
  yOffsetM: number; // Offset in meters
  rotationDeg: number; // Rotation in degrees (0, 90, 180, 270, etc.)
  calibratedDistanceM?: number; // Distance in meters used for calibration
}

export interface PlanAnnotation {
  id: string;
  text: string;
  xM: number;
  yM: number;
  fontSize: number; // e.g. 11, 14, 18
  color: string;
  rotation: number;
  locked: boolean;
  visible: boolean;
  zoneId?: string;
  wallId?: string;
  scope?: 'project' | 'zone' | 'wall' | 'item';
  targetItemId?: string;
}

export interface TrashItem {
  id: string;
  type: 'zone' | 'wall' | 'item' | 'layer' | 'annotation';
  name: string;
  deletedAt: string;
  description?: string;
  data: any;
}

export interface Zone {
  id: string;
  name: string;
  participant: string;
  roleOrNote: string;
  description?: string;
  color: string;
  expanded: boolean;
  visible: boolean;
  locked: boolean;
  order?: number;
  perimeter?: { x: number; y: number }[];
  wallIds?: string[];

  // Independent Space Label Properties
  labelX?: number; // Position X in meters on floor plan
  labelY?: number; // Position Y in meters on floor plan
  labelFontSize?: number; // Font size in px
  labelColor?: string; // Hex color
  labelRotation?: number; // Rotation in degrees
  labelLocked?: boolean;
  labelVisible?: boolean;
}

export interface Wall {
  id: string;
  zoneId: string;
  name: string;
  participant: string;
  startVertexId: string;
  endVertexId: string;
  lengthM: number; // Real length in meters
  heightM: number; // Real height in meters (default 2.60 provisional if unconfirmed)
  heightConfirmed: boolean;
  thicknessCm: number; // Wall thickness in cm (e.g. 15 cm)
  color: string; // Hex color when custom or base tint
  material: WallMaterial;
  visible: boolean;
  locked: boolean;
  orientation: 'horizontal' | 'vertical' | 'angled';
  normalSide: 'top' | 'bottom' | 'left' | 'right'; // Which side of the wall is the exhibition face
  defaultSpacingCm: number;
  pendingVerificationId?: string;
  notes?: string;
  source?: 'manual' | 'drawn' | 'dimension' | 'perimeter';
  isPerimeterLinked?: boolean;
  dimensionLabel?: string; // Custom dimension text (e.g. '5.50 m aprox', 'Longitud Total')
  dimOffset?: number; // Custom distance offset in px for dimension line
  linkedWallId?: string; // ID of opposite face wall when used as a double-sided shared wall
  faceLabel?: string; // e.g. 'Cara A' or 'Cara B'
  secondaryZoneId?: string; // Second space/section where this double-sided wall also appears
  secondaryParticipant?: string; // Participant assigned to the opposite face
}

export type GraphicResourceCategory =
  | 'restaurant_tables'
  | 'decor_squares'
  | 'shelves'
  | 'decor'
  | 'furniture'
  | 'vitrines'
  | 'pedestals'
  | 'sculptures'
  | 'people_standing'
  | 'people_seated'
  | 'people_wheelchair'
  | 'artworks'
  | 'frames'
  | 'signage'
  | 'architecture';

export type LayerKey =
  | 'backgroundPlan'
  | 'architecture'
  | 'walls'
  | 'zoneLabels'
  | 'dimensions'
  | 'artworks'
  | 'people'
  | 'furniture'
  | 'objects'
  | 'texts'
  | 'decor'
  | 'references'
  | (string & {});

export interface LayerState {
  id: string; // Standard LayerKey or custom id
  name: string;
  visible: boolean;
  locked: boolean;
  opacity?: number;
  isCustom?: boolean;
  isStructural?: boolean; // Structural layers cannot be deleted
  order?: number;
}

export interface GraphicResource {
  id: string;
  name: string;
  category: GraphicResourceCategory;
  previewUrl: string;
  fileDataUrl: string;
  planSvgUrl?: string; // Top-down architectural CAD symbol for 2D floor plan
  fileType: 'svg' | 'png' | 'jpg' | 'webp' | 'dxf';
  sourceLicense: string;
  defaultWidthCm: number;
  defaultHeightCm: number;
  defaultDepthCm?: number;
  tags: string[];
  isVector: boolean;
  defaultTintColor?: string;
  isPendingPlaceholder?: boolean;
  galleryName?: string;
  createdAt: string;
}

export interface FloorPlanElement {
  id: string;
  resourceId?: string;
  name: string;
  category: GraphicResourceCategory;
  zoneId?: string;
  xM: number; // Center X in meters on floor plan
  yM: number; // Center Y in meters on floor plan
  widthCm: number; // Width in cm on floor plan
  depthCm: number; // Depth/Length in cm on floor plan
  heightCm?: number; // Height in cm for elevation reference
  rotation: number; // Rotation in degrees
  color?: string;
  tintColor?: string;
  planSvgUrl?: string;
  previewUrl?: string;
  imageUrl?: string;
  layerId?: LayerKey;
  visible: boolean;
  locked: boolean;
  notes?: string;
}

export type TextBlockType = 'curatorial' | 'cedula' | 'free';

export interface WallItem {
  id: string;
  wallId: string;
  zoneId: string;
  name: string;
  code: string;
  type: ItemType;
  widthCm: number; // Width in cm
  heightCm: number; // Height in cm
  xCm: number; // Horizontal position from left edge of wall (cm)
  yCm: number; // Vertical position from floor (cm)
  rotation: number; // Degrees
  frameStyle: FrameStyle;
  matWidthCm: number; // Interior paspartú margin in cm
  description: string;
  textContent?: string;
  imageUrl?: string;
  locked: boolean;
  visible: boolean;
  groupId?: string;
  aspectRatioLocked: boolean;
  decorKind?: DecorKind;
  normalSide?: 'top' | 'bottom' | 'left' | 'right'; // Optional per-artwork facing direction in floor plan

  // Museographic Elevation Resource Extension
  resourceId?: string;
  category?: GraphicResourceCategory;
  layerId?: LayerKey;
  isVector?: boolean;
  tintColor?: string;
  flipHorizontal?: boolean;
  opacity?: number;
  depthCm?: number;
  isPendingReplacement?: boolean;
  zOrder?: number;

  // Independent Museum Text & Cedula Extension
  textType?: TextBlockType;
  textTitle?: string;
  textAuthor?: string;
  textDate?: string;
  textTechnique?: string;
  fontFamily?: 'sans' | 'serif' | 'mono' | string;
  fontSizePt?: number;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | string;
  italic?: boolean;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  textColor?: string;
  showBackground?: boolean;
  backgroundColor?: string;
  showBorder?: boolean;
  borderColor?: string;
  borderWidth?: number;
  paddingCm?: number;
  scope?: 'project' | 'zone' | 'wall' | 'item';
  linkedArtworkId?: string;
}

export type PresentationModeKind =
  | 'single_wall'
  | 'multi_wall'
  | 'guided_tour'
  | 'plan';

export interface MultiWallCompositeConfig {
  artistName?: string;
  wallIds: string[];
  visualGapCm: number; // visual separation between walls in centimeters (default 40 cm)
  showDimensions: boolean; // default true
  showWallNames: boolean; // default true
  showPhysicalSeparationPill: boolean; // default true
}

export interface WallText extends WallItem {
  type: 'text';
  textType: TextBlockType;
}

export interface PendingVerification {
  id: string;
  title: string;
  description: string;
  wallId: string;
  parameter: 'lengthM' | 'heightM';
  currentValue: number;
  unit: string;
  options: {
    label: string;
    value: number;
    description: string;
  }[];
  resolved: boolean;
}

export interface LibraryImage {
  id: string;
  name: string;
  participant: string;
  dataUrl: string;
  defaultWidthCm: number;
  defaultHeightCm: number;
  galleryName?: string;
  tags?: string[];
  createdAt: string;
}

export interface ProposalSnapshot {
  id: string;
  name: string;
  createdAt: string;
  description: string;
  vertices: Vertex[];
  walls: Wall[];
  items: WallItem[];
}

export interface LayerVisibility {
  walls: boolean;
  dimensions: boolean;
  participants: boolean;
  photos: boolean;
  texts: boolean;
  decor: boolean;
  grid: boolean;
  guides: boolean;
  referenceOverlay: boolean;
  // Dynamic Elevation Layers
  architecture?: boolean;
  people?: boolean;
  furniture?: boolean;
  objects?: boolean;
}

export interface ValidationIssue {
  id: string;
  wallId: string;
  itemIds: string[];
  type: 'overflow_right' | 'overflow_left' | 'overflow_top' | 'overflow_bottom' | 'overlap';
  severity: 'error' | 'warning';
  message: string;
}

export interface ExhibitionProject {
  projectName: string;
  subtitle: string;
  version: string;
  updatedAt: string;
  zones: Zone[];
  vertices: Vertex[];
  walls: Wall[];
  items: WallItem[];
  planElements?: FloorPlanElement[];
  verifications: PendingVerification[];
  library: LibraryImage[];
  graphicLibrary?: GraphicResource[];
  layerStates?: LayerState[];
  snapshots: ProposalSnapshot[];
  referenceImageUrl?: string;
  referenceOpacity: number;
  backgroundPlan?: BackgroundPlanSettings;
  annotations?: PlanAnnotation[];
  trash?: TrashItem[];
}

