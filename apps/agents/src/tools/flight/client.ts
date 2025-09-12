import axios, { AxiosInstance, AxiosResponse } from "axios";
import { DuffelOfferRequest, DuffelSlice } from "./types.js";

export class DuffelClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DUFFEL_API_KEY || "";
    
    if (!this.apiKey) {
      throw new Error("Duffel API key is required. Set DUFFEL_API_KEY environment variable.");
    }

    this.client = axios.create({
      baseURL: "https://api.duffel.com",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        "Duffel-Version": "v2",
      },
      timeout: 30000,
    });
  }

  async createOfferRequest(options: {
    slices: DuffelSlice[];
    cabin_class: string;
    adult_count: number;
    max_connections?: number;
    return_offers: boolean;
    supplier_timeout: number;
  }): Promise<any> {
    try {
      const passengers = Array(options.adult_count).fill({ type: "adult" });

      const requestData: DuffelOfferRequest = {
        slices: options.slices,
        cabin_class: options.cabin_class,
        passengers,
        return_offers: options.return_offers,
        supplier_timeout: options.supplier_timeout,
      };

      if (options.max_connections !== undefined) {
        requestData.max_connections = options.max_connections;
      }

      const response: AxiosResponse = await this.client.post("/air/offer_requests", {
        data: requestData,
      });

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.errors?.[0]?.message || error.message;
        const statusCode = error.response?.status;
        throw new Error(`Duffel API error (${statusCode}): ${errorMessage}. Full response: ${JSON.stringify(errorData)}`);
      }
      throw error;
    }
  }

  async getOffer(offer_id: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.get(`/air/offers/${offer_id}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.errors?.[0]?.message || error.message;
        const statusCode = error.response?.status;
        throw new Error(`Duffel API error (${statusCode}): ${errorMessage}. Full response: ${JSON.stringify(errorData)}`);
      }
      throw error;
    }
  }

  async getOfferRequest(request_id: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.get(`/air/offer_requests/${request_id}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.errors?.[0]?.message || error.message;
        const statusCode = error.response?.status;
        throw new Error(`Duffel API error (${statusCode}): ${errorMessage}. Full response: ${JSON.stringify(errorData)}`);
      }
      throw error;
    }
  }

  async listOffers(request_id: string, options?: {
    limit?: number;
    sort?: string;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append("offer_request_id", request_id);
      
      if (options?.limit) {
        params.append("limit", options.limit.toString());
      }
      
      if (options?.sort) {
        params.append("sort", options.sort);
      }

      const response: AxiosResponse = await this.client.get(`/air/offers?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.errors?.[0]?.message || error.message;
        const statusCode = error.response?.status;
        throw new Error(`Duffel API error (${statusCode}): ${errorMessage}. Full response: ${JSON.stringify(errorData)}`);
      }
      throw error;
    }
  }
}