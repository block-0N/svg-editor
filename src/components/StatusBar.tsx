import type { CanvasSize, Shape } from '../core/types';
import type { Tool } from '../App';

interface Props {
    shapesCount: number;
    selected: Shape | null;
    tool: Tool;
    canvasSize: CanvasSize;
}

const TOOL_LABEL: Record<Tool, string> = {
    select: '选择',
    rect: '矩形',
    circle: '圆形',
    ellipse: '椭圆',
    path: '路径',
};

export default function StatusBar({
    shapesCount,
    selected,
    tool,
    canvasSize,
}: Props) {
    return (
        <footer className="statusbar">
            <span>
                工具 <span className="badge">{TOOL_LABEL[tool]}</span>
            </span>
            <span>
                画布{' '}
                <span className="badge">
                    {canvasSize.width} × {canvasSize.height}
                </span>
            </span>
            <span>
                图形 <span className="badge">{shapesCount}</span>
            </span>
            {selected && (
                <span>
                    选中 <span className="badge">{selected.id}</span>
                </span>
            )}
            <div className="statusbar-spacer" />
            <span className="hint">
                Ctrl+Z 撤销 · Ctrl+Shift+Z 重做 · Delete 删除 · 方向键微移 · V/R/O 切换工具
            </span>
        </footer>
    );
}