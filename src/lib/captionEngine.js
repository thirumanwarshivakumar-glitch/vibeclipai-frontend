/**
 * Dynamic Template-Specific Caption Generation Engine for VibeClipAI
 * Replaces placeholders inside the Admin-defined `caption_skeleton` with customer form inputs.
 */

export function generateCaption(template, formValues = {}) {
    const skeleton = template?.caption_skeleton || template?.captionSkeleton;

    // Extract dynamic input variables
    const bride = formValues.BRIDE_NAME || formValues.bride_name || '';
    const groom = formValues.GROOM_NAME || formValues.groom_name || '';
    const couple = formValues.COUPLE_NAMES || formValues.couple_names || (bride && groom ? `${bride} & ${groom}` : '');
    const date = formValues.MARRIAGE_DATE || formValues.EVENT_DATE || formValues.IMPORTANT_DATE || formValues.event_date || '';
    const name = formValues.NAME || formValues.USER_NAME || formValues.CharacterName || '';

    // If Admin defined a custom caption skeleton for this template
    if (skeleton && skeleton.trim().length > 0) {
        let text = skeleton;

        // Perform variable substitution
        text = text.replace(/\{BRIDE_NAME\}/gi, bride || 'Bride');
        text = text.replace(/\{GROOM_NAME\}/gi, groom || 'Groom');
        text = text.replace(/\{COUPLE_NAMES\}/gi, couple || (bride && groom ? `${bride} & ${groom}` : 'Couple'));
        text = text.replace(/\{MARRIAGE_DATE\}/gi, date || 'Save The Date');
        text = text.replace(/\{EVENT_DATE\}/gi, date || 'Save The Date');
        text = text.replace(/\{IMPORTANT_DATE\}/gi, date || 'Save The Date');
        text = text.replace(/\{NAME\}/gi, name || 'User');
        text = text.replace(/\{USER_NAME\}/gi, name || 'User');
        text = text.replace(/\{CharacterName\}/gi, name || 'User');

        return text.trim();
    }

    // Default Fallback if no custom caption skeleton is defined in Admin
    let header = `✨ Check out my custom AI artwork! 🎨`;
    if (couple) header = `✨ Our love story brought to life! 💍\n${couple}`;
    if (date && couple) header += ` | ${date} 🗓️`;

    return `${header}\n\nCreated with VibeClipAI ✨\nhttps://vibeclipsai.com\n\n#VibeClipAI #AIArt #ViralAI`;
}
