<script lang="ts">
  import { submitJson } from "@/lib/client/forms";
  import { displayNameSchema } from "@/lib/validation/schemas";

  let {
    redirectTo = "/prayers",
  }: {
    redirectTo?: string;
  } = $props();

  let displayName = $state("");
  let existingIdentityId = $state("");
  let identityDisplayName = $state("");
  let showCreated = $state(false);
  let createdName = $state("");
  let expiresAt = $state("");
  let generalError = $state("");
  let createErrors = $state<Record<string, string[]>>({});
  let tokenErrors = $state<Record<string, string[]>>({});
  let isCreating = $state(false);
  let isRefreshing = $state(false);

  function validateName(): boolean {
    if (!displayName.trim()) {
      createErrors = {};
      return true;
    }
    const result = displayNameSchema.safeParse(displayName);
    if (!result.success) {
      createErrors = result.error.flatten().fieldErrors;
      return false;
    }
    createErrors = {};
    return true;
  }

  async function handleCreate(event: Event) {
    event.preventDefault();
    if (!validateName() || isCreating) return;

    isCreating = true;
    generalError = "";
    tokenErrors = {};

    try {
      const result = await submitJson("/api/auth/anonymous/create", {
        display_name: displayName.trim() || undefined,
      });
      showCreated = true;
      createdName = result.anonymous?.display_name || displayName || "Anonymous identity";
      expiresAt = result.anonymous?.token_expires_at || "";
    } catch (error: any) {
      generalError = error.detail || "Unable to create anonymous identity.";
      createErrors = error.fields || {};
    } finally {
      isCreating = false;
    }
  }

  async function handleRefresh(event: Event) {
    event.preventDefault();
    if (isRefreshing) return;

    isRefreshing = true;
    generalError = "";
    createErrors = {};

    try {
      await submitJson("/api/auth/anonymous/token", {
        identity_id: existingIdentityId.trim() || undefined,
        display_name: identityDisplayName.trim() || undefined,
      });
      window.location.assign(redirectTo);
    } catch (error: any) {
      generalError = error.detail || "Unable to refresh the anonymous token.";
      tokenErrors = error.fields || {};
    } finally {
      isRefreshing = false;
    }
  }

  const displayNameError = $derived(createErrors.display_name?.[0] || "");
  const identityIdError = $derived(tokenErrors.identity_id?.[0] || "");
</script>

<div class="space-y-4">
  {#if generalError}
    <div class="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3 text-sm text-(--color-danger)">
      {generalError}
    </div>
  {/if}

  {#if showCreated}
    <div class="card p-5">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-sm font-semibold text-(--color-text)">Anonymous identity created</h2>
        <span class="badge badge-info">Ready to use</span>
      </div>
      <p class="mt-2 text-sm leading-6 text-(--color-text-secondary)">
        {createdName}
        {#if expiresAt}
          · token expires {expiresAt}
        {/if}
      </p>
      <p class="mt-2 text-sm leading-6 text-(--color-text-secondary)">
        This identity is separate from a registered account. Use it only for anonymous prayer activity.
      </p>
      <div class="mt-4 flex flex-col gap-2 sm:flex-row">
        <a href={redirectTo} class="btn btn-primary">Continue</a>
        <button type="button" class="btn btn-outline" onclick={() => { showCreated = false; }}>
          Stay here
        </button>
      </div>
    </div>
  {/if}

  <form onsubmit={handleCreate} class="card p-5 space-y-4" novalidate>
    <div>
      <h2 class="text-sm font-semibold text-(--color-text)">Create anonymous identity</h2>
      <p class="mt-1 text-sm leading-6 text-(--color-text-secondary)">Use this when you do not want to register. The identity remains separate from a regular account.</p>
    </div>

    <div class="space-y-1.5">
      <label for="displayName" class="label">Display name</label>
      <input
        id="displayName"
        type="text"
        bind:value={displayName}
        autocomplete="nickname"
        aria-invalid={Boolean(displayNameError)}
        aria-describedby={displayNameError ? "anonymous-display-error anonymous-display-help" : "anonymous-display-help"}
        class="input {displayNameError ? 'border-(--color-danger)' : ''}"
        placeholder="Optional display name"
        disabled={isCreating}
      />
      <p id="anonymous-display-help" class="form-help">Optional. If omitted, the backend can generate one for you.</p>
      {#if displayNameError}<p class="form-error" id="anonymous-display-error">{displayNameError}</p>{/if}
    </div>

    <button type="submit" disabled={isCreating} class="btn btn-primary">
      {isCreating ? "Creating..." : "Create anonymous identity"}
    </button>
  </form>

  <form onsubmit={handleRefresh} class="card p-5 space-y-4" novalidate>
    <div>
      <h2 class="text-sm font-semibold text-(--color-text)">Refresh anonymous token</h2>
      <p class="mt-1 text-sm leading-6 text-(--color-text-secondary)">If you already have an anonymous identity, replace its token without creating a new profile.</p>
    </div>

    <div class="space-y-1.5">
      <label for="identityId" class="label">Identity ID</label>
      <input
        id="identityId"
        type="text"
        bind:value={existingIdentityId}
        autocomplete="off"
        aria-invalid={Boolean(identityIdError)}
        aria-describedby={identityIdError ? "anonymous-id-error anonymous-id-help" : "anonymous-id-help"}
        class="input {identityIdError ? 'border-(--color-danger)' : ''}"
        placeholder="Paste your anonymous identity ID"
        disabled={isRefreshing}
      />
      <p id="anonymous-id-help" class="form-help">This is the persistent identifier from your previous anonymous session.</p>
      {#if identityIdError}<p class="form-error" id="anonymous-id-error">{identityIdError}</p>{/if}
    </div>

    <div class="space-y-1.5">
      <label for="identityDisplayName" class="label">Display name</label>
      <input
        id="identityDisplayName"
        type="text"
        bind:value={identityDisplayName}
        autocomplete="nickname"
        class="input"
        placeholder="Optional display name"
        disabled={isRefreshing}
      />
      <p class="form-help">Optional. Helps keep the identity recognizable when you return later.</p>
    </div>

    <button type="submit" disabled={isRefreshing} class="btn btn-primary">
      {isRefreshing ? "Refreshing..." : "Refresh token"}
    </button>
  </form>
</div>
