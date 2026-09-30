export type Pos = 'left' | 'right' | 'top' | 'bottom' | 'hidden';
export type DockPos = 'top' | 'bottom' | 'left' | 'right';
export type PanelId = 'toolbar' | 'canvasSize' | 'properties' | 'layers';

export interface Layout {
    pos: Record<PanelId, Pos>;
    order: PanelId[];
    dockSizes: Record<DockPos, number>;
    panelSizes: Partial<Record<PanelId, number>>;
}

export const PANEL_TITLES: Record<PanelId, string> = {
    toolbar: '工具',
    canvasSize: '画布',
    properties: '属性',
    layers: '图层',
};

export const POS_LABELS: Record<Pos, string> = {
    top: '顶部',
    bottom: '底部',
    left: '左侧',
    right: '右侧',
    hidden: '隐藏',
};

export const DEFAULT_LAYOUT: Layout = {
    pos: {
        toolbar: 'top',
        canvasSize: 'right',
        properties: 'right',
        layers: 'right',
    },
    order: ['toolbar', 'canvasSize', 'properties', 'layers'],
    dockSizes: { top: 220, bottom: 220, left: 280, right: 280 },
    panelSizes: {},
};

const KEY = 'svg-editor-layout-v3';

export function loadLayout(): Layout {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return DEFAULT_LAYOUT;
        const parsed = JSON.parse(raw) as Partial<Layout>;
        if (!parsed.pos || !parsed.order) return DEFAULT_LAYOUT;
        const pos = { ...DEFAULT_LAYOUT.pos, ...parsed.pos };
        const dockSizes = { ...DEFAULT_LAYOUT.dockSizes, ...(parsed.dockSizes ?? {}) };
        const panelSizes = { ...(parsed.panelSizes ?? {}) };
        const known = new Set<PanelId>(['toolbar', 'canvasSize', 'properties', 'layers']);
        const order = parsed.order.filter((id) => known.has(id as PanelId)) as PanelId[];
        for (const id of DEFAULT_LAYOUT.order) {
            if (!order.includes(id)) order.push(id);
        }
        return { pos, order, dockSizes, panelSizes };
    } catch {
        return DEFAULT_LAYOUT;
    }
}

export function saveLayout(layout: Layout) {
    try {
        localStorage.setItem(KEY, JSON.stringify(layout));
    } catch { /* ignore */ }
}

export function panelsIn(layout: Layout, pos: Pos): PanelId[] {
    return layout.order.filter((id) => layout.pos[id] === pos);
}

export function movePanel(layout: Layout, panel: PanelId, target: Pos): Layout {
    const oldPos = layout.pos[panel];
    if (oldPos === target) return layout;

    const nextPos = { ...layout.pos, [panel]: target };
    const nextOrder = [...layout.order.filter((p) => p !== panel), panel];
    const nextPanelSizes = { ...layout.panelSizes };

    // 被移动的面板：清除自己的旧尺寸
    delete nextPanelSizes[panel];

    // 源 dock 内其余面板：清除固定尺寸，让它们重新均分
    if (oldPos !== 'hidden') {
        for (const id of layout.order) {
            if (id !== panel && layout.pos[id] === oldPos) {
                delete nextPanelSizes[id];
            }
        }
    }

    // 目标 dock 内已有面板：清除固定尺寸，让新老面板重新均分
    if (target !== 'hidden') {
        for (const id of layout.order) {
            if (id !== panel && layout.pos[id] === target) {
                delete nextPanelSizes[id];
            }
        }
    }

    return {
        pos: nextPos,
        order: nextOrder,
        dockSizes: layout.dockSizes,
        panelSizes: nextPanelSizes,
    };
}