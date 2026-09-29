// 图形状态管理（占位）
import type { Shape } from './types';

export const initialShapes: Shape[] = [];

export function addShape(shapes: Shape[], shape: Shape): Shape[] {
    return [...shapes, shape];
}

export function removeShape(shapes: Shape[], id: string): Shape[] {
    return shapes.filter((s) => s.id !== id);
}