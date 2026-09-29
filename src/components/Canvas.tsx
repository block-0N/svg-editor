import { useState } from 'react';
import type { Shape, ShapePatch } from '../core/types';
import type { Tool } from '../App';

interface Props {
    shapes: Shape[];
    tool: Tool;
    selectedId: string | null;
    width: number;
    height: number;
    onSelect: (id: string | null) => void;
    onAddShape: (shape: Shape) => void;
    onUpdateShape: (id: string, patch: ShapePatch, transient?: boolean) => void;
    onCommit: () => void;
    svgRef: React.RefObject<SVGSVGElement | null>;
}

interface Draft {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface DragState {
    id: string;
    type: 'rect' | 'circle';
    startX: number;
    startY: number;
    origX: number;
    origY: number;
}

let idCounter = 1;
const nextId = (prefix: string) => `${prefix}_${idCounter++}`;

export default function Canvas({
    shapes,
    tool,
    selectedId,
    width,
    height,
    onSelect,
    onAddShape,
    onUpdateShape,
    onCommit,
    svgRef,
}: Props) {
    const [draft, setDraft] = useState<Draft | null>(null);
    const [drag, setDrag] = useState<DragState | null>(null);

    const getPoint = (e: React.MouseEvent) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };
        const p = pt.matrixTransform(ctm.inverse());
        return { x: p.x, y: p.y };
    };

    const handleBackgroundMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;

        if (tool === 'select') {
            onSelect(null);
            return;
        }

        const { x, y } = getPoint(e);
        setDraft({ x1: x, y1: y, x2: x, y2: y });
        onSelect(null);
    };

    const handleShapeMouseDown = (e: React.MouseEvent, shape: Shape) => {
        if (tool !== 'select') return;
        e.stopPropagation();
        onSelect(shape.id);

        const { x, y } = getPoint(e);
        if (shape.type === 'rect') {
            setDrag({
                id: shape.id,
                type: 'rect',
                startX: x,
                startY: y,
                origX: shape.x,
                origY: shape.y,
            });
        } else if (shape.type === 'circle') {
            setDrag({
                id: shape.id,
                type: 'circle',
                startX: x,
                startY: y,
                origX: shape.cx,
                origY: shape.cy,
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const { x, y } = getPoint(e);

        if (drag) {
            const dx = x - drag.startX;
            const dy = y - drag.startY;
            if (drag.type === 'rect') {
                onUpdateShape(drag.id, { x: drag.origX + dx, y: drag.origY + dy }, true);
            } else {
                onUpdateShape(drag.id, { cx: drag.origX + dx, cy: drag.origY + dy }, true);
            }
            return;
        }

        if (draft) {
            setDraft({ ...draft, x2: x, y2: y });
        }
    };

    const handleMouseUp = () => {
        if (drag) {
            setDrag(null);
            onCommit();
            return;
        }
        if (!draft) return;

        const x = Math.min(draft.x1, draft.x2);
        const y = Math.min(draft.y1, draft.y2);
        const w = Math.abs(draft.x2 - draft.x1);
        const h = Math.abs(draft.y2 - draft.y1);

        if (w > 2 && h > 2) {
            if (tool === 'rect') {
                onAddShape({
                    id: nextId('rect'),
                    type: 'rect',
                    x,
                    y,
                    width: w,
                    height: h,
                    fill: '#4A90D9',
                    stroke: '#2c5f8a',
                    strokeWidth: 2,
                });
            } else if (tool === 'circle') {
                const r = Math.min(w, h) / 2;
                onAddShape({
                    id: nextId('circle'),
                    type: 'circle',
                    cx: x + w / 2,
                    cy: y + h / 2,
                    r,
                    fill: '#E67E22',
                    stroke: '#a85a13',
                    strokeWidth: 2,
                });
            }
        }
        setDraft(null);
    };

    const renderShape = (shape: Shape) => {
        const common = {
            fill: shape.fill,
            stroke: shape.stroke,
            strokeWidth: shape.strokeWidth,
            onMouseDown: (e: React.MouseEvent) => handleShapeMouseDown(e, shape),
            style: {
                cursor: tool === 'select' ? 'move' : 'crosshair',
            } as React.CSSProperties,
        };

        if (shape.type === 'rect') {
            return (
                <rect
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    {...common}
                />
            );
        }
        if (shape.type === 'circle') {
            return (
                <circle
                    key={shape.id}
                    cx={shape.cx}
                    cy={shape.cy}
                    r={shape.r}
                    {...common}
                />
            );
        }
        return null;
    };

    const renderSelectionOutline = (shape: Shape) => {
        if (shape.type === 'rect') {
            return (
                <rect
                    data-ui="selection"
                    x={shape.x - 2}
                    y={shape.y - 2}
                    width={shape.width + 4}
                    height={shape.height + 4}
                    fill="none"
                    stroke="#1f6feb"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    pointerEvents="none"
                />
            );
        }
        if (shape.type === 'circle') {
            return (
                <circle
                    data-ui="selection"
                    cx={shape.cx}
                    cy={shape.cy}
                    r={shape.r + 3}
                    fill="none"
                    stroke="#1f6feb"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    pointerEvents="none"
                />
            );
        }
        return null;
    };

    const renderDraft = () => {
        if (!draft) return null;
        const x = Math.min(draft.x1, draft.x2);
        const y = Math.min(draft.y1, draft.y2);
        const w = Math.abs(draft.x2 - draft.x1);
        const h = Math.abs(draft.y2 - draft.y1);

        if (tool === 'rect') {
            return (
                <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill="rgba(74,144,217,0.3)"
                    stroke="#4A90D9"
                    strokeDasharray="4 2"
                />
            );
        }
        if (tool === 'circle') {
            const r = Math.min(w, h) / 2;
            return (
                <circle
                    cx={x + w / 2}
                    cy={y + h / 2}
                    r={r}
                    fill="rgba(230,126,34,0.3)"
                    stroke="#E67E22"
                    strokeDasharray="4 2"
                />
            );
        }
        return null;
    };

    const selectedShape = shapes.find((s) => s.id === selectedId) ?? null;

    return (
        <svg
            ref={svgRef}
            className="canvas"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            onMouseDown={handleBackgroundMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
        >
            <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="#e8ecf1"
                        strokeWidth="0.5"
                    />
                </pattern>
            </defs>
            <rect data-ui="grid" width={width} height={height} fill="url(#grid)" />
            {shapes.map(renderShape)}
            {selectedShape && renderSelectionOutline(selectedShape)}
            {renderDraft()}
        </svg>
    );
}