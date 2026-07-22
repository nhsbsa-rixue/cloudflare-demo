<script lang="ts">
  import * as FileDropZone from "$lib/components/ui/file-drop-zone";
  import { Text } from "$lib/components/ui/typography/index.js";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
  import XIcon from "@lucide/svelte/icons/x";

  interface SelectionChangeDetail {
    droppedFile: File | null;
  }

  interface Props {
    allowedTypes?: string[];
    maxSizeBytes?: number;
    inputId?: string;
    inputName?: string;
    accept?: string;
    onSelectionChange?: (detail: SelectionChangeDetail) => void;
  }

  let {
    allowedTypes = ["image/png", "image/jpeg", "application/pdf"],
    maxSizeBytes = 10 * 1024 * 1024,
    inputId = "file",
    inputName = "file",
    accept = ".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf",
    onSelectionChange,
  }: Props = $props();

  let localError = $state("");
  let selectedFileName = $state("");
  let droppedFile = $state<File | null>(null);

  function emitSelectionChange(file: File | null) {
    onSelectionChange?.({ droppedFile: file });
  }

  function validateFile(file: File | null): string | null {
    if (!file) {
      return "file is required";
    }

    if (!allowedTypes.includes(file.type)) {
      return "Only PNG, JPG, JPEG, and PDF files are allowed.";
    }

    if (file.size > maxSizeBytes) {
      return "File size must be 10 MB or less.";
    }

    return null;
  }

  function setFile(file: File | null) {
    const validationError = validateFile(file);

    if (validationError) {
      localError = validationError;
      selectedFileName = "";
      droppedFile = null;
      emitSelectionChange(null);
      return;
    }

    if (!file) {
      return;
    }

    selectedFileName = file.name;
    localError = "";
    droppedFile = file;
    emitSelectionChange(file);
  }

  function clearFile() {
    selectedFileName = "";
    droppedFile = null;
    localError = "";
    emitSelectionChange(null);
  }

  function handleRemoveClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    clearFile();
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const units = ["KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = -1;

    do {
      value /= 1024;
      unitIndex++;
    } while (value >= 1024 && unitIndex < units.length - 1);

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  }

  const dropZoneStateClass = $derived(
    selectedFileName
      ? "border-emerald-400 bg-emerald-50"
      : "border-hairline bg-surface-pearl hover:border-primary-focus hover:bg-primary-focus/8 hover:shadow-[0_0_0_4px_rgba(0,113,227,0.12)]",
  );

  function mapRejectionMessage(reason: FileDropZone.FileRejectedReason): string {
    if (reason === "Maximum file size exceeded") {
      return "File size must be 10 MB or less.";
    }
    if (reason === "File type not allowed") {
      return "Only PNG, JPG, JPEG, and PDF files are allowed.";
    }
    return "Only one file can be uploaded at a time.";
  }

  async function handleUpload(files: File[]) {
    const file = files[0] ?? null;
    setFile(file);
  }

  function handleFileRejected(opts: {
    reason: FileDropZone.FileRejectedReason;
    file: File;
  }) {
    localError = mapRejectionMessage(opts.reason);
    selectedFileName = "";
    droppedFile = null;
    emitSelectionChange(null);
  }
</script>

<FileDropZone.Root
  id={inputId}
  name={inputName}
  accept={accept}
  maxFiles={1}
  maxFileSize={maxSizeBytes}
  fileCount={droppedFile ? 1 : 0}
  onUpload={handleUpload}
  onFileRejected={handleFileRejected}
>
  <FileDropZone.Trigger class="w-full">
    <div
      role="region"
      aria-label="Single file upload drop zone"
      class="group relative flex min-h-96 w-full flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed p-6 transition-all duration-300 {dropZoneStateClass}"
    >
      {#if selectedFileName}
        <button
          type="button"
          class="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-hairline bg-canvas text-ink-muted-48 transition-colors hover:border-red-400 hover:text-red-600"
          aria-label="Remove selected file"
          onclick={handleRemoveClick}
        >
          <XIcon class="size-4" />
        </button>

        <div
          class="flex size-16 place-items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-emerald-600"
        >
          <CircleCheckIcon class="size-8" />
        </div>
        <div class="flex flex-col gap-1 px-8 text-center">
          <Text class="text-base font-semibold text-ink break-all">
            {selectedFileName}
          </Text>
          <Text class="text-sm text-emerald-600">
            Ready to upload{#if droppedFile}
              &nbsp;· {formatFileSize(droppedFile.size)}
            {/if}
          </Text>
        </div>
      {:else}
        <div
          class="flex size-16 place-items-center justify-center rounded-full border border-hairline bg-canvas text-ink-muted-48 transition-all duration-300 group-hover:scale-110 group-hover:border-primary-focus group-hover:bg-primary-focus/12 group-hover:text-primary-focus"
        >
          <UploadIcon class="size-8" />
        </div>
        <div class="flex flex-col gap-2 text-center">
          <Text class="text-base font-semibold text-ink">
            Drag and drop one file here
          </Text>
          <Text class="text-sm text-ink-muted-48">
            or click to browse from your device
          </Text>
        </div>
      {/if}
    </div>
  </FileDropZone.Trigger>
</FileDropZone.Root>

{#if selectedFileName}
  <div aria-live="polite" class="sr-only">
    File selected: {selectedFileName}
  </div>
{:else}
  <div aria-live="polite" class="sr-only">No file selected yet.</div>
{/if}

<Text class="text-xs text-ink-muted-48">
  Accepted file types: PNG, JPG, JPEG, PDF. Maximum file size: 10 MB.
</Text>

{#if localError}
  <Text class="text-sm text-red-600 font-mono">{localError}</Text>
{/if}
