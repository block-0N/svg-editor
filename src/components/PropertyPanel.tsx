import type { Shape, ShapePatch } from '../core/types';
import ColorPicker from './ColorPicker';
import NumberInput from './NumberInput';
import { RotateIcon } from './icons';

interface Props {
    selected: Shape[];
    onUpdate: (id: string, patch: ShapePatch) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDeleteAll: () => void;
    onDuplicateAll: () => void;
}

export default function PropertyPanel({
    selected, onUpdate, onDelete, onDuplicate, onDeleteAll, onDuplicateAll,
}: Props) {
    if (selected.length === 0) {
        return <div className="empty">未选中图形</div>;
    }

    if (selected.length > 1) {
        return (
            <>
                <div className="empty" style={{ padding: '14px 0' }}>
                    已选中 {selected.length} 个图形
                </div>
                <div className="action-row">
                    <button className="action-btn" onClick={onDuplicateAll}>复制一份</button>
                    <button className="action-btn danger" onClick={onDeleteAll}>删除全部</button>
                </div>
            </>
        );
    }

    const shape = selected[0];
    const set = (p: ShapePatch) => onUpdate(shape.id, p);

    return (
        <>
            <div className="field-block">
                <label>填充</label>
                <ColorPicker value={shape.fill} onChange={(c) => set({ fill: c })} />
            </div>
            <div className="field-block">
                <label>描边</label>
                <ColorPicker value={shape.stroke} onChange={(c) => set({ stroke: c })} />
            </div>
            <div className="field">
                <label>线宽</label>
                <NumberInput value={shape.strokeWidth} min={0} max={40}
                    onCommit={(v) => set({ strokeWidth: v })} />
            </div>
            <div className="field">
                <label>不透明</label>
                <NumberInput value={Math.round(shape.opacity * 100)} min={0} max={100}
                    onCommit={(v) => set({ opacity: v / 100 })} />
            </div>
            <div className="field">
                <label><RotateIcon size={12} /> 旋转</label>
                <NumberInput value={shape.rotation} min={-360} max={360}
                    onCommit={(v) => set({ rotation: v })} />
            </div>

            {shape.type === 'rect' && (
                <>
                    <div className="field"><label>X</label>
                        <NumberInput value={shape.x} onCommit={(v) => set({ x: v })} /></div>
                    <div className="field"><label>Y</label>
                        <NumberInput value={shape.y} onCommit={(v) => set({ y: v })} /></div>
                    <div className="field"><label>宽</label>
                        <NumberInput value={shape.width} min={1} onCommit={(v) => set({ width: v })} /></div>
                    <div className="field"><label>高</label>
                        <NumberInput value={shape.height} min={1} onCommit={(v) => set({ height: v })} /></div>
                </>
            )}

            {(shape.type === 'circle' || shape.type === 'ellipse') && (
                <>
                    <div className="field"><label>CX</label>
                        <NumberInput value={shape.cx} onCommit={(v) => set({ cx: v })} /></div>
                    <div className="field"><label>CY</label>
                        <NumberInput value={shape.cy} onCommit={(v) => set({ cy: v })} /></div>
                </>
            )}

            {shape.type === 'circle' && (
                <div className="field"><label>半径</label>
                    <NumberInput value={shape.r} min={1} onCommit={(v) => set({ r: v })} /></div>
            )}

            {shape.type === 'ellipse' && (
                <>
                    <div className="field"><label>RX</label>
                        <NumberInput value={shape.rx} min={1} onCommit={(v) => set({ rx: v })} /></div>
                    <div className="field"><label>RY</label>
                        <NumberInput value={shape.ry} min={1} onCommit={(v) => set({ ry: v })} /></div>
                </>
            )}

            {shape.type === 'line' && (
                <>
                    <div className="field"><label>X1</label>
                        <NumberInput value={shape.x1} onCommit={(v) => set({ x1: v })} /></div>
                    <div className="field"><label>Y1</label>
                        <NumberInput value={shape.y1} onCommit={(v) => set({ y1: v })} /></div>
                    <div className="field"><label>X2</label>
                        <NumberInput value={shape.x2} onCommit={(v) => set({ x2: v })} /></div>
                    <div className="field"><label>Y2</label>
                        <NumberInput value={shape.y2} onCommit={(v) => set({ y2: v })} /></div>
                </>
            )}

            {(shape.type === 'polygon' || shape.type === 'star') && (
                <>
                    <div className="field"><label>CX</label>
                        <NumberInput value={shape.cx} onCommit={(v) => set({ cx: v })} /></div>
                    <div className="field"><label>CY</label>
                        <NumberInput value={shape.cy} onCommit={(v) => set({ cy: v })} /></div>
                </>
            )}

            {shape.type === 'polygon' && (
                <>
                    <div className="field"><label>半径</label>
                        <NumberInput value={shape.radius} min={1} onCommit={(v) => set({ radius: v })} /></div>
                    <div className="field"><label>边数</label>
                        <NumberInput value={shape.sides} min={3} max={20} onCommit={(v) => set({ sides: v })} /></div>
                </>
            )}

            {shape.type === 'star' && (
                <>
                    <div className="field"><label>外径</label>
                        <NumberInput value={shape.outerRadius} min={1} onCommit={(v) => set({ outerRadius: v })} /></div>
                    <div className="field"><label>内径</label>
                        <NumberInput value={shape.innerRadius} min={1} onCommit={(v) => set({ innerRadius: v })} /></div>
                    <div className="field"><label>角数</label>
                        <NumberInput value={shape.points} min={3} max={20} onCommit={(v) => set({ points: v })} /></div>
                </>
            )}

            <div className="action-row">
                <button className="action-btn" onClick={() => onDuplicate(shape.id)}>复制一份</button>
                <button className="action-btn danger" onClick={() => onDelete(shape.id)}>删除</button>
            </div>
        </>
    );
}