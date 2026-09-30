import type { Shape } from './types';

export function getShapeCenter(s: Shape): { x: number; y: number } {
    switch (s.type) {
        case 'rect': return { x: s.x + s.width / 2, y: s.y + s.height / 2 };
        case 'circle':
        case 'ellipse': return { x: s.cx, y: s.cy };
        case 'line': return { x: (s.x1 + s.x2) / 2, y: (s.y1 + s.y2) / 2 };
        case 'polygon':
        case 'star': return { x: s.cx, y: s.cy };
        case 'path': {
            if (!s.points.length) return { x: 0, y: 0 };
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const [x, y] of s.points) {
                if (x < minX) minX = x; if (y < minY) minY = y;
                if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            }
            return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        }
    }
}

export function getShapeBounds(s: Shape) {
    switch (s.type) {
        case 'rect':
            return { x: s.x, y: s.y, width: s.width, height: s.height };
        case 'circle':
            return { x: s.cx - s.r, y: s.cy - s.r, width: s.r * 2, height: s.r * 2 };
        case 'ellipse':
            return { x: s.cx - s.rx, y: s.cy - s.ry, width: s.rx * 2, height: s.ry * 2 };
        case 'line':
            return {
                x: Math.min(s.x1, s.x2), y: Math.min(s.y1, s.y2),
                width: Math.abs(s.x2 - s.x1), height: Math.abs(s.y2 - s.y1),
            };
        case 'polygon':
            return { x: s.cx - s.radius, y: s.cy - s.radius, width: s.radius * 2, height: s.radius * 2 };
        case 'star':
            return {
                x: s.cx - s.outerRadius, y: s.cy - s.outerRadius,
                width: s.outerRadius * 2, height: s.outerRadius * 2,
            };
        case 'path': {
            if (!s.points.length) return { x: 0, y: 0, width: 0, height: 0 };
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const [x, y] of s.points) {
                if (x < minX) minX = x; if (y < minY) minY = y;
                if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            }
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
    }
}

export function polygonPoints(cx: number, cy: number, r: number, sides: number): [number, number][] {
    const pts: [number, number][] = [];
    const start = -Math.PI / 2;
    for (let i = 0; i < sides; i++) {
        const a = start + (Math.PI * 2 * i) / sides;
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
}

export function starPoints(
    cx: number, cy: number, outer: number, inner: number, points: number,
): [number, number][] {
    const pts: [number, number][] = [];
    const total = points * 2;
    const start = -Math.PI / 2;
    for (let i = 0; i < total; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = start + (Math.PI * 2 * i) / total;
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
}

export function pointsToPathD(points: [number, number][]): string {
    if (!points.length) return '';
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) d += ` L ${points[i][0]} ${points[i][1]}`;
    return d;
}

export function attrsToArray(el: Element, attr: string): [number, number][] {
    const raw = el.getAttribute(attr) || '';
    return raw.trim().split(/\s+/).map((pair) => {
        const [x, y] = pair.split(',').map(parseFloat);
        return [x, y] as [number, number];
    }).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}