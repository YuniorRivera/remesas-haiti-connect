import { supabase } from "@/integrations/supabase/client";
import { addCsrfHeader } from "./csrf";

// Wrapper for Supabase client that adds CSRF protection to edge function calls
// Note: For database operations, use standard supabase client
// CSRF validation is implemented at edge function level
export const secureSupabase = {
  functions: {
    invoke: async (functionName: string, options?: any) => {
      const headers = addCsrfHeader(options?.headers || {});
      return supabase.functions.invoke(functionName, {
        ...options,
        headers,
      });
    },
  },
};
