/**
 * Dynamic Caption Generation Engine for VibeClipAI
 * Formats personalized social media captions based on template metadata and user form inputs.
 */

export const CAPTION_PRESETS = [
    { id: 'luxury', name: 'Luxury & Romantic' },
    { id: 'minimal', name: 'Minimalist' },
    { id: 'playful', name: 'Playful & Avatar' },
];

export function generateCaption(template, formValues = {}, style = 'luxury') {
    const templateName = template?.name || 'AI Artwork';

    // Extract dynamic input variables
    const bride = formValues.BRIDE_NAME || formValues.bride_name || '';
    const groom = formValues.GROOM_NAME || formValues.groom_name || '';
    const couple = formValues.COUPLE_NAMES || formValues.couple_names || (bride && groom ? `${bride} & ${groom}` : '');
    const date = formValues.MARRIAGE_DATE || formValues.EVENT_DATE || formValues.IMPORTANT_DATE || formValues.event_date || '';
    const name = formValues.NAME || formValues.USER_NAME || formValues.CharacterName || '';

    const brandLine = 'Created with VibeClipAI ✨\nhttps://vibeclipsai.com';

    if (style === 'minimal') {
        let text = `Saved the Date. 🤍`;
        if (couple) text += ` ${couple}`;
        if (date) text += ` (${date})`;
        return `${text}\n\n@VibeClipAI ✨\nhttps://vibeclipsai.com`;
    }

    if (style === 'playful') {
        let text = `Unlocked my custom AI avatar! 🎨✨`;
        if (name) text = `Unlocked ${name}'s custom AI avatar! 🎨✨`;
        if (couple) text = `Our AI portrait brought to life! 😍 ${couple}`;
        return `${text}\n\nTry yours on VibeClipAI 👇\nhttps://vibeclipsai.com\n\n#VibeClipAI #AIArt #MiniMe #ViralAI`;
    }

    // Default: Luxury & Romantic
    let header = `✨ Our love story brought to life! 💍`;
    if (couple) header += `\n${couple}`;
    if (date) header += ` | ${date} 🗓️`;

    return `${header}\n\n${brandLine}\n\n#VibeClipAI #SaveTheDate #WeddingVibes #AIWedding #CoupleGoals`;
}
