import { forwardRef } from 'react';
import type { PanelId } from '../core/layout';

interface Props {
    id: PanelId;
    title: string;
    extra?: React.ReactNode;
    dragging?: boolean;
    onDragStart: (id: PanelId, e: React.MouseEvent) => void;
    children: React.ReactNode;
    style?: React.CSSProperties;
}

const Panel = forwardRef<HTMLDivElement, Props>(({
    id, title, extra, dragging, onDragStart, children, style,
}, ref) => {
    return (
        <div
            ref={ref}
            className={`panel-wrap ${dragging ? 'dragging' : ''}`}
            data-panel-id={id}
            style={style}
        >
            <div
                className="panel-titlebar"
                onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    const el = e.target as HTMLElement;
                    if (el.closest('button, input, select, textarea')) return;
                    onDragStart(id, e);
                }}
            >
                <span className="panel-grip" aria-hidden>⋮⋮</span>
                <span className="panel-title">{title}</span>
                {extra && <div className="panel-title-extra">{extra}</div>}
            </div>
            <div className="panel-body">{children}</div>
        </div>
    );
});

Panel.displayName = 'Panel';
export default Panel;