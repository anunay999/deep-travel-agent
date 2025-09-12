import { z } from "zod";

// Simplified schemas for Gemini compatibility - no $ref, minimal nesting, basic validation

export const HotelSearchSchema = z.object({
  location: z.string().describe("Hotel search location (city, address, landmark, e.g. 'Paris', 'Times Square New York')"),
  check_in_date: z.string().describe("Check-in date in YYYY-MM-DD format"),
  check_out_date: z.string().describe("Check-out date in YYYY-MM-DD format"),  
  adults: z.number().default(2).describe("Number of adult guests (1-10)"),
  children: z.number().default(0).describe("Number of children (0-8)"),
  rooms: z.number().default(1).describe("Number of rooms needed (1-8)"),
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]).default("USD").describe("Currency for prices"),
  sort_by: z.enum(["price_low", "price_high", "rating", "distance", "deals"]).default("rating").describe("Sort results by"),
  hotel_class: z.enum(["1", "2", "3", "4", "5", "unrated"]).optional().describe("Hotel star rating filter"),
  max_price: z.number().optional().describe("Maximum price per night"),
  min_rating: z.number().optional().describe("Minimum hotel rating (1-5)"),
  free_cancellation: z.boolean().default(false).describe("Show only hotels with free cancellation"),
  vacation_rentals: z.boolean().default(false).describe("Include vacation rentals in search"),
});

export const HotelFilterSchema = z.object({
  search_id: z.string().describe("ID of the hotel search to filter"),
  min_price: z.number().optional().describe("Minimum price per night"),
  max_price: z.number().optional().describe("Maximum price per night"),
  min_rating: z.number().optional().describe("Minimum hotel rating (1-5)"),
  hotel_class: z.enum(["1", "2", "3", "4", "5"]).optional().describe("Hotel star rating"),
  amenities: z.array(z.string()).optional().describe("Required amenities (e.g., ['pool', 'wifi', 'spa'])"),
});

export const PropertyDetailsSchema = z.object({
  property_token: z.string().describe("Unique token for the hotel property"),
  check_in_date: z.string().describe("Check-in date in YYYY-MM-DD format"),
  check_out_date: z.string().describe("Check-out date in YYYY-MM-DD format"),
  adults: z.number().default(2).describe("Number of adult guests"),
  children: z.number().default(0).describe("Number of children"),
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]).default("USD").describe("Currency for prices"),
});

export const AmenityFilterSchema = z.object({
  search_id: z.string().describe("ID of the hotel search to filter"),
  required_amenities: z.array(z.string()).describe("List of required amenities (e.g., ['Free Wi-Fi', 'Pool', 'Spa', 'Gym'])"),
});

export type HotelSearch = z.infer<typeof HotelSearchSchema>;
export type HotelFilter = z.infer<typeof HotelFilterSchema>;
export type PropertyDetails = z.infer<typeof PropertyDetailsSchema>;
export type AmenityFilter = z.infer<typeof AmenityFilterSchema>;

// SerpAPI Response interfaces
export interface HotelProperty {
  type: string;
  name: string;
  description?: string;
  link: string;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
  check_in_time?: string;
  check_out_time?: string;
  rate_per_night?: {
    lowest: string;
    extracted_lowest: number;
    before_taxes_fees: string;
    extracted_before_taxes_fees: number;
  };
  total_rate?: {
    lowest: string;
    extracted_lowest: number;
    before_taxes_fees: string;
    extracted_before_taxes_fees: number;
  };
  nearby_places?: Array<{
    name: string;
    transportations: Array<{
      type: string;
      duration: string;
    }>;
  }>;
  hotel_class?: number;
  extracted_hotel_class?: number;
  rating?: number;
  reviews?: number;
  ratings?: Array<{
    stars: number;
    count: number;
  }>;
  amenities?: string[];
  excluded_amenities?: string[];
  essential_info?: string[];
  property_token?: string;
  serpapi_property_details_link?: string;
  images?: Array<{
    thumbnail: string;
    original_image: string;
  }>;
}

export interface HotelSearchResponse {
  search_metadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_hotels_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  search_parameters: {
    engine: string;
    q: string;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    children?: number;
    currency: string;
    gl: string;
    hl: string;
  };
  properties: HotelProperty[];
  brands?: Array<{
    id: number;
    name: string;
    children: Array<{
      id: number;
      name: string;
      property_count: number;
    }>;
  }>;
}

export interface PropertyDetailsResponse {
  search_metadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_hotels_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  search_parameters: {
    engine: string;
    property_token: string;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    children?: number;
    currency: string;
    gl: string;
    hl: string;
  };
  property_details: {
    name: string;
    type: string;
    description: string;
    gps_coordinates: {
      latitude: number;
      longitude: number;
    };
    check_in_time: string;
    check_out_time: string;
    images: Array<{
      thumbnail: string;
      original_image: string;
    }>;
    overall_rating: number;
    reviews: number;
    location_rating: number;
    amenities: string[];
    excluded_amenities?: string[];
    property_token: string;
    prices: Array<{
      source: string;
      logo: string;
      num_guests: number;
      rate_per_night: {
        lowest: string;
        extracted_lowest: number;
        before_taxes_fees?: string;
        extracted_before_taxes_fees?: number;
      };
      total_rate: {
        lowest: string;
        extracted_lowest: number;
        before_taxes_fees?: string;
        extracted_before_taxes_fees?: number;
      };
    }>;
  };
}

// Common amenities for filtering
export const COMMON_AMENITIES = [
  "Free Wi-Fi",
  "Pool",
  "Spa",
  "Fitness center",
  "Free parking",
  "Airport shuttle",
  "Restaurant",
  "Bar",
  "Room service",
  "Air conditioning",
  "Pet-friendly",
  "Beach access",
  "Concierge",
  "Business center",
  "Laundry service",
  "24-hour front desk",
  "Elevator",
  "Non-smoking rooms",
  "Family rooms",
  "Wheelchair accessible",
] as const;