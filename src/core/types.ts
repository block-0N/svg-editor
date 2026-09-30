export type ShapeType =
    | 'rect' | 'circle' | 'ellipse' | 'line'
    | 'polygon' | 'star' | 'path';

export interface BaseShape {
    id: string;
    type: ShapeType;
    fill: string;
    stroke: string;
    strokeWidth: number;
    rotation: number;
    opacity: number;
}

export interface RectShape extends BaseShape {
    type: 'rect';
    x: number; y: number; width: number; height: number;
}
export interface CircleShape extends BaseShape {
    type: 'circle';
    cx: number; cy: number; r: number;
}
export interface EllipseShape extends BaseShape {
    type: 'ellipse';
    cx: number; cy: number; rx: number; ry: number;
}
export interface LineShape extends BaseShape {
    type: 'line';
    x1: number; y1: number; x2: number; y2: number;
}
export interface PolygonShape extends BaseShape {
    type: 'polygon';
    cx: number; cy: number; radius: number; sides: number;
}
export interface StarShape extends BaseShape {
    type: 'star';
    cx: number; cy: number;
    outerRadius: number; innerRadius: number; points: number;
}
export interface PathShape extends BaseShape {
    type: 'path';
    points: [number, number][];
}

export type Shape =
    | RectShape | CircleShape | EllipseShape | LineShape
    | PolygonShape | StarShape | PathShape;

export interface ShapePatch {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    rotation?: number;
    opacity?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    cx?: number;
    cy?: number;
    r?: number;
    rx?: number;
    ry?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    radius?: number;
    sides?: number;
    outerRadius?: number;
    innerRadius?: number;
    points?: [number, number][] | number;
}

export interface CanvasSize { width: number; height: number; }