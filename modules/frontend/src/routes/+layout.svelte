<script lang="ts">
  import "../app.css";
  import { page } from "$app/state";
  import { GlobalNav, SubNav } from "$lib/components/ui/nav/index.js";

  interface Props {
    children: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  const sectionLabel = $derived(
    page.url.pathname.startsWith("/dashboard")
      ? "Dashboard"
      : "CNC design upload",
  );
</script>

<GlobalNav>
  <a
    href="/"
    class="text-body-on-dark hover:text-primary-on-dark text-sm font-medium"
  >
    Dongyu Engineering Consultancy
  </a>
</GlobalNav>

<SubNav>
  <span class="text-tagline text-body">{sectionLabel}</span>
  {#snippet cta()}
    <div class="flex items-center gap-6">
      <a href="/upload" class="text-sm font-medium text-body hover:text-primary">
        Upload
      </a>
      <a
        href="/dashboard"
        class="text-sm font-medium text-body hover:text-primary"
      >
        Dashboard
      </a>
    </div>
  {/snippet}
</SubNav>

{@render children()}
