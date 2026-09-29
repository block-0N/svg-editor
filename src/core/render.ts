// SVG 渲染逻辑（占位）
import type { Shape } from './types';

export function shapeToSvgProps(shape: Shape): Record<string, unknown> {
    return { ...shape };
}