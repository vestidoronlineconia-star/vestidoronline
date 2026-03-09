export interface CompressionResult {
  blob: Blob;
  preview: string;
  originalSize: number;
  compressedSize: number;
}

export const compressImage = async (
  file: File,
  maxSize = 1024,
  quality = 0.7
): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Resize maintaining aspect ratio
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const preview = canvas.toDataURL('image/jpeg', quality);

          resolve({
            blob,
            preview,
            originalSize: Math.round(file.size / 1024),
            compressedSize: Math.round(blob.size / 1024),
          });
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
};
