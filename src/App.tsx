import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import MenuBar from './components/MenuBar';
import CanvasSizePanel from './components/CanvasSizePanel';
import PropertyPanel from './components/PropertyPanel';
import LayerPanel from './components/LayerPanel';
import StatusBar from './components/StatusBar';
import Panel from './components/Panel';
import DockZones from './components/DockZones';
import Resizer from './components/Resizer';
import { LogoIcon } from './components/icons';
import type { CanvasSize, Shape, ShapePatch, ShapeType } from './core/types';
import type { DockPos, Layout, PanelId, Pos } from './core/layout';
import {
    DEFAULT_LAYOUT, PANEL_TITLES, loadLayout, movePanel, panelsIn, saveLayout,
} from './core/layout';
import { exportPng, exportSvg } from './core/export';
import { parseSvg, readFileAsText } from './core/importSvg';
import './App.css';
import './layout.css';

export type Tool = ShapeType | 'select' | 'eyedropper' | 'eraser';

interface HistoryEntry { shapes: Shape[]; canvasSize: CanvasSize }

const DEFAULT_SIZE: CanvasSize = { width: 800, height: 500 };

let uid = 1;
const nextId = (p: string) => `${p}_${Date.now()}_${uid++}`;

export default function App() {
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [canvasSize, setCanvasSize] = useState<CanvasSize>(DEFAULT_SIZE);
    const [tool, setTool] = useState<Tool>('rect');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [currentFill, setCurrentFill] = useState('#4A90D9');
    const [currentStroke] = useState('#2c5f8a');
    const [layout, setLayout] = useState<Layout>(loadLayout);
    const [draggingPanel, setDraggingPanel] = useState<PanelId | null>(null);
    const [hoverZone, setHoverZone] = useState<Pos | null>(null);
    const [, setHistVersion] = useState(0);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const clipboardRef = useRef<Shape[]>([]);
    const workspaceRef = useRef<HTMLDivElement | null>(null);
    const panelRefs = useRef<Map<PanelId, HTMLDivElement>>(new Map());
    const panelRefCallbacks = useRef<Map<PanelId, (el: HTMLDivElement | null) => void>>(new Map());

    const shapesRef = useRef<Shape[]>(shapes);
    shapesRef.current = shapes;
    const canvasSizeRef = useRef<CanvasSize>(canvasSize);
    canvasSizeRef.current = canvasSize;
    const selectedIdsRef = useRef<string[]>(selectedIds);
    selectedIdsRef.current = selectedIds;

    const historyRef = useRef<HistoryEntry[]>([{ shapes: [], canvasSize: DEFAULT_SIZE }]);
    const historyIndexRef = useRef(0);
    const commitTimerRef = useRef<number | null>(null);

    useEffect(() => { saveLayout(layout); }, [layout]);

    const getPanelRef = (id: PanelId) => {
        let cb = panelRefCallbacks.current.get(id);
        if (!cb) {
            cb = (el: HTMLDivElement | null) => {
                if (el) panelRefs.current.set(id, el);
                else panelRefs.current.delete(id);
            };
            panelRefCallbacks.current.set(id, cb);
        }
        return cb;
    };

    // ── 拖拽面板重排 ────────────────────────
    const handleDragStart = (id: PanelId, _e: React.MouseEvent) => {
        setDraggingPanel(id);
        setHoverZone(null);
    };

    useEffect(() => {
        if (!draggingPanel) return;
        const onMove = (e: MouseEvent) => {
            const ws = workspaceRef.current;
            if (!ws) return;
            const r = ws.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            const edge = 0.22;
            let zone: Pos | null = null;
            const inTop = y < r.height * edge && x > r.width * edge && x < r.width * (1 - edge);
            const inBottom = y > r.height * (1 - edge) && x > r.width * edge && x < r.width * (1 - edge);
            const inLeft = x < r.width * edge && y > r.height * edge && y < r.height * (1 - edge);
            const inRight = x > r.width * (1 - edge) && y > r.height * edge && y < r.height * (1 - edge);
            if (inTop) zone = 'top';
            else if (inBottom) zone = 'bottom';
            else if (inLeft) zone = 'left';
            else if (inRight) zone = 'right';
            setHoverZone(zone);
        };
        const onUp = () => {
            if (hoverZone) {
                setLayout((l) => movePanel(l, draggingPanel, hoverZone));
            }
            setDraggingPanel(null);
            setHoverZone(null);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [draggingPanel, hoverZone]);

    const handlePanelPositionChange = (id: PanelId, pos: Pos) => {
        setLayout((l) => movePanel(l, id, pos));
    };

    const handleResetLayout = () => {
        setLayout(DEFAULT_LAYOUT);
    };

    // ── Dock 尺寸拖拽 ───────────────────────
    const handleDockResize = useCallback((dock: DockPos, delta: number) => {
        let d = delta;
        if (dock === 'right' || dock === 'bottom') d = -delta;
        setLayout((l) => {
            const min = dock === 'top' || dock === 'bottom' ? 100 : 180;
            const max = 500;
            const next = Math.max(min, Math.min(max, l.dockSizes[dock] + d));
            if (next === l.dockSizes[dock]) return l;
            return { ...l, dockSizes: { ...l.dockSizes, [dock]: next } };
        });
    }, []);

    // ── 面板尺寸拖拽 ────────────────────────
    const handlePanelResize = useCallback((
        before: PanelId,
        after: PanelId,
        direction: 'horizontal' | 'vertical',
    ) => (delta: number) => {
        const elA = panelRefs.current.get(before);
        const elB = panelRefs.current.get(after);
        if (!elA || !elB) return;
        const getSize = (el: HTMLElement) =>
            direction === 'horizontal' ? el.offsetWidth : el.offsetHeight;
        const sizeA = getSize(elA);
        const sizeB = getSize(elB);
        const min = 100;
        const actualDelta = Math.max(min - sizeA, Math.min(sizeB - min, delta));
        if (actualDelta === 0) return;
        const newA = sizeA + actualDelta;
        const newB = sizeB - actualDelta;
        setLayout((l) => ({
            ...l,
            panelSizes: { ...l.panelSizes, [before]: newA, [after]: newB },
        }));
    }, []);

    // ── 历史 / 提交 ─────────────────────────
    const commitNow = useCallback(() => {
        if (commitTimerRef.current !== null) {
            window.clearTimeout(commitTimerRef.current);
            commitTimerRef.current = null;
        }
        const current: HistoryEntry = {
            shapes: shapesRef.current, canvasSize: canvasSizeRef.current,
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
        if (commitTimerRef.current !== null) window.clearTimeout(commitTimerRef.current);
        commitTimerRef.current = window.setTimeout(() => {
            commitTimerRef.current = null;
            commitNow();
        }, 400);
    }, [commitNow]);

    // ── 图形操作 ────────────────────────────
    const addShape = (shape: Shape) => {
        setShapes((prev) => [...prev, shape]);
        setSelectedIds([shape.id]);
        scheduleCommit();
    };

    const updateShape = (id: string, patch: ShapePatch, transient = false) => {
        setShapes((prev) => prev.map((s) => (s.id === id ? ({ ...s, ...patch } as Shape) : s)));
        if (!transient) scheduleCommit();
    };

    const updateShapes = (
        patches: Array<{ id: string; patch: ShapePatch }>,
        transient = false,
    ) => {
        const map = new Map(patches.map((p) => [p.id, p.patch]));
        setShapes((prev) => prev.map((s) => {
            const patch = map.get(s.id);
            return patch ? ({ ...s, ...patch } as Shape) : s;
        }));
        if (!transient) scheduleCommit();
    };

    const deleteShape = (id: string) => {
        setShapes((prev) => prev.filter((s) => s.id !== id));
        setSelectedIds((prev) => prev.filter((x) => x !== id));
        scheduleCommit();
    };

    const deleteSelected = useCallback(() => {
        const ids = new Set(selectedIdsRef.current);
        setShapes((prev) => prev.filter((s) => !ids.has(s.id)));
        setSelectedIds([]);
        scheduleCommit();
    }, [scheduleCommit]);

    const moveShape = (id: string, dir: -1 | 1) => {
        setShapes((prev) => {
            const idx = prev.findIndex((s) => s.id === id);
            if (idx < 0) return prev;
            const next = idx + dir;
            if (next < 0 || next >= prev.length) return prev;
            const c = [...prev];
            [c[idx], c[next]] = [c[next], c[idx]];
            return c;
        });
        scheduleCommit();
    };

    const changeCanvasSize = (size: CanvasSize) => {
        setCanvasSize(size);
        scheduleCommit();
    };

    const duplicateShape = useCallback((id: string) => {
        const src = shapesRef.current.find((s) => s.id === id);
        if (!src) return;
        const off = 20;
        const cloned = { ...src, id: nextId(src.type) } as Shape;
        if (cloned.type === 'rect') { cloned.x += off; cloned.y += off; }
        else if (cloned.type === 'circle' || cloned.type === 'ellipse') { cloned.cx += off; cloned.cy += off; }
        else if (cloned.type === 'line') { cloned.x1 += off; cloned.y1 += off; cloned.x2 += off; cloned.y2 += off; }
        else if (cloned.type === 'polygon' || cloned.type === 'star') { cloned.cx += off; cloned.cy += off; }
        else if (cloned.type === 'path') cloned.points = cloned.points.map(([x, y]) => [x + off, y + off]);
        setShapes((prev) => [...prev, cloned]);
        setSelectedIds([cloned.id]);
        scheduleCommit();
    }, [scheduleCommit]);

    const duplicateSelected = useCallback(() => {
        const ids = selectedIdsRef.current;
        if (!ids.length) return;
        const off = 20;
        const cloned: Shape[] = [];
        for (const id of ids) {
            const src = shapesRef.current.find((s) => s.id === id);
            if (!src) continue;
            const c = { ...src, id: nextId(src.type) } as Shape;
            if (c.type === 'rect') { c.x += off; c.y += off; }
            else if (c.type === 'circle' || c.type === 'ellipse') { c.cx += off; c.cy += off; }
            else if (c.type === 'line') { c.x1 += off; c.y1 += off; c.x2 += off; c.y2 += off; }
            else if (c.type === 'polygon' || c.type === 'star') { c.cx += off; c.cy += off; }
            else if (c.type === 'path') c.points = c.points.map(([x, y]) => [x + off, y + off]);
            cloned.push(c);
        }
        setShapes((prev) => [...prev, ...cloned]);
        setSelectedIds(cloned.map((c) => c.id));
        scheduleCommit();
    }, [scheduleCommit]);

    const copySelected = useCallback(() => {
        const ids = selectedIdsRef.current;
        clipboardRef.current = shapesRef.current
            .filter((s) => ids.includes(s.id))
            .map((s) => JSON.parse(JSON.stringify(s)) as Shape);
    }, []);

    const pasteClipboard = useCallback(() => {
        const src = clipboardRef.current;
        if (!src.length) return;
        const off = 20;
        const cloned = src.map((s) => {
            const c = { ...s, id: nextId(s.type) } as Shape;
            if (c.type === 'rect') { c.x += off; c.y += off; }
            else if (c.type === 'circle' || c.type === 'ellipse') { c.cx += off; c.cy += off; }
            else if (c.type === 'line') { c.x1 += off; c.y1 += off; c.x2 += off; c.y2 += off; }
            else if (c.type === 'polygon' || c.type === 'star') { c.cx += off; c.cy += off; }
            else if (c.type === 'path') c.points = c.points.map(([x, y]) => [x + off, y + off]);
            return c;
        });
        setShapes((prev) => [...prev, ...cloned]);
        setSelectedIds(cloned.map((c) => c.id));
        scheduleCommit();
    }, [scheduleCommit]);

    const newDocument = useCallback(() => {
        if (shapesRef.current.length > 0 && !confirm('新建会清空当前画布，是否继续？')) return;
        setShapes([]);
        setCanvasSize(DEFAULT_SIZE);
        setSelectedIds([]);
        setTool('rect');
        commitNow();
    }, [commitNow]);

    const openFile = useCallback(() => fileInputRef.current?.click(), []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            const text = await readFileAsText(file);
            const result = parseSvg(text);
            if (!result.shapes.length) { alert('未在 SVG 中找到可识别的图形'); return; }
            setShapes(result.shapes);
            if (result.width && result.height) {
                setCanvasSize({
                    width: Math.round(result.width),
                    height: Math.round(result.height),
                });
            }
            setSelectedIds([]);
            scheduleCommit();
        } catch (err) {
            alert(`打开失败：${(err as Error).message}`);
        }
    };

    const applyHistoryEntry = (entry: HistoryEntry) => {
        setShapes(entry.shapes);
        setCanvasSize(entry.canvasSize);
        setSelectedIds([]);
    };

    const undo = useCallback(() => {
        if (commitTimerRef.current !== null) { window.clearTimeout(commitTimerRef.current); commitTimerRef.current = null; }
        if (historyIndexRef.current <= 0) return;
        historyIndexRef.current -= 1;
        applyHistoryEntry(historyRef.current[historyIndexRef.current]);
        setHistVersion((v) => v + 1);
    }, []);

    const redo = useCallback(() => {
        if (commitTimerRef.current !== null) { window.clearTimeout(commitTimerRef.current); commitTimerRef.current = null; }
        const stack = historyRef.current;
        if (historyIndexRef.current >= stack.length - 1) return;
        historyIndexRef.current += 1;
        applyHistoryEntry(stack[historyIndexRef.current]);
        setHistVersion((v) => v + 1);
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(shapesRef.current.map((s) => s.id));
    }, []);

    const canUndo = historyIndexRef.current > 0;
    const canRedo = historyIndexRef.current < historyRef.current.length - 1;

    const handleExportSvg = useCallback(() => {
        if (svgRef.current) exportSvg(svgRef.current, 'drawing.svg');
    }, []);

    const handleExportPng = useCallback(() => {
        if (svgRef.current) exportPng(svgRef.current, 'drawing.png');
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            const inInput = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA';
            const mod = e.ctrlKey || e.metaKey;

            if (mod && !e.shiftKey) {
                const k = e.key.toLowerCase();
                if (k === 's') { e.preventDefault(); handleExportSvg(); return; }
                if (k === 'o') { e.preventDefault(); openFile(); return; }
                if (k === 'n') { e.preventDefault(); newDocument(); return; }
                if (k === 'a') {
                    if (!inInput) { e.preventDefault(); selectAll(); }
                    return;
                }
            }
            if (mod && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault(); handleExportPng(); return;
            }
            if (inInput) return;

            if (mod && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo(); else undo();
                return;
            }
            if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
            if (mod && e.key.toLowerCase() === 'c') { e.preventDefault(); copySelected(); return; }
            if (mod && e.key.toLowerCase() === 'v') { e.preventDefault(); pasteClipboard(); return; }
            if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); return; }

            if (e.key === 'Escape') { setSelectedIds([]); return; }

            if (!mod && !e.shiftKey) {
                const k = e.key.toLowerCase();
                const map: Record<string, Tool> = {
                    v: 'select', r: 'rect', o: 'circle', e: 'ellipse',
                    l: 'line', p: 'polygon', s: 'star', b: 'path',
                    i: 'eyedropper', x: 'eraser',
                };
                if (map[k]) { setTool(map[k]); return; }
            }

            const ids = selectedIdsRef.current;
            if (!ids.length) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault(); deleteSelected(); return;
            }
            if (e.key.startsWith('Arrow')) {
                const step = e.shiftKey ? 10 : 1;
                let dx = 0, dy = 0;
                if (e.key === 'ArrowLeft') dx = -step;
                else if (e.key === 'ArrowRight') dx = step;
                else if (e.key === 'ArrowUp') dy = -step;
                else if (e.key === 'ArrowDown') dy = step;
                if (dx === 0 && dy === 0) return;
                e.preventDefault();
                const patches: Array<{ id: string; patch: ShapePatch }> = [];
                for (const id of ids) {
                    const s = shapesRef.current.find((x) => x.id === id);
                    if (!s) continue;
                    if (s.type === 'rect') patches.push({ id, patch: { x: s.x + dx, y: s.y + dy } });
                    else if (s.type === 'circle' || s.type === 'ellipse') patches.push({ id, patch: { cx: s.cx + dx, cy: s.cy + dy } });
                    else if (s.type === 'line') patches.push({ id, patch: { x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy } });
                    else if (s.type === 'polygon' || s.type === 'star') patches.push({ id, patch: { cx: s.cx + dx, cy: s.cy + dy } });
                    else if (s.type === 'path') patches.push({ id, patch: { points: s.points.map(([x, y]) => [x + dx, y + dy] as [number, number]) } });
                }
                updateShapes(patches, true);
                scheduleCommit();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [undo, redo, handleExportSvg, handleExportPng, copySelected, pasteClipboard,
        duplicateSelected, newDocument, openFile, selectAll, deleteSelected,
        updateShapes, scheduleCommit]);

    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));

    // ── 面板内容分发 ────────────────────────
    const panelContent = (id: PanelId) => {
        switch (id) {
            case 'toolbar':
                return (
                    <Toolbar
                        tool={tool} onToolChange={setTool}
                        canUndo={canUndo} canRedo={canRedo}
                        onUndo={undo} onRedo={redo}
                    />
                );
            case 'canvasSize':
                return <CanvasSizePanel size={canvasSize} onChange={changeCanvasSize} />;
            case 'properties':
                return (
                    <PropertyPanel
                        selected={selectedShapes}
                        onUpdate={updateShape}
                        onDelete={deleteShape}
                        onDuplicate={duplicateShape}
                        onDeleteAll={deleteSelected}
                        onDuplicateAll={duplicateSelected}
                    />
                );
            case 'layers':
                return (
                    <LayerPanel
                        shapes={shapes} selectedIds={selectedIds}
                        onSelect={setSelectedIds}
                        onMove={moveShape} onDelete={deleteShape}
                    />
                );
        }
    };

    const renderPanel = (id: PanelId, orientation: 'horizontal' | 'vertical') => {
        const size = layout.panelSizes[id];
        const style: React.CSSProperties | undefined = size === undefined
            ? undefined
            : orientation === 'horizontal'
                ? { flex: `0 0 ${size}px`, width: size, minWidth: 100 }
                : { flex: `0 0 ${size}px`, height: size, minHeight: 80 };

        return (
            <Panel
                key={id}
                ref={getPanelRef(id)}
                id={id}
                title={PANEL_TITLES[id]}
                dragging={draggingPanel === id}
                onDragStart={handleDragStart}
                style={style}
            >
                {panelContent(id)}
            </Panel>
        );
    };

    const renderDock = (pos: DockPos) => {
        const panels = panelsIn(layout, pos);
        if (!panels.length) return null;

        const isRow = pos === 'top' || pos === 'bottom';
        const size = layout.dockSizes[pos];

        const dockStyle: React.CSSProperties = isRow
            ? { height: size, minHeight: 100, maxHeight: 500 }
            : { width: size, minWidth: 180, maxWidth: 500 };

        const edgeClass =
            pos === 'top' ? 'resizer-dock-bottom' :
                pos === 'bottom' ? 'resizer-dock-top' :
                    pos === 'left' ? 'resizer-dock-right' :
                        'resizer-dock-left';

        const panelDir: 'horizontal' | 'vertical' = isRow ? 'horizontal' : 'vertical';
        const edgeDir: 'horizontal' | 'vertical' = isRow ? 'vertical' : 'horizontal';

        return (
            <div className={`dock dock-${pos}`} style={dockStyle}>
                <Resizer
                    direction={edgeDir}
                    onDrag={(d) => handleDockResize(pos, d)}
                    className={edgeClass}
                />
                {panels.map((pid, i) => (
                    <Fragment key={pid}>
                        {i > 0 && (
                            <Resizer
                                direction={panelDir}
                                onDrag={handlePanelResize(panels[i - 1], pid, panelDir)}
                                className={isRow ? 'resizer-panel-horizontal' : 'resizer-panel-vertical'}
                            />
                        )}
                        {renderPanel(pid, isRow ? 'horizontal' : 'vertical')}
                    </Fragment>
                ))}
            </div>
        );
    };

    const topDock = renderDock('top');
    const bottomDock = renderDock('bottom');
    const leftDock = renderDock('left');
    const rightDock = renderDock('right');

    return (
        <div className="app">
            <header className="titlebar">
                <div className="brand"><LogoIcon /><span>SVG Editor</span></div>
                <MenuBar
                    onNew={newDocument}
                    onOpen={openFile}
                    onExportSvg={handleExportSvg}
                    onExportPng={handleExportPng}
                    onUndo={undo}
                    onRedo={redo}
                    onDelete={deleteSelected}
                    onDuplicate={duplicateSelected}
                    onSelectAll={selectAll}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    hasSelection={selectedIds.length > 0}
                    layout={layout}
                    onPanelPositionChange={handlePanelPositionChange}
                    onResetLayout={handleResetLayout}
                />
                <div className="titlebar-spacer" />
            </header>

            <input
                type="file" ref={fileInputRef}
                accept=".svg,image/svg+xml"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            <div className="workspace" ref={workspaceRef}>
                {topDock}
                <div className="workspace-middle">
                    {leftDock}
                    <main className="canvas-area">
                        <Canvas
                            shapes={shapes} tool={tool}
                            selectedIds={selectedIds}
                            width={canvasSize.width} height={canvasSize.height}
                            currentFill={currentFill} currentStroke={currentStroke}
                            onSelect={setSelectedIds}
                            onAddShape={addShape}
                            onUpdateShape={updateShape}
                            onUpdateShapes={updateShapes}
                            onDeleteShape={deleteShape}
                            onCommit={commitNow}
                            onPickColor={(c) => { setCurrentFill(c); setTool('rect'); }}
                            svgRef={svgRef}
                        />
                    </main>
                    {rightDock}
                </div>
                {bottomDock}
                {draggingPanel && <DockZones hovered={hoverZone} />}
            </div>

            <StatusBar
                shapesCount={shapes.length}
                selected={selectedShapes.length === 1 ? selectedShapes[0] : null}
                selectedCount={selectedShapes.length}
                tool={tool}
                canvasSize={canvasSize}
            />
        </div>
    );
}