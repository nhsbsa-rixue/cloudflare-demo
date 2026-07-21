<script lang="ts">
  import "../app.css";
  import { GlobalNav, SubNav } from "$lib/components/ui/nav/index.js";

  interface Props {
    children: import("svelte").Snippet;
  }

  let { children }: Props = $props();
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
  <span class="text-tagline text-body">CNC design upload</span>
</SubNav>

{@render children()}
