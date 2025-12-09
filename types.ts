
export enum Page {
  DASHBOARD = 'DASHBOARD',
  NOVA_BOARD = 'NOVA_BOARD',
  TASKS = 'TASKS',
  TIMELINE = 'TIMELINE',
  RESOURCES = 'RESOURCES',
  NOTES = 'NOTES',
  SHEETS = 'SHEETS',
  SETTINGS = 'SETTINGS'
}

export enum ShapeType {
  TASK = 'TASK',
  IDEA = 'IDEA',
  DATA = 'DATA',
  TEXT = 'TEXT',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  NOTE = 'NOTE',
  SHEET = 'SHEET',
  IMAGE = 'IMAGE',
  VOICE = 'VOICE'
}

export type ToolType = 
  | 'SELECT' 
  | 'HAND' 
  | 'CONNECTOR' 
  | ShapeType;

export type Side = 'top' | 'right' | 'bottom' | 'left';

export type ConnectionStyle = 'solid' | 'dashed' | 'dotted' | 'double';

export interface Connection {
  targetId: string;
  sourceSide?: Side;
  targetSide?: Side;
  style?: ConnectionStyle;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'audio';
  url: string; // Base64 data URL
  mimeType: string;
  name?: string;
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  email?: string;
  status?: 'active' | 'busy' | 'offline';
  initials?: string;
}

export interface ShapeStyling {
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  // Text styling properties
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  listStyle?: 'none' | 'bullet' | 'numbered';
}

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  connections: Connection[]; 
  groupId?: string; // Identifier for grouped shapes
  expandedNodeIds?: string[]; // IDs of nodes generated from subtasks
  // Task specific fields
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  startDate?: number; // Timestamp
  dueDate?: number;   // Timestamp
  subtasks?: Subtask[];
  hideSubtasks?: boolean;
  assignee?: string;
  attachments?: Attachment[];
  // Styling
  color?: string; // Legacy: Background color override
  locked?: boolean;
  opacity?: number;
  styling?: ShapeStyling; // New specific styling
  // Complex Data (for Sheets/Notes)
  content?: any;
}

export interface Point {
  x: number;
  y: number;
}

export interface Board {
  id: string;
  title: string;
  shapes: Shape[];
  lastModified: number;
  thumbnail?: string; // Optional for future use
}
