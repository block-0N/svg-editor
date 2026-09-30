import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from './icons';

interface Props {
    onNew: () => void;
    onOpen: () => void;
    onExportSvg: () => void;
    onExportPng: () => void;
}

export default function FileMenu({
    onNew,
    onOpen,
    onExportSvg,
    onExportPng,
}: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, [open]);

    const run = (fn: () => void) => () => {
        setOpen(false);
        fn();
    };

    return (
        <div className="file-menu" ref={ref}>
            <button
                className={`tb-btn ${open ? 'open' : ''}`}
                onClick={() => setOpen((v) => !v)}
            >
                文件
                <ChevronDownIcon />
            </button>

            {open && (
                <div className="menu-popup">
                    <button className="menu-item" onClick={run(onNew)}>
                        <span>新建</span>
                        <span className="shortcut">Ctrl+N</span>
                    </button>
                    <button className="menu-item" onClick={run(onOpen)}>
                        <span>打开…</span>
                        <span className="shortcut">Ctrl+O</span>
                    </button>
                    <div className="menu-sep" />
                    <button className="menu-item" onClick={run(onExportSvg)}>
                        <span>导出 SVG</span>
                        <span className="shortcut">Ctrl+S</span>
                    </button>
                    <button className="menu-item" onClick={run(onExportPng)}>
                        <span>导出 PNG</span>
                        <span className="shortcut">Ctrl+Shift+S</span>
                    </button>
                </div>
            )}
        </div>
    );
}