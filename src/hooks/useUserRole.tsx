import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "agent_owner" | "agent_clerk" | "compliance_officer" | "sender_user";

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
        const rolesArray = data?.map((r) => r.role as AppRole) || [];
        console.log("🔷 useUserRole: Fetched roles:", rolesArray, "for user:", userId);
        setRoles(rolesArray);
      }
      setLoading(false);
    };

    fetchRoles();
  }, [userId]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isAgentOwner = hasRole("agent_owner");
  const isAgentClerk = hasRole("agent_clerk");
  const isComplianceOfficer = hasRole("compliance_officer");
  const isSenderUser = hasRole("sender_user");
  
  // Convenience groupings
  const isAgent = isAgentOwner || isAgentClerk;

  return { 
    roles, 
    hasRole, 
    isAdmin, 
    isAgentOwner,
    isAgentClerk,
    isComplianceOfficer,
    isSenderUser,
    isAgent,
    loading 
  };
}
