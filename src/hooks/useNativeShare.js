import { useState, useCallback } from 'react';

export function useNativeShare() {
    const [isSharing, setIsSharing] = useState(false);
    const [shareError, setShareError] = useState(null);

    // Check if navigator.share and file sharing are supported
    const isSupported = typeof window !== 'undefined' && !!navigator.share;

    const share = useCallback(async ({ imageUrl, title, text }) => {
        if (!isSupported) {
            setShareError('Native sharing is not supported on this browser.');
            return false;
        }

        setIsSharing(true);
        setShareError(null);

        try {
            let filesArray = [];

            if (imageUrl) {
                try {
                    // Fetch image blob from URL
                    const response = await fetch(imageUrl, { mode: 'cors' });
                    const blob = await response.blob();

                    // Convert Blob to JPEG file object for maximum iOS/Android native share compatibility
                    const file = new File([blob], 'vibeclip-artwork.jpg', {
                        type: blob.type.includes('png') ? 'image/png' : 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    // Test if browser can share files
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        filesArray = [file];
                    }
                } catch (fetchErr) {
                    console.warn('Could not process image file for native share:', fetchErr);
                }
            }

            const shareData = {
                title: title || 'VibeClipAI Artwork',
                text: text || 'Created with VibeClipAI ✨ https://vibeclipsai.com',
            };

            if (filesArray.length > 0) {
                shareData.files = filesArray;
            }

            await navigator.share(shareData);
            setIsSharing(false);
            return true;
        } catch (err) {
            setIsSharing(false);
            // Ignore AbortError when user intentionally closes OS share sheet
            if (err.name !== 'AbortError') {
                console.error('Native share error:', err);
                setShareError(err.message || 'Failed to share');
            }
            return false;
        }
    }, [isSupported]);

    return { share, isSupported, isSharing, shareError };
}
