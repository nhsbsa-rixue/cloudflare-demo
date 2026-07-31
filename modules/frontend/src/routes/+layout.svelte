<script lang="ts">
  import "../app.css";
  import { page } from "$app/state";
  import { GlobalNav, SubNav } from "$lib/components/ui/nav/index.js";
  import type { AppUserRole, AuthenticatedUser } from "$lib/types";

  interface Props {
    data: {
      authenticatedUser: AuthenticatedUser | null;
    };
    children: import("svelte").Snippet;
  }

  let { data, children }: Props = $props();

  const roleLabels: Record<AppUserRole, string> = {
    admin: "Admin",
    user: "User",
    operator: "Operator",
    editor: "Editor",
    guest: "Guest",
  };

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
  {#if data.authenticatedUser}
    <div class="ml-auto text-right">
      <p class="text-xs font-semibold text-body-on-dark">{data.authenticatedUser.email}</p>
    </div>
  {/if}
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
