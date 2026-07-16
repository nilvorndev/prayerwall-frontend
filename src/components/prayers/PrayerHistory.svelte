<script lang="ts">
  import { submitJson } from "@/lib/client/forms";
  import type { Prayer } from "@/lib/types";
  import { formatDateTime } from "@/lib/utils/format";

  let {
    prayers: initialPrayers = [],
  }: {
    prayers: Prayer[];
  } = $props();

  let prayers = $state(initialPrayers);
  let busy = $state<Record<string, boolean>>({});
  let error = $state("");

  async function remove(entryId: string) {
    const confirmed = window.confirm("Remove this prayer record? This cannot be undone.");
    if (!confirmed) return;

    busy = { ...busy, [entryId]: true };
    error = "";
    try {
      await submitJson(`/api/prayers/prayers/${entryId}/delete`, {});
      prayers = prayers.filter((entry) => entry.id !== entryId);
    } catch (err: any) {
      error = err.detail || "Unable to delete this prayer record.";
    } finally {
      busy = { ...busy, [entryId]: false };
    }
  }
</script>

<div class="space-y-3">
  {#if error}
    <div class="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3 text-sm text-(--color-danger)">
      {error}
    </div>
  {/if}

  {#if prayers.length === 0}
    <p class="py-8 text-center text-sm text-(--color-text-muted)">No prayer records yet.</p>
  {:else}
    {#each prayers as prayer (prayer.id)}
      <article class="card p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm text-(--color-text)">
              Prayed for
              <a href={`/prayers/${prayer.prayer_request}`} class="font-medium text-(--color-primary) hover:text-(--color-primary-light) transition-colors"
                >{prayer.prayer_request_title || prayer.prayer_request}</a
              >
            </p>
            <p class="mt-1 text-xs text-(--color-text-muted)">{formatDateTime(prayer.created_at || "")}</p>
          </div>
          <button
            type="button"
            onclick={() => remove(prayer.id)}
            disabled={busy[prayer.id]}
            class="btn btn-danger-outline btn-xs shrink-0"
          >
            {busy[prayer.id] ? "Removing..." : "Delete"}
          </button>
        </div>
      </article>
    {/each}
  {/if}
</div>
