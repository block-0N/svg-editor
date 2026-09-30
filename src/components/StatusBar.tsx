import type { CanvasSize, Shape } from '../core/types';
import type { Tool } from '../App';

interface Props {
    shapesCount: number;
    selected: Shape | null;
    selectedCount: number;
    tool: Tool;
    canvasSize: CanvasSize;
}

const TOOL_LABEL: Record<Tool, string> = {
    select: '选择', rect: '矩形', circle: '圆形', ellipse: '椭圆',
    line: '直线', polygon: '多边形', star: '星形', path: '画笔',
    eyedropper: '吸管', eraser: '橡皮擦',
};

export default function StatusBar({
    shapesCount, selected, selectedCount, tool, canvasSize,
}: Props) {
    return (
        <footer className="statusbar">
            <span>工具 <span className="badge">{TOOL_LABEL[tool]}</span></span>
            <span>画布 <span className="badge">{canvasSize.width} × {canvasSize.height}</span></span>
            <span>图形 <span className="badge">{shapesCount}</span></span>
            {selectedCount > 1 && (
                <span>已选中 <span className="badge">{selectedCount} 个</span></span>
            )}
            {selected && <span>选中 <span className="badge">{selected.id}</span></span>}
            <div className="statusbar-spacer" />
            <span className="hint">
                V/R/O/E/L/P/S/B/I/X 工具 · Ctrl+A 全选 · Shift+点击 多选
            </span>
        </footer>
    );
}