<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
  import { Heading, Lead, Text } from '$lib/components/ui/typography/index.js';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const title = 'Cloudflare Demo Upload';

  const apiResult = $derived(form?.upload ?? data.upload);
  const apiError = $derived(form?.error ?? data.error);
</script>

<svelte:head>
  <title>{title}</title>
  <meta
    name="description"
    content="Upload png, jpg, and pdf files to Cloudflare R2 through a SvelteKit + Workers integration."
  />
</svelte:head>

<!-- Hero Tile -->
<section class="w-full min-h-screen flex flex-col items-center justify-center px-spacing-lg py-spacing-section bg-canvas-parchment">
  <div class="max-w-4xl w-full space-y-8 text-center">
    <Heading level={1} class="text-ink">
      Upload Your Files to <span class="text-primary">R2</span>
    </Heading>

    <Lead class="text-ink-muted-80">
      PNG, JPG, or PDF up to 10 MB. Your upload is processed by Cloudflare Workers and stored in R2.
    </Lead>

    <!-- Upload Card -->
    <Card variant="utility" class="mx-auto max-w-2xl text-left space-y-4">
      <CardHeader>
        <Text class="text-sm font-semibold uppercase tracking-wider text-ink-muted-48">
          File Upload
        </Text>
      </CardHeader>

      <CardContent class="space-y-4">
        <form method="POST" enctype="multipart/form-data" class="space-y-4">
          <div class="rounded-lg border-2 border-dashed border-hairline bg-surface-pearl p-6 space-y-3">
            <label for="file" class="block text-sm font-medium text-ink">
              Select a file to upload
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
              required
              class="block w-full text-sm text-ink file:mr-4 file:rounded-pill file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white hover:file:bg-primary-focus"
            />
            <Text class="text-xs text-ink-muted-48">
              Allowed formats: PNG, JPG, JPEG, PDF. Max size: 10 MB.
            </Text>
          </div>

          <Button type="submit" size="md" variant="primary">
            Upload File
          </Button>
        </form>

        {#if apiError}
          <Text class="text-sm text-red-600 font-mono">{apiError}</Text>
        {:else if apiResult}
          <div class="space-y-2">
            <Text class="text-xl font-semibold text-ink">Upload complete</Text>
            <Text class="text-sm text-ink-muted-48">
              {apiResult.filename} ({apiResult.size} bytes)
            </Text>
            <Text class="text-sm text-ink-muted-48 font-mono">{apiResult.contentType}</Text>
            <Text class="text-sm text-ink-muted-48 font-mono">{apiResult.key}</Text>
            <Text class="text-sm text-ink-muted-48 font-mono">{apiResult.uploadedAt}</Text>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- CTA Buttons -->
    <div class="flex flex-wrap gap-4 justify-center pt-4">
      <Button
        href="https://svelte.dev/docs/kit"
        target="_blank"
        rel="noopener noreferrer"
        label="SvelteKit Docs"
        variant="primary"
        size="lg"
      />
      <Button
        href="https://developers.cloudflare.com/pages"
        target="_blank"
        rel="noopener noreferrer"
        label="Cloudflare Pages"
        variant="secondary"
        size="lg"
      />
    </div>
  </div>
</section>

