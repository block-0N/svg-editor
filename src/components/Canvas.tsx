import { useState } from 'react';
import type { Shape, ShapePatch } from '../core/types';
import type { Tool } from '../App';
import {
    getShapeCenter, getShapeBounds, polygonPoints, starPoints,
    pointsToPathD,
} from '../core/geometry';

interface Props {
    shapes: Shape[];
    tool: Tool;
    selectedIds: string[];
    width: number;
    height: number;
    currentFill: string;
    currentStroke: string;
    onSelect: (ids: string[]) => void;
    onAddShape: (shape: Shape) => void;
    onUpdateShape: (id: string, patch: ShapePatch, transient?: boolean) => void;
    onUpdateShapes: (patches: Array<{ id: string; patch: ShapePatch }>, transient?: boolean) => void;
    onDeleteShape: (id: string) => void;
    onCommit: () => void;
    onPickColor: (color: string) => void;
    svgRef: React.RefObject<SVGSVGElement | null>;
}

interface Draft { x1: number; y1: number; x2: number; y2: number }
interface DragState {
    startX: number;
    startY: number;
    origs: Array<{ id: string; shape: Shape }>;
}
type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
interface ResizeState {
    id: string;
    handle: Handle;
    startX: number;
    startY: number;
    origBounds: { x: number; y: number; width: number; height: number };
    origShape: Shape;
}
interface RotateState {
    id: string;
    centerX: number;
    centerY: number;
    startAngle: number;
    origRotation: number;
}

const HANDLE_SIZE = 7;
const ROTATE_R = 11;
const ROTATE_OFFSET = 26;

let uid = 1;
const nextId = (p: string) => `${p}_${Date.now()}_${uid++}`;

export default function Canvas(props: Props) {
    const {
        shapes, tool, selectedIds, width, height,
        currentFill, currentStroke,
        onSelect, onAddShape, onUpdateShape, onUpdateShapes,
        onDeleteShape, onCommit, onPickColor, svgRef,
    } = props;

    const [draft, setDraft] = useState<Draft | null>(null);
    const [drag, setDrag] = useState<DragState | null>(null);
    const [resize, setResize] = useState<ResizeState | null>(null);
    const [rotate, setRotate] = useState<RotateState | null>(null);
    const [pathPts, setPathPts] = useState<[number, number][]>([]);
    const [erasing, setErasing] = useState(false);

    const singleSelected = selectedIds.length === 1
        ? shapes.find((s) => s.id === selectedIds[0]) ?? null
        : null;

    const getPoint = (e: React.MouseEvent) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };
        const p = pt.matrixTransform(ctm.inverse());
        return { x: p.x, y: p.y };
    };

    // ── 背景 mousedown ──────────────────────
    const handleBgMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        if (resize || rotate) return;

        if (tool === 'eraser') { setErasing(true); return; }
        if (tool === 'select') { onSelect([]); return; }

        const { x, y } = getPoint(e);
        if (tool === 'path') { setPathPts([[x, y]]); onSelect([]); return; }
        if (tool === 'eyedropper') return;

        setDraft({ x1: x, y1: y, x2: x, y2: y });
        onSelect([]);
    };

    // ── 图形 mousedown ──────────────────────
    const handleShapeMouseDown = (e: React.MouseEvent, shape: Shape) => {
        if (tool === 'eraser') {
            e.stopPropagation();
            onDeleteShape(shape.id);
            setErasing(true);
            return;
        }
        if (tool === 'eyedropper') {
            e.stopPropagation();
            onPickColor(shape.fill);
            return;
        }
        if (tool !== 'select') return;
        e.stopPropagation();

        const additive = e.shiftKey || e.ctrlKey || e.metaKey;
        const isSelected = selectedIds.includes(shape.id);
        let nextIds: string[];
        if (additive) {
            nextIds = isSelected
                ? selectedIds.filter((id) => id !== shape.id)
                : [...selectedIds, shape.id];
        } else if (isSelected) {
            nextIds = selectedIds;
        } else {
            nextIds = [shape.id];
        }
        onSelect(nextIds);

        const { x, y } = getPoint(e);
        const origs = nextIds
            .map((id) => {
                const s = shapes.find((sh) => sh.id === id);
                return s ? { id, shape: JSON.parse(JSON.stringify(s)) as Shape } : null;
            })
            .filter(Boolean) as Array<{ id: string; shape: Shape }>;

        setDrag({ startX: x, startY: y, origs });
    };

    // ── Resize 手柄 ─────────────────────────
    const handleResizeMouseDown = (e: React.MouseEvent, handle: Handle) => {
        if (!singleSelected || singleSelected.rotation !== 0) return;
        e.stopPropagation();
        const { x, y } = getPoint(e);
        setResize({
            id: singleSelected.id,
            handle,
            startX: x,
            startY: y,
            origBounds: getShapeBounds(singleSelected),
            origShape: singleSelected,
        });
    };

    // ── 旋转按钮 ────────────────────────────
    const handleRotateMouseDown = (e: React.MouseEvent) => {
        if (!singleSelected) return;
        e.stopPropagation();
        const { x, y } = getPoint(e);
        const center = getShapeCenter(singleSelected);
        setRotate({
            id: singleSelected.id,
            centerX: center.x,
            centerY: center.y,
            startAngle: Math.atan2(y - center.y, x - center.x),
            origRotation: singleSelected.rotation,
        });
    };

    // ── resize 计算 ─────────────────────────
    const computeNewBounds = (r: ResizeState, curX: number, curY: number) => {
        const dx = curX - r.startX;
        const dy = curY - r.startY;
        let { x, y, width: w, height: h } = r.origBounds;

        switch (r.handle) {
            case 'nw': x += dx; y += dy; w -= dx; h -= dy; break;
            case 'n': y += dy; h -= dy; break;
            case 'ne': y += dy; w += dx; h -= dy; break;
            case 'e': w += dx; break;
            case 'se': w += dx; h += dy; break;
            case 's': h += dy; break;
            case 'sw': x += dx; w -= dx; h += dy; break;
            case 'w': x += dx; w -= dx; break;
        }
        if (w < 0) { x += w; w = -w; }
        if (h < 0) { y += h; h = -h; }
        w = Math.max(2, w);
        h = Math.max(2, h);
        return { x, y, width: w, height: h };
    };

    const centeredScale = (
        handle: Handle,
        newB: { width: number; height: number },
        origB: { width: number; height: number },
    ): number => {
        if (origB.width <= 0 || origB.height <= 0) return 1;
        if (handle === 'e' || handle === 'w') return newB.width / origB.width;
        if (handle === 'n' || handle === 's') return newB.height / origB.height;
        const od = Math.hypot(origB.width, origB.height);
        const nd = Math.hypot(newB.width, newB.height);
        return od > 0 ? nd / od : 1;
    };

    const boundsToPatch = (
        shape: Shape,
        b: { x: number; y: number; width: number; height: number },
        handle: Handle,
        origBounds: { x: number; y: number; width: number; height: number },
    ): ShapePatch | null => {
        switch (shape.type) {
            case 'rect':
                return { x: b.x, y: b.y, width: b.width, height: b.height };
            case 'circle': {
                const scale = centeredScale(handle, b, origBounds);
                return { r: Math.max(1, shape.r * scale) };
            }
            case 'ellipse':
                return {
                    cx: b.x + b.width / 2,
                    cy: b.y + b.height / 2,
                    rx: Math.max(1, b.width / 2),
                    ry: Math.max(1, b.height / 2),
                };
            case 'polygon': {
                const scale = centeredScale(handle, b, origBounds);
                return { radius: Math.max(1, shape.radius * scale) };
            }
            case 'star': {
                const scale = centeredScale(handle, b, origBounds);
                const ratio = shape.outerRadius > 0 ? shape.innerRadius / shape.outerRadius : 0.45;
                const outer = Math.max(1, shape.outerRadius * scale);
                return { outerRadius: outer, innerRadius: outer * ratio };
            }
            case 'line': {
                const sx = origBounds.width > 0 ? b.width / origBounds.width : 1;
                const sy = origBounds.height > 0 ? b.height / origBounds.height : 1;
                const remap = (px: number, py: number): [number, number] => [
                    b.x + (px - origBounds.x) * sx,
                    b.y + (py - origBounds.y) * sy,
                ];
                const [x1, y1] = remap(shape.x1, shape.y1);
                const [x2, y2] = remap(shape.x2, shape.y2);
                return { x1, y1, x2, y2 };
            }
            case 'path': {
                const sx = origBounds.width > 0 ? b.width / origBounds.width : 1;
                const sy = origBounds.height > 0 ? b.height / origBounds.height : 1;
                const pts = shape.points.map(([px, py]) => [
                    b.x + (px - origBounds.x) * sx,
                    b.y + (py - origBounds.y) * sy,
                ] as [number, number]);
                return { points: pts };
            }
        }
    };

    // ── mousemove ───────────────────────────
    const handleMouseMove = (e: React.MouseEvent) => {
        const { x, y } = getPoint(e);

        // 橡皮擦拖动连续删除
        if (erasing && tool === 'eraser') {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const g = el?.closest?.('[data-shape-id]') as HTMLElement | null;
            if (g) {
                const id = g.getAttribute('data-shape-id');
                if (id) onDeleteShape(id);
            }
            return;
        }

        if (rotate) {
            const angle = Math.atan2(y - rotate.centerY, x - rotate.centerX);
            let deg = rotate.origRotation + (angle - rotate.startAngle) * 180 / Math.PI;
            if (e.shiftKey) deg = Math.round(deg / 15) * 15;
            deg = ((deg + 180) % 360 + 360) % 360 - 180;
            onUpdateShape(rotate.id, { rotation: Math.round(deg) }, true);
            return;
        }

        if (resize) {
            const b = computeNewBounds(resize, x, y);
            const patch = boundsToPatch(resize.origShape, b, resize.handle, resize.origBounds);
            if (patch) onUpdateShape(resize.id, patch, true);
            return;
        }

        if (tool === 'path' && pathPts.length > 0) {
            const last = pathPts[pathPts.length - 1];
            const dx = x - last[0];
            const dy = y - last[1];
            if (dx * dx + dy * dy > 4) setPathPts((p) => [...p, [x, y]]);
            return;
        }

        if (drag) {
            const dx = x - drag.startX;
            const dy = y - drag.startY;
            const patches: Array<{ id: string; patch: ShapePatch }> = [];
            for (const { id, shape } of drag.origs) {
                if (shape.type === 'rect') {
                    patches.push({ id, patch: { x: shape.x + dx, y: shape.y + dy } });
                } else if (shape.type === 'circle' || shape.type === 'ellipse') {
                    patches.push({ id, patch: { cx: shape.cx + dx, cy: shape.cy + dy } });
                } else if (shape.type === 'line') {
                    patches.push({
                        id,
                        patch: {
                            x1: shape.x1 + dx, y1: shape.y1 + dy,
                            x2: shape.x2 + dx, y2: shape.y2 + dy,
                        },
                    });
                } else if (shape.type === 'polygon' || shape.type === 'star') {
                    patches.push({ id, patch: { cx: shape.cx + dx, cy: shape.cy + dy } });
                } else if (shape.type === 'path') {
                    const pts = shape.points.map(([px, py]) => [px + dx, py + dy] as [number, number]);
                    patches.push({ id, patch: { points: pts } });
                }
            }
            onUpdateShapes(patches, true);
            return;
        }

        if (draft) setDraft({ ...draft, x2: x, y2: y });
    };

    // ── mouseup ────────────────────────────
    const handleMouseUp = () => {
        if (erasing) { setErasing(false); onCommit(); return; }
        if (rotate) { setRotate(null); onCommit(); return; }
        if (resize) { setResize(null); onCommit(); return; }

        if (tool === 'path' && pathPts.length > 1) {
            onAddShape({
                id: nextId('path'), type: 'path',
                points: pathPts, fill: 'none', stroke: currentStroke,
                strokeWidth: 2, rotation: 0, opacity: 1,
            });
            setPathPts([]);
            return;
        }

        if (drag) { setDrag(null); onCommit(); return; }
        if (!draft) return;

        const x = Math.min(draft.x1, draft.x2);
        const y = Math.min(draft.y1, draft.y2);
        const w = Math.abs(draft.x2 - draft.x1);
        const h = Math.abs(draft.y2 - draft.y1);

        if (w > 2 && h > 2) {
            const common = {
                fill: currentFill, stroke: currentStroke,
                strokeWidth: 2, rotation: 0, opacity: 1,
            };
            if (tool === 'rect') {
                onAddShape({ id: nextId('rect'), type: 'rect', x, y, width: w, height: h, ...common });
            } else if (tool === 'circle') {
                onAddShape({ id: nextId('circle'), type: 'circle', cx: x + w / 2, cy: y + h / 2, r: Math.min(w, h) / 2, ...common });
            } else if (tool === 'ellipse') {
                onAddShape({ id: nextId('ellipse'), type: 'ellipse', cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2, ...common });
            } else if (tool === 'polygon') {
                onAddShape({ id: nextId('polygon'), type: 'polygon', cx: x + w / 2, cy: y + h / 2, radius: Math.min(w, h) / 2, sides: 6, ...common });
            } else if (tool === 'star') {
                const outer = Math.min(w, h) / 2;
                onAddShape({ id: nextId('star'), type: 'star', cx: x + w / 2, cy: y + h / 2, outerRadius: outer, innerRadius: outer * 0.45, points: 5, ...common });
            }
        }

        if (tool === 'line' && (draft.x1 !== draft.x2 || draft.y1 !== draft.y2)) {
            onAddShape({
                id: nextId('line'), type: 'line',
                x1: draft.x1, y1: draft.y1, x2: draft.x2, y2: draft.y2,
                fill: 'none', stroke: currentStroke, strokeWidth: 2, rotation: 0, opacity: 1,
            });
        }

        setDraft(null);
    };

    // ── 渲染 ───────────────────────────────
    const renderShapeContent = (s: Shape) => {
        const common = {
            fill: s.fill, stroke: s.stroke, strokeWidth: s.strokeWidth, opacity: s.opacity,
        } as const;
        switch (s.type) {
            case 'rect': return <rect x={s.x} y={s.y} width={s.width} height={s.height} rx={2} {...common} />;
            case 'circle': return <circle cx={s.cx} cy={s.cy} r={s.r} {...common} />;
            case 'ellipse': return <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...common} />;
            case 'line': return <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} {...common} strokeLinecap="round" />;
            case 'polygon': {
                const pts = polygonPoints(s.cx, s.cy, s.radius, s.sides);
                return <polygon points={pts.map(([x, y]) => `${x},${y}`).join(' ')} {...common} />;
            }
            case 'star': {
                const pts = starPoints(s.cx, s.cy, s.outerRadius, s.innerRadius, s.points);
                return <polygon points={pts.map(([x, y]) => `${x},${y}`).join(' ')} {...common} />;
            }
            case 'path': return <path d={pointsToPathD(s.points)} {...common} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
        }
    };

    const renderShape = (s: Shape) => {
        const center = getShapeCenter(s);
        const transform = s.rotation ? `rotate(${s.rotation} ${center.x} ${center.y})` : undefined;
        const shapeCursor = tool === 'select' ? 'move'
            : tool === 'eraser' ? 'crosshair'
                : 'crosshair';
        return (
            <g
                key={s.id}
                data-shape-id={s.id}
                transform={transform}
                style={{ cursor: shapeCursor }}
                onMouseDown={(e) => handleShapeMouseDown(e, s)}
            >
                {renderShapeContent(s)}
            </g>
        );
    };

    // ── 单个图形的选中框（带手柄和旋转按钮）──
    const renderSingleSelection = (s: Shape) => {
        const b = getShapeBounds(s);
        const center = getShapeCenter(s);
        const pad = 4;
        const transform = s.rotation ? `rotate(${s.rotation} ${center.x} ${center.y})` : undefined;
        const canResize = s.rotation === 0;

        const x = b.x - pad;
        const y = b.y - pad;
        const w = b.width + pad * 2;
        const h = b.height + pad * 2;

        const handleAt = (hx: number, hy: number, dir: Handle) => (
            <rect
                key={dir}
                className="resize-handle"
                x={hx - HANDLE_SIZE / 2}
                y={hy - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                fill="#ffffff"
                stroke="#0d99ff"
                strokeWidth={1}
                style={{ cursor: `${dir}-resize` }}
                onMouseDown={(e) => handleResizeMouseDown(e, dir)}
            />
        );

        const rotX = x + w + ROTATE_OFFSET;
        const rotY = y - ROTATE_OFFSET;

        return (
            <g transform={transform}>
                <rect
                    x={x} y={y} width={w} height={h}
                    fill="none" stroke="#0d99ff" strokeWidth={1}
                    strokeDasharray="4 3"
                    style={{ pointerEvents: 'none' }}
                />

                {canResize && (
                    <>
                        {handleAt(x, y, 'nw')}
                        {handleAt(x + w / 2, y, 'n')}
                        {handleAt(x + w, y, 'ne')}
                        {handleAt(x + w, y + h / 2, 'e')}
                        {handleAt(x + w, y + h, 'se')}
                        {handleAt(x + w / 2, y + h, 's')}
                        {handleAt(x, y + h, 'sw')}
                        {handleAt(x, y + h / 2, 'w')}
                    </>
                )}

                <line
                    x1={x + w} y1={y} x2={rotX} y2={rotY}
                    stroke="#0d99ff" strokeWidth={1}
                    style={{ pointerEvents: 'none' }}
                />

                {/* 旋转按钮 */}
                <g
                    className="rotate-btn"
                    style={{ cursor: 'grab' }}
                    onMouseDown={handleRotateMouseDown}
                >
                    <circle
                        cx={rotX} cy={rotY} r={ROTATE_R}
                        fill="#ffffff" stroke="#0d99ff" strokeWidth={1.4}
                    />
                    <g
                        transform={`translate(${rotX - 6}, ${rotY - 6})`}
                        fill="none" stroke="#0d99ff"
                        strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
                        pointerEvents="none"
                    >
                        <path d="M 9.5 3 A 4 4 0 1 0 10.5 7" />
                        <path d="M 9.5 1.5 L 9.5 4 L 7 4" />
                    </g>
                </g>
            </g>
        );
    };

    // ── 多选时的虚线框 ────────────────────
    const renderMultiSelection = (list: Shape[]) => (
        <>
            {list.map((s) => {
                const b = getShapeBounds(s);
                const center = getShapeCenter(s);
                const transform = s.rotation ? `rotate(${s.rotation} ${center.x} ${center.y})` : undefined;
                const pad = 4;
                return (
                    <rect
                        key={s.id}
                        transform={transform}
                        x={b.x - pad} y={b.y - pad}
                        width={b.width + pad * 2} height={b.height + pad * 2}
                        fill="none" stroke="#0d99ff" strokeWidth={1}
                        strokeDasharray="4 3"
                        pointerEvents="none"
                    />
                );
            })}
        </>
    );

    const renderDraft = () => {
        if (tool === 'path' && pathPts.length > 1) {
            return <path d={pointsToPathD(pathPts)} fill="none" stroke={currentStroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />;
        }
        if (!draft) return null;
        const x = Math.min(draft.x1, draft.x2);
        const y = Math.min(draft.y1, draft.y2);
        const w = Math.abs(draft.x2 - draft.x1);
        const h = Math.abs(draft.y2 - draft.y1);
        const stroke = '#0d99ff';
        const fill = 'rgba(13,153,255,0.15)';

        if (tool === 'rect') return <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeDasharray="4 2" />;
        if (tool === 'circle') return <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) / 2} fill={fill} stroke={stroke} strokeDasharray="4 2" />;
        if (tool === 'ellipse') return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill={fill} stroke={stroke} strokeDasharray="4 2" />;
        if (tool === 'polygon') {
            const pts = polygonPoints(x + w / 2, y + h / 2, Math.min(w, h) / 2, 6);
            return <polygon points={pts.map(([px, py]) => `${px},${py}`).join(' ')} fill={fill} stroke={stroke} strokeDasharray="4 2" />;
        }
        if (tool === 'star') {
            const outer = Math.min(w, h) / 2;
            const pts = starPoints(x + w / 2, y + h / 2, outer, outer * 0.45, 5);
            return <polygon points={pts.map(([px, py]) => `${px},${py}`).join(' ')} fill={fill} stroke={stroke} strokeDasharray="4 2" />;
        }
        if (tool === 'line') return <line x1={draft.x1} y1={draft.y1} x2={draft.x2} y2={draft.y2} stroke={stroke} strokeWidth={2} strokeDasharray="4 2" />;
        return null;
    };

    const cursor =
        erasing || tool === 'eraser' ? 'crosshair' :
            rotate ? 'grabbing' :
                resize ? `${resize.handle}-resize` :
                    tool === 'select' ? 'default' :
                        'crosshair';

    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));

    return (
        <svg
            ref={svgRef}
            className="canvas"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            onMouseDown={handleBgMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor }}
        >
            <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8ecf1" strokeWidth="0.5" />
                </pattern>
            </defs>
            <rect data-ui="grid" width={width} height={height} fill="url(#grid)" />
            {shapes.map(renderShape)}

            {selectedShapes.length === 1 && renderSingleSelection(selectedShapes[0])}
            {selectedShapes.length > 1 && renderMultiSelection(selectedShapes)}

            {renderDraft()}
        </svg>
    );
}