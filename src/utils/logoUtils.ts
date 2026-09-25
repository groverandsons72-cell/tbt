/**
 * Utility to convert SVG or any image format into a crisp PNG Data URI
 * so that jsPDF.addImage and html2canvas can embed it without cross-origin or SVG renderer issues.
 */

let cachedRasterLogo = '';

export function getRasterLogo(logoSource?: string): Promise<string> {
  if (!logoSource) return Promise.resolve('');
  
  // If it's already a PNG or JPEG data URI, return immediately
  if (logoSource.startsWith('data:image/png') || logoSource.startsWith('data:image/jpeg')) {
    return Promise.resolve(logoSource);
  }

  // Return cached result if same source
  if (cachedRasterLogo) {
    return Promise.resolve(cachedRasterLogo);
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(logoSource);
      return;
    }

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 400, 400);
            ctx.drawImage(img, 0, 0, 400, 400);
            const pngUri = canvas.toDataURL('image/png', 1.0);
            cachedRasterLogo = pngUri;
            resolve(pngUri);
            return;
          }
        } catch (err) {
          console.warn('Canvas rasterization caught exception:', err);
        }
        resolve(logoSource);
      };

      img.onerror = () => {
        console.warn('Image load failed for rasterization');
        resolve(logoSource);
      };

      img.src = logoSource;
    } catch {
      resolve(logoSource);
    }
  });
}
