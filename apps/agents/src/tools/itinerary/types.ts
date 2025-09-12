import { z } from "zod";

// Core schemas for itinerary state management

export const StartItinerarySchema = z.object({
  session_id: z.string().describe("Unique session or itinerary id"),
  origin: z.string().describe("Origin city or airport"),
  destinations: z.array(z.string()).min(1).describe("Destination city/cities"),
  start_date: z.string().describe("Trip start date YYYY-MM-DD"),
  end_date: z.string().describe("Trip end date YYYY-MM-DD"),
  num_travelers: z.number().default(1).describe("Number of travelers"),
  currency: z.string().default("USD").describe("Currency code (e.g. USD, INR)"),
});

export const PreferencesSchema = z.object({
  vegetarian: z.boolean().optional().describe("Whether travelers prefer vegetarian options"),
  accessibility: z.boolean().optional().describe("Require accessibility-friendly options"),
  travel_style: z.enum(["budget", "standard", "luxury", "family"]).optional().describe("Overall travel style"),
  max_hotel_budget: z.number().optional().describe("Max hotel budget per night"),
  notes: z.string().optional().describe("Freeform preference notes")
});

export const ActivityItemSchema = z.object({
  title: z.string(),
  time: z.string().describe("Start time or time window, e.g. '09:00' or '09:00-11:00'"),
  price: z.object({ amount: z.number(), currency: z.string() }).optional(),
  details: z.string().optional(),
});

export const AddActivitySchema = z.object({
  session_id: z.string(),
  date: z.string().describe("YYYY-MM-DD for the day to update"),
  period: z.enum(["morning", "afternoon", "evening"]).describe("Which part of the day"),
  activity: ActivityItemSchema,
});

export const SetAccommodationSchema = z.object({
  session_id: z.string(),
  date: z.string().describe("YYYY-MM-DD"),
  hotel_name: z.string(),
  price_per_night: z.object({ amount: z.number(), currency: z.string() }).optional(),
});

export const UpdatePreferencesSchema = z.object({
  session_id: z.string(),
  preferences: PreferencesSchema,
});

export const SummarizeBudgetSchema = z.object({
  session_id: z.string(),
  overrides: z.object({
    flights_total: z.number().optional(),
    activities_total: z.number().optional(),
    accommodation_total: z.number().optional(),
  }).optional(),
});

export const FinalizeItinerarySchema = z.object({
  session_id: z.string(),
});

export type StartItinerary = z.infer<typeof StartItinerarySchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type ActivityItemInput = z.infer<typeof ActivityItemSchema>;
export type AddActivity = z.infer<typeof AddActivitySchema>;
export type SetAccommodation = z.infer<typeof SetAccommodationSchema>;
export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;
export type SummarizeBudget = z.infer<typeof SummarizeBudgetSchema>;
export type FinalizeItinerary = z.infer<typeof FinalizeItinerarySchema>;

// Internal persistent structure
export interface ItineraryDay {
  date: string;
  morning: Activity[];
  afternoon: Activity[];
  evening: Activity[];
  accommodation?: {
    hotel_name: string;
    price_per_night?: { amount: number; currency: string };
  };
}

export interface Activity {
  title: string;
  time: string;
  price?: { amount: number; currency: string };
  details?: string;
}

export interface ItineraryState {
  id: string;
  origin: string;
  destinations: string[];
  start_date: string;
  end_date: string;
  num_travelers: number;
  currency: string;
  preferences: Preferences;
  days: ItineraryDay[];
  totals?: {
    flights_total?: number;
    accommodation_total?: number;
    activities_total?: number;
    grand_total?: number;
    per_person?: number;
  };
  updated_at: string;
}


