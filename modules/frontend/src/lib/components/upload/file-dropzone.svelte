<script lang="ts">
  import * as FileDropZone from "$lib/components/ui/file-drop-zone";
  import { Text } from "$lib/components/ui/typography/index.js";

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
      class="w-full rounded-md border border-hairline bg-surface-pearl p-6 transition-colors hover:border-primary/55"
      class:border-primary={!!selectedFileName}
    >
      <div class="flex flex-col gap-2 text-center">
        <Text class="text-base font-semibold text-ink">
          Drag and drop one file here
        </Text>
        <Text class="text-sm text-ink-muted-48">
          or click to browse from your device
        </Text>
      </div>
    </div>
  </FileDropZone.Trigger>
</FileDropZone.Root>

{#if selectedFileName}
  <div aria-live="polite">
    <Text class="text-sm text-ink">File selected: {selectedFileName}</Text>
  </div>
{:else}
  <div aria-live="polite">
    <Text class="text-sm text-ink-muted-48">No file selected yet.</Text>
  </div>
{/if}

<Text class="text-xs text-ink-muted-48">
  Accepted file types: PNG, JPG, JPEG, PDF. Maximum file size: 10 MB.
</Text>

{#if localError}
  <Text class="text-sm text-red-600 font-mono">{localError}</Text>
{/if}
