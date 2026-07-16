<script lang="ts">
  import { submitJson } from "@/lib/client/forms";
  import { accountUpdateSchema } from "@/lib/validation/schemas";
  import type { SessionState } from "@/lib/auth/session";

  let {
    session,
  }: {
    session: SessionState;
  } = $props();

  let firstName = $state(session.user?.first_name || "");
  let lastName = $state(session.user?.last_name || "");
  let isSaving = $state(false);
  let isRefreshing = $state(false);
  let isLoggingOut = $state(false);
  let isDeleting = $state(false);
  let generalError = $state("");
  let success = $state("");
  let errors = $state<Record<string, string[]>>({});

  function validate(): boolean {
    const result = accountUpdateSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
    });
    if (!result.success) {
      errors = result.error.flatten().fieldErrors;
      return false;
    }
    errors = {};
    return true;
  }

  async function handleSave(event: Event) {
    event.preventDefault();
    if (!validate() || isSaving) return;

    isSaving = true;
    success = "";
    generalError = "";

    try {
      await submitJson("/api/auth/me/update", {
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
      });
      success = "Profile updated.";
    } catch (error: any) {
      generalError = error.detail || "Unable to update your profile.";
      errors = error.fields || {};
    } finally {
      isSaving = false;
    }
  }

  async function handleRefreshToken() {
    if (isRefreshing) return;
    isRefreshing = true;
    success = "";
    generalError = "";
    try {
      await submitJson("/api/auth/anonymous/token", {
        identity_id: session.anonymous?.id || undefined,
        display_name: session.anonymous?.display_name || undefined,
      });
      window.location.reload();
    } catch (error: any) {
      generalError = error.detail || "Unable to refresh the token.";
    } finally {
      isRefreshing = false;
    }
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    isLoggingOut = true;
    try {
      await submitJson("/api/auth/logout", {
        mode: session.mode === "registered" ? "registered" : "anonymous",
      });
      window.location.assign("/auth/login?logged_out=1");
    } catch (error: any) {
      generalError = error.detail || "Unable to log out.";
    } finally {
      isLoggingOut = false;
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this account? This cannot be undone.");
    if (!confirmed || isDeleting) return;
    isDeleting = true;
    try {
      await submitJson("/api/auth/me/delete", {});
      window.location.assign("/auth/register?deleted=1");
    } catch (error: any) {
      generalError = error.detail || "Unable to delete the account.";
    } finally {
      isDeleting = false;
    }
  }

  const firstNameError = $derived(errors.first_name?.[0] || "");
  const lastNameError = $derived(errors.last_name?.[0] || "");
</script>

<div class="space-y-4">
  {#if generalError}
    <div class="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3 text-sm text-(--color-danger)">
      {generalError}
    </div>
  {/if}

  {#if success}
    <div class="rounded-xl border border-[color-mix(in_srgb,var(--color-success)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] p-3 text-sm text-(--color-success)">
      {success}
    </div>
  {/if}

  <section class="card p-5 space-y-4">
    <div>
      <h2 class="text-sm font-semibold text-(--color-text)">Profile</h2>
      <p class="mt-1 text-sm leading-6 text-(--color-text-secondary)">
        {session.mode === "registered" ? "Registered account" : "Anonymous identity"}
      </p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <div class="rounded-xl border border-(--color-line-light) bg-(--color-surface) px-3 py-3">
        <p class="text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">Auth mode</p>
        <p class="mt-1 text-sm text-(--color-text)">{session.mode}</p>
      </div>
      <div class="rounded-xl border border-(--color-line-light) bg-(--color-surface) px-3 py-3">
        <p class="text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">Status</p>
        <p class="mt-1 text-sm text-(--color-text)">
          {session.isBlocked ? "Blocked" : session.isVerified ? "Verified" : session.mode === "anonymous" ? "Anonymous" : "Unverified"}
        </p>
      </div>
    </div>

    {#if session.mode === "registered"}
      <form onsubmit={handleSave} class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="firstName" class="label">First name</label>
            <input id="firstName" bind:value={firstName} class="input {firstNameError ? 'border-(--color-danger)' : ''}" />
            {#if firstNameError}<p class="form-error">{firstNameError}</p>{/if}
          </div>
          <div>
            <label for="lastName" class="label">Last name</label>
            <input id="lastName" bind:value={lastName} class="input {lastNameError ? 'border-(--color-danger)' : ''}" />
            {#if lastNameError}<p class="form-error">{lastNameError}</p>{/if}
          </div>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <button type="submit" disabled={isSaving} class="btn btn-primary">
            {isSaving ? "Saving..." : "Update profile"}
          </button>
          <button type="button" onclick={handleLogout} disabled={isLoggingOut} class="btn btn-outline">
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
          <button type="button" onclick={handleDelete} disabled={isDeleting} class="btn btn-danger-outline">
            {isDeleting ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </form>
    {:else}
      <div class="flex flex-col gap-2 sm:flex-row">
        <button type="button" onclick={handleLogout} disabled={isLoggingOut} class="btn btn-outline">
          {isLoggingOut ? "Logging out..." : "Discard anonymous identity"}
        </button>
        <button type="button" onclick={handleRefreshToken} disabled={isRefreshing} class="btn btn-primary">
          {isRefreshing ? "Refreshing..." : "Refresh token"}
        </button>
      </div>
    {/if}
  </section>
</div>
