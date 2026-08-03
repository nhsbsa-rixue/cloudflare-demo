/**
 * Shared frontend types.
 */

/** Metadata for a single uploaded file, as returned by the backend worker. */
export interface UploadResult {
  key: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

/** Response envelope returned by the worker upload endpoint. */
export interface WorkerUploadResponse {
  upload: UploadResult;
}

/** App roles persisted in the users table. */
export type AppUserRole = 'admin' | 'user' | 'operator' | 'editor' | 'guest';

/** Authenticated app user object returned by worker auth endpoint. */
export interface AuthenticatedUser {
  id: string | null;
  email: string;
  name: string;
  role: AppUserRole;
}

/** Response envelope returned by the worker `GET /api/auth/me` endpoint. */
export interface WorkerAuthMeResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/** Case classification. */
export type CaseType = 'cnc' | '3d' | 'other';

/** Lifecycle status persisted for a case in the database. */
export type CaseStatus = 'draft' | 'active' | 'completed' | 'archived';

/** A case row enriched with its owner's email/name, for the dashboard list. */
export interface DashboardCase {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  imageUrl: string;
  type: CaseType;
  status: CaseStatus;
  /** ISO timestamp (Date serialized over JSON). */
  createdAt: string;
  updatedAt: string;
}

/** Response envelope returned by the worker `GET /api/cases` endpoint. */
export interface WorkerCasesResponse {
  cases: DashboardCase[];
  total: number;
  page: number;
  pageSize: number;
  actorRole: AppUserRole;
}

/** Measurement unit a CNC design is dimensioned in. */
export type DesignUnit = 'mm' | 'inch' | 'cm';

/** Lifecycle status of an uploaded design case. */
export type DesignStatus = 'draft' | 'in-review' | 'quoted' | 'completed';

/** A single read-only attribute value, optionally flagged as the selected choice. */
export interface AttributeOption {
  label: string;
  /** When true, this value is the one chosen for the design. */
  selected: boolean;
}

/**
 * Read-only summary of the CNC manufacturing attributes captured for an
 * uploaded design. This is example/mock data for now — the backend does not
 * persist these fields yet.
 */
export interface DesignDetail {
  id: string;
  status: DesignStatus;
  quantity: number;
  unit: DesignUnit;
  unitOptions: DesignUnit[];
  material: string;
  materialOptions: string[];
  /** e.g. the specific aluminium grade, when the material has sub-types. */
  materialSubType?: string;
  materialSubTypeOptions?: string[];
  color?: string;
  surfaceFinish?: string;
  tolerance?: string;
  threads?: string;
  remarks?: string;
}

/** File metadata paired with its CNC design attributes for the detail page. */
export interface DesignDetailView {
  file: UploadResult;
  detail: DesignDetail;
}

/** Human-readable labels for each app role, shared by nav and dashboard. */
export const roleLabels: Record<AppUserRole, string> = {
  admin: 'Admin',
  user: 'User',
  operator: 'Operator',
  editor: 'Editor',
  guest: 'Guest'
};
