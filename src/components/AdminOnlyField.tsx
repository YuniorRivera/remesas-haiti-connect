import { ReactNode } from "react";
import { Lock } from "lucide-react";

interface AdminOnlyFieldProps {
  children: ReactNode;
  isAdmin: boolean;
  fallback?: ReactNode;
  showMessage?: boolean;
}

/**
 * Component to conditionally render admin-only fields
 * Shows a lock icon or custom fallback for non-admin users
 */
export function AdminOnlyField({ 
  children, 
  isAdmin, 
  fallback,
  showMessage = false 
}: AdminOnlyFieldProps) {
  if (isAdmin) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showMessage) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Lock className="h-3 w-3" />
        <span>Solo visible para administradores</span>
      </div>
    );
  }

  return null;
}

/**
 * Component to mask sensitive data for non-privileged users
 */
interface SensitiveDataProps {
  value: string | null | undefined;
  canView: boolean;
  maskLength?: number;
}

export function SensitiveData({ value, canView, maskLength = 4 }: SensitiveDataProps) {
  if (canView) {
    return <span>{value || 'N/A'}</span>;
  }

  if (!value) {
    return <span className="text-muted-foreground">****</span>;
  }

  if (value.length <= maskLength) {
    return <span className="text-muted-foreground">****</span>;
  }

  return (
    <span className="text-muted-foreground">
      ****{value.slice(-maskLength)}
    </span>
  );
}
