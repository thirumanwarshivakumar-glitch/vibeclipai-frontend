/**
 * Client-Side Image Compression & Validation Utility for VibeClipAI
 * Automatically resizes and compresses high-resolution camera selfies (Android/iOS 50MP photos)
 * down to crisp, web-optimized JPEGs (< 2MB) before upload.
 */

export async function compressImage(file, maxWidth = 2048, maxHeight = 2048, quality = 0.85) {
    if (!file) return file;

    // Check if valid image type or extension
    const isImageType = file.type?.startsWith('image/') || file.type === '';
    const hasImageExt = /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name || '');

    if (!isImageType && !hasImageExt) {
        throw new Error('Please select a valid image file (JPEG, PNG, WEBP).');
    }

    // If file is already under 2MB, return original file directly
    if (file.size <= 2 * 1024 * 1024) {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate scaling maintaining aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File(
                                    [blob],
                                    file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                                    { type: 'image/jpeg', lastModified: Date.now() }
                                );
                                resolve(compressedFile);
                            } else {
                                resolve(file); // Fallback to original
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                } else {
                    resolve(file);
                }
            };
            img.onerror = () => resolve(file);
            img.src = event.target?.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}
