import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  TrendingUp,
  TrendingDown,
  Store,
  Laptop,
  Truck,
  Heart,
  UtensilsCrossed,
  Home,
  Briefcase,
  Camera,
  Wrench,
  Leaf,
  Building,
  Users,
  DollarSign,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { canadianProvinces } from "@/data/provinces";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const iconMap: Record<string, React.ElementType> = {
  store: Store,
  laptop: Laptop,
  truck: Truck,
  heart: Heart,
  utensils: UtensilsCrossed,
  home: Home,
  briefcase: Briefcase,
  camera: Camera,
  wrench: Wrench,
  leaf: Leaf,
};

interface TrendingBusiness {
  name: string;
  category: string;
  growth: number;
  avgStartupCost: number;
  description: string;
  icon: string;
}

interface ProvinceStats {
  newBusinesses: number;
  topCategory: string;
  avgStartupCost: number;
  totalEntrepreneurs: number;
}

interface EmergingOpportunity {
  name: string;
  reason: string;
  growth: number;
}

interface DecliningCategory {
  name: string;
  reason: string;
  decline: number;
}

interface TrendsData {
  province: string;
  provinceName: string;
  topBusinessTypes: TrendingBusiness[];
  stats: ProvinceStats;
  emergingOpportunities: EmergingOpportunity[];
  categoriesToAvoid: DecliningCategory[];
  lastUpdated: string;
}

// Generate sparkline data based on growth
const generateSparklineData = (growth: number) => {
  const baseValue = 50;
  const trend = growth / 100;
  return Array.from({ length: 7 }, (_, i) => ({
    value: baseValue + (i * trend * 10) + (Math.random() * 5 - 2.5),
  }));
};

const Trends = () => {
  const navigate = useNavigate();
  const [selectedProvince, setSelectedProvince] = useState("ALL");
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "1y">("30d");

  const { data: trendsData, isLoading, error } = useQuery<TrendsData>({
    queryKey: ["provincial-trends", selectedProvince, timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ft_fetch_provincial_trends", {
        body: { province: selectedProvince, timeRange },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const handleGetIdeas = (category: string) => {
    navigate("/chat", { state: { prefillCategory: category, prefillProvince: selectedProvince } });
  };

  const handlePersonalizedIdeas = () => {
    navigate("/chat", { state: { prefillProvince: selectedProvince } });
  };

  const provinceName = selectedProvince === "ALL" 
    ? "All Canada" 
    : canadianProvinces.find(p => p.value === selectedProvince)?.label || selectedProvince;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            📈 Trending in Canada
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover what's hot in the Canadian business landscape
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <ToggleGroup 
            type="single" 
            value={timeRange} 
            onValueChange={(v) => v && setTimeRange(v as "30d" | "90d" | "1y")}
            className="justify-start"
          >
            <ToggleGroupItem value="30d" size="sm">30 days</ToggleGroupItem>
            <ToggleGroupItem value="90d" size="sm">90 days</ToggleGroupItem>
            <ToggleGroupItem value="1y" size="sm">1 year</ToggleGroupItem>
          </ToggleGroup>
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Canada</SelectItem>
              {canadianProvinces.map((province) => (
                <SelectItem key={province.value} value={province.value}>
                  {province.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">Failed to load trends. Please try again.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Left Column - Top Business Types (60%) */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Top 5 Trending Business Types
          </h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {trendsData?.topBusinessTypes.map((business, index) => {
                const IconComponent = iconMap[business.icon] || Store;
                const sparklineData = generateSparklineData(business.growth);
                
                return (
                  <Card key={index} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-foreground">{business.name}</h3>
                              <p className="text-sm text-muted-foreground">{business.category}</p>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0"
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              +{business.growth}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{business.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-muted-foreground">
                                Avg. startup: ${business.avgStartupCost.toLocaleString()}
                              </span>
                              <div className="w-20 h-6">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={sparklineData}>
                                    <Line 
                                      type="monotone" 
                                      dataKey="value" 
                                      stroke="hsl(var(--primary))" 
                                      strokeWidth={2}
                                      dot={false}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleGetIdeas(business.category)}
                            >
                              Get Ideas
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column - Market Stats (40%) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Market Stats for {provinceName}
          </h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Building className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {trendsData?.stats.newBusinesses.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">New businesses this month</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {trendsData?.stats.topCategory}
                    </p>
                    <p className="text-sm text-muted-foreground">Top category</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      ${trendsData?.stats.avgStartupCost.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg. startup cost</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {trendsData?.stats.totalEntrepreneurs?.toLocaleString() || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">Active entrepreneurs</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Emerging Opportunities */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Emerging Opportunities
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendsData?.emergingOpportunities.map((opp, index) => (
              <Card key={index} className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{opp.name}</h3>
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                      +{opp.growth}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{opp.reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Categories to Avoid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5" />
          Categories to Consider Carefully
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendsData?.categoriesToAvoid.map((cat, index) => (
              <Card key={index} className="border-muted bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-muted-foreground">{cat.name}</h3>
                    <Badge variant="outline" className="text-destructive border-destructive/30">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      {cat.decline}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{cat.reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Ready to start your business in {provinceName}?
          </h2>
          <p className="text-muted-foreground mb-4">
            Get personalized business ideas tailored to your skills and budget
          </p>
          <Button size="lg" onClick={handlePersonalizedIdeas}>
            Get Personalized Ideas for {provinceName}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Last updated */}
      {trendsData?.lastUpdated && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Last updated: {new Date(trendsData.lastUpdated).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default Trends;
