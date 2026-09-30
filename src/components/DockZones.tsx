import type { Pos } from '../core/layout';
import { POS_LABELS } from '../core/layout';

interface Props {
    hovered: Pos | null;
}

const ZONES: Exclude<Pos, 'hidden'>[] = ['top', 'bottom', 'left', 'right'];

export default function DockZones({ hovered }: Props) {
    return (
        <div className="dock-zones">
            {ZONES.map((z) => (
                <div
                    key={z}
                    className={`dock-zone dock-zone-${z} ${hovered === z ? 'hovered' : ''}`}
                >
                    <div className="dock-zone-inner">{POS_LABELS[z]}</div>
                </div>
            ))}
        </div>
    );
}