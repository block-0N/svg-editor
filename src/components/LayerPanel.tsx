import type { Shape } from '../core/types';

interface Props {
    shapes: Shape[];
    selectedIds: string[];
    onSelect: (ids: string[]) => void;
    onMove: (id: string, dir: -1 | 1) => void;
    onDelete: (id: string) => void;
}

export default function LayerPanel({
    shapes, selectedIds, onSelect, onMove, onDelete,
}: Props) {
    const ordered = [...shapes].reverse();

    const handleItemClick = (e: React.MouseEvent, id: string) => {
        const additive = e.shiftKey || e.ctrlKey || e.metaKey;
        if (additive) {
            if (selectedIds.includes(id)) {
                onSelect(selectedIds.filter((x) => x !== id));
            } else {
                onSelect([...selectedIds, id]);
            }
        } else {
            onSelect([id]);
        }
    };

    if (ordered.length === 0) {
        return <div className="empty">暂无图形</div>;
    }

    return (
        <div className="layer-list">
            {ordered.map((s) => (
                <div
                    key={s.id}
                    className={`layer-item ${selectedIds.includes(s.id) ? 'selected' : ''}`}
                    onClick={(e) => handleItemClick(e, s.id)}
                >
                    <span className="layer-dot" style={{ background: s.fill }} />
                    <span className="layer-name">{s.id}</span>
                    <div
                        className="layer-actions"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button title="上移" onClick={() => onMove(s.id, 1)}>↑</button>
                        <button title="下移" onClick={() => onMove(s.id, -1)}>↓</button>
                        <button className="delete" title="删除" onClick={() => onDelete(s.id)}>×</button>
                    </div>
                </div>
            ))}
        </div>
    );
}