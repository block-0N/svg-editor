import type { Shape } from './types';
import { attrsToArray } from './geometry';

let counter = 1;
const uid = (p: string) => `${p}_${Date.now()}_${counter++}`;

const num = (v: string | null, fallback: number) => {
    const n = parseFloat(v ?? '');
    return Number.isFinite(n) ? n : fallback;
};

export interface ImportResult {
    shapes: Shape[];
    width: number | null;
    height: number | null;
}

const base = (el: Element) => ({
    fill: el.getAttribute('fill') || '#4A90D9',
    stroke: el.getAttribute('stroke') || '#2c5f8a',
    strokeWidth: num(el.getAttribute('stroke-width'), 2),
    rotation: 0,
    opacity: num(el.getAttribute('opacity'), 1),
});

export function parseSvg(text: string): ImportResult {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('SVG 解析失败');
    const svg = doc.querySelector('svg');
    if (!svg) throw new Error('未找到 <svg> 根元素');

    let width: number | null = null;
    let height: number | null = null;
    const vb = svg.getAttribute('viewBox');
    if (vb) {
        const p = vb.split(/[\s,]+/).map(parseFloat);
        if (p.length === 4) { width = p[2]; height = p[3]; }
    }
    if (width === null) width = num(svg.getAttribute('width'), 0) || null;
    if (height === null) height = num(svg.getAttribute('height'), 0) || null;

    const shapes: Shape[] = [];

    svg.querySelectorAll('rect').forEach((el) => {
        const w = num(el.getAttribute('width'), 0);
        const h = num(el.getAttribute('height'), 0);
        if (w <= 0 || h <= 0) return;
        shapes.push({
            id: uid('rect'), type: 'rect',
            x: num(el.getAttribute('x'), 0), y: num(el.getAttribute('y'), 0),
            width: w, height: h, ...base(el),
        });
    });

    svg.querySelectorAll('circle').forEach((el) => {
        const r = num(el.getAttribute('r'), 0);
        if (r <= 0) return;
        shapes.push({
            id: uid('circle'), type: 'circle',
            cx: num(el.getAttribute('cx'), 0), cy: num(el.getAttribute('cy'), 0),
            r, ...base(el),
        });
    });

    svg.querySelectorAll('ellipse').forEach((el) => {
        const rx = num(el.getAttribute('rx'), 0);
        const ry = num(el.getAttribute('ry'), 0);
        if (rx <= 0 || ry <= 0) return;
        shapes.push({
            id: uid('ellipse'), type: 'ellipse',
            cx: num(el.getAttribute('cx'), 0), cy: num(el.getAttribute('cy'), 0),
            rx, ry, ...base(el),
        });
    });

    svg.querySelectorAll('line').forEach((el) => {
        shapes.push({
            id: uid('line'), type: 'line',
            x1: num(el.getAttribute('x1'), 0), y1: num(el.getAttribute('y1'), 0),
            x2: num(el.getAttribute('x2'), 0), y2: num(el.getAttribute('y2'), 0),
            ...base(el),
        });
    });

    svg.querySelectorAll('polygon').forEach((el) => {
        const pts = attrsToArray(el, 'points');
        if (pts.length < 3) return;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const [x, y] of pts) {
            if (x < minX) minX = x; if (y < minY) minY = y;
            if (x > maxX) maxX = x; if (y > maxY) maxY = y;
        }
        shapes.push({
            id: uid('polygon'), type: 'polygon',
            cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
            radius: Math.max(maxX - minX, maxY - minY) / 2,
            sides: pts.length, ...base(el),
        });
    });

    svg.querySelectorAll('path').forEach((el) => {
        const d = el.getAttribute('d') || '';
        // 只解析 M/L 命令
        const nums = d.match(/-?\d*\.?\d+/g)?.map(parseFloat) ?? [];
        if (nums.length < 4) return;
        const pts: [number, number][] = [];
        for (let i = 0; i < nums.length - 1; i += 2) {
            pts.push([nums[i], nums[i + 1]]);
        }
        shapes.push({ id: uid('path'), type: 'path', points: pts, ...base(el) });
    });

    return { shapes, width, height };
}

export function readFileAsText(file: File): Promise<string> {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result ?? ''));
        r.onerror = () => rej(r.error);
        r.readAsText(file);
    });
}