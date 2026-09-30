import type { Tool } from '../App';
import {
    CursorIcon, SquareIcon, CircleIcon, EllipseIcon, LineIcon,
    PolygonIcon, StarIcon, PencilIcon, EyedropperIcon, EraserIcon,
    UndoIcon, RedoIcon,
} from './icons';

interface Props {
    tool: Tool;
    onToolChange: (t: Tool) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
}

const TOOLS: { id: Tool; label: string; icon: React.ReactNode; key: string }[] = [
    { id: 'select', label: '选择', icon: <CursorIcon />, key: 'V' },
    { id: 'rect', label: '矩形', icon: <SquareIcon />, key: 'R' },
    { id: 'circle', label: '圆形', icon: <CircleIcon />, key: 'O' },
    { id: 'ellipse', label: '椭圆', icon: <EllipseIcon />, key: 'E' },
    { id: 'line', label: '直线', icon: <LineIcon />, key: 'L' },
    { id: 'polygon', label: '多边形', icon: <PolygonIcon />, key: 'P' },
    { id: 'star', label: '星形', icon: <StarIcon />, key: 'S' },
    { id: 'path', label: '画笔', icon: <PencilIcon />, key: 'B' },
    { id: 'eyedropper', label: '吸管', icon: <EyedropperIcon />, key: 'I' },
    { id: 'eraser', label: '橡皮擦', icon: <EraserIcon />, key: 'X' },
];

export default function Toolbar({
    tool, onToolChange, canUndo, canRedo, onUndo, onRedo,
}: Props) {
    return (
        <aside className="toolbar">
            {TOOLS.map((t) => (
                <button
                    key={t.id}
                    className={tool === t.id ? 'active' : ''}
                    onClick={() => onToolChange(t.id)}
                    title={`${t.label} (${t.key})`}
                >
                    {t.icon}
                </button>
            ))}

            <div className="toolbar-divider" />

            <button onClick={onUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)">
                <UndoIcon />
            </button>
            <button onClick={onRedo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)">
                <RedoIcon />
            </button>
        </aside>
    );
}