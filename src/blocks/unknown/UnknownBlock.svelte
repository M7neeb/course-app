<script lang="ts">
  import type { Block } from '../../core/types.ts';
  import { t } from '../../i18n/i18n.ts';

  let { block }: { block: Block } = $props();
</script>

<aside class="block unsupported">
  <p>{t('unknown.block', { type: block.type })}</p>
</aside>
