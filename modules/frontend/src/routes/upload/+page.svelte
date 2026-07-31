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
  import { Text } from "$lib/components/ui/typography/index.js";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const title = "CNC Demo Upload";
  let droppedFile = $state<File | null>(null);

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
    class="relative flex-1 w-full flex flex-col px-spacing-lg py-spacing-section pt-(--spacing-xl) pb-(--spacing-section) overflow-visible"
  >
    <div
      class="absolute inset-0"
      style="background-color: rgba(68, 76, 88, 0.56);"
      aria-hidden="true"
    ></div>

    <div class="relative z-10 w-full flex-1 flex flex-col">
      <!-- Right column: heading appears above the upload card -->
      <div class="flex-1 flex items-center justify-center">
        <div class="w-full max-w-[1440px] mx-auto lg:grid lg:grid-cols-3">
          <div class="w-full max-w-104 mx-auto lg:col-start-3 lg:justify-self-center flex flex-col gap-6">
            <Card
              variant="utility"
              class="w-full min-h-164 mb-(--spacing-xxl) text-left transition-all duration-500 flex flex-col"
            >
            <CardHeader>
              <div class="flex items-center justify-between gap-3">
                <Text class="text-sm font-semibold uppercase tracking-wider text-ink-muted-48">
                  CNC design upload
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
                action="?type=cnc"
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

              {#if apiError}
                <div class="p-4 rounded-lg bg-red-50 border border-red-200" aria-live="polite" role="alert">
                  <Text class="text-sm font-semibold text-red-800">
                    {apiError}
                  </Text>
                </div>
              {/if}

              {#if hasSelectedFile && droppedFile}
                <div aria-live="polite">
                  <Text class="text-sm text-ink">
                    Ready to upload: {droppedFile.name}
                  </Text>
                </div>
              {/if}

            </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>
