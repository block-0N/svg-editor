import type { Tool } from '../App';
import {
    CircleIcon,
    CursorIcon,
    RedoIcon,
    SquareIcon,
    UndoIcon,
} from './icons';

interface Props {
    tool: Tool;
    onToolChange: (t: Tool) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
}

export default function Toolbar({
    tool,
    onToolChange,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
}: Props) {
    return (
        <aside className="toolbar">
            <button
                className={tool === 'select' ? 'active' : ''}
                onClick={() => onToolChange('select')}
                title="选择 (V)"
            >
                <CursorIcon />
            </button>
            <button
                className={tool === 'rect' ? 'active' : ''}
                onClick={() => onToolChange('rect')}
                title="矩形 (R)"
            >
                <SquareIcon />
            </button>
            <button
                className={tool === 'circle' ? 'active' : ''}
                onClick={() => onToolChange('circle')}
                title="圆形 (O)"
            >
                <CircleIcon />
            </button>

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