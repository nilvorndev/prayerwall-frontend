<script lang="ts">
  import { submitJson } from "@/lib/client/forms";
  import type { PrayerRequest } from "@/lib/types";
  import { formatDateTime, identityLabel } from "@/lib/utils/format";

  let {
    prayers: initialPrayers = [],
    allowEdit = true,
    allowDelete = true,
    emptyLabel = "No requests found.",
  }: {
    prayers: PrayerRequest[];
    allowEdit?: boolean;
    allowDelete?: boolean;
    emptyLabel?: string;
  } = $props();

  let prayers = $state(initialPrayers);
  let editingId = $state<string | null>(null);
  let editDescription = $state("");
  let editIsPublic = $state(true);
  let editTitle = $state("");
  let isBusy = $state<Record<string, boolean>>({});
  let generalError = $state("");

  function startEdit(prayer: PrayerRequest) {
    editingId = prayer.id;
    editDescription = prayer.description;
    editIsPublic = prayer.is_public;
    editTitle = prayer.title || "";
    generalError = "";
  }

  function cancelEdit() {
    editingId = null;
    editDescription = "";
    editIsPublic = true;
    editTitle = "";
  }

  async function saveEdit(prayerId: string) {
    isBusy = { ...isBusy, [prayerId]: true };
    generalError = "";
    try {
      const result = await submitJson<{ prayer: PrayerRequest }>(`/api/prayers/${prayerId}/update`, {
        description: editDescription.trim(),
        is_public: editIsPublic,
        title: editTitle.trim(),
      }, { method: "PATCH" });
      prayers = prayers.map((prayer) =>
        prayer.id === prayerId ? { ...prayer, ...(result.prayer as PrayerRequest) } : prayer,
      );
      cancelEdit();
    } catch (error: any) {
      generalError = error.detail || "Unable to save changes.";
    } finally {
      isBusy = { ...isBusy, [prayerId]: false };
    }
  }

  async function deletePrayerRequest(prayerId: string) {
    const confirmed = window.confirm("Delete this request? This cannot be undone.");
    if (!confirmed) return;

    isBusy = { ...isBusy, [prayerId]: true };
    generalError = "";
    try {
      await submitJson(`/api/prayers/${prayerId}/delete`, {});
      prayers = prayers.filter((prayer) => prayer.id !== prayerId);
    } catch (error: any) {
      generalError = error.detail || "Unable to delete the request.";
    } finally {
      isBusy = { ...isBusy, [prayerId]: false };
    }
  }

  const trimText = (value: string) => (value.length > 220 ? `${value.slice(0, 220).trimEnd()}…` : value);
</script>

{#if generalError}
  <div class="mb-4 rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3 text-sm text-(--color-danger)">
    {generalError}
  </div>
{/if}

{#if prayers.length === 0}
  <p class="py-8 text-center text-sm text-(--color-text-muted)">{emptyLabel}</p>
{:else}
  <div class="space-y-3">
    {#each prayers as prayer (prayer.id)}
      <article class="card p-4 md:p-5">
        {#if editingId === prayer.id}
          <div class="space-y-4">
            <div>
              <label class="label">Title</label>
              <input
                bind:value={editTitle}
                type="text"
                class="input"
                placeholder="Prayer request title"
              />
            </div>
            <div>
              <label class="label">Description</label>
              <textarea
                bind:value={editDescription}
                rows="5"
                class="textarea"
              ></textarea>
            </div>
            <label class="checkbox-label">
              <input type="checkbox" bind:checked={editIsPublic} class="checkbox" />
              <span class="text-sm leading-6 text-(--color-text-secondary)">Publish on the public feed when approved.</span>
            </label>
            <div class="flex gap-2">
              <button
                type="button"
                onclick={() => saveEdit(prayer.id)}
                disabled={isBusy[prayer.id]}
                class="btn btn-primary btn-sm"
              >
                Save
              </button>
              <button
                type="button"
                onclick={cancelEdit}
                class="btn btn-outline btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        {:else}
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="badge {prayer.is_public ? 'badge-success' : 'badge-warning'}">
                {prayer.is_public ? "Public" : "Private"}
              </span>
              <span class="badge">{identityLabel(prayer)}</span>
            </div>

            <h3 class="text-base font-semibold leading-snug text-(--color-text)">
              {prayer.title || trimText(prayer.description)}
            </h3>

            {#if prayer.tags && prayer.tags.length > 0}
              <div class="flex flex-wrap gap-1.5">
                {#each prayer.tags as tag (tag)}
                  <span class="badge badge-accent">{tag}</span>
                {/each}
              </div>
            {/if}

            <p class="text-sm leading-7 text-(--color-text-secondary)">
              {trimText(prayer.description)}
            </p>

            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-(--color-line-light) pt-3 text-xs text-(--color-text-muted)">
              <div class="flex flex-wrap items-center gap-3">
                <span>{formatDateTime(prayer.created_at)}</span>
                <span>{prayer.prayer_count} prayers</span>
              </div>
              <div class="flex flex-wrap gap-2">
                {#if allowEdit}
                  <button
                    type="button"
                    onclick={() => startEdit(prayer)}
                    class="btn btn-outline btn-xs"
                  >
                    Edit
                  </button>
                {/if}
                {#if allowDelete}
                  <button
                    type="button"
                    onclick={() => deletePrayerRequest(prayer.id)}
                    disabled={isBusy[prayer.id]}
                    class="btn btn-danger-outline btn-xs"
                  >
                    Delete
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </article>
    {/each}
  </div>
{/if}
