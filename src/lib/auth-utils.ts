import { supabase } from '@/integrations/supabase/client';

/**
 * Generates an SSO-enabled URL for common MCS Vercel applications.
 * Append access_token and refresh_token to the URL hash so the target app 
 * can pick it up via supabase.auth.setSession().
 */
export async function getSSOUrl(targetUrl: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        console.warn("No active session found for SSO");
        return targetUrl;
    }

    try {
        const url = new URL(targetUrl);

        // Check if target is one of our known Vercel apps
        const isMcsApp = targetUrl.includes('webapp-proyectos.vercel.app') ||
            targetUrl.includes('webapp-disponibilidad.vercel.app');

        if (!isMcsApp) return targetUrl;

        // Supabase auth.setSession expects tokens in the hash in a specific format
        // or we can pass them as custom params. The most standard way for 
        // Supabase JS client to pick it up is via the hash.
        const ssoParams = new URLSearchParams();
        ssoParams.set('access_token', session.access_token);
        ssoParams.set('refresh_token', session.refresh_token);
        ssoParams.set('expires_in', String(session.expires_in));
        ssoParams.set('token_type', 'bearer');
        ssoParams.set('type', 'recovery'); // Using recovery type often helps auto-login logic

        // Build the final URL with the session in the hash
        return `${targetUrl.split('#')[0]}#${ssoParams.toString()}`;
    } catch (e) {
        console.error("Error generating SSO URL:", e);
        return targetUrl;
    }
}
