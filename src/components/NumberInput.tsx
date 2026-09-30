import { useEffect, useState } from 'react';

interface Props {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onCommit: (v: number) => void;
}

const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Math.round(v)));

export default function NumberInput({
    value,
    min = -Infinity,
    max = Infinity,
    step = 1,
    onCommit,
}: Props) {
    const [text, setText] = useState(String(value));

    useEffect(() => {
        setText(String(value));
    }, [value]);

    const commit = () => {
        const n = parseFloat(text);
        if (Number.isFinite(n)) {
            onCommit(clamp(n, min, max));
        } else {
            setText(String(value));
        }
    };

    return (
        <input
            type="number"
            step={step}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') {
                    setText(String(value));
                    e.currentTarget.blur();
                }
            }}
        />
    );
}