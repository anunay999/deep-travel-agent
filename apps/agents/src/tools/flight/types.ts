import { z } from "zod";

// Simplified schemas for Gemini compatibility - no $ref, minimal nesting, basic validation

export const OneWayFlightSchema = z.object({
  origin: z.string().describe("IATA airport code (3 letters, e.g., 'JFK')"),
  destination: z.string().describe("IATA airport code (3 letters, e.g., 'LAX')"),
  departure_date: z.string().describe("Departure date in YYYY-MM-DD format"),
  adults: z.number().default(1).describe("Number of adult passengers (1-9)"),
  cabin_class: z.enum(["economy", "premium_economy", "business", "first"]).default("economy").describe("Cabin class preference"),
  max_connections: z.number().optional().describe("Maximum number of stops (0-3)"),
  departure_time_from: z.string().optional().describe("Earliest departure time in HH:MM format (e.g., '09:00')"),
  departure_time_to: z.string().optional().describe("Latest departure time in HH:MM format (e.g., '18:00')"),
});

export const RoundTripFlightSchema = z.object({
  origin: z.string().describe("IATA airport code (3 letters, e.g., 'JFK')"),
  destination: z.string().describe("IATA airport code (3 letters, e.g., 'LAX')"),
  departure_date: z.string().describe("Departure date in YYYY-MM-DD format"),
  return_date: z.string().describe("Return date in YYYY-MM-DD format"),
  adults: z.number().default(1).describe("Number of adult passengers (1-9)"),
  cabin_class: z.enum(["economy", "premium_economy", "business", "first"]).default("economy").describe("Cabin class preference"),
  max_connections: z.number().optional().describe("Maximum number of stops (0-3)"),
  departure_time_from: z.string().optional().describe("Earliest departure time in HH:MM format (e.g., '09:00')"),
  departure_time_to: z.string().optional().describe("Latest departure time in HH:MM format (e.g., '18:00')"),
});

export const MultiCityFlightSchema = z.object({
  segment1_origin: z.string().describe("First segment origin IATA airport code"),
  segment1_destination: z.string().describe("First segment destination IATA airport code"),
  segment1_date: z.string().describe("First segment departure date in YYYY-MM-DD format"),
  segment2_origin: z.string().describe("Second segment origin IATA airport code"),
  segment2_destination: z.string().describe("Second segment destination IATA airport code"),
  segment2_date: z.string().describe("Second segment departure date in YYYY-MM-DD format"),
  segment3_origin: z.string().optional().describe("Third segment origin IATA airport code (optional)"),
  segment3_destination: z.string().optional().describe("Third segment destination IATA airport code (optional)"),
  segment3_date: z.string().optional().describe("Third segment departure date in YYYY-MM-DD format (optional)"),
  adults: z.number().default(1).describe("Number of adult passengers (1-9)"),
  cabin_class: z.enum(["economy", "premium_economy", "business", "first"]).default("economy").describe("Cabin class preference"),
  max_connections: z.number().optional().describe("Maximum number of stops per segment (0-3)"),
});

export const OfferDetailsSchema = z.object({
  offer_id: z.string().describe("The ID of the flight offer to get details for"),
});

export type OneWayFlight = z.infer<typeof OneWayFlightSchema>;
export type RoundTripFlight = z.infer<typeof RoundTripFlightSchema>;
export type MultiCityFlight = z.infer<typeof MultiCityFlightSchema>;
export type OfferDetails = z.infer<typeof OfferDetailsSchema>;

export interface DuffelSlice {
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: {
    from: string;
    to: string;
  };
  arrival_time: {
    from: string;
    to: string;
  };
}

export interface DuffelOfferRequest {
  slices: DuffelSlice[];
  cabin_class: string;
  passengers: Array<{
    type: "adult";
  }>;
  max_connections?: number;
  return_offers: boolean;
  supplier_timeout: number;
}

export interface DuffelConnection {
  airport: string;
  arrival: string;
  departure: string;
  duration: string;
}

export interface DuffelSliceDetails {
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  carrier: string;
  stops: number;
  stops_description: string;
  connections: DuffelConnection[];
}

export interface DuffelOfferDetails {
  offer_id: string;
  price: {
    amount: string;
    currency: string;
  };
  slices: DuffelSliceDetails[];
}

export interface DuffelSearchResponse {
  request_id: string;
  offers: DuffelOfferDetails[];
}