import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ActivitySearchClient } from "./client.js";
import {
  ActivitySearchSchema,
  AttractionSearchSchema,
  TourSearchSchema,
  RestaurantSearchSchema,
  ActivityFilterSchema,
  ActivityDetailsSchema,
  type ActivitySearch,
  type AttractionSearch,
  type TourSearch,
  type RestaurantSearch,
  type ActivityFilter,
  type ActivityDetails,
  ActivityItem,
} from "./types.js";
import * as fs from "fs";
import * as path from "path";

// Store search results for filtering
const ACTIVITY_SEARCHES = new Map<string, ActivityItem[]>();

// Ensure activities directory exists
const activitiesDir = path.join(process.cwd(), "activities");
if (!fs.existsSync(activitiesDir)) {
  fs.mkdirSync(activitiesDir, { recursive: true });
}

export const searchActivitiesTool = new DynamicStructuredTool({
  name: "search_activities",
  description: "Search for activities and things to do by location, category, and preferences with weather integration.",
  schema: ActivitySearchSchema,
  func: async (params: ActivitySearch) => {
    try {
      const client = new ActivitySearchClient();
      
      // Get weather information for outdoor activity recommendations
      const weather = await client.getWeather(params.location);
      
      const response = await client.searchActivities({
        location: params.location,
        category: params.category,
        date: params.date,
        duration: params.duration,
        price_range: params.price_range,
        min_rating: params.min_rating,
        group_size: params.group_size,
        accessibility: params.accessibility,
        indoor_only: params.indoor_only,
        sort_by: params.sort_by,
      });

      // Store search results for filtering
      const searchId = response.search_metadata.id;
      const activities = [...(response.local_results || []), ...(response.places_results || [])];
      ACTIVITY_SEARCHES.set(searchId, activities);

      // Save to file
      const filename = path.join(activitiesDir, `${searchId}.json`);
      fs.writeFileSync(filename, JSON.stringify({
        ...response,
        weather: weather,
        search_params: params,
      }, null, 2));

      // Format results for better readability
      const formatted = client.formatSearchResults(response, weather);
      return JSON.stringify(formatted, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Activity search failed: ${errorMessage}`);
    }
  },
});

export const searchAttractionsTool = new DynamicStructuredTool({
  name: "search_attractions",
  description: "Search for specific attractions, museums, landmarks, and points of interest.",
  schema: AttractionSearchSchema,
  func: async (params: AttractionSearch) => {
    try {
      const client = new ActivitySearchClient();
      
      const response = await client.searchAttractions({
        location: params.location,
        attraction_type: params.attraction_type,
        min_rating: params.min_rating,
        free_only: params.free_only,
        max_distance: params.max_distance,
        sort_by: params.sort_by,
      });

      // Store search results for filtering
      const searchId = response.search_metadata.id;
      const activities = [...(response.local_results || []), ...(response.places_results || [])];
      ACTIVITY_SEARCHES.set(searchId, activities);

      // Save to file
      const filename = path.join(activitiesDir, `${searchId}.json`);
      fs.writeFileSync(filename, JSON.stringify({
        ...response,
        search_params: params,
      }, null, 2));

      // Format results for better readability
      const formatted = client.formatSearchResults(response);
      return JSON.stringify(formatted, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Attraction search failed: ${errorMessage}`);
    }
  },
});

export const searchToursTool = new DynamicStructuredTool({
  name: "search_tours",
  description: "Search for guided tours, experiences, and group activities.",
  schema: TourSearchSchema,
  func: async (params: TourSearch) => {
    try {
      const client = new ActivitySearchClient();
      
      const response = await client.searchTours({
        location: params.location,
        tour_type: params.tour_type,
        duration: params.duration,
        max_price: params.max_price,
        group_size: params.group_size,
        language: params.language,
        date: params.date,
      });

      // Store search results for filtering
      const searchId = response.search_metadata.id;
      const activities = [...(response.local_results || []), ...(response.places_results || [])];
      ACTIVITY_SEARCHES.set(searchId, activities);

      // Save to file
      const filename = path.join(activitiesDir, `${searchId}.json`);
      fs.writeFileSync(filename, JSON.stringify({
        ...response,
        search_params: params,
      }, null, 2));

      // Format results for better readability
      const formatted = client.formatSearchResults(response);
      return JSON.stringify(formatted, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Tour search failed: ${errorMessage}`);
    }
  },
});

export const searchRestaurantsTool = new DynamicStructuredTool({
  name: "search_restaurants",
  description: "Search for restaurants, cafes, and dining experiences by cuisine and preferences.",
  schema: RestaurantSearchSchema,
  func: async (params: RestaurantSearch) => {
    try {
      const client = new ActivitySearchClient();
      
      const response = await client.searchRestaurants({
        location: params.location,
        cuisine_type: params.cuisine_type,
        price_range: params.price_range,
        min_rating: params.min_rating,
        meal_type: params.meal_type,
        dietary_restrictions: params.dietary_restrictions,
        reservation_required: params.reservation_required,
      });

      // Store search results for filtering
      const searchId = response.search_metadata.id;
      const activities = [...(response.local_results || []), ...(response.places_results || [])];
      ACTIVITY_SEARCHES.set(searchId, activities);

      // Save to file
      const filename = path.join(activitiesDir, `${searchId}.json`);
      fs.writeFileSync(filename, JSON.stringify({
        ...response,
        search_params: params,
      }, null, 2));

      // Format results for better readability
      const formatted = client.formatSearchResults(response);
      return JSON.stringify(formatted, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Restaurant search failed: ${errorMessage}`);
    }
  },
});

export const filterActivitiesByPriceTool = new DynamicStructuredTool({
  name: "filter_activities_by_price",
  description: "Filter activities from a previous search by price range.",
  schema: ActivityFilterSchema,
  func: async (params: ActivityFilter) => {
    try {
      const client = new ActivitySearchClient();
      
      // Get activities from memory or file
      let activities = ACTIVITY_SEARCHES.get(params.search_id);
      if (!activities) {
        const filename = path.join(activitiesDir, `${params.search_id}.json`);
        if (fs.existsSync(filename)) {
          const data = JSON.parse(fs.readFileSync(filename, "utf-8"));
          activities = [...(data.local_results || []), ...(data.places_results || [])];
          if (activities && activities.length > 0) {
            ACTIVITY_SEARCHES.set(params.search_id, activities);
          }
        } else {
          throw new Error(`No activity search found with ID: ${params.search_id}`);
        }
      }

      if (!activities || activities.length === 0) {
        throw new Error(`No activities found for search ID: ${params.search_id}`);
      }

      const filteredActivities = client.filterActivitiesByPrice(
        activities!,
        params.min_price,
        params.max_price
      );

      const result = {
        search_id: params.search_id,
        filter_applied: "price_range",
        min_price: params.min_price,
        max_price: params.max_price,
        total_results: filteredActivities.length,
        original_results: activities!.length,
        activities: filteredActivities.map(activity => ({
          title: activity.title,
          description: activity.description,
          rating: activity.rating,
          reviews: activity.reviews,
          price: activity.price,
          address: activity.address,
          categories: activity.categories?.slice(0, 3), // Limit for readability
          website: activity.website,
          phone: activity.phone,
        })),
      };

      return JSON.stringify(result, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Price filtering failed: ${errorMessage}`);
    }
  },
});

export const filterActivitiesByRatingTool = new DynamicStructuredTool({
  name: "filter_activities_by_rating",
  description: "Filter activities from a previous search by minimum rating.",
  schema: z.object({
    search_id: z.string().describe("ID of the activity search to filter"),
    min_rating: z.number().describe("Minimum activity rating (1-5)"),
  }),
  func: async (params: { search_id: string; min_rating: number }) => {
    try {
      const client = new ActivitySearchClient();
      
      // Get activities from memory or file
      let activities = ACTIVITY_SEARCHES.get(params.search_id);
      if (!activities) {
        const filename = path.join(activitiesDir, `${params.search_id}.json`);
        if (fs.existsSync(filename)) {
          const data = JSON.parse(fs.readFileSync(filename, "utf-8"));
          activities = [...(data.local_results || []), ...(data.places_results || [])];
          if (activities && activities.length > 0) {
            ACTIVITY_SEARCHES.set(params.search_id, activities);
          }
        } else {
          throw new Error(`No activity search found with ID: ${params.search_id}`);
        }
      }

      if (!activities || activities.length === 0) {
        throw new Error(`No activities found for search ID: ${params.search_id}`);
      }

      const filteredActivities = client.filterActivitiesByRating(activities!, params.min_rating);

      const result = {
        search_id: params.search_id,
        filter_applied: "minimum_rating",
        min_rating: params.min_rating,
        total_results: filteredActivities.length,
        original_results: activities!.length,
        activities: filteredActivities.map(activity => ({
          title: activity.title,
          description: activity.description,
          rating: activity.rating,
          reviews: activity.reviews,
          price: activity.price,
          address: activity.address,
          categories: activity.categories?.slice(0, 3),
          website: activity.website,
          phone: activity.phone,
        })),
      };

      return JSON.stringify(result, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Rating filtering failed: ${errorMessage}`);
    }
  },
});

export const filterActivitiesByCategoryTool = new DynamicStructuredTool({
  name: "filter_activities_by_category",
  description: "Filter activities from a previous search by category types.",
  schema: z.object({
    search_id: z.string().describe("ID of the activity search to filter"),
    categories: z.array(z.string()).describe("Activity categories to include (e.g., ['museum', 'park', 'restaurant'])"),
  }),
  func: async (params: { search_id: string; categories: string[] }) => {
    try {
      const client = new ActivitySearchClient();
      
      // Get activities from memory or file
      let activities = ACTIVITY_SEARCHES.get(params.search_id);
      if (!activities) {
        const filename = path.join(activitiesDir, `${params.search_id}.json`);
        if (fs.existsSync(filename)) {
          const data = JSON.parse(fs.readFileSync(filename, "utf-8"));
          activities = [...(data.local_results || []), ...(data.places_results || [])];
          if (activities && activities.length > 0) {
            ACTIVITY_SEARCHES.set(params.search_id, activities);
          }
        } else {
          throw new Error(`No activity search found with ID: ${params.search_id}`);
        }
      }

      if (!activities || activities.length === 0) {
        throw new Error(`No activities found for search ID: ${params.search_id}`);
      }

      const filteredActivities = client.filterActivitiesByCategory(activities!, params.categories);

      const result = {
        search_id: params.search_id,
        filter_applied: "category_filter",
        categories: params.categories,
        total_results: filteredActivities.length,
        original_results: activities!.length,
        activities: filteredActivities.map(activity => ({
          title: activity.title,
          description: activity.description,
          rating: activity.rating,
          reviews: activity.reviews,
          price: activity.price,
          address: activity.address,
          categories: activity.categories,
          website: activity.website,
          phone: activity.phone,
          matching_categories: activity.categories?.filter(cat => 
            params.categories.some(filterCat => 
              cat.toLowerCase().includes(filterCat.toLowerCase())
            )
          ),
        })),
      };

      return JSON.stringify(result, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Category filtering failed: ${errorMessage}`);
    }
  },
});

export const getActivityDetailsTool = new DynamicStructuredTool({
  name: "get_activity_details",
  description: "Get detailed information about a specific activity including reviews, hours, and contact information.",
  schema: ActivityDetailsSchema,
  func: async (params: ActivityDetails) => {
    try {
      // Since we don't have a direct activity details API endpoint,
      // we'll provide enhanced information from our stored searches
      let activity: ActivityItem | undefined;
      
      // Search through all stored activity searches
      for (const [_searchId, activities] of ACTIVITY_SEARCHES.entries()) {
        activity = activities.find(act => 
          act.title.toLowerCase().includes(params.activity_id.toLowerCase()) ||
          params.activity_id.toLowerCase().includes(act.title.toLowerCase())
        );
        if (activity) break;
      }

      // If not found in memory, search files
      if (!activity) {
        const files = fs.readdirSync(activitiesDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
          const data = JSON.parse(fs.readFileSync(path.join(activitiesDir, file), "utf-8"));
          const activities = [...(data.local_results || []), ...(data.places_results || [])];
          activity = activities.find(act => 
            act.title.toLowerCase().includes(params.activity_id.toLowerCase()) ||
            params.activity_id.toLowerCase().includes(act.title.toLowerCase())
          );
          if (activity) break;
        }
      }

      if (!activity) {
        throw new Error(`Activity not found: ${params.activity_id}`);
      }

      // Format detailed activity information
      const details = {
        title: activity.title,
        description: activity.description,
        location: {
          address: activity.address,
          coordinates: activity.gps_coordinates,
        },
        ratings: {
          overall_rating: activity.rating,
          review_count: activity.reviews,
        },
        pricing: activity.price,
        hours: activity.hours,
        contact: {
          website: activity.website,
          phone: activity.phone,
        },
        categories: activity.categories,
        service_options: activity.service_options,
        images: activity.images?.map(img => ({
          thumbnail: img.thumbnail,
          original: img.original_image,
        })),
        additional_info: {
          search_location: params.location,
          last_updated: new Date().toISOString(),
        },
      };

      return JSON.stringify(details, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Activity details failed: ${errorMessage}`);
    }
  },
});

export const getWeatherRecommendationsTool = new DynamicStructuredTool({
  name: "get_weather_recommendations",
  description: "Get weather-based activity recommendations for a location.",
  schema: z.object({
    location: z.string().describe("Location to check weather and get activity recommendations"),
    activity_preference: z.enum(["outdoor", "indoor", "mixed"]).default("mixed").describe("Activity preference based on weather"),
  }),
  func: async (params: { location: string; activity_preference: string }) => {
    try {
      const client = new ActivitySearchClient();
      const weather = await client.getWeather(params.location);

      if (!weather) {
        return JSON.stringify({
          location: params.location,
          weather_available: false,
          message: "Weather information not available, showing general recommendations",
          recommendations: [
            "Check local weather before outdoor activities",
            "Have indoor backup plans ready",
            "Consider seasonal attractions",
          ]
        }, null, 2);
      }

      const weatherCondition = weather.weather[0]?.main.toLowerCase() || "";
      const temp = Math.round(weather.main.temp);
      const description = weather.weather[0]?.description || "";

      // Get weather suitability assessment
      const outdoorSuitability = client.isWeatherSuitable(weather, "outdoor");

      const recommendations = {
        location: params.location,
        current_weather: {
          condition: description,
          temperature: `${temp}°C`,
          feels_like: `${Math.round(weather.main.feels_like)}°C`,
          humidity: `${weather.main.humidity}%`,
          wind_speed: `${weather.wind.speed} m/s`,
        },
        outdoor_activities: {
          recommended: outdoorSuitability.suitable,
          reason: outdoorSuitability.reason,
          alternatives: outdoorSuitability.alternatives,
        },
        activity_suggestions: [] as string[],
      };

      // Weather-based activity suggestions
      if (weatherCondition.includes("rain")) {
        recommendations.activity_suggestions = [
          "Visit museums and galleries",
          "Indoor shopping centers",
          "Restaurants and cafes",
          "Theaters and cinemas",
          "Indoor entertainment venues",
        ];
      } else if (weatherCondition.includes("snow")) {
        recommendations.activity_suggestions = [
          "Winter sports activities",
          "Indoor cultural sites", 
          "Cozy restaurants and cafes",
          "Museums with heating",
          "Indoor markets",
        ];
      } else if (temp > 30) {
        recommendations.activity_suggestions = [
          "Air-conditioned museums",
          "Indoor attractions",
          "Water activities",
          "Early morning or evening outdoor activities",
          "Shaded parks and gardens",
        ];
      } else if (temp < 5) {
        recommendations.activity_suggestions = [
          "Indoor attractions",
          "Museums and galleries",
          "Shopping centers",
          "Restaurants and warm cafes",
          "Brief outdoor sightseeing with warm clothing",
        ];
      } else {
        recommendations.activity_suggestions = [
          "Outdoor sightseeing",
          "Walking tours",
          "Parks and gardens",
          "Outdoor markets",
          "Street food experiences",
          "Museum visits",
        ];
      }

      return JSON.stringify(recommendations, null, 2);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Weather recommendations failed: ${errorMessage}`);
    }
  },
});

export const ACTIVITY_TOOLS = [
  searchActivitiesTool,
  searchAttractionsTool,
  searchToursTool,
  searchRestaurantsTool,
  filterActivitiesByPriceTool,
  filterActivitiesByRatingTool,
  filterActivitiesByCategoryTool,
  getActivityDetailsTool,
  getWeatherRecommendationsTool,
];