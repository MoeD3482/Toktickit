const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

// Issue 2 + Issue 4 — call the backend.
// Steps: fetch `${API_URL}/api/health`; if not ok, throw.
//        then fetch `${API_URL}/api/categories`; if not ok, throw.
//        return { online: true, categories }.
// Throwing on failure lets the UI show a single Offline/error state.
export async function checkSystem(): Promise<SystemStatus> {
  // Step 1: Check backend health
  const healthResponse = await fetch(`${API_URL}/api/health`);

  if (!healthResponse.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  // Step 2: Get categories from the backend
  const categoriesResponse = await fetch(`${API_URL}/api/categories`);

  if (!categoriesResponse.ok) {
    throw new Error("Unable to load request categories");
  }

  // Step 3: Convert JSON response into Category[]
  const categories: Category[] = await categoriesResponse.json();

  // Step 4: Return system status and categories
  return {
    online: true,
    categories,
  };
}

export interface DevelopmentRequester {
  id: string;
  displayName: string;
  email: string;
}

interface DevelopmentRequesterResponse {
  data: DevelopmentRequester[];
}

export async function getDevelopmentRequesters(): Promise<
  DevelopmentRequester[]
> {
  const response = await fetch(
    `${API_URL}/api/v1/development-requesters`
  );

  if (!response.ok) {
    throw new Error("Unable to load Development Requesters");
  }

  const result: DevelopmentRequesterResponse = await response.json();

  return result.data;
}

export interface RelatedSystem {
  id: string;
  name: string;
}

interface CategoryListResponse {
  data: Category[];
}

interface RelatedSystemListResponse {
  data: RelatedSystem[];
}

export type RequestedPriority = "Low" | "Medium" | "High" | "Urgent";

export interface CreateTicketInput {
  categoryId: number;
  relatedSystemId: string;
  summary: string;
  description: string;
  requestedPriority: RequestedPriority;
  clientRequestId: string;
}

export interface CreatedTicket {
  id: string;
  ticketNo: string;
  requester: {
    id: string;
    displayName: string;
  };
  category: {
    id: number;
    name: string;
  };
  relatedSystem: {
    id: string;
    name: string;
  };
  summary: string;
  description: string;
  requestedPriority: RequestedPriority;
  status: "New";
  createdAt: string;
  updatedAt: string;
}

interface CreatedTicketResponse {
  data: CreatedTicket;
}

export async function getActiveCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/api/v1/categories`);

  if (!response.ok) {
    throw new Error("Unable to load request categories");
  }

  const result: CategoryListResponse = await response.json();

  return result.data;
}

export async function getRelatedSystems(): Promise<RelatedSystem[]> {
  const response = await fetch(`${API_URL}/api/v1/related-systems`);

  if (!response.ok) {
    throw new Error("Unable to load Related Systems");
  }

  const result: RelatedSystemListResponse = await response.json();

  return result.data;
}

export async function createTicket(
  requesterId: string,
  input: CreateTicketInput
): Promise<CreatedTicket> {
  const response = await fetch(`${API_URL}/api/v1/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Development-Requester-Id": requesterId,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Unable to create Ticket");
  }

  const result: CreatedTicketResponse = await response.json();

  return result.data;
}