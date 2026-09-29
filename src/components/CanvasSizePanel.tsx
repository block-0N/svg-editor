import type { CanvasSize } from '../core/types';

interface Props {
    size: CanvasSize;
    onChange: (size: CanvasSize) => void;
}

const PRESETS: CanvasSize[] = [
    { width: 800, height: 500 },
    { width: 1200, height: 800 },
    { width: 1920, height: 1080 },
];

const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Math.round(v)));

export default function CanvasSizePanel({ size, onChange }: Props) {
    const setW = (v: number) =>
        onChange({ ...size, width: clamp(v, 100, 4000) });
    const setH = (v: number) =>
        onChange({ ...size, height: clamp(v, 100, 4000) });

    return (
        <section className="panel">
            <div className="panel-header">
                <span>画布</span>
                <span className="count">
                    {size.width} × {size.height}
                </span>
            </div>

            <div className="field">
                <label>宽度</label>
                <input
                    type="number"
                    min={100}
                    max={4000}
                    value={size.width}
                    onChange={(e) => setW(parseFloat(e.target.value) || 100)}
                />
            </div>
            <div className="field">
                <label>高度</label>
                <input
                    type="number"
                    min={100}
                    max={4000}
                    value={size.height}
                    onChange={(e) => setH(parseFloat(e.target.value) || 100)}
                />
            </div>

            <div className="preset-row">
                {PRESETS.map((p) => {
                    const active = p.width === size.width && p.height === size.height;
                    return (
                        <button
                            key={`${p.width}x${p.height}`}
                            className={`preset-btn ${active ? 'active' : ''}`}
                            onClick={() => onChange(p)}
                            title={`${p.width} × ${p.height}`}
                        >
                            {p.width}×{p.height}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}