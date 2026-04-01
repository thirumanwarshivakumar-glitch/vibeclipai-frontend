import { useEffect } from 'react';
import { useUser } from '@insforge/react';
import { getUserProfile, sendWelcomeEmail } from '../lib/api';

/**
 * Handle sending a welcome email on the first login.
 * This component checks the user's profile status and triggers the email if needed.
 */
export default function WelcomeEmailHandler() {
    const { user } = useUser();

    useEffect(() => {
        if (user?.id && user?.email) {
            const handleWelcomeFlow = async () => {
                try {
                    // 1. Fetch user profile from public.profiles
                    const profile = await getUserProfile(user.id);
                    
                    // 2. If profile exists and welcome email hasn't been sent, trigger it
                    if (profile && !profile.welcome_email_sent) {
                        console.log(`[WelcomeEmailHandler] Triggering first login welcome email for: ${user.email}`);
                        await sendWelcomeEmail(user.email, user.id);
                    }
                } catch (error) {
                    console.error('[WelcomeEmailHandler] Error in welcome workflow:', error);
                }
            };

            handleWelcomeFlow();
        }
    }, [user]);

    return null;
}
