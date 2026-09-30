import { useEffect, useRef } from 'react';

interface Props {
    direction: 'horizontal' | 'vertical';
    onDrag: (delta: number) => void;
    className?: string;
}

export default function Resizer({ direction, onDrag, className }: Props) {
    const startRef = useRef<{ x: number; y: number } | null>(null);
    const onDragRef = useRef(onDrag);
    onDragRef.current = onDrag;

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        startRef.current = { x: e.clientX, y: e.clientY };
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const s = startRef.current;
            if (!s) return;
            const dx = e.clientX - s.x;
            const dy = e.clientY - s.y;
            const delta = direction === 'horizontal' ? dx : dy;
            if (delta === 0) return;
            startRef.current = { x: e.clientX, y: e.clientY };
            onDragRef.current(delta);
        };
        const onUp = () => { startRef.current = null; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [direction]);

    return (
        <div
            className={`resizer ${className ?? ''}`}
            style={{ cursor: direction === 'horizontal' ? 'ew-resize' : 'ns-resize' }}
            onMouseDown={handleMouseDown}
        />
    );
}