import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button as ButtonComp } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function WhatsAppButton() {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);

  // WhatsApp Business number (replace with your actual number)
  const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "1234567890";
  
  // Base messages by language
  const messages = {
    es: "¡Hola! Necesito ayuda con mi remesa.",
    ht: "Bonjou! Mwen bezwen èd ak remès mwen.",
    fr: "Bonjour! J'ai besoin d'aide avec mon envoi.",
  };

  const [orderId, setOrderId] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);

  // Generate WhatsApp URL
  const getWhatsAppUrl = (customMessage?: string) => {
    const message = customMessage || messages[selectedLanguage as keyof typeof messages];
    const fullMessage = orderId 
      ? `${message}\n\nReferencia: ${orderId}`
      : message;
    const encodedMessage = encodeURIComponent(fullMessage);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  };

  const handleOpenWhatsApp = () => {
    window.open(getWhatsAppUrl(), '_blank');
    setOpen(false);
  };

  return (
    <>
      {/* Fixed Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-300 bg-green-600 hover:bg-green-700"
              aria-label={t('contactWhatsApp')}
            >
              <MessageCircle className="h-8 w-8" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px]">
            <SheetHeader>
              <SheetTitle className="text-2xl">{t('support24Hours')}</SheetTitle>
              <SheetDescription>{t('support24HoursDesc')}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('selectLanguage')}
                </label>
                <div className="flex gap-2">
                  <ButtonComp
                    variant={selectedLanguage === 'es' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLanguage('es')}
                  >
                    🇪🇸 Español
                  </ButtonComp>
                  <ButtonComp
                    variant={selectedLanguage === 'ht' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLanguage('ht')}
                  >
                    🇭🇹 Kreyòl
                  </ButtonComp>
                  <ButtonComp
                    variant={selectedLanguage === 'fr' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLanguage('fr')}
                  >
                    🇫🇷 Français
                  </ButtonComp>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('orderReference')} ({t('optional')})
                </label>
                <Input
                  placeholder="ABC123"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <ButtonComp
                  onClick={handleOpenWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t('openWhatsApp')}
                </ButtonComp>
              </div>

              <Card className="p-4 bg-green-50 dark:bg-green-950/20">
                <p className="text-sm text-muted-foreground">
                  {t('whatsappSupportInfo')}
                </p>
              </Card>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

