<script lang="ts">
  import { fly } from 'svelte/transition';
  import { rise } from '$lib/motion';
  import { Card } from '$lib/components/ui/card/index.js';
  import { Heading, Lead, Text } from '$lib/components/ui/typography/index.js';

</script>

<main class="min-h-screen bg-canvas-parchment flex items-center justify-center px-6 py-16">
  <div class="w-full max-w-3xl">
    <Card variant="utility" class="w-full px-12 py-16 flex flex-col gap-10">
      <div in:fly={rise(0)} class="text-center flex flex-col items-center gap-4">
        <Heading level={1}>About Us</Heading>
        <Lead>We build tools that make manufacturing workflows faster and simpler.</Lead>
      </div>

      <hr class="border-hairline" />

      <div in:fly={rise(80)} class="text-center flex flex-col items-center gap-4">
        <Heading level={2}>What we do</Heading>
        <Text size="lg" class="text-ink-muted-48">
          Our platform connects CNC operators, designers, and project managers in a single
          workspace - from file upload to final delivery.
        </Text>
      </div>

      <hr class="border-hairline" />

      <div in:fly={rise(160)} class="text-center flex flex-col items-center gap-3">
        <Heading level={2}>Get in touch</Heading>
        <Text size="base" class="text-ink-muted-48">
          Interested in joining the platform? Reach out to your administrator.
        </Text>
      </div>
    </Card>
  </div>
</main>
