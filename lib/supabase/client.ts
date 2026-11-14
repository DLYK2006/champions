import { createBrowserClient } from "@supabase/ssr";

// Browser client: carries the signed-in user's session, so RPCs see auth.uid().
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
