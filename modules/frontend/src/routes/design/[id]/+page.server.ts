import type { PageServerLoad } from './$types';
import type { DesignDetail, DesignUnit, UploadResult } from '$lib/types';

const UNIT_OPTIONS: DesignUnit[] = ['mm', 'inch', 'cm'];

const MATERIAL_OPTIONS = [
  'Aluminum',
  'Stainless steel',
  'Brass',
  'Copper',
  'Titanium',
  'Mild steel',
  'Alloy steel',
  'Tool steel',
  'Spring steel',
  'ABS',
  'Polycarbonate (PC)',
  'Nylon',
  'Polypropylene (PP)',
  'POM',
  'PTFE (Teflon)',
  'PMMA (Acrylic)',
  'Polyethylene (PE)',
  'PEEK',
  'Bakelite',
  'FR4',
  'Rubber'
];

const ALUMINUM_GRADES = ['Aluminum 6061', 'Aluminum 7075', 'Aluminum 5052', 'Aluminum 2A12'];

/** Example CNC attributes — placeholder data until the backend persists these. */
function exampleDetail(id: string): DesignDetail {
  return {
    id,
    status: 'in-review',
    quantity: 25,
    unit: 'mm',
    unitOptions: UNIT_OPTIONS,
    material: 'Aluminum',
    materialOptions: MATERIAL_OPTIONS,
    materialSubType: 'Aluminum 6061',
    materialSubTypeOptions: ALUMINUM_GRADES,
    color: 'Silver white',
    surfaceFinish: 'Anodizing (matte)',
    tolerance: '±0.05 mm',
    threads: 'As per drawing',
    remarks: 'Deburr all edges. Keep marked datum faces free of finishing.'
  };
}

/** Fallback file metadata used when the page is opened directly (no upload). */
function exampleFile(id: string): UploadResult {
  return {
    key: `uploads/sample/${id}.pdf`,
    filename: `${id}.pdf`,
    contentType: 'application/pdf',
    size: 128_450,
    uploadedAt: new Date().toISOString()
  };
}

export const load: PageServerLoad = ({ params, url }) => {
  const { id } = params;
  const q = url.searchParams;

  const sizeParam = Number.parseInt(q.get('size') ?? '', 10);

  const file: UploadResult = q.has('filename')
    ? {
        key: q.get('key') ?? `uploads/${id}`,
        filename: q.get('filename') ?? `${id}`,
        contentType: q.get('contentType') ?? 'application/octet-stream',
        size: Number.isFinite(sizeParam) ? sizeParam : 0,
        uploadedAt: q.get('uploadedAt') ?? new Date().toISOString()
      }
    : exampleFile(id);

  return {
    file,
    detail: exampleDetail(id)
  };
};
