interface IconProps { size?: number }

const S = (props: IconProps, children: React.ReactNode, viewBox = '0 0 16 16') => (
    <svg
        width={props.size ?? 16}
        height={props.size ?? 16}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {children}
    </svg>
);

export const CursorIcon = (p: IconProps) => S(p,
    <path d="M3 1.5 L3 13.2 L6.3 10 L8.4 14.5 L10.2 13.6 L8.1 9.2 L12.8 9.2 Z" fill="currentColor" stroke="none" />
);

export const SquareIcon = (p: IconProps) => S(p,
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
);

export const CircleIcon = (p: IconProps) => S(p,
    <circle cx="8" cy="8" r="5.5" />
);

export const EllipseIcon = (p: IconProps) => S(p,
    <ellipse cx="8" cy="8" rx="6.5" ry="4.5" />
);

export const LineIcon = (p: IconProps) => S(p,
    <path d="M2 14 L14 2" />
);

export const PolygonIcon = (p: IconProps) => S(p,
    <path d="M8 2 L13.7 5.5 L13.7 10.5 L8 14 L2.3 10.5 L2.3 5.5 Z" />
);

export const StarIcon = (p: IconProps) => S(p,
    <path d="M8 1.5 L9.9 6.1 L14.5 6.4 L11 9.4 L12.1 14.2 L8 11.5 L3.9 14.2 L5 9.4 L1.5 6.4 L6.1 6.1 Z" />
);

export const PencilIcon = (p: IconProps) => S(p,
    <>
        <path d="M11.5 1.8 L14.2 4.5 L5.5 13.2 L2 14 L2.8 10.5 Z" />
        <path d="M9.8 3.5 L12.5 6.2" />
    </>
);

export const EyedropperIcon = (p: IconProps) => S(p,
    <>
        <path d="M13.5 2.5 L13.5 5.5 L9 10 L6 7 L10.5 2.5 Z" />
        <path d="M6 7 L2 13.5 L3.5 14 L9 10" />
    </>
);

export const EraserIcon = (p: IconProps) => S(p,
    <>
        <path d="M9.5 2.5 L13.5 6.5 L8 12 L3.5 12 L2.5 11 Z" />
        <path d="M5.5 6.5 L9.5 10.5" />
        <path d="M2.5 14 L13.5 14" />
    </>
);

export const RotateIcon = (p: IconProps) => S(p,
    <>
        <path d="M13.5 8 A5.5 5.5 0 1 1 8 2.5" />
        <path d="M8 0.5 L8 4.5 L12 2.5" />
    </>
);

export const UndoIcon = (p: IconProps) => S(p,
    <>
        <path d="M6 5 L2.5 8 L6 11" />
        <path d="M2.5 8 H9.5 A3.2 3.2 0 0 1 9.5 14.4 H7.5" />
    </>
);

export const RedoIcon = (p: IconProps) => S(p,
    <>
        <path d="M10 5 L13.5 8 L10 11" />
        <path d="M13.5 8 H6.5 A3.2 3.2 0 0 0 6.5 14.4 H8.5" />
    </>
);

export const ChevronDownIcon = (p: IconProps) => S(p,
    <path d="M4 6 L8 10 L12 6" />
);

export const LogoIcon = (p: IconProps) => S(p,
    <>
        <path d="M2 4.5 L8 1.5 L14 4.5 L8 7.5 Z" />
        <path d="M2 8 L8 11 L14 8" />
        <path d="M2 11.5 L8 14.5 L14 11.5" />
    </>
);