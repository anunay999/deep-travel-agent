import { getJson } from "serpapi";
import axios from "axios";
import { 
  ActivitySearchResponse, 
  ActivityItem,
  WeatherResponse 
} from "./types.js";

export class ActivitySearchClient {
  private apiKey: string;
  private weatherApiKey?: string;

  constructor(apiKey?: string, weatherApiKey?: string) {
    this.apiKey = apiKey || process.env.SERPAPI_API_KEY || "";
    this.weatherApiKey = weatherApiKey || process.env.OPENWEATHER_API_KEY || "";
    
    if (!this.apiKey) {
      throw new Error("SerpAPI API key is required. Set SERPAPI_API_KEY environment variable.");
    }
  }

  async searchActivities(params: {
    location: string;
    category?: string;
    date?: string;
    duration?: string;
    price_range?: string;
    min_rating?: number;
    group_size?: number;
    accessibility?: boolean;
    indoor_only?: boolean;
    sort_by?: string;
  }): Promise<ActivitySearchResponse> {
    try {
      // Build search query based on category
      let query = "";
      switch (params.category) {
        case "attractions":
          query = `attractions things to do ${params.location}`;
          break;
        case "tours":
          query = `tours experiences ${params.location}`;
          break;
        case "outdoor":
          query = `outdoor activities parks ${params.location}`;
          break;
        case "entertainment":
          query = `entertainment shows events ${params.location}`;
          break;
        case "cultural":
          query = `museums cultural sites ${params.location}`;
          break;
        case "family":
          query = `family activities kids ${params.location}`;
          break;
        case "food":
          query = `restaurants food tours ${params.location}`;
          break;
        default:
          query = `things to do ${params.location}`;
      }

      const searchParams: any = {
        engine: "google_local",
        q: query,
        location: params.location,
        gl: "us",
        hl: "en",
        api_key: this.apiKey,
      };

      const response = await getJson(searchParams);
      return response as ActivitySearchResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`SerpAPI Activities search failed: ${errorMessage}`);
    }
  }

  async searchAttractions(params: {
    location: string;
    attraction_type?: string;
    min_rating?: number;
    free_only?: boolean;
    max_distance?: number;
    sort_by?: string;
  }): Promise<ActivitySearchResponse> {
    try {
      let query = "";
      switch (params.attraction_type) {
        case "museums":
          query = `museums ${params.location}`;
          break;
        case "landmarks":
          query = `landmarks monuments ${params.location}`;
          break;
        case "parks":
          query = `parks gardens ${params.location}`;
          break;
        case "historical":
          query = `historical sites ${params.location}`;
          break;
        case "viewpoints":
          query = `viewpoints scenic views ${params.location}`;
          break;
        default:
          query = `attractions ${params.location}`;
      }

      if (params.free_only) {
        query += " free";
      }

      const searchParams: any = {
        engine: "google_local",
        q: query,
        location: params.location,
        gl: "us",
        hl: "en",
        api_key: this.apiKey,
      };

      const response = await getJson(searchParams);
      return response as ActivitySearchResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Attraction search failed: ${errorMessage}`);
    }
  }

  async searchTours(params: {
    location: string;
    tour_type?: string;
    duration?: string;
    max_price?: number;
    group_size?: number;
    language?: string;
    date?: string;
  }): Promise<ActivitySearchResponse> {
    try {
      let query = "";
      switch (params.tour_type) {
        case "walking":
          query = `walking tours ${params.location}`;
          break;
        case "bus":
          query = `bus tours ${params.location}`;
          break;
        case "boat":
          query = `boat tours cruises ${params.location}`;
          break;
        case "food":
          query = `food tours culinary experiences ${params.location}`;
          break;
        case "historical":
          query = `historical tours ${params.location}`;
          break;
        case "cultural":
          query = `cultural tours ${params.location}`;
          break;
        case "adventure":
          query = `adventure tours ${params.location}`;
          break;
        default:
          query = `tours ${params.location}`;
      }

      if (params.language && params.language !== "any") {
        query += ` ${params.language}`;
      }

      const searchParams: any = {
        engine: "google_local",
        q: query,
        location: params.location,
        gl: "us",
        hl: "en",
        api_key: this.apiKey,
      };

      const response = await getJson(searchParams);
      return response as ActivitySearchResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Tour search failed: ${errorMessage}`);
    }
  }

  async searchRestaurants(params: {
    location: string;
    cuisine_type?: string;
    price_range?: string;
    min_rating?: number;
    meal_type?: string;
    dietary_restrictions?: string[];
    reservation_required?: boolean;
  }): Promise<ActivitySearchResponse> {
    try {
      let query = "restaurants";
      
      if (params.cuisine_type && params.cuisine_type !== "all") {
        if (params.cuisine_type === "local") {
          query = `local cuisine restaurants ${params.location}`;
        } else {
          query = `${params.cuisine_type} restaurants`;
        }
      }

      query += ` ${params.location}`;

      if (params.meal_type && params.meal_type !== "any") {
        query += ` ${params.meal_type}`;
      }

      if (params.dietary_restrictions && params.dietary_restrictions.length > 0) {
        query += ` ${params.dietary_restrictions.join(" ")}`;
      }

      if (params.reservation_required) {
        query += " reservations";
      }

      const searchParams: any = {
        engine: "google_local",
        q: query,
        location: params.location,
        gl: "us",
        hl: "en",
        api_key: this.apiKey,
      };

      const response = await getJson(searchParams);
      return response as ActivitySearchResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Restaurant search failed: ${errorMessage}`);
    }
  }

  async getWeather(location: string): Promise<WeatherResponse | null> {
    if (!this.weatherApiKey) {
      console.warn("Weather API key not provided, skipping weather check");
      return null;
    }

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q: location,
            appid: this.weatherApiKey,
            units: "metric",
          },
        }
      );
      return response.data as WeatherResponse;
    } catch (error) {
      console.warn("Weather API request failed:", error);
      return null;
    }
  }

  // Helper method to filter activities by price range
  filterActivitiesByPrice(activities: ActivityItem[], minPrice?: number, maxPrice?: number): ActivityItem[] {
    return activities.filter(activity => {
      const price = activity.price?.value;
      if (!price) return true; // Include free activities if no price filter
      
      if (minPrice && price < minPrice) return false;
      if (maxPrice && price > maxPrice) return false;
      
      return true;
    });
  }

  // Helper method to filter activities by rating
  filterActivitiesByRating(activities: ActivityItem[], minRating: number): ActivityItem[] {
    return activities.filter(activity => {
      const rating = activity.rating;
      return rating !== undefined && rating >= minRating;
    });
  }

  // Helper method to filter activities by category
  filterActivitiesByCategory(activities: ActivityItem[], categories: string[]): ActivityItem[] {
    return activities.filter(activity => {
      const activityCategories = activity.categories || [];
      return categories.some(category => 
        activityCategories.some(actCategory => 
          actCategory.toLowerCase().includes(category.toLowerCase())
        )
      );
    });
  }

  // Check if activities are suitable for current weather
  isWeatherSuitable(weather: WeatherResponse, activityType: string): {
    suitable: boolean;
    reason?: string;
    alternatives?: string[];
  } {
    const weatherMain = weather.weather[0]?.main.toLowerCase() || "";
    const temp = weather.main.temp;
    const windSpeed = weather.wind.speed;

    // Weather conditions that might affect outdoor activities
    const badWeatherConditions = ["thunderstorm", "rain", "snow"];
    const isBadWeather = badWeatherConditions.includes(weatherMain);

    if (activityType === "outdoor") {
      if (isBadWeather) {
        return {
          suitable: false,
          reason: `Not recommended due to ${weather.weather[0]?.description}`,
          alternatives: ["Museums", "Indoor attractions", "Shopping", "Restaurants"]
        };
      }
      
      if (temp < 0) {
        return {
          suitable: false,
          reason: "Very cold weather, outdoor activities may be uncomfortable",
          alternatives: ["Indoor activities", "Museums", "Shopping centers"]
        };
      }

      if (temp > 35) {
        return {
          suitable: false,
          reason: "Very hot weather, outdoor activities may be uncomfortable",
          alternatives: ["Indoor attractions", "Air-conditioned venues", "Water activities"]
        };
      }

      if (windSpeed > 10) {
        return {
          suitable: false,
          reason: "High winds may affect outdoor activities",
          alternatives: ["Indoor activities", "Sheltered attractions"]
        };
      }
    }

    return { suitable: true };
  }

  // Format search results for better readability
  formatSearchResults(response: ActivitySearchResponse, weather?: WeatherResponse | null): {
    search_id: string;
    location: string;
    weather_info?: {
      condition: string;
      temperature: number;
      suitable_for_outdoor: boolean;
      recommendations?: string[];
    };
    activities: Array<{
      title: string;
      description?: string;
      rating?: number;
      reviews?: number;
      price?: {
        amount: number;
        currency: string;
        description: string;
      };
      address?: string;
      location?: {
        latitude?: number;
        longitude?: number;
      };
      categories?: string[];
      hours?: Record<string, string>;
      contact?: {
        website?: string;
        phone?: string;
      };
      images?: Array<{
        thumbnail: string;
        original: string;
      }>;
      weather_suitable?: boolean;
    }>;
    total_results: number;
  } {
    const activities = [...(response.local_results || []), ...(response.places_results || [])];

    const weatherInfo = weather ? {
      condition: weather.weather[0]?.description || "Unknown",
      temperature: Math.round(weather.main.temp),
      suitable_for_outdoor: !["thunderstorm", "rain", "snow"].includes(weather.weather[0]?.main.toLowerCase() || ""),
      recommendations: !["thunderstorm", "rain", "snow"].includes(weather.weather[0]?.main.toLowerCase() || "") ? 
        undefined : ["Consider indoor activities", "Museums and galleries", "Shopping centers", "Restaurants"]
    } : undefined;

    return {
      search_id: response.search_metadata.id,
      location: response.search_parameters.q,
      weather_info: weatherInfo,
      activities: activities.map(activity => ({
        title: activity.title,
        description: activity.description,
        rating: activity.rating,
        reviews: activity.reviews,
        price: activity.price ? {
          amount: activity.price.value,
          currency: activity.price.currency,
          description: activity.price.description,
        } : undefined,
        address: activity.address,
        location: activity.gps_coordinates ? {
          latitude: activity.gps_coordinates.latitude,
          longitude: activity.gps_coordinates.longitude,
        } : undefined,
        categories: activity.categories,
        hours: activity.hours,
        contact: {
          website: activity.website,
          phone: activity.phone,
        },
        images: activity.images?.map(img => ({
          thumbnail: img.thumbnail,
          original: img.original_image,
        })),
        weather_suitable: weatherInfo ? weatherInfo.suitable_for_outdoor : true,
      })),
      total_results: activities.length,
    };
  }
}