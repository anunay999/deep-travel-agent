import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import {
  StartItinerarySchema,
  PreferencesSchema,
  AddActivitySchema,
  SetAccommodationSchema,
  UpdatePreferencesSchema,
  SummarizeBudgetSchema,
  FinalizeItinerarySchema,
  type StartItinerary,
} from "./types.js";

// In-memory store plus file persistence for resilience across calls
const ITINERARY_STORE = new Map<string, any>();
const itineraryDir = path.join(process.cwd(), "itinerary");
if (!fs.existsSync(itineraryDir)) {
  fs.mkdirSync(itineraryDir, { recursive: true });
}

function itineraryFile(sessionId: string): string {
  return path.join(itineraryDir, `${sessionId}.json`);
}

function loadItinerary(sessionId: string): any | null {
  if (ITINERARY_STORE.has(sessionId)) return ITINERARY_STORE.get(sessionId);
  const file = itineraryFile(sessionId);
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    ITINERARY_STORE.set(sessionId, data);
    return data;
  }
  return null;
}

function saveItinerary(sessionId: string, data: any) {
  data.updated_at = new Date().toISOString();
  ITINERARY_STORE.set(sessionId, data);
  fs.writeFileSync(itineraryFile(sessionId), JSON.stringify(data, null, 2));
}

function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const startDate = new Date(start + "T00:00:00Z");
  const endDate = new Date(end + "T00:00:00Z");
  for (
    let d = new Date(startDate.getTime());
    d.getTime() <= endDate.getTime();
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export const startItineraryTool = new DynamicStructuredTool({
  name: "start_itinerary",
  description: "Start or reset an itinerary session with dates, destinations, and traveler info.",
  schema: StartItinerarySchema,
  func: async (params: StartItinerary) => {
    const { session_id, origin, destinations, start_date, end_date, num_travelers, currency } = params;

    const days = enumerateDates(start_date, end_date).map((date) => ({
      date,
      morning: [],
      afternoon: [],
      evening: [],
    }));

    const itinerary = {
      id: session_id,
      origin,
      destinations,
      start_date,
      end_date,
      num_travelers,
      currency,
      preferences: {},
      days,
      totals: undefined,
      updated_at: new Date().toISOString(),
    };
    saveItinerary(session_id, itinerary);
    return JSON.stringify({ status: "ok", itinerary_id: session_id, days: days.length }, null, 2);
  },
});

export const updatePreferencesTool = new DynamicStructuredTool({
  name: "update_preferences",
  description: "Update user preferences for the current itinerary session.",
  schema: UpdatePreferencesSchema,
  func: async (params: { session_id: string; preferences: any }) => {
    const existing = loadItinerary(params.session_id);
    if (!existing) throw new Error(`Itinerary not found: ${params.session_id}`);
    // Validate and normalize preferences using the shared schema
    const validated = PreferencesSchema.parse(params.preferences || {});
    existing.preferences = { ...(existing.preferences || {}), ...validated };
    saveItinerary(params.session_id, existing);
    return JSON.stringify({ status: "ok", itinerary_id: params.session_id, preferences: existing.preferences }, null, 2);
  },
});

export const addActivityTool = new DynamicStructuredTool({
  name: "add_activity",
  description: "Add an activity to a specific day and period (morning/afternoon/evening).",
  schema: AddActivitySchema,
  func: async (params: { session_id: string; date: string; period: "morning" | "afternoon" | "evening"; activity: any }) => {
    const existing = loadItinerary(params.session_id);
    if (!existing) throw new Error(`Itinerary not found: ${params.session_id}`);
    const day = existing.days.find((d: any) => d.date === params.date);
    if (!day) throw new Error(`Date not in itinerary: ${params.date}`);
    day[params.period].push(params.activity);
    saveItinerary(params.session_id, existing);
    return JSON.stringify({ status: "ok", itinerary_id: params.session_id, date: params.date, period: params.period, count: day[params.period].length }, null, 2);
  },
});

export const setAccommodationTool = new DynamicStructuredTool({
  name: "set_accommodation",
  description: "Set accommodation (hotel) for a specific date.",
  schema: SetAccommodationSchema,
  func: async (params: { session_id: string; date: string; hotel_name: string; price_per_night?: { amount: number; currency: string } }) => {
    const existing = loadItinerary(params.session_id);
    if (!existing) throw new Error(`Itinerary not found: ${params.session_id}`);
    const day = existing.days.find((d: any) => d.date === params.date);
    if (!day) throw new Error(`Date not in itinerary: ${params.date}`);
    day.accommodation = { hotel_name: params.hotel_name, price_per_night: params.price_per_night };
    saveItinerary(params.session_id, existing);
    return JSON.stringify({ status: "ok", itinerary_id: params.session_id, date: params.date, accommodation: day.accommodation }, null, 2);
  },
});

export const getItineraryTool = new DynamicStructuredTool({
  name: "get_itinerary",
  description: "Get the current itinerary document for a session.",
  schema: z.object({ session_id: z.string().describe("Itinerary session id") }),
  func: async ({ session_id }: { session_id: string }) => {
    const existing = loadItinerary(session_id);
    if (!existing) throw new Error(`Itinerary not found: ${session_id}`);
    return JSON.stringify(existing, null, 2);
  },
});

export const summarizeBudgetTool = new DynamicStructuredTool({
  name: "summarize_budget",
  description: "Compute totals for flights, accommodation, and activities, with optional overrides.",
  schema: SummarizeBudgetSchema,
  func: async ({ session_id, overrides }: { session_id: string; overrides?: { flights_total?: number; activities_total?: number; accommodation_total?: number } }) => {
    const existing = loadItinerary(session_id);
    if (!existing) throw new Error(`Itinerary not found: ${session_id}`);

    let activitiesTotal = 0;
    for (const day of existing.days) {
      for (const period of ["morning", "afternoon", "evening"]) {
        for (const act of day[period]) {
          if (act.price?.amount) activitiesTotal += act.price.amount;
        }
      }
    }

    let accommodationTotal = 0;
    for (const day of existing.days.slice(0, Math.max(existing.days.length - 1, 0))) {
      if (day.accommodation?.price_per_night?.amount) {
        accommodationTotal += day.accommodation.price_per_night.amount;
      }
    }

    const totals = {
      flights_total: overrides?.flights_total ?? existing.totals?.flights_total ?? 0,
      accommodation_total: overrides?.accommodation_total ?? accommodationTotal,
      activities_total: overrides?.activities_total ?? activitiesTotal,
    };
    const grand_total = (totals.flights_total || 0) + (totals.accommodation_total || 0) + (totals.activities_total || 0);
    const per_person = existing.num_travelers > 0 ? grand_total / existing.num_travelers : grand_total;
    existing.totals = { ...totals, grand_total, per_person };
    saveItinerary(session_id, existing);
    return JSON.stringify({ status: "ok", itinerary_id: session_id, totals: existing.totals }, null, 2);
  },
});

export const finalizeItineraryTool = new DynamicStructuredTool({
  name: "finalize_itinerary",
  description: "Mark itinerary as finalized and return a confirmation id.",
  schema: FinalizeItinerarySchema,
  func: async ({ session_id }: { session_id: string }) => {
    const existing = loadItinerary(session_id);
    if (!existing) throw new Error(`Itinerary not found: ${session_id}`);
    const confirmation = `${session_id}-${Date.now()}`;
    const result = { status: "finalized", itinerary_id: session_id, confirmation };
    return JSON.stringify(result, null, 2);
  },
});

export const removeActivitiesTool = new DynamicStructuredTool({
  name: "remove_activities",
  description: "Remove activities from the itinerary by date, period, and/or title substring. If no filters provided for a date, removes all activities on that date.",
  schema: z.object({
    session_id: z.string().describe("Itinerary session id"),
    date: z.string().optional().describe("YYYY-MM-DD to target a specific day. If omitted, applies across all days."),
    period: z.enum(["morning", "afternoon", "evening", "all"]).optional().describe("Period to target. Defaults to all periods."),
    title_contains: z.string().optional().describe("Case-insensitive substring to match activity titles for removal."),
  }),
  func: async (params: { session_id: string; date?: string; period?: "morning" | "afternoon" | "evening" | "all"; title_contains?: string }) => {
    const existing = loadItinerary(params.session_id);
    if (!existing) throw new Error(`Itinerary not found: ${params.session_id}`);

    const matchTitle = (title: string | undefined): boolean => {
      if (!params.title_contains) return true;
      return (title || "").toLowerCase().includes(params.title_contains.toLowerCase());
    };

    const targetDays = existing.days.filter((d: any) => !params.date || d.date === params.date);
    if (targetDays.length === 0) {
      throw new Error(params.date ? `Date not in itinerary: ${params.date}` : "No days to modify");
    }

    const periods: Array<"morning" | "afternoon" | "evening"> =
      !params.period || params.period === "all" ? ["morning", "afternoon", "evening"] : [params.period];

    let removed = 0;
    let remaining = 0;

    for (const day of targetDays) {
      for (const p of periods) {
        const before = day[p].length;
        day[p] = day[p].filter((act: any) => !matchTitle(act?.title));
        const after = day[p].length;
        removed += before - after;
        remaining += after;
      }
    }

    saveItinerary(params.session_id, existing);
    return JSON.stringify({
      status: "ok",
      itinerary_id: params.session_id,
      date: params.date,
      period: params.period || "all",
      title_filter: params.title_contains || null,
      removed,
      remaining,
    }, null, 2);
  },
});

export const ITINERARY_TOOLS = [
  startItineraryTool,
  updatePreferencesTool,
  addActivityTool,
  setAccommodationTool,
  getItineraryTool,
  summarizeBudgetTool,
  finalizeItineraryTool,
  removeActivitiesTool,
];


