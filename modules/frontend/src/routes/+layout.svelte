<script lang="ts">
  import "../app.css";
  import { page } from "$app/state";
  import { dev } from "$app/environment";
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
    page.error
      ? page.status === 404
        ? "Not found"
        : "Error"
      : page.url.pathname.startsWith("/dashboard")
        ? "Dashboard"
        : page.url.pathname.startsWith("/upload")
          ? "Upload"
          : page.url.pathname.startsWith("/design")
            ? "Design"
            : page.url.pathname.startsWith("/dev-login")
              ? "Dev login"
              : page.url.pathname.startsWith("/about")
                ? "About"
                : page.url.pathname.startsWith("/access-denied")
                  ? "Access denied"
                  : "Home",
  );
</script>

<GlobalNav>
  <a
    href="/"
    class="text-body-on-dark hover:text-primary-on-dark min-w-0 shrink truncate text-sm font-medium"
  >
    Dongyu Engineering Consultancy
  </a>
  {#if data.authenticatedUser}
    <div class="ml-auto flex shrink-0 items-center gap-3">
      <p class="max-[680px]:hidden text-xs font-semibold text-body-on-dark">{data.authenticatedUser.email}</p>
      <a
        href={dev ? "/dev-login" : "/cdn-cgi/access/logout"}
        class="text-xs font-medium text-body-on-dark hover:text-primary-on-dark transition-colors duration-150"
      >
        Sign out
      </a>
    </div>
  {/if}
</GlobalNav>

<SubNav>
  <h1 class="text-tagline text-body m-0 text-sm font-medium leading-none">{sectionLabel}</h1>
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
