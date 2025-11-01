/**
 * Statistics Data
 * 
 * Public statistics and metrics for landing page.
 * Can be extended to fetch from API in the future.
 */

export interface Statistic {
  id: string;
  value: string | number;
  label: string;
  icon: string;
  trend?: 'up' | 'down' | 'stable';
  change?: string;
}

export interface StatisticsData {
  familiesConnected: number;
  remittancesThisMonth: number;
  averageDeliveryTime: string;
  lastUpdated: string;
}

// Mock data - in production, this would come from an API
export const statisticsData: StatisticsData = {
  familiesConnected: 12580,
  remittancesThisMonth: 48230,
  averageDeliveryTime: '3-7 minutos',
  lastUpdated: new Date().toISOString().split('T')[0] || new Date().toISOString(),
};

// Statistics for display cards
export const statistics: Statistic[] = [
  {
    id: 'families',
    value: statisticsData.familiesConnected,
    label: 'Familias Conectadas',
    icon: '👨‍👩‍👧‍👦',
    trend: 'up',
    change: '+12% este mes',
  },
  {
    id: 'remittances',
    value: statisticsData.remittancesThisMonth,
    label: 'Envíos Este Mes',
    icon: '📦',
    trend: 'up',
    change: '+8% vs. mes pasado',
  },
  {
    id: 'speed',
    value: statisticsData.averageDeliveryTime,
    label: 'Tiempo Medio de Entrega',
    icon: '⚡',
    trend: 'stable',
    change: 'MonCash Plus',
  },
  {
    id: 'success',
    value: '99.8%',
    label: 'Tasa de Éxito',
    icon: '✅',
    trend: 'stable',
    change: 'Transacciones',
  },
];

/**
 * Get translated statistics
 */
export function getStatistics(locale: 'es' | 'ht' | 'fr'): Statistic[] {
  const translations = {
    es: {
      families: 'Familias Conectadas',
      remittances: 'Envíos Este Mes',
      speed: 'Tiempo Medio de Entrega',
      success: 'Tasa de Éxito',
    },
    ht: {
      families: 'Famili Konekte',
      remittances: 'Vwayaj Nan Mwa Sa',
      speed: 'Tan Mwayen Livrezon',
      success: 'To Siksè',
    },
    fr: {
      families: 'Familles Connectées',
      remittances: 'Envois Ce Mois',
      speed: 'Délai Moyen de Livraison',
      success: 'Taux de Réussite',
    },
  };

  return statistics.map(stat => ({
    ...stat,
    label: translations[locale][stat.id as keyof typeof translations.es],
  }));
}

