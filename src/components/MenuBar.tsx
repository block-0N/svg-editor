import { useEffect, useRef, useState } from 'react';
import type { PanelId, Layout, Pos } from '../core/layout';
import { PANEL_TITLES, POS_LABELS } from '../core/layout';

interface Props {
    onNew: () => void;
    onOpen: () => void;
    onExportSvg: () => void;
    onExportPng: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onSelectAll: () => void;
    canUndo: boolean;
    canRedo: boolean;
    hasSelection: boolean;
    layout: Layout;
    onPanelPositionChange: (id: PanelId, pos: Pos) => void;
    onResetLayout: () => void;
}

type MenuId = 'file' | 'edit' | 'view' | 'help' | null;

const PANEL_IDS: PanelId[] = ['toolbar', 'canvasSize', 'properties', 'layers'];
const POS_OPTIONS: Pos[] = ['top', 'bottom', 'left', 'right', 'hidden'];

export default function MenuBar(p: Props) {
    const [open, setOpen] = useState<MenuId>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(null);
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, [open]);

    const run = (fn: () => void) => () => { setOpen(null); fn(); };

    const item = (
        label: string, shortcut: string, action: () => void, disabled = false,
    ) => (
        <button className="menu-item" onClick={run(action)} disabled={disabled}>
            <span>{label}</span>
            <span className="shortcut">{shortcut}</span>
        </button>
    );

    return (
        <div className="menubar" ref={ref}>
            <div className="menubar-item">
                <button
                    className={`menubar-btn ${open === 'file' ? 'open' : ''}`}
                    onClick={() => setOpen(open === 'file' ? null : 'file')}
                >文件</button>
                {open === 'file' && (
                    <div className="menu-popup">
                        {item('新建', 'Ctrl+N', p.onNew)}
                        {item('打开…', 'Ctrl+O', p.onOpen)}
                        <div className="menu-sep" />
                        {item('导出 SVG', 'Ctrl+S', p.onExportSvg)}
                        {item('导出 PNG', 'Ctrl+Shift+S', p.onExportPng)}
                    </div>
                )}
            </div>

            <div className="menubar-item">
                <button
                    className={`menubar-btn ${open === 'edit' ? 'open' : ''}`}
                    onClick={() => setOpen(open === 'edit' ? null : 'edit')}
                >编辑</button>
                {open === 'edit' && (
                    <div className="menu-popup">
                        {item('撤销', 'Ctrl+Z', p.onUndo, !p.canUndo)}
                        {item('重做', 'Ctrl+Shift+Z', p.onRedo, !p.canRedo)}
                        <div className="menu-sep" />
                        {item('全选', 'Ctrl+A', p.onSelectAll)}
                        {item('复制一份', 'Ctrl+D', p.onDuplicate, !p.hasSelection)}
                        {item('删除', 'Delete', p.onDelete, !p.hasSelection)}
                    </div>
                )}
            </div>

            <div className="menubar-item">
                <button
                    className={`menubar-btn ${open === 'view' ? 'open' : ''}`}
                    onClick={() => setOpen(open === 'view' ? null : 'view')}
                >视图</button>
                {open === 'view' && (
                    <div className="menu-popup menu-popup-wide">
                        {PANEL_IDS.map((pid) => (
                            <div key={pid} className="view-row">
                                <span className="view-label">{PANEL_TITLES[pid]}</span>
                                <div className="view-positions">
                                    {POS_OPTIONS.map((pos) => (
                                        <button
                                            key={pos}
                                            className={p.layout.pos[pid] === pos ? 'active' : ''}
                                            onClick={() => p.onPanelPositionChange(pid, pos)}
                                        >
                                            {POS_LABELS[pos]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="menu-sep" />
                        <button className="menu-item" onClick={run(p.onResetLayout)}>
                            <span>重置布局</span>
                            <span className="shortcut">恢复默认</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="menubar-item">
                <button
                    className={`menubar-btn ${open === 'help' ? 'open' : ''}`}
                    onClick={() => setOpen(open === 'help' ? null : 'help')}
                >帮助</button>
                {open === 'help' && (
                    <div className="menu-popup">
                        <div className="menu-info">
                            <strong>SVG Editor v0.3.0</strong>
                            <p>拖拽面板标题可重新排列布局</p>
                            <p>V 选择 · R 矩形 · O 圆形 · E 椭圆 · L 直线</p>
                            <p>P 多边形 · S 星形 · B 画笔 · I 吸管 · X 橡皮擦</p>
                            <p>Ctrl+A 全选 · Ctrl+Z 撤销 · Ctrl+C/V 复制粘贴</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}