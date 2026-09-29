// 克隆并清理 SVG：去掉网格、选中框等辅助 UI
function serializeCleanSvg(svg: SVGSVGElement): string {
    const clone = svg.cloneNode(true) as SVGSVGElement;

    clone.querySelectorAll('[data-ui]').forEach((el) => el.remove());

    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    const serializer = new XMLSerializer();
    return serializer.serializeToString(clone);
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function exportSvg(svg: SVGSVGElement, filename = 'drawing.svg'): string {
    const str = serializeCleanSvg(svg);
    downloadBlob(
        new Blob([str], { type: 'image/svg+xml;charset=utf-8' }),
        filename,
    );
    return str;
}

export function exportPng(
    svg: SVGSVGElement,
    filename = 'drawing.png',
    scale = 2,
): Promise<Blob | null> {
    const str = serializeCleanSvg(svg);
    const svgBlob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const vb = svg.viewBox.baseVal;
    const w = vb.width || svg.clientWidth || 800;
    const h = vb.height || svg.clientHeight || 500;

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = w * scale;
            canvas.height = h * scale;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((b) => {
                if (b) downloadBlob(b, filename);
                URL.revokeObjectURL(url);
                resolve(b);
            }, 'image/png');
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        img.src = url;
    });
}