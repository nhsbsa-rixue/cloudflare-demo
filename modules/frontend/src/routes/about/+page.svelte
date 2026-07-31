<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Card } from '$lib/components/ui/card/index.js';
  import { Heading, Lead, Text } from '$lib/components/ui/typography/index.js';

  const rise = (delay: number) => ({ y: 16, duration: 600, delay, easing: cubicOut });
</script>

<svelte:head>
  <title>About Us</title>
</svelte:head>

<Card variant="tile" tileMode="light">
  <div class="mx-auto max-w-3xl text-center flex flex-col items-center gap-4">
    <div in:fly={rise(0)}>
      <Heading level={1}>About Us</Heading>
    </div>
    <div in:fly={rise(80)}>
      <Lead>We build tools that make manufacturing workflows faster and simpler.</Lead>
    </div>
  </div>
</Card>

<section class="reveal">
  <Card variant="tile" tileMode="parchment">
    <div class="mx-auto max-w-3xl flex flex-col gap-6">
      <Heading level={2}>What we do</Heading>
      <Text size="lg">
        Our platform connects CNC operators, designers, and project managers in a single
        workspace — from file upload to final delivery.
      </Text>
    </div>
  </Card>
</section>

<section class="reveal">
  <Card variant="tile" tileMode="dark">
    <div class="mx-auto max-w-3xl text-center flex flex-col items-center gap-4">
      <Heading level={2} class="text-body-on-dark">Get in touch</Heading>
      <Text size="base" class="text-body-muted">
        Interested in joining the platform? Reach out to your administrator.
      </Text>
    </div>
  </Card>
</section>

<style>
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 40%;
    }
    @keyframes reveal {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  }
</style>
