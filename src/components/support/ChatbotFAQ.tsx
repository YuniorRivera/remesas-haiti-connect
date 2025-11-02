import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Send, Bot, User } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { helpArticles } from "@/data/helpArticles";

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function ChatbotFAQ() {
  const { t, locale } = useLocale();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: t('chatbotWelcome'),
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Quick reply buttons
  const quickReplies = [
    { id: 'moncash', label: t('popularMoncash') },
    { id: 'fees', label: t('popularFees') },
    { id: 'tracking', label: t('popularTracking') },
    { id: 'kyc', label: t('complianceKYC') },
  ];

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Search in help articles
    const matchedArticle = helpArticles.find(article => {
      const localeKey = locale as 'es' | 'ht' | 'fr';
      const localizedContent = article[localeKey];
      if (!localizedContent) return false;
      
      const titleLower = localizedContent.title.toLowerCase();
      const contentLower = localizedContent.content.toLowerCase();
      const keywords = article.tags.map((k: string) => k.toLowerCase());
      
      return (
        titleLower.includes(lowerMessage) ||
        contentLower.includes(lowerMessage) ||
        keywords.some((k: string) => k.includes(lowerMessage))
      );
    });

    if (matchedArticle) {
      const localeKey = locale as 'es' | 'ht' | 'fr';
      const localizedContent = matchedArticle[localeKey];
      if (localizedContent) {
        // Return first 200 characters of the article
        const preview = localizedContent.content.substring(0, 200);
        return `${localizedContent.title}\n\n${preview}...\n\n${t('readFullArticle')} /help?article=${matchedArticle.id}`;
      }
    }

    // Fallback responses by keyword
    if (lowerMessage.includes('moncash') || lowerMessage.includes('mon cash')) {
      return t('chatbotResponseMoncash');
    }
    
    if (lowerMessage.includes('tarifa') || lowerMessage.includes('frais') || lowerMessage.includes('fee')) {
      return t('chatbotResponseFees');
    }
    
    if (lowerMessage.includes('rastre') || lowerMessage.includes('track') || lowerMessage.includes('seguim')) {
      return t('chatbotResponseTracking');
    }
    
    if (lowerMessage.includes('kyc') || lowerMessage.includes('document') || lowerMessage.includes('verificar')) {
      return t('chatbotResponseKYC');
    }

    // Default response
    return t('chatbotDefaultResponse');
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage.content);
      const botMessage: Message = {
        role: 'bot',
        content: botResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickReply = (replyId: string) => {
    const messages = {
      moncash: t('chatbotQuickMoncash'),
      fees: t('chatbotQuickFees'),
      tracking: t('chatbotQuickTracking'),
      kyc: t('chatbotQuickKYC'),
    };
    setInputValue(messages[replyId as keyof typeof messages] || '');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="fixed bottom-24 right-6 w-96 h-[500px] flex flex-col shadow-2xl border-2">
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg">{t('chatbotTitle')}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('chatbotSubtitle')}
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {msg.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Replies */}
        {messages.length === 1 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">{t('quickQuestions')}</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map(reply => (
                <Button
                  key={reply.id}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickReply(reply.id)}
                >
                  {reply.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 flex-shrink-0">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('typeMessage')}
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

