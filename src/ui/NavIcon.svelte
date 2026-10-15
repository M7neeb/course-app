<script lang="ts">
  // Inline stroke icons. No emoji, no icon font, no network — just SVG paths that inherit the
  // surrounding text colour.
  let { name, size = 20 }: { name: string; size?: number } = $props();
</script>

<svg
  class="icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {#if name === 'library'}
    <path d="M4 4.5h5.5A2.5 2.5 0 0 1 12 7v12.5a2 2 0 0 0-2-2H4z" />
    <path d="M20 4.5h-5.5A2.5 2.5 0 0 0 12 7v12.5a2 2 0 0 1 2-2h6z" />
  {:else if name === 'stats'}
    <path d="M5 20V11" />
    <path d="M12 20V4" />
    <path d="M19 20v-6" />
  {:else if name === 'import'}
    <path d="M12 3v10" />
    <path d="M8 9l4 4 4-4" />
    <path d="M5 20h14" />
  {:else if name === 'create'}
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M12 8.5v7" />
    <path d="M8.5 12h7" />
  {:else if name === 'settings'}
    <path d="m10.2 3 .4-1h2.8l.4 1a8 8 0 0 1 1.5.6l1-.5 2 2-.5 1a8 8 0 0 1 .6 1.5l1 .4v2.8l-1 .4a8 8 0 0 1-.6 1.5l.5 1-2 2-1-.5a8 8 0 0 1-1.5.6l-.4 1h-2.8l-.4-1a8 8 0 0 1-1.5-.6l-1 .5-2-2 .5-1a8 8 0 0 1-.6-1.5l-1-.4V8.1l1-.4a8 8 0 0 1 .6-1.5l-.5-1 2-2 1 .5a8 8 0 0 1 1.5-.7Z" transform="translate(1.3 1.4) scale(.88)" />
    <circle cx="12" cy="12" r="3" />
  {:else if name === 'review'}
    <circle cx="12" cy="12" r="9" />
    <path d="M8.3 12.4l2.5 2.5 4.9-5.3" />
  {:else if name === 'check'}
    <path d="M5 12.5l4.5 4.5L19 7" />
  {:else if name === 'globe'}
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.3 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.3-3.5-8.5s1.1-6 3.5-8.5Z" />
  {:else if name === 'lock'}
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  {:else if name === 'trash'}
    <path d="M4 7h16" />
    <path d="M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7" />
    <path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7" />
  {:else if name === 'menu'}
    <path d="M4 7h16M4 12h16M4 17h16" />
  {:else if name === 'close'}
    <path d="M6 6l12 12M18 6L6 18" />
  {:else if name === 'dashboard'}
    <rect x="3.5" y="4" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="4" width="7" height="4" rx="1.5" />
    <rect x="13.5" y="11" width="7" height="9" rx="1.5" />
    <rect x="3.5" y="14" width="7" height="6" rx="1.5" />
  {:else if name === 'profile'}
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  {:else if name === 'home'}
    <path d="M4 10.5 12 4l8 6.5" />
    <path d="M6.5 9.5V20h11V9.5" />
  {:else if name === 'flame'}
    <path d="M12 3.2c2.6 3.1 4.9 5.2 4.9 8.8a4.9 4.9 0 1 1-9.8 0c0-1.5.5-2.7 1.4-3.8.5 1 1.2 1.7 2.1 2.1-.4-2.5.2-5.1 1.4-7.1Z" />
  {:else if name === 'search'}
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  {:else if name === 'play'}
    <path d="M8 5.5v13l11-6.5z" />
  {:else if name === 'exercise'}
    <path d="M4 6.5h16M4 12h16M4 17.5h9" />
    <circle cx="18.5" cy="17.5" r="1.7" />
  {:else if name === 'article'}
    <path d="M6.5 3.5h7L18.5 8v12.5h-12z" />
    <path d="M13.5 3.5V8h5" />
    <path d="M9 12.5h6M9 16h6" />
  {/if}
</svg>
