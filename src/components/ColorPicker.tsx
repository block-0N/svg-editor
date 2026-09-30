interface Props {
    value: string;
    onChange: (c: string) => void;
}

const PRESETS = [
    '#000000', '#ffffff', '#9e9e9e',
    '#f44336', '#e91e63', '#9c27b0',
    '#673ab7', '#3f51b5', '#2196f3',
    '#03a9f4', '#00bcd4', '#009688',
    '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b',
];

export default function ColorPicker({ value, onChange }: Props) {
    return (
        <div className="color-picker">
            <div className="color-row">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <input
                    type="text"
                    className="color-hex"
                    value={value}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
                    }}
                    spellCheck={false}
                />
            </div>
            <div className="swatch-grid">
                {PRESETS.map((c) => (
                    <button
                        key={c}
                        className={`swatch ${value.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                        style={{ background: c }}
                        title={c}
                        onClick={() => onChange(c)}
                    />
                ))}
            </div>
        </div>
    );
}