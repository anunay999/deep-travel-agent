import { z } from "zod";

// Simplified schemas for Gemini compatibility - no $ref, minimal nesting, basic validation

export const ActivitySearchSchema = z.object({
  location: z.string().describe("Location for activity search (city, address, landmark, e.g. 'Paris', 'Central Park New York')"),
  category: z.enum(["attractions", "tours", "outdoor", "entertainment", "cultural", "family", "food", "all"]).default("all").describe("Activity category filter"),
  date: z.string().optional().describe("Activity date in YYYY-MM-DD format (optional)"),
  duration: z.enum(["1-2hours", "half-day", "full-day", "multi-day", "any"]).default("any").describe("Preferred activity duration"),
  price_range: z.enum(["free", "budget", "moderate", "premium", "any"]).default("any").describe("Price range preference"),
  min_rating: z.number().optional().describe("Minimum rating (1-5)"),
  group_size: z.number().default(2).describe("Number of people (1-20)"),
  accessibility: z.boolean().default(false).describe("Require wheelchair accessibility"),
  indoor_only: z.boolean().default(false).describe("Indoor activities only (useful for bad weather)"),
  sort_by: z.enum(["rating", "price", "distance", "popularity"]).default("rating").describe("Sort results by"),
});

export const AttractionSearchSchema = z.object({
  location: z.string().describe("Location for attraction search"),
  attraction_type: z.enum(["museums", "landmarks", "parks", "monuments", "viewpoints", "historical", "all"]).default("all").describe("Type of attraction"),
  min_rating: z.number().optional().describe("Minimum rating (1-5)"),
  free_only: z.boolean().default(false).describe("Show only free attractions"),
  max_distance: z.number().optional().describe("Maximum distance in kilometers from location center"),
  sort_by: z.enum(["rating", "distance", "popularity"]).default("rating").describe("Sort results by"),
});

export const TourSearchSchema = z.object({
  location: z.string().describe("Location for tour search"),
  tour_type: z.enum(["walking", "bus", "boat", "food", "historical", "cultural", "adventure", "all"]).default("all").describe("Type of tour"),
  duration: z.enum(["1-2hours", "half-day", "full-day", "multi-day", "any"]).default("any").describe("Tour duration"),
  max_price: z.number().optional().describe("Maximum price per person"),
  group_size: z.number().default(2).describe("Number of people"),
  language: z.enum(["english", "spanish", "french", "german", "italian", "any"]).default("english").describe("Tour language"),
  date: z.string().optional().describe("Tour date in YYYY-MM-DD format"),
});

export const RestaurantSearchSchema = z.object({
  location: z.string().describe("Location for restaurant search"),
  cuisine_type: z.enum(["italian", "french", "chinese", "japanese", "mexican", "indian", "american", "local", "all"]).default("all").describe("Cuisine type"),
  price_range: z.enum(["budget", "moderate", "upscale", "fine-dining", "any"]).default("any").describe("Restaurant price range"),
  min_rating: z.number().optional().describe("Minimum rating (1-5)"),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "brunch", "any"]).default("any").describe("Meal type"),
  dietary_restrictions: z.array(z.string()).optional().describe("Dietary restrictions (e.g., ['vegetarian', 'gluten-free'])"),
  reservation_required: z.boolean().default(false).describe("Show only restaurants that accept reservations"),
});

export const ActivityFilterSchema = z.object({
  search_id: z.string().describe("ID of the activity search to filter"),
  min_price: z.number().optional().describe("Minimum price per person"),
  max_price: z.number().optional().describe("Maximum price per person"),
  min_rating: z.number().optional().describe("Minimum rating (1-5)"),
  categories: z.array(z.string()).optional().describe("Activity categories to include"),
  duration: z.enum(["1-2hours", "half-day", "full-day", "multi-day"]).optional().describe("Activity duration"),
});

export const ActivityDetailsSchema = z.object({
  activity_id: z.string().describe("Unique identifier for the activity"),
  location: z.string().describe("Location context for the activity"),
});

export type ActivitySearch = z.infer<typeof ActivitySearchSchema>;
export type AttractionSearch = z.infer<typeof AttractionSearchSchema>;
export type TourSearch = z.infer<typeof TourSearchSchema>;
export type RestaurantSearch = z.infer<typeof RestaurantSearchSchema>;
export type ActivityFilter = z.infer<typeof ActivityFilterSchema>;
export type ActivityDetails = z.infer<typeof ActivityDetailsSchema>;

// SerpAPI Google Things to Do Response interfaces
export interface ActivityItem {
  title: string;
  description?: string;
  rating?: number;
  reviews?: number;
  price?: {
    value: number;
    currency: string;
    description: string;
  };
  address?: string;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  website?: string;
  phone?: string;
  categories?: string[];
  images?: Array<{
    thumbnail: string;
    original_image: string;
  }>;
  service_options?: {
    dine_in?: boolean;
    takeout?: boolean;
    delivery?: boolean;
  };
}

export interface ActivitySearchResponse {
  search_metadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  search_parameters: {
    engine: string;
    q: string;
    location?: string;
    gl: string;
    hl: string;
  };
  local_results?: ActivityItem[];
  places_results?: ActivityItem[];
}

// Weather API Response interface
export interface WeatherResponse {
  weather: Array<{
    main: string;
    description: string;
    id: number;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  visibility: number;
  dt: number;
  name: string;
}

// Common activity categories and types
export const ACTIVITY_CATEGORIES = [
  "Museums & Galleries",
  "Historical Sites",
  "Parks & Nature",
  "Entertainment",
  "Tours & Experiences",
  "Food & Dining",
  "Sports & Recreation",
  "Shopping",
  "Nightlife",
  "Cultural Sites",
  "Family Activities",
  "Adventure & Outdoor",
] as const;

export const CUISINE_TYPES = [
  "Italian",
  "French", 
  "Chinese",
  "Japanese",
  "Mexican",
  "Indian",
  "American",
  "Mediterranean",
  "Thai",
  "Korean",
  "Vietnamese",
  "Local Cuisine",
] as const;

export const TOUR_TYPES = [
  "Walking Tours",
  "Bus Tours", 
  "Boat Tours",
  "Food Tours",
  "Historical Tours",
  "Cultural Tours",
  "Adventure Tours",
  "Photography Tours",
  "Private Tours",
  "Group Tours",
] as const;

// Activity duration mappings
export const DURATION_MAPPINGS = {
  "1-2hours": "1-2 hours",
  "half-day": "3-4 hours", 
  "full-day": "6-8 hours",
  "multi-day": "Multiple days",
} as const;

// Price range mappings
export const PRICE_RANGE_MAPPINGS = {
  "free": "Free",
  "budget": "Under $25",
  "moderate": "$25-75", 
  "premium": "$75+",
} as const;