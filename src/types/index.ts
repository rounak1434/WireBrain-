export type ElementType =
  | 'frame-desktop'
  | 'frame-mobile'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'cylinder'
  | 'cloud'
  | 'service'
  | 'queue'
  | 'button'
  | 'input'
  | 'image'
  | 'text';

export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left' | 'center';

export type PrototypeActionType = 'none' | 'navigate' | 'modal' | 'back' | 'alert';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  secondaryText?: string;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  opacity?: number;
  fontSize?: number;
  fontWeight?: 'normal' | '500' | '600' | '700';
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'card' | 'badge';
  urlBar?: string;
  locked?: boolean;
  hidden?: boolean;
  prototypeAction?: PrototypeActionType;
  prototypeTarget?: string; // target board ID, frame ID, or modal title
  prototypePayload?: string;
  groupId?: string;
  groupName?: string;
  responsiveVisibility?: { desktop?: boolean; tablet?: boolean; mobile?: boolean };
  responsiveWidth?: 'fixed' | 'fill' | 'hug';
  customData?: Record<string, any>;
  assetId?: string;
  src?: string;
  imageFit?: 'contain' | 'cover' | 'fill';
  aspectRatioLocked?: boolean;
  autoSize?: boolean;
  originalWidth?: number;
  originalHeight?: number;
}

export interface Connector {
  id: string;
  fromId: string;
  toId: string;
  fromAnchor: AnchorPosition;
  toAnchor: AnchorPosition;
  label?: string;
  color: string;
  strokeWidth: number;
  style: 'orthogonal' | 'straight' | 'curved';
  dashed?: boolean;
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

export interface ProjectAsset {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64 data URL
  size: number;
  width?: number;
  height?: number;
  createdAt: number;
}

export interface ReusableComponentDefinition {
  id: string;
  name: string;
  category: string;
  description?: string;
  elements: CanvasElement[];
  createdAt: number;
}

export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    baseFontSize: number;
  };
  spacing: {
    gridSize: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    full: number;
  };
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  elements: CanvasElement[];
  connectors: Connector[];
  createdAt: number;
  updatedAt: number;
  boardType?: 'website' | 'mobile' | 'system' | 'flowchart' | 'custom';
  viewportPreset?: 'desktop' | 'tablet' | 'mobile' | 'responsive';
}

export interface Project {
  id: string;
  name: string;
  version: string;
  boards: Board[];
  activeBoardId: string;
  assets?: Record<string, ProjectAsset>;
  reusableComponents?: ReusableComponentDefinition[];
  designTokens?: DesignTokens;
}

export type ToolMode =
  | 'select'
  | 'pan'
  | 'connector'
  | 'text'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'cylinder'
  | 'cloud'
  | 'service'
  | 'button'
  | 'input'
  | 'image'
  | 'frame-desktop'
  | 'frame-mobile';

export type ActiveSidebarTab = 'boards' | 'elements' | 'layers' | 'examples' | 'tutorial' | 'shortcuts';

export type ThemeMode = 'pure-black' | 'midnight';

export type EditorMode = 'edit' | 'simulate' | 'prototype';

export interface SimulationStep {
  stepNumber: number;
  sourceNodeId: string;
  targetNodeId?: string;
  connectorId?: string;
  title: string;
  description: string;
  protocol?: string;
  payload?: string;
  response?: string;
  decisionCondition?: string;
  decisionOutcome?: string;
  latency?: string;
  status?: string;
}

export interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  steps: SimulationStep[];
}

