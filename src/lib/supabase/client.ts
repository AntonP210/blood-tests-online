import { createBrowserClient } from "@supabase/ssr";

function getEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return { url, key };
}

/**
 * Creates a Supabase browser client.
 * Returns null if required environment variables are not configured.
 */
export function createClient() {
  const env = getEnv();
  if (!env) {
    return null;
  }
  return createBrowserClient(env.url, env.key);
}
