import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "agente" | "emisor";

export function useUserRole(userId: string | undefined) {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
      } else {
        setRoles(data?.map((r) => r.role as AppRole) || []);
      }
      setLoading(false);
    };

    fetchRoles();
  }, [userId]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isAgente = hasRole("agente");
  const isEmisor = hasRole("emisor");

  return { roles, hasRole, isAdmin, isAgente, isEmisor, loading };
}
