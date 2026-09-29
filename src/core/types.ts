// 图形数据类型定义（占位）
export type ShapeType = 'rect' | 'circle' | 'ellipse' | 'path';

export interface BaseShape {
    id: string;
    type: ShapeType;
    fill: string;
    stroke: string;
    strokeWidth: number;
}

export interface RectShape extends BaseShape {
    type: 'rect';
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CircleShape extends BaseShape {
    type: 'circle';
    cx: number;
    cy: number;
    r: number;
}

export type Shape = RectShape | CircleShape;
export type ShapePatch = Partial<RectShape> | Partial<CircleShape>;
export interface CanvasSize {
    width: number;
    height: number;
}