export async function splitPdfToImages(file: File): Promise<File[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const base = file.name.replace(/\.pdf$/i, '');
  const out: File[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp0 = page.getViewport({ scale: 1 });
    const scale = Math.min(2.2, Math.max(1.2, 1600 / vp0.width));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(`Canvas unavailable for page ${i}`);

    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) throw new Error(`Failed to render page ${i}`);

    out.push(
      new File([blob], `${base} - p${String(i).padStart(2, '0')}.png`, {
        type: 'image/png',
      }),
    );
    canvas.remove();
  }
  return out;
}

export function isPdf(file: File): boolean {
  return (
    file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  );
}
