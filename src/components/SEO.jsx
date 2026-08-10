import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'VibeClips AI – AI Video Invitation & Celebration Generator';
const DEFAULT_DESCRIPTION = 'Create viral AI video invitations, hero entry reels, and personalized celebration videos in minutes. Powered by ByteDance Seedance & Google Veo.';
const DEFAULT_IMAGE = 'https://vibeclipsai.com/mascot.png';
const BASE_URL = 'https://vibeclipsai.com';

export default function SEO({
    title,
    description,
    canonical,
    ogImage = DEFAULT_IMAGE,
    ogType = 'website',
    noindex = false,
    jsonLd = null,
}) {
    const location = useLocation();
    const activeCanonical = canonical || `${BASE_URL}${location.pathname}`;
    const activeTitle = title ? `${title} | VibeClips AI` : DEFAULT_TITLE;
    const activeDescription = description || DEFAULT_DESCRIPTION;

    useEffect(() => {
        // 1. Update Title
        document.title = activeTitle;

        // 2. Helper to set or create meta elements
        const setMetaTag = (name, content, isProperty = false) => {
            const attr = isProperty ? 'property' : 'name';
            let el = document.querySelector(`meta[${attr}="${name}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, name);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content || '');
        };

        // Standard metadata
        setMetaTag('description', activeDescription);
        setMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');

        // Open Graph tags
        setMetaTag('og:title', activeTitle, true);
        setMetaTag('og:description', activeDescription, true);
        setMetaTag('og:url', activeCanonical, true);
        setMetaTag('og:type', ogType, true);
        setMetaTag('og:image', ogImage, true);
        setMetaTag('og:site_name', 'VibeClips AI', true);

        // Twitter tags
        setMetaTag('twitter:card', 'summary_large_image');
        setMetaTag('twitter:title', activeTitle);
        setMetaTag('twitter:description', activeDescription);
        setMetaTag('twitter:image', ogImage);

        // 3. Update Canonical Tag
        let linkCanonical = document.querySelector('link[rel="canonical"]');
        if (!linkCanonical) {
            linkCanonical = document.createElement('link');
            linkCanonical.setAttribute('rel', 'canonical');
            document.head.appendChild(linkCanonical);
        }
        linkCanonical.setAttribute('href', activeCanonical);

        // 4. Update JSON-LD structured data if provided
        let jsonLdScript = document.getElementById('page-jsonld-schema');
        if (jsonLd) {
            if (!jsonLdScript) {
                jsonLdScript = document.createElement('script');
                jsonLdScript.setAttribute('type', 'application/ld+json');
                jsonLdScript.setAttribute('id', 'page-jsonld-schema');
                document.head.appendChild(jsonLdScript);
            }
            jsonLdScript.textContent = typeof jsonLd === 'string' ? jsonLd : JSON.stringify(jsonLd);
        } else if (jsonLdScript) {
            jsonLdScript.remove();
        }

        return () => {
            // Clean up JSON-LD on unmount if component changes
            const script = document.getElementById('page-jsonld-schema');
            if (script) script.remove();
        };
    }, [activeTitle, activeDescription, activeCanonical, ogImage, ogType, noindex, jsonLd]);

    return null;
}
