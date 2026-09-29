interface IconProps {
    size?: number;
}

export function CursorIcon({ size = 16 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 1.5 L3 13.2 L6.3 10 L8.4 14.5 L10.2 13.6 L8.1 9.2 L12.8 9.2 Z" />
        </svg>
    );
}

export function SquareIcon({ size = 16 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
        </svg>
    );
}

export function CircleIcon({ size = 16 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <circle cx="8" cy="8" r="5.5" />
        </svg>
    );
}

export function UndoIcon({ size = 16 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 5 L2.5 8 L6 11" />
            <path d="M2.5 8 H9.5 A3.2 3.2 0 0 1 9.5 14.4 H7.5" />
        </svg>
    );
}

export function RedoIcon({ size = 16 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M10 5 L13.5 8 L10 11" />
            <path d="M13.5 8 H6.5 A3.2 3.2 0 0 0 6.5 14.4 H8.5" />
        </svg>
    );
}

export function DownloadIcon({ size = 14 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M8 2 V10" />
            <path d="M4.5 7 L8 10.5 L11.5 7" />
            <path d="M2.5 13.5 H13.5" />
        </svg>
    );
}

export function LogoIcon({ size = 18 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
        >
            <path d="M2 4.5 L8 1.5 L14 4.5 L8 7.5 Z" />
            <path d="M2 8 L8 11 L14 8" />
            <path d="M2 11.5 L8 14.5 L14 11.5" />
        </svg>
    );
}