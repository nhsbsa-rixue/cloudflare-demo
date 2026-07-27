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
