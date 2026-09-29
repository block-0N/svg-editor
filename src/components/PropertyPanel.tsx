import type { Shape, ShapePatch } from '../core/types';

interface Props {
    shape: Shape | null;
    onUpdate: (id: string, patch: ShapePatch) => void;
    onDelete: (id: string) => void;
}

const num = (v: string) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

export default function PropertyPanel({ shape, onUpdate, onDelete }: Props) {
    if (!shape) {
        return (
            <section className="panel">
                <div className="panel-header">
                    <span>属性</span>
                </div>
                <div className="empty">未选中图形</div>
            </section>
        );
    }

    const set = (patch: ShapePatch) => onUpdate(shape.id, patch);

    return (
        <section className="panel">
            <div className="panel-header">
                <span>属性</span>
                <span className="count">{shape.type}</span>
            </div>

            <div className="field">
                <label>填充</label>
                <input
                    type="color"
                    value={shape.fill}
                    onChange={(e) => set({ fill: e.target.value })}
                />
            </div>
            <div className="field">
                <label>描边</label>
                <input
                    type="color"
                    value={shape.stroke}
                    onChange={(e) => set({ stroke: e.target.value })}
                />
            </div>
            <div className="field">
                <label>线宽</label>
                <input
                    type="number"
                    min={0}
                    max={20}
                    value={shape.strokeWidth}
                    onChange={(e) => set({ strokeWidth: num(e.target.value) })}
                />
            </div>

            {shape.type === 'rect' && (
                <>
                    <div className="field">
                        <label>X</label>
                        <input
                            type="number"
                            value={Math.round(shape.x)}
                            onChange={(e) => set({ x: num(e.target.value) })}
                        />
                    </div>
                    <div className="field">
                        <label>Y</label>
                        <input
                            type="number"
                            value={Math.round(shape.y)}
                            onChange={(e) => set({ y: num(e.target.value) })}
                        />
                    </div>
                    <div className="field">
                        <label>宽</label>
                        <input
                            type="number"
                            min={1}
                            value={Math.round(shape.width)}
                            onChange={(e) => set({ width: num(e.target.value) })}
                        />
                    </div>
                    <div className="field">
                        <label>高</label>
                        <input
                            type="number"
                            min={1}
                            value={Math.round(shape.height)}
                            onChange={(e) => set({ height: num(e.target.value) })}
                        />
                    </div>
                </>
            )}

            {shape.type === 'circle' && (
                <>
                    <div className="field">
                        <label>CX</label>
                        <input
                            type="number"
                            value={Math.round(shape.cx)}
                            onChange={(e) => set({ cx: num(e.target.value) })}
                        />
                    </div>
                    <div className="field">
                        <label>CY</label>
                        <input
                            type="number"
                            value={Math.round(shape.cy)}
                            onChange={(e) => set({ cy: num(e.target.value) })}
                        />
                    </div>
                    <div className="field">
                        <label>半径</label>
                        <input
                            type="number"
                            min={1}
                            value={Math.round(shape.r)}
                            onChange={(e) => set({ r: num(e.target.value) })}
                        />
                    </div>
                </>
            )}

            <button className="danger" onClick={() => onDelete(shape.id)}>
                删除图形
            </button>
        </section>
    );
}