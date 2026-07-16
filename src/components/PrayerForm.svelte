<script lang="ts">
  import { submitJson } from "@/lib/client/forms";
  import { prayerFormSchema } from "@/lib/validation/schemas";

  let {
    prayerId = "",
    initialDescription = "",
    initialIsPublic = true,
    initialTitle = "",
    redirectTo = "/my/requests",
    submitLabel = "Save request",
    mode = "create",
  }: {
    prayerId?: string;
    initialDescription?: string;
    initialIsPublic?: boolean;
    initialTitle?: string;
    redirectTo?: string;
    submitLabel?: string;
    mode?: "create" | "edit";
  } = $props();

  let description = $state(initialDescription);
  let isPublic = $state(initialIsPublic);
  let title = $state(initialTitle);
  let errors = $state<Record<string, string[]>>({});
  let isSubmitting = $state(false);
  let generalError = $state("");

  function validate(): boolean {
    const result = prayerFormSchema.safeParse({
      title,
      description,
      is_public: isPublic,
    });
    if (!result.success) {
      errors = result.error.flatten().fieldErrors;
      return false;
    }
    errors = {};
    return true;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!validate() || isSubmitting) return;

    isSubmitting = true;
    generalError = "";

    try {
      const endpoint =
        mode === "edit" && prayerId
          ? `/api/prayers/${prayerId}/update`
          : "/api/prayers/create";

      await submitJson(
        endpoint,
        {
          description: description.trim(),
          is_public: isPublic,
          title: title.trim(),
        },
        mode === "edit" ? { method: "PATCH" } : {},
      );
      window.location.assign(redirectTo);
    } catch (error: any) {
      errors = error.fields || {};
      generalError = error.detail || "Unable to save the request.";
    } finally {
      isSubmitting = false;
    }
  }

  const descriptionError = $derived(errors.description?.[0] || "");
</script>

<form onsubmit={handleSubmit} class="space-y-4">
  {#if generalError}
    <div class="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3 text-sm text-(--color-danger)">
      {generalError}
    </div>
  {/if}

  <div>
    <label for="title" class="label">Title</label>
    <input
      id="title"
      bind:value={title}
      type="text"
      maxlength="200"
      class="input"
      placeholder="Short title for your prayer request"
      disabled={isSubmitting}
    />
  </div>

  <div>
    <label for="description" class="label">Prayer request</label>
    <textarea
      id="description"
      bind:value={description}
      rows="6"
      maxlength="1200"
      class="textarea {descriptionError ? 'border-(--color-danger)' : ''}"
      placeholder="Describe the request clearly so people can pray well."
      disabled={isSubmitting}
    ></textarea>
    <div class="mt-1 flex items-center justify-between text-xs">
      {#if descriptionError}
        <p class="form-error">{descriptionError}</p>
      {:else}
        <span class="form-help">Keep it brief and specific.</span>
      {/if}
      <span class="text-(--color-text-muted)">{description.length}/1200</span>
    </div>
  </div>

  <label class="checkbox-label">
    <input
      type="checkbox"
      bind:checked={isPublic}
      class="checkbox"
      disabled={isSubmitting}
    />
    <span class="text-sm leading-6 text-(--color-text-secondary)">
      Make this request public on the feed.
    </span>
  </label>

  <div class="flex flex-col gap-3 sm:flex-row">
    <button
      type="submit"
      disabled={isSubmitting}
      class="btn btn-primary"
    >
      {isSubmitting ? "Saving..." : submitLabel}
    </button>
    <a
      href={redirectTo}
      class="btn btn-outline"
    >
      Cancel
    </a>
  </div>
</form>
