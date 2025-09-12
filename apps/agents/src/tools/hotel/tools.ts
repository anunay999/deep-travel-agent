import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { SerpAPIHotelClient } from "./client.js";
import {
  HotelSearchSchema,
  HotelFilterSchema,
  PropertyDetailsSchema,
  AmenityFilterSchema,
  type HotelSearch,
  type HotelFilter,
  type PropertyDetails,
  type AmenityFilter,
  HotelProperty,
} from "./types.js";
import * as fs from "fs";
import * as path from "path";

// Store search results for filtering
const HOTEL_SEARCHES = new Map<string, HotelProperty[]>();

// Ensure hotels directory exists
const hotelsDir = path.join(process.cwd(), "hotels");
if (!fs.existsSync(hotelsDir)) {
  fs.mkdirSync(hotelsDir, { recursive: true });
}

export const searchHotelsTool = new DynamicStructuredTool({
  name: "search_hotels",
  description: "Search for hotels and accommodations by location, dates, and preferences.",
  schema: HotelSearchSchema,
  func: async (params: HotelSearch) => {
    try {
      const client = new SerpAPIHotelClient();
      
      const response = await client.searchHotels({
        location: params.location,
        check_in_date: params.check_in_date,
        check_out_date: params.check_out_date,
        adults: params.adults,
        children: params.children,
        rooms: params.rooms,
        currency: params.currency,
        sort_by: params.sort_by,
        hotel_class: params.hotel_class,
        max_price: params.max_price,
        min_rating: params.min_rating,
        free_cancellation: params.free_cancellation,
        vacation_rentals: params.vacation_rentals,
      });

      // Store search results for filtering
      const searchId = response.search_metadata.id;
      HOTEL_SEARCHES.set(searchId, response.properties);

      // Save to file
      const filename = path.join(hotelsDir, `${searchId}.json`);
      fs.writeFileSync(filename, JSON.stringify(response, null, 2));

      // Format results for better readability
      const formatted = client.formatSearchResults(response);
      return JSON.stringify(formatted, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Hotel search failed: ${errorMessage}`);
    }
  },
});

export const filterHotelsByPriceTool = new DynamicStructuredTool({
  name: "filter_hotels_by_price",
  description: "Filter hotels from a previous search by price range.",
  schema: HotelFilterSchema,
  func: async (params: HotelFilter) => {
    try {
      const client = new SerpAPIHotelClient();
      
      // Get hotels from memory or file
      let hotels = HOTEL_SEARCHES.get(params.search_id);
      if (!hotels) {
        const filename = path.join(hotelsDir, `${params.search_id}.json`);
        if (fs.existsSync(filename)) {
          const data = JSON.parse(fs.readFileSync(filename, "utf-8"));
          hotels = data.properties || [];
          if (hotels && hotels.length > 0) {
            HOTEL_SEARCHES.set(params.search_id, hotels);
          }
        } else {
          throw new Error(`No hotel search found with ID: ${params.search_id}`);
        }
      }

      if (!hotels || hotels.length === 0) {
        throw new Error(`No hotels found for search ID: ${params.search_id}`);
      }

      const filteredHotels = client.filterHotelsByPrice(
        hotels!,
        params.min_price,
        params.max_price
      );

      const result = {
        search_id: params.search_id,
        filter_applied: "price_range",
        min_price: params.min_price,
        max_price: params.max_price,
        total_results: filteredHotels.length,
        original_results: hotels!.length,
        hotels: filteredHotels.map(hotel => ({
          name: hotel.name,
          type: hotel.type,
          rating: hotel.rating,
          reviews: hotel.reviews,
          hotel_class: hotel.extracted_hotel_class || hotel.hotel_class,
          price_per_night: hotel.rate_per_night?.extracted_lowest,
          total_price: hotel.total_rate?.extracted_lowest,
          amenities: hotel.amenities?.slice(0, 5), // Limit amenities for readability
          property_token: hotel.property_token,
        })),
      };

      return JSON.stringify(result, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Price filtering failed: ${errorMessage}`);
    }
  },
});

export const filterHotelsByRatingTool = new DynamicStructuredTool({
  name: "filter_hotels_by_rating",
  description: "Filter hotels from a previous search by minimum rating.",
  schema: z.object({
    search_id: z.string().describe("ID of the hotel search to filter"),
    min_rating: z.number().describe("Minimum hotel rating (1-5)"),
  }),
  func: async (params: { search_id: string; min_rating: number }) => {
    try {
      const client = new SerpAPIHotelClient();
      
      // Get hotels from memory or file
      let hotels = HOTEL_SEARCHES.get(params.search_id);
      if (!hotels) {
        const filename = path.join(hotelsDir, `${params.search_id}.json`);
        if (fs.existsSync(filename)) {
          const data = JSON.parse(fs.readFileSync(filename, "utf-8"));
          hotels = data.properties || [];
          if (hotels && hotels.length > 0) {
            HOTEL_SEARCHES.set(params.search_id, hotels);
          }
        } else {
          throw new Error(`No hotel search found with ID: ${params.search_id}`);
        }
      }

      if (!hotels || hotels.length === 0) {
        throw new Error(`No hotels found for search ID: ${params.search_id}`);
      }

      const filteredHotels = client.filterHotelsByRating(hotels!, params.min_rating);

      const result = {
        search_id: params.search_id,
        filter_applied: "minimum_rating",
        min_rating: params.min_rating,
        total_results: filteredHotels.length,
        original_results: hotels!.length,
        hotels: filteredHotels.map(hotel => ({
          name: hotel.name,
          type: hotel.type,
          rating: hotel.rating,
          reviews: hotel.reviews,
          hotel_class: hotel.extracted_hotel_class || hotel.hotel_class,
          price_per_night: hotel.rate_per_night?.extracted_lowest,
          total_price: hotel.total_rate?.extracted_lowest,
          amenities: hotel.amenities?.slice(0, 5),
          property_token: hotel.property_token,
        })),
      };

      return JSON.stringify(result, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Rating filtering failed: ${errorMessage}`);
    }
  },
});

export const filterHotelsByAmenitiesTool = new DynamicStructuredTool({
  name: "filter_hotels_by_amenities",
  description: "Filter hotels from a previous search by required amenities.",
  schema: AmenityFilterSchema,
  func: async (params: AmenityFilter) => {
    try {
      const client = new SerpAPIHotelClient();
      
      // Get hotels from memory or file
      let hotels = HOTEL_SEARCHES.get(params.search_id);
      if (!hotels) {
        const filename = path.join(hotelsDir, `${params.search_id}.json`);
        if (fs.existsSync(filename)) {
          const data = JSON.parse(fs.readFileSync(filename, "utf-8"));
          hotels = data.properties || [];
          if (hotels && hotels.length > 0) {
            HOTEL_SEARCHES.set(params.search_id, hotels);
          }
        } else {
          throw new Error(`No hotel search found with ID: ${params.search_id}`);
        }
      }

      if (!hotels || hotels.length === 0) {
        throw new Error(`No hotels found for search ID: ${params.search_id}`);
      }

      const filteredHotels = client.filterHotelsByAmenities(hotels!, params.required_amenities);

      const result = {
        search_id: params.search_id,
        filter_applied: "required_amenities",
        required_amenities: params.required_amenities,
        total_results: filteredHotels.length,
        original_results: hotels!.length,
        hotels: filteredHotels.map(hotel => ({
          name: hotel.name,
          type: hotel.type,
          rating: hotel.rating,
          reviews: hotel.reviews,
          hotel_class: hotel.extracted_hotel_class || hotel.hotel_class,
          price_per_night: hotel.rate_per_night?.extracted_lowest,
          total_price: hotel.total_rate?.extracted_lowest,
          amenities: hotel.amenities,
          property_token: hotel.property_token,
          matching_amenities: hotel.amenities?.filter(amenity => 
            params.required_amenities.some(required => 
              amenity.toLowerCase().includes(required.toLowerCase())
            )
          ),
        })),
      };

      return JSON.stringify(result, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Amenity filtering failed: ${errorMessage}`);
    }
  },
});

export const getPropertyDetailsTool = new DynamicStructuredTool({
  name: "get_property_details",
  description: "Get detailed information about a specific hotel property.",
  schema: PropertyDetailsSchema,
  func: async (params: PropertyDetails) => {
    try {
      const client = new SerpAPIHotelClient();
      
      const response = await client.getPropertyDetails({
        property_token: params.property_token,
        check_in_date: params.check_in_date,
        check_out_date: params.check_out_date,
        adults: params.adults,
        children: params.children,
        currency: params.currency,
      });

      // Format property details for better readability
      const details = response.property_details;
      const formatted = {
        name: details.name,
        type: details.type,
        description: details.description,
        location: {
          latitude: details.gps_coordinates.latitude,
          longitude: details.gps_coordinates.longitude,
        },
        ratings: {
          overall_rating: details.overall_rating,
          reviews: details.reviews,
          location_rating: details.location_rating,
        },
        check_in_out: {
          check_in_time: details.check_in_time,
          check_out_time: details.check_out_time,
        },
        amenities: details.amenities,
        excluded_amenities: details.excluded_amenities,
        images: details.images?.slice(0, 10).map(img => ({
          thumbnail: img.thumbnail,
          original: img.original_image,
        })),
        pricing: details.prices?.map(price => ({
          source: price.source,
          num_guests: price.num_guests,
          rate_per_night: price.rate_per_night.extracted_lowest,
          total_rate: price.total_rate.extracted_lowest,
          before_taxes_per_night: price.rate_per_night.extracted_before_taxes_fees,
          before_taxes_total: price.total_rate.extracted_before_taxes_fees,
        })),
        search_metadata: {
          search_id: response.search_metadata.id,
          dates: {
            check_in: response.search_parameters.check_in_date,
            check_out: response.search_parameters.check_out_date,
          },
          guests: {
            adults: response.search_parameters.adults,
            children: response.search_parameters.children,
          },
        },
      };

      return JSON.stringify(formatted, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Property details failed: ${errorMessage}`);
    }
  },
});

export const filterHotelsByClassTool = new DynamicStructuredTool({
  name: "filter_hotels_by_class",
  description: "Filter hotels from a previous search by star rating/hotel class.",
  schema: z.object({
    search_id: z.string().describe("ID of the hotel search to filter"),
    hotel_class: z.number().describe("Hotel star rating (1-5)"),
  }),
  func: async (params: { search_id: string; hotel_class: number }) => {
    try {
      const client = new SerpAPIHotelClient();
      
      // Get hotels from memory or file
      let hotels = HOTEL_SEARCHES.get(params.search_id);
      if (!hotels) {
        const filename = path.join(hotelsDir, `${params.search_id}.json`);
        if (fs.existsSync(filename)) {
          const data = JSON.parse(fs.readFileSync(filename, "utf-8"));
          hotels = data.properties || [];
          if (hotels && hotels.length > 0) {
            HOTEL_SEARCHES.set(params.search_id, hotels);
          }
        } else {
          throw new Error(`No hotel search found with ID: ${params.search_id}`);
        }
      }

      if (!hotels || hotels.length === 0) {
        throw new Error(`No hotels found for search ID: ${params.search_id}`);
      }

      const filteredHotels = client.filterHotelsByClass(hotels!, params.hotel_class);

      const result = {
        search_id: params.search_id,
        filter_applied: "hotel_class",
        hotel_class: params.hotel_class,
        total_results: filteredHotels.length,
        original_results: hotels!.length,
        hotels: filteredHotels.map(hotel => ({
          name: hotel.name,
          type: hotel.type,
          rating: hotel.rating,
          reviews: hotel.reviews,
          hotel_class: hotel.extracted_hotel_class || hotel.hotel_class,
          price_per_night: hotel.rate_per_night?.extracted_lowest,
          total_price: hotel.total_rate?.extracted_lowest,
          amenities: hotel.amenities?.slice(0, 5),
          property_token: hotel.property_token,
        })),
      };

      return JSON.stringify(result, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Hotel class filtering failed: ${errorMessage}`);
    }
  },
});

export const HOTEL_TOOLS = [
  searchHotelsTool,
  filterHotelsByPriceTool,
  filterHotelsByRatingTool,
  filterHotelsByAmenitiesTool,
  filterHotelsByClassTool,
  getPropertyDetailsTool,
];