import type { Shape } from '../core/types';

interface Props {
    shapes: Shape[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onMove: (id: string, dir: -1 | 1) => void;
    onDelete: (id: string) => void;
}

export default function LayerPanel({
    shapes,
    selectedId,
    onSelect,
    onMove,
    onDelete,
}: Props) {
    const ordered = [...shapes].reverse();

    return (
        <section className="panel">
            <div className="panel-header">
                <span>图层</span>
                <span className="count">{shapes.length}</span>
            </div>

            {ordered.length === 0 ? (
                <div className="empty">暂无图形</div>
            ) : (
                <div className="layer-list">
                    {ordered.map((s) => (
                        <div
                            key={s.id}
                            className={`layer-item ${selectedId === s.id ? 'selected' : ''}`}
                            onClick={() => onSelect(s.id)}
                        >
                            <span className="layer-dot" style={{ background: s.fill }} />
                            <span className="layer-name">{s.id}</span>
                            <div
                                className="layer-actions"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button title="上移" onClick={() => onMove(s.id, 1)}>
                                    ↑
                                </button>
                                <button title="下移" onClick={() => onMove(s.id, -1)}>
                                    ↓
                                </button>
                                <button
                                    className="delete"
                                    title="删除"
                                    onClick={() => onDelete(s.id)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}