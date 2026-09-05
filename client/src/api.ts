const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthResponse = await fetch(
    `${API_URL}/api/health`
  );

  if (!healthResponse.ok) {
    throw new Error(
      "Unable to connect to TokTickIT API"
    );
  }

  const categoriesResponse = await fetch(
    `${API_URL}/api/categories`
  );

  if (!categoriesResponse.ok) {
    throw new Error(
      "Unable to load request categories"
    );
  }

  const categories: Category[] =
    await categoriesResponse.json();

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
    throw new Error(
      "Unable to load Development Requesters"
    );
  }

  const result: DevelopmentRequesterResponse =
    await response.json();

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

export type RequestedPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Urgent";

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

export async function getActiveCategories(): Promise<
  Category[]
> {
  const response = await fetch(
    `${API_URL}/api/v1/categories`
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load request categories"
    );
  }

  const result: CategoryListResponse =
    await response.json();

  return result.data;
}

export async function getRelatedSystems(): Promise<
  RelatedSystem[]
> {
  const response = await fetch(
    `${API_URL}/api/v1/related-systems`
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load Related Systems"
    );
  }

  const result: RelatedSystemListResponse =
    await response.json();

  return result.data;
}

export async function createTicket(
  requesterId: string,
  input: CreateTicketInput
): Promise<CreatedTicket> {
  const response = await fetch(
    `${API_URL}/api/v1/tickets`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Development-Requester-Id":
          requesterId,
      },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to create Ticket"
    );
  }

  const result: CreatedTicketResponse =
    await response.json();

  return result.data;
}

export interface TicketListItem {
  id: string;
  ticketNo: string;
  summary: string;

  category: {
    id: number;
    name: string;
  };

  relatedSystem: {
    id: string;
    name: string;
  };

  requestedPriority: RequestedPriority;
  status: "New";
  createdAt: string;
  updatedAt: string;
}

export interface TicketListMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface MyTicketsQuery {
  search?: string;
  categoryId?: number;
  relatedSystemId?: string;
  requestedPriority?: RequestedPriority;
  status?: "New";
  sort?: "ticketNo" | "createdAt" | "updatedAt";
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

interface MyTicketsResponse {
  data: TicketListItem[];
  meta: TicketListMeta;
}

export async function getMyTickets(
  requesterId: string,
  query: MyTicketsQuery = {}
): Promise<MyTicketsResponse> {
  const params = new URLSearchParams();

  if (query.search) {
    params.set(
      "search",
      query.search
    );
  }

  if (query.categoryId !== undefined) {
    params.set(
      "categoryId",
      String(query.categoryId)
    );
  }

  if (query.relatedSystemId) {
    params.set(
      "relatedSystemId",
      query.relatedSystemId
    );
  }

  if (query.requestedPriority) {
    params.set(
      "requestedPriority",
      query.requestedPriority
    );
  }

  if (query.status) {
    params.set(
      "status",
      query.status
    );
  }

  if (query.sort) {
    params.set(
      "sort",
      query.sort
    );
  }

  if (query.order) {
    params.set(
      "order",
      query.order
    );
  }

  if (query.page !== undefined) {
    params.set(
      "page",
      String(query.page)
    );
  }

  if (query.pageSize !== undefined) {
    params.set(
      "pageSize",
      String(query.pageSize)
    );
  }

  const queryString =
    params.toString();

  const response = await fetch(
    `${API_URL}/api/v1/tickets${
      queryString
        ? `?${queryString}`
        : ""
    }`,
    {
      headers: {
        "X-Development-Requester-Id":
          requesterId,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load your Tickets"
    );
  }

  const result: MyTicketsResponse =
    await response.json();

  return result;
}

export interface TicketDetail {
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

interface TicketDetailResponse {
  data: TicketDetail;
}

export async function getTicketDetail(
  requesterId: string,
  ticketId: string
): Promise<TicketDetail> {
  const response = await fetch(
    `${API_URL}/api/v1/tickets/${ticketId}`,
    {
      headers: {
        "X-Development-Requester-Id":
          requesterId,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load Ticket detail"
    );
  }

  const result: TicketDetailResponse =
    await response.json();

  return result.data;
}

/* =========================================================
   Lab 2 - Attachments
   ========================================================= */

export interface TicketAttachment {
  id: string;
  ticketId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  isRemoved: boolean;
  removedAt?: string | null;
  removalReason?: string | null;
  createdAt: string;
}

interface TicketAttachmentResponse {
  data: TicketAttachment;
}

interface TicketAttachmentListResponse {
  data: TicketAttachment[];
}

export async function getTicketAttachments(
  requesterId: string,
  ticketId: string
): Promise<TicketAttachment[]> {
  const response = await fetch(
    `${API_URL}/api/v1/tickets/${ticketId}/attachments`,
    {
      headers: {
        "X-Development-Requester-Id":
          requesterId,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load Attachments"
    );
  }

  const result: TicketAttachmentListResponse =
    await response.json();

  return result.data;
}

export async function uploadTicketAttachment(
  requesterId: string,
  ticketId: string,
  file: File
): Promise<TicketAttachment> {
  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  const response = await fetch(
    `${API_URL}/api/v1/tickets/${ticketId}/attachments`,
    {
      method: "POST",
      headers: {
        "X-Development-Requester-Id":
          requesterId,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      "Attachment upload failed."
    );
  }

  const result: TicketAttachmentResponse =
    await response.json();

  return result.data;
}

export async function removeTicketAttachment(
  requesterId: string,
  ticketId: string,
  attachmentId: string,
  reason: string
): Promise<TicketAttachment> {
  const response = await fetch(
    `${API_URL}/api/v1/tickets/${ticketId}/attachments/${attachmentId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Development-Requester-Id":
          requesterId,
      },
      body: JSON.stringify({
        confirmed: true,
        reason,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to remove Attachment"
    );
  }

  const result: TicketAttachmentResponse =
    await response.json();

  return result.data;
}

export async function downloadTicketAttachment(
  requesterId: string,
  ticketId: string,
  attachmentId: string
): Promise<Blob> {
  const response = await fetch(
    `${API_URL}/api/v1/tickets/${ticketId}/attachments/${attachmentId}/download`,
    {
      headers: {
        "X-Development-Requester-Id":
          requesterId,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to download Attachment"
    );
  }

  return response.blob();
}