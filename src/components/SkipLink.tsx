/**
 * Skip Link Component
 * 
 * Provides keyboard navigation skip links for accessibility.
 * Allows users to skip to main content, navigation, or footer.
 */

import { useNavigate, useLocation } from "react-router-dom";

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

function SkipLink({ href, children }: SkipLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // If same route, just focus the element
    if (location.pathname === href.split('#')[0] || href.startsWith('#')) {
      const targetId = href.includes('#') ? href.split('#')[1] : '';
      const target = targetId ? document.getElementById(targetId) : document.querySelector('main');
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Navigate to route first, then focus after navigation
      navigate(href);
      setTimeout(() => {
        const target = document.querySelector('main');
        if (target) {
          (target as HTMLElement).focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {children}
    </a>
  );
}

/**
 * Skip Links Container
 * Groups all skip links for easy keyboard navigation
 */
export function SkipLinks() {
  return (
    <div className="skip-links" aria-label="Skip links">
      <SkipLink href="#main-content">Saltar al contenido principal</SkipLink>
      <SkipLink href="#main-navigation">Saltar a la navegación</SkipLink>
      <SkipLink href="#footer">Saltar al pie de página</SkipLink>
    </div>
  );
}

