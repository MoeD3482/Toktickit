const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type UserRole =
  | "Requester"
  | "ITStaff"
  | "Administrator";

export type PasswordState =
  | "InitialPassword"
  | "ChangeRequired"
  | "Active";

export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  roles: UserRole[];
  isActive: boolean;
  passwordState: PasswordState;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  data: {
    user: AuthenticatedUser;
  };
}
export interface AuthenticatedUser {
  id: string;
  displayName: string;
  email: string;
  roles: UserRole[];
  isActive: boolean;
  passwordState: PasswordState;
}
export async function login(
  email: string,
  password: string
): Promise<AuthenticatedUser> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Email or password is incorrect.");
  }

  const result: AuthResponse =
    await response.json();

  return result.data.user;
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/me`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Authentication required.");
  }

  const result: AuthResponse =
    await response.json();

  return result.data.user;
}

export async function logout(): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/logout`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Unable to sign out.");
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<AuthenticatedUser> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/change-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Unable to change password.");
  }

  const result: AuthResponse =
    await response.json();

  return result.data.user;
}

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
      },
      credentials: "include",
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
      credentials: "include",
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
      credentials: "include",
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
      credentials: "include",
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
      credentials: "include",
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
      },
      credentials: "include",
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
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to download Attachment"
    );
  }

  return response.blob();
}

/* =========================================================
   Lab 3 - IT Staff ticket management
   ========================================================= */

export type ITPriority = RequestedPriority;

export type TicketStatus =
  | "New"
  | "InProgress"
  | "WaitingForRequester"
  | "Resolved"
  | "Closed"
  | "Reopened"
  | "Cancelled";

export interface StaffActor {
  id: string;
  displayName: string;
}

export interface StaffTicketComment {
  id: string;
  ticketId: string;
  body: string;
  visibility: "Public" | "Internal";
  author: StaffActor;
  createdAt: string;
  updatedAt: string;
}

export interface StaffTicketAction {
  id: string;
  ticketId: string;
  actionType: string;
  body: string;
  actor: StaffActor;
  createdAt: string;
}

export interface StaffTicketAttachment {
  id: string;
  ticketId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface StaffTicketListItem {
  id: string;
  ticketNo: string;
  summary: string;
  requester: {
    id: string;
    displayName: string;
    email: string;
  };
  category: Category;
  relatedSystem: RelatedSystem;
  requestedPriority: RequestedPriority;
  itPriority: ITPriority | null;
  status: TicketStatus;
  assignedTo: StaffActor | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffTicketDetail
  extends StaffTicketListItem {
  description: string;
  attachments: StaffTicketAttachment[];
  comments: StaffTicketComment[];
  internalNotes: StaffTicketComment[];
  actions: StaffTicketAction[];
}

export interface StaffTicketMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface StaffTicketQuery {
  search?: string;
  requester?: string;
  categoryId?: number;
  relatedSystemId?: string;
  requestedPriority?: RequestedPriority;
  itPriority?: ITPriority;
  status?: TicketStatus;
  assignedToUserId?: string;
  requesterUserId?: string;
  sort?:
    | "ticketNo"
    | "createdAt"
    | "updatedAt"
    | "requestedPriority"
    | "itPriority"
    | "status";
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface StaffAssignee extends StaffActor {}

export class ApiRequestError extends Error {
  status: number;
  fieldErrors: {
    field: string;
    message: string;
  }[];

  constructor(
    status: number,
    message: string,
    fieldErrors: {
      field: string;
      message: string;
    }[] = []
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function getApiError(
  response: Response,
  fallbackMessage: string
) {
  const result =
    await response.json().catch(() => null);

  const error = result?.error;

  return new ApiRequestError(
    response.status,
    typeof error?.message === "string"
      ? error.message
      : fallbackMessage,
    Array.isArray(error?.fieldErrors)
      ? error.fieldErrors
      : []
  );
}

async function staffRequest<T>(
  path: string,
  init: RequestInit = {},
  fallbackMessage: string
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...init,
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw await getApiError(
      response,
      fallbackMessage
    );
  }

  const result: { data: T } =
    await response.json();

  return result.data;
}

function staffQueryString(
  query: StaffTicketQuery
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(
    query
  )) {
    if (
      value !== undefined &&
      value !== ""
    ) {
      params.set(key, String(value));
    }
  }

  const value = params.toString();

  return value
    ? `?${value}`
    : "";
}

export async function getStaffTickets(
  query: StaffTicketQuery = {}
): Promise<{
  data: StaffTicketListItem[];
  meta: StaffTicketMeta;
}> {
  const response = await fetch(
    `${API_URL}/api/v1/staff/tickets${staffQueryString(
      query
    )}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw await getApiError(
      response,
      "Unable to load the staff queue."
    );
  }

  return response.json();
}

export function getStaffAssignees(): Promise<
  StaffAssignee[]
> {
  return staffRequest(
    "/api/v1/staff/assignees",
    {},
    "Unable to load staff assignees."
  );
}

export function getStaffTicketDetail(
  ticketId: string
): Promise<StaffTicketDetail> {
  return staffRequest(
    `/api/v1/staff/tickets/${ticketId}`,
    {},
    "Unable to load Ticket detail."
  );
}

export function claimStaffTicket(
  ticketId: string
): Promise<{
  id: string;
  assignedTo: StaffActor | null;
}> {
  return staffRequest(
    `/api/v1/staff/tickets/${ticketId}/claim`,
    {
      method: "POST",
    },
    "Unable to claim Ticket."
  );
}

export function updateStaffAssignment(
  ticketId: string,
  assignedToUserId: string
): Promise<{
  id: string;
  assignedTo: StaffActor | null;
}> {
  return staffRequest(
    `/api/v1/staff/tickets/${ticketId}/assignment`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignedToUserId,
      }),
    },
    "Unable to update Ticket assignment."
  );
}

export function updateStaffITPriority(
  ticketId: string,
  itPriority: ITPriority
): Promise<{
  id: string;
  itPriority: ITPriority;
}> {
  return staffRequest(
    `/api/v1/staff/tickets/${ticketId}/it-priority`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itPriority,
      }),
    },
    "Unable to update IT Priority."
  );
}

export function updateStaffStatus(
  ticketId: string,
  status: TicketStatus,
  reason: string
): Promise<{
  id: string;
  status: TicketStatus;
}> {
  return staffRequest(
    `/api/v1/staff/tickets/${ticketId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        reason,
      }),
    },
    "Unable to update Ticket status."
  );
}

export function addStaffAction(
  ticketId: string,
  body: string
): Promise<StaffTicketAction> {
  return staffRequest(
    `/api/v1/staff/tickets/${ticketId}/actions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body,
      }),
    },
    "Unable to save the action."
  );
}

export function addStaffInternalNote(
  ticketId: string,
  body: string
): Promise<StaffTicketComment> {
  return staffRequest(
    `/api/v1/staff/tickets/${ticketId}/internal-notes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body,
      }),
    },
    "Unable to save the internal note."
  );
}

export function addPublicComment(
  ticketId: string,
  body: string
): Promise<StaffTicketComment> {
  return staffRequest(
    `/api/v1/tickets/${ticketId}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body,
      }),
    },
    "Unable to save the public comment."
  );
}

/* =========================================================
   Lab 3 - IT Staff Attachments
   ========================================================= */

export async function uploadStaffTicketAttachment(
  ticketId: string,
  file: File
): Promise<StaffTicketAttachment> {
  const formData = new FormData();

  formData.append("file", file);

  return staffRequest(
    `/api/v1/staff/tickets/${ticketId}/attachments`,
    {
      method: "POST",
      body: formData,
    },
    "Unable to upload Attachment."
  );
}

export async function downloadStaffTicketAttachment(
  ticketId: string,
  attachmentId: string
): Promise<Blob> {
  const response = await fetch(
    `${API_URL}/api/v1/staff/tickets/${ticketId}/attachments/${attachmentId}/download`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw await getApiError(
      response,
      "Unable to download Attachment."
    );
  }

  return response.blob();
}
export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  roles: UserRole[];
  isActive: boolean;
  passwordState: PasswordState;
  createdAt: string;
}

export interface AdminUserMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminUsersResponse {
  data: AdminUser[];
  meta: AdminUserMeta;
}

export interface AdminUsersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export async function getAdminUsers(
  query: AdminUsersQuery = {}
): Promise<AdminUsersResponse> {
  const params = new URLSearchParams();

  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }

  if (query.pageSize !== undefined) {
    params.set("pageSize", String(query.pageSize));
  }

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.role) {
    params.set("role", query.role);
  }

  if (query.isActive !== undefined) {
    params.set("isActive", String(query.isActive));
  }

  const response = await fetch(
    `${API_URL}/api/v1/admin/users?${params.toString()}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load administrator users."
    );
  }

  return response.json();
}
export interface CreateAdminUserInput {
  displayName: string;
  email: string;
  role: UserRole;
  password: string;
}

export async function createAdminUser(
  input: CreateAdminUserInput
)
: Promise<AdminUser> {
  const response = await fetch(
    `${API_URL}/api/v1/admin/users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.error?.message ??
        "Unable to create user."
    );
  }

  const result = await response.json();

  return result.data;
}
export async function updateAdminUser(
  userId: string,
  input: {
    displayName?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
  }
): Promise<AdminUser> {
  const response = await fetch(
    `${API_URL}/api/v1/admin/users/${userId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.error?.message ??
        "Unable to update user."
    );
  }

  const result = await response.json();

  return result.data;
}
export async function setAdminUserInitialPassword(
  userId: string,
  password: string
): Promise<AdminUser> {
  const response = await fetch(
    `${API_URL}/api/v1/admin/users/${userId}/password`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        password,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.error?.message ??
        "Unable to set user password."
    );
  }

  const result = await response.json();

  return result.data;
}