import { Link } from "react-router-dom";
import { 
  MessageCircle, 
  Mail, 
  Clock, 
  FileText, 
  Shield, 
  Cookie, 
  AlertCircle,
  Languages,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Map,
  Home,
  Send,
  History,
} from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import { useLocale } from "@/lib/i18n";

export function Footer() {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Soporte */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Soporte
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <a 
                  href="https://wa.me/1234567890" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  WhatsApp 24/7
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href="mailto:soporte@kobcash.com" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  soporte@kobcash.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Respuesta: &lt; 5 minutos
                </span>
              </li>
            </ul>
          </div>

          {/* Legales */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Legales
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/legal" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal#privacy" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal#cookies" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Cookie className="h-4 w-4" />
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Cumplimiento */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Cumplimiento
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Kobcash no custodia fondos.</strong> El servicio financiero lo presta el banco/remesadora en República Dominicana.
              </p>
              <p>
                <strong className="text-foreground">Pago al beneficiario:</strong> HTG (Gourdes Haitianas)
              </p>
              <p>
                <strong className="text-foreground">Tarifa oficial Haití:</strong> US$1.50 por transacción
              </p>
            </div>
          </div>

          {/* Mapa del Sitio */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Navegación
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Inicio
                </Link>
              </li>
              <li>
                <Link 
                  to="/send" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Enviar Dinero
                </Link>
              </li>
              <li>
                <Link 
                  to="/track" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  Rastrear
                </Link>
              </li>
              <li>
                <Link 
                  to="/help" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ayuda
                </Link>
              </li>
              <li>
                <Link 
                  to="/locations" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Map className="h-4 w-4" />
                  Ubicaciones
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {currentYear} kobcash. Sistema de transferts sécurisé.
              </p>
              <span className="text-sm text-muted-foreground hidden md:inline">•</span>
              <Link 
                to="/status" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Estado del Sistema
              </Link>
            </div>

            {/* Idioma Selector */}
            <div className="flex items-center gap-4">
              <LanguageSelector />
            </div>

            {/* Redes Sociales */}
            <div className="flex items-center gap-4">
              <a 
                href="https://facebook.com/kobcash" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com/kobcash" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/kobcash" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com/company/kobcash" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

