import { useLocale } from "@/lib/i18n";
import { useLite } from "@/contexts/LiteModeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatistics } from "@/data/statistics";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function StatisticsDisplay() {
  const { locale } = useLocale();
  const isLite = useLite();
  const stats = getStatistics(locale as 'es' | 'ht' | 'fr');

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.id}
          className={`${isLite ? 'border border-accent/30' : 'border-accent/30 bg-card/30 backdrop-blur-md shadow-2xl hover:shadow-[0_0_30px_hsl(0_85%_72%_/_0.4)]'} transition-all duration-300`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">{stat.icon}</span>
              {stat.trend && getTrendIcon(stat.trend)}
            </div>

            <h3 className={`text-3xl font-bold mb-2 ${
              stat.id === 'success' 
                ? 'text-green-600 dark:text-green-500'
                : 'text-primary'
            }`}>
              {typeof stat.value === 'number' 
                ? stat.value.toLocaleString('es-DO')
                : stat.value}
            </h3>

            <p className="text-sm text-muted-foreground mb-2">
              {stat.label}
            </p>

            {stat.change && (
              <Badge
                variant="outline"
                className={`
                  text-xs
                  ${stat.trend === 'up' ? 'text-green-600 border-green-600' : ''}
                  ${stat.trend === 'down' ? 'text-red-600 border-red-600' : ''}
                  ${stat.trend === 'stable' ? 'text-gray-600 border-gray-600' : ''}
                `}
              >
                {stat.change}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

