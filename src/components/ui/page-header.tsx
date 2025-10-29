/**
 * Page Header Component
 * 
 * Reusable page header with title, description, and optional actions
 */

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  description?: string;
  backUrl?: string;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  backUrl,
  backLabel = "Volver",
  actions,
  className = "",
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={`border-b bg-card shadow-sm ${className}`}>
      <div className="container mx-auto px-4 py-4">
        {backUrl && (
          <Button
            variant="ghost"
            onClick={() => navigate(backUrl)}
            className="mb-2"
            aria-label={backLabel}
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            {backLabel}
          </Button>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </header>
  );
}

