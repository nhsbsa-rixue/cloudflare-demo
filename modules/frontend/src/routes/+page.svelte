<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import FileDropzone from "$lib/components/upload/file-dropzone.svelte";
  import {
    Card,
    CardContent,
    CardHeader,
  } from "$lib/components/ui/card/index.js";
  import { Heading, Text } from "$lib/components/ui/typography/index.js";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const title = "CNC Demo Upload";
  let droppedFile = $state<File | null>(null);

  const apiResult = $derived(form?.upload ?? data.upload);
  const apiError = $derived(form?.error ?? data.error);
  const hasSelectedFile = $derived(!!droppedFile);

  function enhanceUpload(formElement: HTMLFormElement) {
    return enhance(formElement, ({ formData }) => {
      const current = formData.get("file");
      const hasFile =
        current instanceof File && (current.name.length > 0 || current.size > 0);

      if (!hasFile && droppedFile) {
        formData.set("file", droppedFile, droppedFile.name);
      }

      return async ({ update }) => {
        await update();
        droppedFile = null;
      };
    });
  }

  function handleSelectionChange(detail: { droppedFile: File | null }) {
    droppedFile = detail.droppedFile;
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
  <!-- Hero Tile -->
  <section
    aria-label="File upload drop zone"
    class="relative flex-1 w-full flex flex-col px-spacing-lg py-spacing-section overflow-visible"
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
            class="w-full max-w-104 self-center min-h-164 text-left transition-all duration-500 flex flex-col"
          >
            <CardHeader>
              <div class="flex items-center justify-between gap-3">
                <Text
                  class="text-sm font-semibold uppercase tracking-wider text-ink-muted-48"
                >
                  Single File Upload
                </Text>
                <Badge variant="pearl" selected={hasSelectedFile}>
                  {#if hasSelectedFile}
                    1 file selected
                  {:else}
                    No file selected
                  {/if}
                </Badge>
              </div>
            </CardHeader>

            <CardContent class="flex flex-1 flex-col gap-6">
              <form
                method="POST"
                enctype="multipart/form-data"
                class="flex flex-1 flex-col gap-6"
                use:enhanceUpload
              >
                <FileDropzone onSelectionChange={handleSelectionChange} />

                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  class="w-full"
                  disabled={!hasSelectedFile}
                >
                  {#if hasSelectedFile}
                    Upload Selected File
                  {:else}
                    Select a File to Upload
                  {/if}
                </Button>
              </form>

              {#if hasSelectedFile && droppedFile}
                <div aria-live="polite">
                  <Text class="text-sm text-ink">
                    Ready to upload: {droppedFile.name}
                  </Text>
                </div>
              {/if}

              {#if apiError && hasSelectedFile}
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
