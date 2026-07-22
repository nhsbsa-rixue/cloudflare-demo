<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    Card,
    CardContent,
    CardHeader,
  } from "$lib/components/ui/card/index.js";
  import { Heading, Text } from "$lib/components/ui/typography/index.js";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const title = "CNC Demo Upload";
  const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];

  let isDragging = $state(false);
  let localError = $state("");
  let selectedFileName = $state("");
  let fileInput: HTMLInputElement | null = null;

  const apiResult = $derived(form?.upload ?? data.upload);
  const apiError = $derived(form?.error ?? data.error);

  function setFile(file: File | null) {
    if (!file || !fileInput) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      localError = "Only PNG, JPG, JPEG, and PDF files are allowed.";
      selectedFileName = "";
      fileInput.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      localError = "File size must be 10 MB or less.";
      selectedFileName = "";
      fileInput.value = "";
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.files = transfer.files;
    selectedFileName = file.name;
    localError = "";
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
    const file = event.dataTransfer?.files?.[0] ?? null;
    setFile(file);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    const related = event.relatedTarget as Node | null;
    if (
      related &&
      event.currentTarget instanceof Node &&
      event.currentTarget.contains(related)
    ) {
      return;
    }
    isDragging = false;
  }

  function handleInputChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0] ?? null;
    setFile(file);
  }
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content="Upload PNG, JPG, and PDF files." />
</svelte:head>

<main
  class="min-h-screen w-full flex flex-col overflow-x-hidden"
  style="background-image: url('/bg.webp'); background-size: cover; background-position: center top; background-repeat: no-repeat;"
>
  <!-- Hero Tile (entire hero acts as the drop zone) -->
  <section
    aria-label="File upload drop zone"
    class="relative flex-1 w-full flex flex-col px-spacing-lg py-spacing-section overflow-visible"
    ondrop={handleDrop}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
  >
    <div
      class="absolute inset-0"
      style="background-color: rgba(68, 76, 88, 0.56);"
      aria-hidden="true"
    ></div>

    <div class="relative z-10 w-full flex-1 flex flex-col">
      <!-- Right column: heading appears above the upload card -->
      <div class="flex-1 flex items-center justify-center lg:justify-end">
        <div
          class="w-full max-w-176 shrink-0 lg:ml-auto lg:mr-10 xl:mr-16 flex flex-col gap-6"
        >
          <Heading
            level={1}
            class="w-full whitespace-nowrap text-right font-display text-body-on-dark tracking-[-0.02em] text-[2.5rem]!"
          >
            Upload Your CNC Design File
          </Heading>

          <Card
            variant="utility"
            class={cn(
              "w-full max-w-104 self-center min-h-164 text-left transition-all duration-500 flex flex-col",
              isDragging &&
                "ring-2 ring-primary shadow-[0_0_32px_8px_rgba(0,102,204,0.5)]",
              !isDragging &&
                selectedFileName &&
                "ring-2 ring-primary/70 shadow-[0_0_24px_6px_rgba(0,102,204,0.4)] scale-[1.01]",
            )}
          >
            <CardHeader>
              <Text
                class="text-sm font-semibold uppercase tracking-wider text-ink-muted-48"
              >
                File Upload
              </Text>
            </CardHeader>

            <CardContent class="flex flex-1 flex-col gap-6">
              <form
                method="POST"
                enctype="multipart/form-data"
                class="flex flex-1 flex-col gap-6"
              >
                <div
                  class="flex-1 rounded-lg border-2 border-dashed bg-surface-pearl p-6 space-y-3 transition-colors"
                  class:border-primary={isDragging || selectedFileName}
                  class:border-hairline={!isDragging && !selectedFileName}
                >
                  <label for="file" class="block text-sm font-medium text-ink">
                    Select a file to upload or drag and drop here
                  </label>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                    required
                    bind:this={fileInput}
                    onchange={handleInputChange}
                    class="block w-full text-sm text-ink file:mr-4 file:rounded-pill file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white hover:file:bg-primary-focus"
                  />
                  {#if selectedFileName}
                    <Text class="text-xs text-ink"
                      >Selected: {selectedFileName}</Text
                    >
                  {/if}
                  <Text class="text-xs text-ink-muted-48">
                    Allowed formats: PNG, JPG, JPEG, PDF. Max size: 10 MB.
                  </Text>
                  {#if localError}
                    <Text class="text-sm text-red-600 font-mono"
                      >{localError}</Text
                    >
                  {/if}
                </div>

                <Button type="submit" size="md" variant="primary" class="w-full"
                  >Upload File</Button
                >
              </form>

              {#if apiError}
                <Text class="text-sm text-red-600 font-mono">{apiError}</Text>
              {:else if apiResult}
                <div class="space-y-2">
                  <Text class="text-xl font-semibold text-ink"
                    >Upload complete</Text
                  >
                  <Text class="text-sm text-ink-muted-48">
                    {apiResult.filename} ({apiResult.size} bytes)
                  </Text>
                  <Text class="text-sm text-ink-muted-48 font-mono"
                    >{apiResult.contentType}</Text
                  >
                  <Text class="text-sm text-ink-muted-48 font-mono"
                    >{apiResult.key}</Text
                  >
                  <Text class="text-sm text-ink-muted-48 font-mono"
                    >{apiResult.uploadedAt}</Text
                  >
                </div>
              {/if}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </section>

  <footer
    class="w-full py-10 px-6 text-center"
    style="background-color: #12171d; color: #d0d5db;"
  >
    <p class="text-2xl font-semibold" style="color: #ffffff;">
      Dongyu Engineering Consultancy
    </p>
    <p class="mt-6 text-sm">
      © 2026 Dongyu Engineering Consultancy. All rights reserved
    </p>
  </footer>
</main>
