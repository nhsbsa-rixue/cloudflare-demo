<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Text } from "$lib/components/ui/typography/index.js";

  interface SelectionChangeDetail {
    droppedFile: File | null;
  }

  const dispatch = createEventDispatcher<{
    selectionchange: SelectionChangeDetail;
  }>();

  interface Props {
    allowedTypes?: string[];
    maxSizeBytes?: number;
    inputId?: string;
    inputName?: string;
    accept?: string;
  }

  let {
    allowedTypes = ["image/png", "image/jpeg", "application/pdf"],
    maxSizeBytes = 10 * 1024 * 1024,
    inputId = "file",
    inputName = "file",
    accept = ".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf",
  }: Props = $props();

  let isDragging = $state(false);
  let dragDepth = $state(0);
  let localError = $state("");
  let selectedFileName = $state("");
  let droppedFile = $state<File | null>(null);
  let fileInput: HTMLInputElement | null = null;
  let dropZoneEl: HTMLDivElement | null = null;

  function emitSelectionChange(file: File | null) {
    dispatch("selectionchange", { droppedFile: file });
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

  function clearInputSelection() {
    if (fileInput) {
      fileInput.value = "";
    }
  }

  function syncInputFile(file: File) {
    if (!fileInput || typeof DataTransfer === "undefined") {
      return;
    }

    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInput.files = transfer.files;
    } catch {
      // Some browsers do not allow programmatic FileList assignment.
    }
  }

  function setFile(file: File | null, source: "drop" | "input") {
    const validationError = validateFile(file);

    if (validationError) {
      localError = validationError;
      selectedFileName = "";
      droppedFile = null;
      clearInputSelection();
      emitSelectionChange(null);
      return;
    }

    if (!file) {
      return;
    }

    selectedFileName = file.name;
    localError = "";

    if (source === "drop") {
      droppedFile = file;
      syncInputFile(file);
      emitSelectionChange(file);
      return;
    }

    droppedFile = null;
    emitSelectionChange(null);
  }

  function hasDraggedItems(event: DragEvent): boolean {
    return (event.dataTransfer?.items?.length ?? 0) > 0 ||
      (event.dataTransfer?.files?.length ?? 0) > 0;
  }

  function isInsideDropZone(event: DragEvent): boolean {
    if (!dropZoneEl) {
      return false;
    }

    const bounds = dropZoneEl.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    dragDepth += 1;
    isDragging = true;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
      isDragging = false;
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth = 0;
    isDragging = false;

    const hasFiles = (event.dataTransfer?.files?.length ?? 0) > 0;
    if (!hasFiles) {
      return;
    }

    const file = event.dataTransfer?.files?.[0] ?? null;
    setFile(file, "drop");
  }

  function handleInputChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0] ?? null;
    setFile(file, "input");
  }

  function handleWindowDragOver(event: DragEvent) {
    if (!hasDraggedItems(event)) {
      return;
    }

    event.preventDefault();

    const inside = isInsideDropZone(event);
    if (inside) {
      isDragging = true;
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
      return;
    }

    isDragging = false;
    dragDepth = 0;
  }

  function handleWindowDrop(event: DragEvent) {
    if (!hasDraggedItems(event)) {
      return;
    }

    event.preventDefault();

    const inside = isInsideDropZone(event);
    isDragging = false;
    dragDepth = 0;

    if (!inside) {
      return;
    }

    const file = event.dataTransfer?.files?.[0] ?? null;
    if (!file) {
      return;
    }

    setFile(file, "drop");
  }

  function handleWindowDragLeave(event: DragEvent) {
    if (!hasDraggedItems(event)) {
      return;
    }

    const pointerLeftWindow =
      event.clientX <= 0 ||
      event.clientY <= 0 ||
      event.clientX >= window.innerWidth ||
      event.clientY >= window.innerHeight;

    if (pointerLeftWindow) {
      isDragging = false;
      dragDepth = 0;
    }
  }
</script>

<svelte:window
  ondragover={handleWindowDragOver}
  ondrop={handleWindowDrop}
  ondragleave={handleWindowDragLeave}
/>

<div
  bind:this={dropZoneEl}
  role="region"
  aria-label="File upload drop zone"
  class="flex-1 rounded-lg border-2 border-dashed bg-surface-pearl p-6 space-y-3 transition-colors"
  class:border-primary={isDragging || selectedFileName}
  class:border-hairline={!isDragging && !selectedFileName}
  ondrop={handleDrop}
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
>
  <label for={inputId} class="block text-sm font-medium text-ink">
    Select a file to upload or drag and drop here
  </label>
  <input
    id={inputId}
    name={inputName}
    type="file"
    {accept}
    required={!droppedFile}
    bind:this={fileInput}
    onchange={handleInputChange}
    class="block w-full text-sm text-ink file:mr-4 file:rounded-pill file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white hover:file:bg-primary-focus"
  />
  {#if selectedFileName}
    <Text class="text-xs text-ink">Selected: {selectedFileName}</Text>
  {/if}
  <Text class="text-xs text-ink-muted-48">
    Allowed formats: PNG, JPG, JPEG, PDF. Max size: 10 MB.
  </Text>
  {#if localError}
    <Text class="text-sm text-red-600 font-mono">{localError}</Text>
  {/if}
</div>
