import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: { email, password },
      });

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      if (data.error) {
        return { data: null, error: { message: data.error } };
      }

      // Store CSRF token for subsequent requests
      if (data.csrfToken) {
        sessionStorage.setItem('csrf-token', data.csrfToken);
      }
      
      // Update local state
      setUser(data.user);
      
      return { data: { user: data.user }, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    try {
      const csrfToken = sessionStorage.getItem('csrf-token');
      
      const { data, error } = await supabase.functions.invoke('auth-logout', {
        headers: {
          'X-CSRF-Token': csrfToken || '',
        },
      });

      if (error) {
        console.error('Logout error:', error);
      }

      // Always clear local state
      setUser(null);
      setSession(null);
      sessionStorage.removeItem('csrf-token');

      return { error: null };
    } catch (error: any) {
      // Even if there's an error, clear local state
      setUser(null);
      setSession(null);
      sessionStorage.removeItem('csrf-token');
      return { error: { message: error.message } };
    }
  };

  return { user, session, loading, signIn, signUp, signOut };
}
