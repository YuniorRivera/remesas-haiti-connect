import { useEffect, useState, useCallback, useMemo } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Clock, Filter, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";

interface AgentLocation {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  code: string | null;
  gps_lat: number | null;
  gps_lon: number | null;
  address_old: string;
  is_active: boolean | null;
  channel?: 'MONCASH' | 'SPIH';
  hours?: string;
  phone?: string | null;
}

const LIBRARIES: ("geometry" | "drawing" | "visualization" | "places")[] = ["places"];

// Default center: Santo Domingo, RD
const DEFAULT_CENTER = {
  lat: 18.4861,
  lng: -69.9312,
};

const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
};

export default function AgentLocator() {
  const { t } = useLocale();
  const [agents, setAgents] = useState<AgentLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [selectedAgent, setSelectedAgent] = useState<AgentLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get Google Maps API key from environment
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    fetchAgents();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          // Optionally center map on user location
          // setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => {
          console.log("Location access denied or unavailable:", error);
        }
      );
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("is_active", true)
        .not("gps_lat", "is", null)
        .not("gps_lon", "is", null);

      if (error) throw error;

      // Enrich with partner network (for now all are MONCASH, but this could come from a config)
      const enrichedAgents: AgentLocation[] = (data || []).map((agent) => ({
        ...agent,
        channel: 'MONCASH' as const,
        hours: '7:00 AM - 7:00 PM',
      }));

      setAgents(enrichedAgents);
    } catch (error: any) {
      console.error("Error fetching agents:", error);
      toast.error(t('errorLoadingLocations') || "Error al cargar ubicaciones");
    } finally {
      setLoading(false);
    }
  };

  // Filter agents based on search and network
  const filteredAgents = useMemo(() => {
    let filtered = agents;

    // Filter by network
    if (networkFilter !== "all") {
      filtered = filtered.filter((agent) => agent.channel === networkFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (agent) =>
          agent.legal_name?.toLowerCase().includes(query) ||
          agent.trade_name?.toLowerCase().includes(query) ||
          agent.code?.toLowerCase().includes(query) ||
          agent.address_old?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [agents, searchQuery, networkFilter]);

  // Calculate distance from user location (Haversine formula)
  const calculateDistance = useCallback(
    (agent: AgentLocation): number | null => {
      if (!userLocation || !agent.gps_lat || !agent.gps_lon) return null;

      const R = 6371; // Earth's radius in km
      const dLat = ((agent.gps_lat - userLocation.lat) * Math.PI) / 180;
      const dLon = ((agent.gps_lon - userLocation.lng) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLocation.lat * Math.PI) / 180) *
          Math.cos((agent.gps_lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return Math.round(distance * 10) / 10; // Round to 1 decimal
    },
    [userLocation]
  );

  // Geocode search query using Google Places API
  const handleSearch = useCallback(() => {
    if (!searchQuery || !map) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        setCenter({
          lat: location.lat(),
          lng: location.lng(),
        });
        map.setCenter(location);
        map.setZoom(15);
      } else {
        toast.error(
          t('addressNotFound') || "No se encontró la dirección. Intenta con otra."
        );
      }
    });
  }, [searchQuery, map, t]);

  const handleDirections = (agent: AgentLocation) => {
    if (!agent.gps_lat || !agent.gps_lon) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${agent.gps_lat},${agent.gps_lon}`;
    window.open(url, "_blank");
  };

  if (!googleMapsApiKey) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Google Maps no configurado</CardTitle>
              <CardDescription>
                Agrega VITE_GOOGLE_MAPS_API_KEY a tu archivo .env
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-primary mb-2">
              {t('findAgentLocations') || "Encontrar Puntos de Cobro"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('findAgentDesc') || "Localiza agentes MoneyGram y MonCash cerca de ti"}
            </p>
          </div>
        </header>

        <main className="container mx-auto p-4">
          {/* Filters and Search */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-12 gap-4">
                {/* Search */}
                <div className="md:col-span-7">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder={t('searchByAddress') || "Buscar por dirección..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleSearch();
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={handleSearch}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Network Filter */}
                <div className="md:col-span-3">
                  <Select value={networkFilter} onValueChange={setNetworkFilter}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t('filterByNetwork') || "Red"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('allNetworks') || "Todas las Redes"}
                      </SelectItem>
                      <SelectItem value="MONCASH">MonCash</SelectItem>
                      <SelectItem value="SPIH">MoneyGram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Results Count */}
                <div className="md:col-span-2 flex items-center justify-end">
                  <Badge variant="secondary">
                    {filteredAgents.length} {t('locationsFound') || "ubicaciones"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-[600px]">
                  <p className="text-muted-foreground">{t("loading") || "Cargando..."}</p>
                </div>
              ) : (
                <LoadScript
                  googleMapsApiKey={googleMapsApiKey}
                  libraries={LIBRARIES}
                  loadingElement={
                    <div className="flex items-center justify-center h-[600px]">
                      <p className="text-muted-foreground">{t("loadingMap") || "Cargando mapa..."}</p>
                    </div>
                  }
                >
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={13}
                    center={center}
                    options={defaultOptions}
                    onLoad={(mapInstance) => setMap(mapInstance)}
                  >
                    {/* User location marker */}
                    {userLocation && (
                      <Marker
                        position={userLocation}
                        title={t('yourLocation') || "Tu ubicación"}
                        icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          scale: 8,
                          fillColor: "#4285F4",
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 2,
                        }}
                      />
                    )}

                    {/* Agent markers */}
                    {filteredAgents.map((agent) => (
                      <Marker
                        key={agent.id}
                        position={{
                          lat: agent.gps_lat!,
                          lng: agent.gps_lon!,
                        }}
                        title={agent.trade_name || agent.legal_name}
                        onClick={() => setSelectedAgent(agent)}
                        icon={{
                          path: google.maps.SymbolPath.CIRCLE,
                          scale: 10,
                          fillColor: agent.channel === "MONCASH" ? "#10B981" : "#EF4444",
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 2,
                        }}
                      />
                    ))}

                    {/* Info Window */}
                    {selectedAgent && selectedAgent.gps_lat && selectedAgent.gps_lon && (
                      <InfoWindow
                        position={{
                          lat: selectedAgent.gps_lat,
                          lng: selectedAgent.gps_lon,
                        }}
                        onCloseClick={() => setSelectedAgent(null)}
                      >
                        <div className="p-2 max-w-xs">
                          <h3 className="font-bold text-sm mb-2">
                            {selectedAgent.trade_name || selectedAgent.legal_name}
                          </h3>
                          {selectedAgent.code && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {t('code') || "Código"}: {selectedAgent.code}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mb-1">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            {selectedAgent.address_old}
                          </p>
                          {selectedAgent.hours && (
                            <p className="text-xs text-muted-foreground mb-1">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {selectedAgent.hours}
                            </p>
                          )}
                          {userLocation && calculateDistance(selectedAgent) !== null && (
                            <p className="text-xs text-primary font-semibold mb-2">
                              {calculateDistance(selectedAgent)} km {t('away') || "de distancia"}
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDirections(selectedAgent)}
                            className="w-full"
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            {t('getDirections') || "Cómo llegar"}
                          </Button>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AppLayout>
  );
}

