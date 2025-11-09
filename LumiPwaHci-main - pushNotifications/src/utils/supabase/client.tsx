import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";
import { debugError, debugLog } from "../debug";

// Verify we have the required credentials
if (!projectId || !publicAnonKey) {
  debugError("Supabase", "Missing Supabase credentials:", { 
    hasProjectId: !!projectId, 
    hasPublicAnonKey: !!publicAnonKey 
  });
  throw new Error("Missing Supabase credentials");
}

const supabaseUrl = `https://${projectId}.supabase.co`;
debugLog("Supabase", "Initializing Supabase client with URL:", supabaseUrl);

// Create a singleton Supabase client to avoid multiple GoTrueClient instances
export const supabase = createClient(
  supabaseUrl,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

debugLog("Supabase", "Supabase client initialized successfully");
