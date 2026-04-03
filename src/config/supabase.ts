import { createClient } from "@supabase/supabase-js";

/**
 * --- WHAT IS SUPABASE? ---
 * Supabase is our online database where we store all 
 * chargers, bookings, and user ratings. 
 * 
 * --- WHAT ARE ENVIRONMENT VARIABLES? ---
 * Notice 'import.meta.env'? These are secret keys stored 

 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase environment variables are missing! Check your Netlify settings.");
}

// This 'supabase' object is what the rest of the app 
// uses to send and receive data.
// We use a fallback if missing to prevent a complete app crash during import
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
