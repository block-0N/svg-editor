import type { CanvasSize } from '../core/types';
import NumberInput from './NumberInput';

interface Props {
    size: CanvasSize;
    onChange: (size: CanvasSize) => void;
}

const PRESETS: CanvasSize[] = [
    { width: 800, height: 500 },
    { width: 1200, height: 800 },
    { width: 1920, height: 1080 },
];

export default function CanvasSizePanel({ size, onChange }: Props) {
    return (
        <>
            <div className="field">
                <label>宽度</label>
                <NumberInput
                    value={size.width}
                    min={100}
                    max={4000}
                    onCommit={(v) => onChange({ ...size, width: v })}
                />
            </div>
            <div className="field">
                <label>高度</label>
                <NumberInput
                    value={size.height}
                    min={100}
                    max={4000}
                    onCommit={(v) => onChange({ ...size, height: v })}
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
                        >
                            {p.width}×{p.height}
                        </button>
                    );
                })}
            </div>
        </>
    );
}