import { useCallback, useEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import CanvasSizePanel from './components/CanvasSizePanel';
import PropertyPanel from './components/PropertyPanel';
import LayerPanel from './components/LayerPanel';
import StatusBar from './components/StatusBar';
import { DownloadIcon, LogoIcon } from './components/icons';
import type { CanvasSize, Shape, ShapePatch, ShapeType } from './core/types';
import { exportPng, exportSvg } from './core/export';
import './App.css';

export type Tool = ShapeType | 'select';

interface HistoryEntry {
    shapes: Shape[];
    canvasSize: CanvasSize;
}

const DEFAULT_SIZE: CanvasSize = { width: 800, height: 500 };

export default function App() {
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [canvasSize, setCanvasSize] = useState<CanvasSize>(DEFAULT_SIZE);
    const [tool, setTool] = useState<Tool>('rect');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [, setHistVersion] = useState(0);
    const svgRef = useRef<SVGSVGElement | null>(null);

    const shapesRef = useRef<Shape[]>(shapes);
    shapesRef.current = shapes;
    const canvasSizeRef = useRef<CanvasSize>(canvasSize);
    canvasSizeRef.current = canvasSize;

    const historyRef = useRef<HistoryEntry[]>([
        { shapes: [], canvasSize: DEFAULT_SIZE },
    ]);
    const historyIndexRef = useRef(0);
    const commitTimerRef = useRef<number | null>(null);

    const commitNow = useCallback(() => {
        if (commitTimerRef.current !== null) {
            window.clearTimeout(commitTimerRef.current);
            commitTimerRef.current = null;
        }
        const current: HistoryEntry = {
            shapes: shapesRef.current,
            canvasSize: canvasSizeRef.current,
        };
        const stack = historyRef.current;
        const idx = historyIndexRef.current;
        if (JSON.stringify(stack[idx]) === JSON.stringify(current)) return;
        stack.splice(idx + 1);
        stack.push(current);
        historyIndexRef.current = stack.length - 1;
        setHistVersion((v) => v + 1);
    }, []);

    const scheduleCommit = useCallback(() => {
        if (commitTimerRef.current !== null) {
            window.clearTimeout(commitTimerRef.current);
        }
        commitTimerRef.current = window.setTimeout(() => {
            commitTimerRef.current = null;
            commitNow();
        }, 400);
    }, [commitNow]);

    const addShape = (shape: Shape) => {
        setShapes((prev) => [...prev, shape]);
        setSelectedId(shape.id);
        scheduleCommit();
    };

    const updateShape = (id: string, patch: ShapePatch, transient = false) => {
        setShapes((prev) =>
            prev.map((s) => (s.id === id ? ({ ...s, ...patch } as Shape) : s)),
        );
        if (!transient) scheduleCommit();
    };

    const deleteShape = (id: string) => {
        setShapes((prev) => prev.filter((s) => s.id !== id));
        setSelectedId((cur) => (cur === id ? null : cur));
        scheduleCommit();
    };

    const moveShape = (id: string, dir: -1 | 1) => {
        setShapes((prev) => {
            const idx = prev.findIndex((s) => s.id === id);
            if (idx < 0) return prev;
            const next = idx + dir;
            if (next < 0 || next >= prev.length) return prev;
            const copy = [...prev];
            [copy[idx], copy[next]] = [copy[next], copy[idx]];
            return copy;
        });
        scheduleCommit();
    };

    const changeCanvasSize = (size: CanvasSize) => {
        setCanvasSize(size);
        scheduleCommit();
    };

    const applyHistoryEntry = (entry: HistoryEntry) => {
        setShapes(entry.shapes);
        setCanvasSize(entry.canvasSize);
        setSelectedId(null);
    };

    const undo = () => {
        if (commitTimerRef.current !== null) {
            window.clearTimeout(commitTimerRef.current);
            commitTimerRef.current = null;
        }
        if (historyIndexRef.current <= 0) return;
        historyIndexRef.current -= 1;
        applyHistoryEntry(historyRef.current[historyIndexRef.current]);
        setHistVersion((v) => v + 1);
    };

    const redo = () => {
        if (commitTimerRef.current !== null) {
            window.clearTimeout(commitTimerRef.current);
            commitTimerRef.current = null;
        }
        const stack = historyRef.current;
        if (historyIndexRef.current >= stack.length - 1) return;
        historyIndexRef.current += 1;
        applyHistoryEntry(stack[historyIndexRef.current]);
        setHistVersion((v) => v + 1);
    };

    const canUndo = historyIndexRef.current > 0;
    const canRedo = historyIndexRef.current < historyRef.current.length - 1;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;

            const mod = e.ctrlKey || e.metaKey;

            if (mod && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
                return;
            }
            if (mod && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
                return;
            }

            if (!mod && !e.shiftKey) {
                const k = e.key.toLowerCase();
                if (k === 'v') {
                    setTool('select');
                    return;
                }
                if (k === 'r') {
                    setTool('rect');
                    return;
                }
                if (k === 'o') {
                    setTool('circle');
                    return;
                }
            }

            if (!selectedId) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                deleteShape(selectedId);
                return;
            }

            if (e.key.startsWith('Arrow')) {
                const step = e.shiftKey ? 10 : 1;
                let dx = 0;
                let dy = 0;
                if (e.key === 'ArrowLeft') dx = -step;
                else if (e.key === 'ArrowRight') dx = step;
                else if (e.key === 'ArrowUp') dy = -step;
                else if (e.key === 'ArrowDown') dy = step;
                if (dx === 0 && dy === 0) return;
                e.preventDefault();
                const shape = shapesRef.current.find((s) => s.id === selectedId);
                if (!shape) return;
                if (shape.type === 'rect') {
                    updateShape(selectedId, { x: shape.x + dx, y: shape.y + dy });
                } else if (shape.type === 'circle') {
                    updateShape(selectedId, { cx: shape.cx + dx, cy: shape.cy + dy });
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    const handleExportSvg = () => {
        if (svgRef.current) exportSvg(svgRef.current, 'drawing.svg');
    };

    const handleExportPng = () => {
        if (svgRef.current) exportPng(svgRef.current, 'drawing.png');
    };

    const selectedShape = shapes.find((s) => s.id === selectedId) ?? null;

    return (
        <div className="app">
            <header className="titlebar">
                <div className="brand">
                    <LogoIcon />
                    <span>SVG Editor</span>
                </div>
                <div className="titlebar-spacer" />
                <button className="tb-btn" onClick={handleExportSvg}>
                    <DownloadIcon />
                    导出 SVG
                </button>
                <button className="tb-btn" onClick={handleExportPng}>
                    <DownloadIcon />
                    导出 PNG
                </button>
            </header>

            <div className="workspace">
                <Toolbar
                    tool={tool}
                    onToolChange={setTool}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={undo}
                    onRedo={redo}
                />
                <main className="canvas-area">
                    <Canvas
                        shapes={shapes}
                        tool={tool}
                        selectedId={selectedId}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        onSelect={setSelectedId}
                        onAddShape={addShape}
                        onUpdateShape={updateShape}
                        onCommit={commitNow}
                        svgRef={svgRef}
                    />
                </main>
                <aside className="sidebar">
                    <CanvasSizePanel size={canvasSize} onChange={changeCanvasSize} />
                    <PropertyPanel
                        shape={selectedShape}
                        onUpdate={updateShape}
                        onDelete={deleteShape}
                    />
                    <LayerPanel
                        shapes={shapes}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onMove={moveShape}
                        onDelete={deleteShape}
                    />
                </aside>
            </div>

            <StatusBar
                shapesCount={shapes.length}
                selected={selectedShape}
                tool={tool}
                canvasSize={canvasSize}
            />
        </div>
    );
}