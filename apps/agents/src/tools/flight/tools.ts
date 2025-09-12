import { DynamicStructuredTool } from "@langchain/core/tools";
import { DuffelClient } from "./client.js";
import {
  OneWayFlightSchema,
  RoundTripFlightSchema,
  MultiCityFlightSchema,
  OfferDetailsSchema,
  type OneWayFlight,
  type RoundTripFlight,
  type MultiCityFlight,
  type OfferDetails,
  type DuffelSlice,
  type DuffelSearchResponse,
  type DuffelOfferDetails,
  type DuffelSliceDetails,
  type DuffelConnection,
} from "./types.js";

function createSlice(
  origin: string,
  destination: string,
  date: string,
  departureTimeFrom?: string,
  departureTimeTo?: string
): DuffelSlice {
  return {
    origin,
    destination,
    departure_date: date,
    departure_time: {
      from: departureTimeFrom || "00:00",
      to: departureTimeTo || "23:59",
    },
    arrival_time: {
      from: "00:00",
      to: "23:59",
    },
  };
}

function formatOfferResponse(response: any): DuffelSearchResponse {
  const formattedResponse: DuffelSearchResponse = {
    request_id: response.id,
    offers: [],
  };

  const offers = response.offers || [];
  for (const offer of offers.slice(0, 50)) {
    const offerDetails: DuffelOfferDetails = {
      offer_id: offer.id,
      price: {
        amount: offer.total_amount,
        currency: offer.total_currency,
      },
      slices: [],
    };

    for (const slice of offer.slices || []) {
      const segments = slice.segments || [];
      if (segments.length > 0) {
        const sliceDetails: DuffelSliceDetails = {
          origin: slice.origin.iata_code,
          destination: slice.destination.iata_code,
          departure: segments[0].departing_at,
          arrival: segments[segments.length - 1].arriving_at,
          duration: slice.duration,
          carrier: segments[0].marketing_carrier?.name || "Unknown",
          stops: segments.length - 1,
          stops_description:
            segments.length === 1
              ? "Non-stop"
              : `${segments.length - 1} stop${segments.length - 1 > 1 ? "s" : ""}`,
          connections: [],
        };

        if (segments.length > 1) {
          for (let i = 0; i < segments.length - 1; i++) {
            const connection: DuffelConnection = {
              airport: segments[i].destination.iata_code,
              arrival: segments[i].arriving_at,
              departure: segments[i + 1].departing_at,
              duration: segments[i + 1].duration,
            };
            sliceDetails.connections.push(connection);
          }
        }

        offerDetails.slices.push(sliceDetails);
      }
    }

    formattedResponse.offers.push(offerDetails);
  }

  return formattedResponse;
}

export const searchOneWayFlightsTool = new DynamicStructuredTool({
  name: "search_one_way_flights",
  description: "Search for one-way flights between two airports.",
  schema: OneWayFlightSchema,
  func: async (params: OneWayFlight) => {
    try {
      const client = new DuffelClient();
      const slices: DuffelSlice[] = [
        createSlice(
          params.origin,
          params.destination,
          params.departure_date,
          params.departure_time_from,
          params.departure_time_to
        ),
      ];

      const response = await client.createOfferRequest({
        slices,
        cabin_class: params.cabin_class,
        adult_count: params.adults,
        max_connections: params.max_connections,
        return_offers: true,
        supplier_timeout: 15000,
      });

      const formatted = formatOfferResponse(response);
      return JSON.stringify(formatted, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`One-way flight search failed: ${errorMessage}`);
    }
  },
});

export const searchRoundTripFlightsTool = new DynamicStructuredTool({
  name: "search_round_trip_flights",
  description: "Search for round-trip flights between two airports.",
  schema: RoundTripFlightSchema,
  func: async (params: RoundTripFlight) => {
    try {
      const client = new DuffelClient();
      const slices: DuffelSlice[] = [
        createSlice(
          params.origin,
          params.destination,
          params.departure_date,
          params.departure_time_from,
          params.departure_time_to
        ),
        createSlice(
          params.destination,
          params.origin,
          params.return_date,
          params.departure_time_from,
          params.departure_time_to
        ),
      ];

      const response = await client.createOfferRequest({
        slices,
        cabin_class: params.cabin_class,
        adult_count: params.adults,
        max_connections: params.max_connections,
        return_offers: true,
        supplier_timeout: 15000,
      });

      const formatted = formatOfferResponse(response);
      return JSON.stringify(formatted, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Round-trip flight search failed: ${errorMessage}`);
    }
  },
});

export const getOfferDetailsTool = new DynamicStructuredTool({
  name: "get_offer_details",
  description: "Get detailed information about a specific flight offer.",
  schema: OfferDetailsSchema,
  func: async (params: OfferDetails) => {
    try {
      const client = new DuffelClient();
      const response = await client.getOffer(params.offer_id);
      return JSON.stringify(response, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to get offer details: ${errorMessage}`);
    }
  },
});

export const searchMultiCityFlightsTool = new DynamicStructuredTool({
  name: "search_multi_city_flights",
  description: "Search for multi-city flights with 2-3 segments.",
  schema: MultiCityFlightSchema,
  func: async (params: MultiCityFlight) => {
    try {
      const client = new DuffelClient();
      const slices: DuffelSlice[] = [
        createSlice(params.segment1_origin, params.segment1_destination, params.segment1_date),
        createSlice(params.segment2_origin, params.segment2_destination, params.segment2_date),
      ];

      if (params.segment3_origin && params.segment3_destination && params.segment3_date) {
        slices.push(
          createSlice(params.segment3_origin, params.segment3_destination, params.segment3_date)
        );
      }

      const response = await client.createOfferRequest({
        slices,
        cabin_class: params.cabin_class,
        adult_count: params.adults,
        max_connections: params.max_connections,
        return_offers: true,
        supplier_timeout: 30000,
      });

      const formatted = formatOfferResponse(response);
      return JSON.stringify(formatted, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Multi-city flight search failed: ${errorMessage}`);
    }
  },
});

export const FLIGHT_TOOLS = [
  searchOneWayFlightsTool,
  searchRoundTripFlightsTool,
  searchMultiCityFlightsTool,
  getOfferDetailsTool,
];