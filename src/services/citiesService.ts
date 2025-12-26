// City autocomplete service for Canadian cities
// Can be enhanced to fetch from external API in the future

interface City {
  name: string;
  province: string;
  population?: number;
}

// Comprehensive Canadian cities database
const CANADIAN_CITIES: City[] = [
  // Ontario
  { name: "Toronto", province: "ON", population: 2930000 },
  { name: "Ottawa", province: "ON", population: 1017000 },
  { name: "Mississauga", province: "ON", population: 721000 },
  { name: "Brampton", province: "ON", population: 593000 },
  { name: "Hamilton", province: "ON", population: 537000 },
  { name: "London", province: "ON", population: 383000 },
  { name: "Markham", province: "ON", population: 328000 },
  { name: "Vaughan", province: "ON", population: 306000 },
  { name: "Kitchener", province: "ON", population: 233000 },
  { name: "Windsor", province: "ON", population: 217000 },
  { name: "Richmond Hill", province: "ON", population: 195000 },
  { name: "Oakville", province: "ON", population: 193000 },
  { name: "Burlington", province: "ON", population: 183000 },
  { name: "Greater Sudbury", province: "ON", population: 161000 },
  { name: "Oshawa", province: "ON", population: 159000 },
  { name: "Barrie", province: "ON", population: 141000 },
  { name: "St. Catharines", province: "ON", population: 133000 },
  { name: "Cambridge", province: "ON", population: 129000 },
  { name: "Kingston", province: "ON", population: 123000 },
  { name: "Guelph", province: "ON", population: 131000 },
  { name: "Whitby", province: "ON", population: 128000 },
  { name: "Ajax", province: "ON", population: 119000 },
  { name: "Thunder Bay", province: "ON", population: 107000 },
  { name: "Waterloo", province: "ON", population: 104000 },

  // Quebec
  { name: "Montreal", province: "QC", population: 1705000 },
  { name: "Quebec City", province: "QC", population: 531000 },
  { name: "Laval", province: "QC", population: 422000 },
  { name: "Gatineau", province: "QC", population: 276000 },
  { name: "Longueuil", province: "QC", population: 239000 },
  { name: "Sherbrooke", province: "QC", population: 161000 },
  { name: "Saguenay", province: "QC", population: 144000 },
  { name: "Lévis", province: "QC", population: 143000 },
  { name: "Trois-Rivières", province: "QC", population: 134000 },
  { name: "Terrebonne", province: "QC", population: 111000 },
  { name: "Saint-Jean-sur-Richelieu", province: "QC", population: 94000 },
  { name: "Repentigny", province: "QC", population: 84000 },
  { name: "Brossard", province: "QC", population: 79000 },
  { name: "Drummondville", province: "QC", population: 72000 },
  { name: "Saint-Jérôme", province: "QC", population: 69000 },

  // British Columbia
  { name: "Vancouver", province: "BC", population: 631000 },
  { name: "Surrey", province: "BC", population: 518000 },
  { name: "Burnaby", province: "BC", population: 232000 },
  { name: "Richmond", province: "BC", population: 198000 },
  { name: "Abbotsford", province: "BC", population: 141000 },
  { name: "Coquitlam", province: "BC", population: 139000 },
  { name: "Kelowna", province: "BC", population: 132000 },
  { name: "Saanich", province: "BC", population: 114000 },
  { name: "Delta", province: "BC", population: 102000 },
  { name: "Langley", province: "BC", population: 117000 },
  { name: "Victoria", province: "BC", population: 85000 },
  { name: "Kamloops", province: "BC", population: 90000 },
  { name: "Nanaimo", province: "BC", population: 90000 },
  { name: "Prince George", province: "BC", population: 74000 },
  { name: "Chilliwack", province: "BC", population: 83000 },
  { name: "Vernon", province: "BC", population: 40000 },
  { name: "Penticton", province: "BC", population: 33000 },

  // Alberta
  { name: "Calgary", province: "AB", population: 1239000 },
  { name: "Edmonton", province: "AB", population: 932000 },
  { name: "Red Deer", province: "AB", population: 100000 },
  { name: "Lethbridge", province: "AB", population: 92000 },
  { name: "St. Albert", province: "AB", population: 65000 },
  { name: "Medicine Hat", province: "AB", population: 63000 },
  { name: "Grande Prairie", province: "AB", population: 63000 },
  { name: "Airdrie", province: "AB", population: 61000 },
  { name: "Spruce Grove", province: "AB", population: 34000 },
  { name: "Leduc", province: "AB", population: 29000 },
  { name: "Fort McMurray", province: "AB", population: 72000 },
  { name: "Cochrane", province: "AB", population: 25000 },

  // Manitoba
  { name: "Winnipeg", province: "MB", population: 705000 },
  { name: "Brandon", province: "MB", population: 48000 },
  { name: "Steinbach", province: "MB", population: 15000 },
  { name: "Thompson", province: "MB", population: 13000 },
  { name: "Portage la Prairie", province: "MB", population: 13000 },
  { name: "Winkler", province: "MB", population: 12000 },

  // Saskatchewan
  { name: "Saskatoon", province: "SK", population: 246000 },
  { name: "Regina", province: "SK", population: 215000 },
  { name: "Prince Albert", province: "SK", population: 35000 },
  { name: "Moose Jaw", province: "SK", population: 33000 },
  { name: "Swift Current", province: "SK", population: 16000 },
  { name: "Yorkton", province: "SK", population: 16000 },

  // Nova Scotia
  { name: "Halifax", province: "NS", population: 403000 },
  { name: "Cape Breton", province: "NS", population: 94000 },
  { name: "Truro", province: "NS", population: 12000 },
  { name: "New Glasgow", province: "NS", population: 9000 },
  { name: "Dartmouth", province: "NS", population: 67000 },

  // New Brunswick
  { name: "Moncton", province: "NB", population: 71000 },
  { name: "Saint John", province: "NB", population: 67000 },
  { name: "Fredericton", province: "NB", population: 58000 },
  { name: "Dieppe", province: "NB", population: 25000 },
  { name: "Miramichi", province: "NB", population: 17000 },

  // Newfoundland and Labrador
  { name: "St. John's", province: "NL", population: 108000 },
  { name: "Mount Pearl", province: "NL", population: 23000 },
  { name: "Corner Brook", province: "NL", population: 20000 },
  { name: "Conception Bay South", province: "NL", population: 26000 },
  { name: "Paradise", province: "NL", population: 21000 },

  // Prince Edward Island
  { name: "Charlottetown", province: "PE", population: 36000 },
  { name: "Summerside", province: "PE", population: 15000 },
  { name: "Stratford", province: "PE", population: 9000 },
  { name: "Cornwall", province: "PE", population: 5000 },

  // Yukon
  { name: "Whitehorse", province: "YT", population: 25000 },
  { name: "Dawson City", province: "YT", population: 1300 },

  // Northwest Territories
  { name: "Yellowknife", province: "NT", population: 19000 },
  { name: "Hay River", province: "NT", population: 3500 },
  { name: "Inuvik", province: "NT", population: 3200 },

  // Nunavut
  { name: "Iqaluit", province: "NU", population: 7700 },
  { name: "Rankin Inlet", province: "NU", population: 2800 },
  { name: "Arviat", province: "NU", population: 2600 },
];

export class CitiesService {
  /**
   * Search for cities by name with autocomplete
   */
  static searchCities(query: string, province?: string, limit: number = 10): City[] {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return [];
    }

    let filtered = CANADIAN_CITIES.filter((city) => {
      const matchesQuery = city.name.toLowerCase().includes(normalizedQuery);
      const matchesProvince = !province || city.province === province;
      return matchesQuery && matchesProvince;
    });

    // Sort by relevance (starts with query first, then by population)
    filtered.sort((a, b) => {
      const aStartsWith = a.name.toLowerCase().startsWith(normalizedQuery);
      const bStartsWith = b.name.toLowerCase().startsWith(normalizedQuery);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // If both start with or both don't, sort by population
      return (b.population || 0) - (a.population || 0);
    });

    return filtered.slice(0, limit);
  }

  /**
   * Get popular cities for a specific province
   */
  static getPopularCities(province: string, limit: number = 6): City[] {
    return CANADIAN_CITIES
      .filter((city) => city.province === province)
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, limit);
  }

  /**
   * Get all cities for a province
   */
  static getCitiesByProvince(province: string): City[] {
    return CANADIAN_CITIES
      .filter((city) => city.province === province)
      .sort((a, b) => (b.population || 0) - (a.population || 0));
  }

  /**
   * Validate if a city exists in the database
   */
  static validateCity(cityName: string, province?: string): boolean {
    return CANADIAN_CITIES.some(
      (city) =>
        city.name.toLowerCase() === cityName.toLowerCase() &&
        (!province || city.province === province)
    );
  }

  /**
   * Get city details
   */
  static getCityDetails(cityName: string, province?: string): City | undefined {
    return CANADIAN_CITIES.find(
      (city) =>
        city.name.toLowerCase() === cityName.toLowerCase() &&
        (!province || city.province === province)
    );
  }
}

export type { City };
