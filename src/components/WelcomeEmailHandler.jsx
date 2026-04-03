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
        if (!user?.id || !user?.email) return;

        let isMounted = true;
        let retryCount = 0;
        const maxRetries = 5;

        const handleWelcomeFlow = async () => {
            try {
                // 1. Fetch user profile from public.profiles
                const profile = await getUserProfile(user.id);
                
                if (!profile && retryCount < maxRetries) {
                    // Profile might not be created yet by the database trigger, retry later
                    retryCount++;
                    setTimeout(() => {
                        if (isMounted) handleWelcomeFlow();
                    }, 1000);
                    return;
                }

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

        return () => {
            isMounted = false;
        };
    }, [user?.id, user?.email]);

    return null;
}
