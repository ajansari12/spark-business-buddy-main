import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, ArrowRight } from "lucide-react";
import { canadianProvinces } from "@/data/provinces";
import { CitiesService } from "@/services/citiesService";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LocationSelectorProps {
  onComplete: (province: string, city: string) => void;
  initialProvince?: string;
  initialCity?: string;
}

export const LocationSelector = ({
  onComplete,
  initialProvince,
  initialCity
}: LocationSelectorProps) => {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(initialProvince || null);
  const [city, setCity] = useState(initialCity || "");
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [popularCities, setPopularCities] = useState<string[]>([]);
  const [showCityInput, setShowCityInput] = useState(false);

  useEffect(() => {
    if (selectedProvince) {
      setShowCityInput(true);
      const popular = CitiesService.getPopularCities(selectedProvince, 6);
      setPopularCities(popular.map(c => c.name));
      setCitySuggestions(popular.map(c => c.name));
    }
  }, [selectedProvince]);

  const handleProvinceSelect = (provinceCode: string) => {
    setSelectedProvince(provinceCode);
    setCity(""); // Reset city when province changes
  };

  const handleCitySelect = (cityName: string) => {
    setCity(cityName);
  };

  const handleCityInput = (value: string) => {
    setCity(value);
    if (value.length >= 2 && selectedProvince) {
      const results = CitiesService.searchCities(value, selectedProvince, 8);
      setCitySuggestions(results.map(c => c.name));
    } else if (selectedProvince) {
      setCitySuggestions(popularCities);
    }
  };

  const handleContinue = () => {
    if (selectedProvince && city.trim()) {
      const provinceName = canadianProvinces.find(p => p.value === selectedProvince)?.label || selectedProvince;
      onComplete(provinceName, city.trim());
    }
  };

  const canContinue = selectedProvince && city.trim().length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Where are you located?
          </h1>
          <p className="text-muted-foreground text-lg">
            We'll tailor business ideas to your local market
          </p>
        </div>

        {/* Province Grid */}
        <div className="mb-8" role="region" aria-label="Province selection">
          <h2 className="text-xl font-semibold mb-4" id="province-label">Select your province</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" role="radiogroup" aria-labelledby="province-label">
            {canadianProvinces.map((province, index) => (
              <motion.div
                key={province.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:scale-105",
                    "border-2 p-4 text-center",
                    selectedProvince === province.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleProvinceSelect(province.value)}
                  role="radio"
                  aria-checked={selectedProvince === province.value}
                  aria-label={`${province.label} (${province.value})`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleProvinceSelect(province.value);
                    }
                  }}
                >
                  <div className="font-semibold text-lg mb-1">{province.value}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {province.label}
                  </div>
                  {selectedProvince === province.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2"
                    >
                      <Badge className="bg-primary">Selected</Badge>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* City Input - Only shows after province selection */}
        {showCityInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="mb-8"
            role="region"
            aria-label="City selection"
          >
            <h2 className="text-xl font-semibold mb-4" id="city-label">What's your city?</h2>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Start typing your city..."
                value={city}
                onChange={(e) => handleCityInput(e.target.value)}
                className="pl-10 text-lg py-6"
                autoFocus
                aria-label="City name"
                aria-describedby="city-label"
              />
            </div>

            {/* Popular Cities */}
            {citySuggestions.length > 0 && (
              <div role="group" aria-label="Popular cities">
                <p className="text-sm text-muted-foreground mb-3">Popular cities:</p>
                <div className="flex flex-wrap gap-2">
                  {citySuggestions.map((cityName) => (
                    <Button
                      key={cityName}
                      variant={city === cityName ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCitySelect(cityName)}
                      className="transition-all hover:scale-105"
                      aria-label={`Select ${cityName}`}
                      aria-pressed={city === cityName}
                    >
                      {cityName}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mt-8"
        >
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full md:w-auto px-12 py-6 text-lg group"
          >
            Continue
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Helper Text */}
        {selectedProvince && !city && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground mt-4"
          >
            💡 Select a popular city or type your own
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};
