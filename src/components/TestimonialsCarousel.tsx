import { useState, useEffect } from "react";
import { useLocale } from "@/lib/i18n";
import { useLite } from "@/contexts/LiteModeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVerifiedTestimonials, Testimonial } from "@/data/testimonials";

export function TestimonialsCarousel() {
  const { t } = useLocale();
  const isLite = useLite();
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonials = getVerifiedTestimonials();

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (testimonials.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  if (testimonials.length === 0) return null;

  const testimonial = testimonials[currentIndex];

  return (
    <div className="relative w-full">
      <Card className={`${isLite ? 'border border-primary/30' : 'border-primary/30 shadow-lg'}`}>
        <CardContent className="pt-6">
          {/* Stars */}
          <div className="flex gap-1 mb-4 justify-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < testimonial.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Testimonial */}
          <blockquote className="text-center mb-6">
            <p className="text-lg italic text-muted-foreground">
              "{testimonial.testimonial}"
            </p>
          </blockquote>

          {/* Author */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{testimonial.name}</span>
              {testimonial.verified && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              {testimonial.country}
            </Badge>
          </div>

          {/* Date */}
          <div className="text-center text-sm text-muted-foreground">
            {new Date(testimonial.date).toLocaleDateString('es-DO', {
              year: 'numeric',
              month: 'long',
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      {testimonials.length > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={prevTestimonial}
            aria-label="Testimonio anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Dots indicator */}
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-primary'
                    : 'bg-muted hover:bg-primary/50'
                }`}
                aria-label={`Ir a testimonio ${index + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={nextTestimonial}
            aria-label="Siguiente testimonio"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

