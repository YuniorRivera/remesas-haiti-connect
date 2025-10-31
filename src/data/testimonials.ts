/**
 * Testimonials Data
 * 
 * Verified testimonials with social proof for landing page.
 * Can be extended to fetch from API in the future.
 */

export interface Testimonial {
  id: string;
  name: string;
  country: string;
  countryCode: string; // ISO country code for flag
  date: string;
  rating: number; // 1-5 stars
  testimonial: string;
  verified: boolean;
  category: 'speed' | 'security' | 'fees' | 'service';
}

export const testimonials: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Marie Joseph',
    country: 'Haití',
    countryCode: 'HT',
    date: '2025-01-15',
    rating: 5,
    testimonial: 'Mwen fè transfè la nan 5 minit! Lajan an rive nan MonCash mwen an imedyatman. Sèvis sa a fòmidab!',
    verified: true,
    category: 'speed',
  },
  {
    id: 'test-2',
    name: 'Juan Carlos Pérez',
    country: 'República Dominicana',
    countryCode: 'DO',
    date: '2025-01-18',
    rating: 5,
    testimonial: 'Envío dinero a mi familia en Haití cada mes. Las tarifas son justas y el proceso es súper fácil. Lo recomiendo 100%.',
    verified: true,
    category: 'fees',
  },
  {
    id: 'test-3',
    name: 'Sophie Laurent',
    country: 'Haití',
    countryCode: 'HT',
    date: '2025-01-20',
    rating: 5,
    testimonial: 'Trè sekirite! Mwen gen konfyans ak kobcash. Anpil mwayen pou verifye tranzaksyon an. Pa gen pwoblèm.',
    verified: true,
    category: 'security',
  },
  {
    id: 'test-4',
    name: 'Roberto Martínez',
    country: 'República Dominicana',
    countryCode: 'DO',
    date: '2025-01-22',
    rating: 5,
    testimonial: 'El mejor servicio de remesas. Atención al cliente excelente y entrega en minutos. Mi familia siempre recibe a tiempo.',
    verified: true,
    category: 'service',
  },
  {
    id: 'test-5',
    name: 'Lise Pierre',
    country: 'Haití',
    countryCode: 'HT',
    date: '2025-01-25',
    rating: 4,
    testimonial: 'Sèvis la rapid. Se sèl yon bagay ki pa bon: ta vle pou gen plis pwen kolekte nan zòn mwen an.',
    verified: true,
    category: 'speed',
  },
  {
    id: 'test-6',
    name: 'Miguel Ángel García',
    country: 'República Dominicana',
    countryCode: 'DO',
    date: '2025-01-28',
    rating: 5,
    testimonial: 'La app es muy intuitiva y las comisiones son transparentes. Poder rastrear cada envío en tiempo real es genial.',
    verified: true,
    category: 'fees',
  },
];

export function getTestimonialsByCategory(category: Testimonial['category']): Testimonial[] {
  return testimonials.filter(t => t.category === category);
}

export function getVerifiedTestimonials(): Testimonial[] {
  return testimonials.filter(t => t.verified);
}

