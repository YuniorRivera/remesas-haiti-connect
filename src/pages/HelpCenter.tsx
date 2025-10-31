import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "@/lib/i18n";
import { useLite } from "@/contexts/LiteModeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Wallet, Lock, DollarSign, Clock, MapPin, HelpCircle, ChevronRight, Home, MessageCircle, Clock as ClockIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { helpArticles, getCategoryLabel, ArticleCategory, HelpArticle } from "@/data/helpArticles";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from 'react-markdown';

const categoryIcons: Record<ArticleCategory, typeof Search> = {
  'moncash-plus': Wallet,
  'prism-opt-in': Lock,
  'kyc-documents': Lock,
  'fees': DollarSign,
  'delivery-times': Clock,
  'tracking': MapPin,
  'general': HelpCircle,
};

export default function HelpCenter() {
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const isLite = useLite();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // Filter articles
  const filteredArticles = useMemo(() => {
    let articles = helpArticles;

    // Filter by category
    if (selectedCategory !== 'all') {
      articles = articles.filter(article => article.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      articles = helpArticles.filter(article => {
        const content = article[locale as 'es' | 'ht' | 'fr'];
        const lowerQuery = searchQuery.toLowerCase();
        return (
          content.title.toLowerCase().includes(lowerQuery) ||
          content.content.toLowerCase().includes(lowerQuery) ||
          article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      });
    }

    return articles;
  }, [searchQuery, selectedCategory, locale]);

  // Breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs = [
      { label: t('home') || 'Inicio', href: '/', onClick: () => navigate('/') },
      { label: t('helpCenter') || 'Centro de Ayuda', href: '/help' },
    ];
    
    if (selectedArticle) {
      crumbs.push({ label: getCategoryLabel(selectedArticle.category, locale as 'es' | 'ht' | 'fr'), href: '' });
      crumbs.push({ label: selectedArticle[locale as 'es' | 'ht' | 'fr'].title, href: '' });
    } else if (selectedCategory !== 'all') {
      crumbs.push({ label: getCategoryLabel(selectedCategory, locale as 'es' | 'ht' | 'fr'), href: '' });
    }
    
    return crumbs;
  };

  if (selectedArticle) {
    const content = selectedArticle[locale as 'es' | 'ht' | 'fr'];
    const Icon = categoryIcons[selectedArticle.category];

    return (
      <AppLayout>
        <div className="min-h-screen bg-muted/30">
          <header className="border-b bg-card shadow-sm">
            <div className="container mx-auto px-4 py-4">
              {/* Breadcrumbs */}
              <nav aria-label="Breadcrumb" className="mb-3">
                <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getBreadcrumbs().map((crumb, idx, arr) => (
                    <li key={idx} className="flex items-center gap-2">
                      {idx > 0 && <ChevronRight className="h-4 w-4" />}
                      {crumb.onClick ? (
                        <button onClick={crumb.onClick} className="hover:text-primary underline">
                          {crumb.label}
                        </button>
                      ) : (
                        <span>{crumb.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>

              <Button
                variant="ghost"
                onClick={() => setSelectedArticle(null)}
                className="mb-2"
              >
                <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                {t('backToHelp') || "Volver al Centro de Ayuda"}
              </Button>

              <div className="flex items-center gap-3">
                <Icon className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-primary">
                    {content.title}
                  </h1>
                  <Badge variant="outline" className="mt-1">
                    {getCategoryLabel(selectedArticle.category, locale as 'es' | 'ht' | 'fr')}
                  </Badge>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto p-4 max-w-4xl">
            <Card>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-6">
                <ReactMarkdown>{content.content}</ReactMarkdown>
              </CardContent>
            </Card>

            {/* Related Articles */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">{t('relatedArticles') || "Artículos Relacionados"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-2">
                  {helpArticles
                    .filter(article => article.category === selectedArticle.category && article.id !== selectedArticle.id)
                    .slice(0, 4)
                    .map(article => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="text-left p-3 rounded-lg hover:bg-muted transition-colors text-sm"
                      >
                        <p className="font-medium">{article[locale as 'es' | 'ht' | 'fr'].title}</p>
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="h-12 w-12 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-primary">
                  {t('helpCenter') || "Centro de Ayuda"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('helpCenterDesc') || "Encuentra respuestas rápidas a tus preguntas"}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('searchHelpPlaceholder') || "Buscar ayuda..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
                aria-label={t('searchHelpPlaceholder') || "Buscar ayuda"}
              />
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4">
          {/* Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className="h-20 flex-col gap-2"
            >
              <HelpCircle className="h-6 w-6" />
              <span className="text-xs">{t('allCategories') || 'Todas'}</span>
            </Button>
            {(Object.keys(categoryIcons) as ArticleCategory[]).map(category => {
              const Icon = categoryIcons[category];
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className="h-20 flex-col gap-2"
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs text-center">
                    {getCategoryLabel(category, locale as 'es' | 'ht' | 'fr')}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Results */}
          {filteredArticles.length === 0 ? (
            <Alert>
              <Search className="h-4 w-4" />
              <AlertDescription>
                {t('noArticlesFound') || "No se encontraron artículos. Intenta con otros términos."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredArticles.map(article => {
                const Icon = categoryIcons[article.category];
                const content = article[locale as 'es' | 'ht' | 'fr'];
                return (
                  <Card
                    key={article.id}
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(article.category, locale as 'es' | 'ht' | 'fr')}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{content.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {content.content.substring(0, 120)}...
                      </p>
                      <div className="mt-3 flex items-center text-primary text-sm font-medium">
                        {t('readMore') || "Leer más"} <ChevronRight className="ml-1 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Popular Topics */}
          {!searchQuery && selectedCategory === 'all' && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">
                {t('popularTopics') || "Temas Populares"}
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className={`cursor-pointer transition-all hover:shadow-lg ${isLite ? '' : 'hover:border-primary/50'}`}>
                  <CardHeader>
                    <Wallet className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-base">
                      {t('popularMoncash') || "MonCash Plus"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {helpArticles.filter(a => a.category === 'moncash-plus').length} {t('articles') || "artículos"}
                    </p>
                  </CardContent>
                </Card>
                <Card className={`cursor-pointer transition-all hover:shadow-lg ${isLite ? '' : 'hover:border-primary/50'}`}>
                  <CardHeader>
                    <DollarSign className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-base">
                      {t('popularFees') || "Tarifas"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {helpArticles.filter(a => a.category === 'fees').length} {t('articles') || "artículos"}
                    </p>
                  </CardContent>
                </Card>
                <Card className={`cursor-pointer transition-all hover:shadow-lg ${isLite ? '' : 'hover:border-primary/50'}`}>
                  <CardHeader>
                    <MapPin className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-base">
                      {t('popularTracking') || "Rastreo"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {helpArticles.filter(a => a.category === 'tracking').length} {t('articles') || "artículos"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Support Contact Card */}
          {!searchQuery && selectedCategory === 'all' && (
            <div className="mt-8">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <MessageCircle className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{t('support24Hours') || "Soporte 24/7"}</h3>
                      <p className="text-muted-foreground mb-4">
                        {t('support24HoursDesc') || "¿No encuentras lo que buscas? Contáctanos por WhatsApp"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ClockIcon className="h-4 w-4" />
                          <span>{t('whatsappSupportInfo') || "Horario: 24/7 | Tiempo de respuesta: < 5 minutos"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}

