<script lang="ts">
  import { submitJson } from "@/lib/client/forms";

  let {
    prayerId,
    initialCount = 0,
    alreadyPrayed = false,
    canDelete = false,
    onChanged,
  }: {
    prayerId: string;
    initialCount?: number;
    alreadyPrayed?: boolean;
    canDelete?: boolean;
    onChanged?: () => void;
  } = $props();

  let count = $state(initialCount);
  let isPrayed = $state(alreadyPrayed);
  let isBusy = $state(false);
  let message = $state("");

  async function pray() {
    if (isBusy || isPrayed) return;
    isBusy = true;
    message = "";
    try {
      await submitJson(`/api/prayers/${prayerId}/pray`, {});
      count += 1;
      isPrayed = true;
      onChanged?.();
    } catch (error: any) {
      message = error.detail || "Unable to record prayer.";
      if (error.status === 400 || error.status === 409) {
        isPrayed = true;
      }
    } finally {
      isBusy = false;
    }
  }

  async function remove() {
    const confirmed = window.confirm("Delete this request? This cannot be undone.");
    if (!confirmed || isBusy) return;
    isBusy = true;
    message = "";
    try {
      await submitJson(`/api/prayers/${prayerId}/delete`, {}, { method: "DELETE" });
      window.location.assign("/my/requests");
    } catch (error: any) {
      message = error.detail || "Unable to delete request.";
    } finally {
      isBusy = false;
    }
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      onclick={pray}
      disabled={isPrayed || isBusy}
      class="btn btn-gold disabled:opacity-50"
    >
      {#if isBusy && !isPrayed}
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 2v6" /><path d="M12 16v6" /><path d="M4.93 4.93l4.24 4.24" /><path d="M14.83 14.83l4.24 4.24" /><path d="M2 12h6" /><path d="M16 12h6" /><path d="M4.93 19.07l4.24-4.24" /><path d="M14.83 9.17l4.24-4.24" />
        </svg>
        <span>Working...</span>
      {:else if isPrayed}
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
        <span>I prayed for you</span>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
        <span>I prayed for you</span>
      {/if}
    </button>
    {#if canDelete}
      <button type="button" onclick={remove} disabled={isBusy} class="btn btn-danger-outline">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
        </svg>
        Delete
      </button>
    {/if}
  </div>

  <div class="prayer-count">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
    {count}
  </div>

  {#if message}
    <p class="text-xs text-(--color-text-muted)">{message}</p>
  {/if}
</div>
