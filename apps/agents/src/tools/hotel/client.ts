import { getJson } from "serpapi";
import { 
  HotelSearchResponse, 
  PropertyDetailsResponse, 
  HotelProperty 
} from "./types.js";

export class SerpAPIHotelClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SERPAPI_API_KEY || "";
    
    if (!this.apiKey) {
      throw new Error("SerpAPI API key is required. Set SERPAPI_API_KEY environment variable.");
    }
  }

  async searchHotels(params: {
    location: string;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    children?: number;
    rooms?: number;
    currency?: string;
    sort_by?: string;
    hotel_class?: string;
    max_price?: number;
    min_rating?: number;
    free_cancellation?: boolean;
    vacation_rentals?: boolean;
  }): Promise<HotelSearchResponse> {
    try {
      // Build search parameters for SerpAPI
      const searchParams: any = {
        engine: "google_hotels",
        q: params.location,
        check_in_date: params.check_in_date,
        check_out_date: params.check_out_date,
        adults: params.adults,
        currency: params.currency || "USD",
        gl: "us", // Geographic location
        hl: "en", // Interface language
        api_key: this.apiKey,
      };

      if (params.children && params.children > 0) {
        searchParams.children = params.children;
      }

      if (params.rooms && params.rooms > 1) {
        searchParams.rooms = params.rooms;
      }

      // Add sorting
      if (params.sort_by) {
        switch (params.sort_by) {
          case "price_low":
            searchParams.sort_by = 3; // Lowest price
            break;
          case "price_high":
            searchParams.sort_by = 4; // Highest price
            break;
          case "rating":
            searchParams.sort_by = 8; // Highest rating
            break;
          case "distance":
            searchParams.sort_by = 1; // Distance
            break;
          case "deals":
            searchParams.sort_by = 13; // Best deals
            break;
        }
      }

      // Add filters
      if (params.hotel_class) {
        searchParams.hotel_class = [parseInt(params.hotel_class)];
      }

      if (params.max_price) {
        searchParams.max_price = params.max_price;
      }

      if (params.min_rating) {
        searchParams.min_rating = params.min_rating;
      }

      if (params.free_cancellation) {
        searchParams.free_cancellation = true;
      }

      if (params.vacation_rentals) {
        searchParams.vacation_rentals = true;
      }

      const response = await getJson(searchParams);
      return response as HotelSearchResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`SerpAPI Hotels search failed: ${errorMessage}`);
    }
  }

  async getPropertyDetails(params: {
    property_token: string;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    children?: number;
    currency?: string;
  }): Promise<PropertyDetailsResponse> {
    try {
      const searchParams: any = {
        engine: "google_hotels",
        property_token: params.property_token,
        check_in_date: params.check_in_date,
        check_out_date: params.check_out_date,
        adults: params.adults,
        currency: params.currency || "USD",
        gl: "us",
        hl: "en",
        api_key: this.apiKey,
      };

      if (params.children && params.children > 0) {
        searchParams.children = params.children;
      }

      const response = await getJson(searchParams);
      return response as PropertyDetailsResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`SerpAPI Property details failed: ${errorMessage}`);
    }
  }

  // Helper method to filter hotels by price range
  filterHotelsByPrice(hotels: HotelProperty[], minPrice?: number, maxPrice?: number): HotelProperty[] {
    return hotels.filter(hotel => {
      const price = hotel.rate_per_night?.extracted_lowest;
      if (!price) return false;
      
      if (minPrice && price < minPrice) return false;
      if (maxPrice && price > maxPrice) return false;
      
      return true;
    });
  }

  // Helper method to filter hotels by rating
  filterHotelsByRating(hotels: HotelProperty[], minRating: number): HotelProperty[] {
    return hotels.filter(hotel => {
      const rating = hotel.rating;
      return rating !== undefined && rating >= minRating;
    });
  }

  // Helper method to filter hotels by amenities
  filterHotelsByAmenities(hotels: HotelProperty[], requiredAmenities: string[]): HotelProperty[] {
    return hotels.filter(hotel => {
      const hotelAmenities = hotel.amenities || [];
      return requiredAmenities.every(requiredAmenity => 
        hotelAmenities.some(hotelAmenity => 
          hotelAmenity.toLowerCase().includes(requiredAmenity.toLowerCase())
        )
      );
    });
  }

  // Helper method to filter hotels by star rating
  filterHotelsByClass(hotels: HotelProperty[], hotelClass: number): HotelProperty[] {
    return hotels.filter(hotel => {
      const starRating = hotel.extracted_hotel_class || hotel.hotel_class;
      return starRating === hotelClass;
    });
  }

  // Format search results for better readability
  formatSearchResults(response: HotelSearchResponse): {
    search_id: string;
    location: string;
    dates: {
      check_in: string;
      check_out: string;
    };
    guests: {
      adults: number;
      children?: number;
    };
    hotels: Array<{
      name: string;
      type: string;
      rating?: number;
      reviews?: number;
      hotel_class?: number;
      price_per_night?: {
        amount: number;
        currency: string;
        before_taxes: number;
      };
      total_price?: {
        amount: number;
        currency: string;
        before_taxes: number;
      };
      location?: {
        latitude?: number;
        longitude?: number;
      };
      amenities?: string[];
      property_token?: string;
      images?: Array<{
        thumbnail: string;
        original: string;
      }>;
      nearby_places?: Array<{
        name: string;
        transportation: string;
      }>;
    }>;
    total_results: number;
  } {
    return {
      search_id: response.search_metadata.id,
      location: response.search_parameters.q,
      dates: {
        check_in: response.search_parameters.check_in_date,
        check_out: response.search_parameters.check_out_date,
      },
      guests: {
        adults: response.search_parameters.adults,
        children: response.search_parameters.children,
      },
      hotels: response.properties.map(hotel => ({
        name: hotel.name,
        type: hotel.type,
        rating: hotel.rating,
        reviews: hotel.reviews,
        hotel_class: hotel.extracted_hotel_class || hotel.hotel_class,
        price_per_night: hotel.rate_per_night ? {
          amount: hotel.rate_per_night.extracted_lowest,
          currency: response.search_parameters.currency,
          before_taxes: hotel.rate_per_night.extracted_before_taxes_fees || hotel.rate_per_night.extracted_lowest,
        } : undefined,
        total_price: hotel.total_rate ? {
          amount: hotel.total_rate.extracted_lowest,
          currency: response.search_parameters.currency,
          before_taxes: hotel.total_rate.extracted_before_taxes_fees || hotel.total_rate.extracted_lowest,
        } : undefined,
        location: hotel.gps_coordinates ? {
          latitude: hotel.gps_coordinates.latitude,
          longitude: hotel.gps_coordinates.longitude,
        } : undefined,
        amenities: hotel.amenities,
        property_token: hotel.property_token,
        images: hotel.images?.map(img => ({
          thumbnail: img.thumbnail,
          original: img.original_image,
        })),
        nearby_places: hotel.nearby_places?.map(place => ({
          name: place.name,
          transportation: place.transportations?.[0] ? 
            `${place.transportations[0].type}: ${place.transportations[0].duration}` : 
            "No transportation info",
        })),
      })),
      total_results: response.properties.length,
    };
  }
}