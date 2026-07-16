<script lang="ts">
  import { onMount } from "svelte";
  import { submitJson } from "@/lib/client/forms";

  let {
    initialEmail = "",
    initialToken = "",
    redirectTo = "/auth/login?verified=1",
  }: {
    initialEmail?: string;
    initialToken?: string;
    redirectTo?: string;
  } = $props();

  let email = $state(initialEmail);
  let code = $state("");
  let isConfirming = $state(false);
  let isResending = $state(false);
  let confirmError = $state("");
  let resendError = $state("");
  let info = $state("");
  let confirmFields = $state<Record<string, string[]>>({});
  let resendFields = $state<Record<string, string[]>>({});

  async function verify(payload: Record<string, string>) {
    isConfirming = true;
    confirmError = "";
    confirmFields = {};
    info = "";

    try {
      await submitJson("/api/auth/verify/confirm", payload);
      window.location.assign(redirectTo);
    } catch (error: any) {
      confirmError = error.detail || "Verification failed.";
      confirmFields = error.fields || {};
    } finally {
      isConfirming = false;
    }
  }

  async function handleConfirm(event: Event) {
    event.preventDefault();
    await verify({ code: code.trim() });
  }

  async function handleResend(event: Event) {
    event.preventDefault();
    isResending = true;
    resendError = "";
    resendFields = {};
    info = "";

    try {
      const result = await submitJson("/api/auth/verify/resend", { email: email.trim() });
      info = result.detail || "Verification email sent.";
    } catch (error: any) {
      resendError = error.detail || "Unable to resend the verification email.";
      resendFields = error.fields || {};
    } finally {
      isResending = false;
    }
  }

  onMount(() => {
    if (initialToken) {
      verify({ token: initialToken });
    }
  });

  const codeError = $derived(confirmFields.code?.[0] || confirmFields.token?.[0] || "");
  const confirmEmailError = $derived(resendFields.email?.[0] || "");
</script>

<div class="space-y-4">
  {#if info}
    <div class="rounded-xl border border-[color-mix(in_srgb,var(--color-success)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] p-3 text-sm text-(--color-success)">
      {info}
    </div>
  {/if}

  {#if initialToken && isConfirming}
    <div class="rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] p-3 text-sm text-(--color-primary)">
      Verifying your email...
    </div>
  {:else if initialToken && confirmError}
    <div class="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3 text-sm text-(--color-danger)">
      {confirmError}
    </div>
  {/if}

  {#if !initialToken || confirmError}
    <form onsubmit={handleConfirm} class="card p-5 space-y-4" novalidate>
      <div>
        <h2 class="text-sm font-semibold text-(--color-text)">Enter verification code</h2>
        <p class="mt-1 text-sm leading-6 text-(--color-text-secondary)">Enter the 6-digit code from the email. Unverified accounts cannot create prayer requests.</p>
      </div>

      {#if confirmError && !initialToken}
        <div class="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3 text-sm text-(--color-danger)">
          {confirmError}
        </div>
      {/if}

      <div class="space-y-1.5">
        <label for="code" class="label">6-digit code</label>
        <input
          id="code"
          bind:value={code}
          autocomplete="one-time-code"
          inputmode="numeric"
          pattern="\d{6}"
          maxlength={6}
          required
          aria-invalid={Boolean(codeError)}
          aria-describedby={codeError ? "verify-code-error verify-code-help" : "verify-code-help"}
          class="input text-center text-2xl tracking-[0.3em] tabular-nums {codeError ? 'border-(--color-danger)' : ''}"
          placeholder="000000"
          disabled={isConfirming}
        />
        <p id="verify-code-help" class="form-help">Enter the 6-digit code sent to your email. If the email expired, use the resend section below.</p>
        {#if codeError}<p class="form-error" id="verify-code-error">{codeError}</p>{/if}
      </div>

      <button type="submit" disabled={isConfirming} class="btn btn-primary">
        {isConfirming ? "Verifying..." : "Verify"}
      </button>
    </form>
  {/if}

  <form onsubmit={handleResend} class="card p-5 space-y-4" novalidate>
    <div>
      <h2 class="text-sm font-semibold text-(--color-text)">Resend verification</h2>
      <p class="mt-1 text-sm leading-6 text-(--color-text-secondary)">Use the same email address used during registration. We will send a new verification message with a fresh code.</p>
    </div>

    {#if resendError}
      <div class="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3 text-sm text-(--color-danger)">
        {resendError}
      </div>
    {/if}

    <div class="space-y-1.5">
      <label for="email" class="label">Email</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        autocomplete="email"
        required
        aria-invalid={Boolean(confirmEmailError)}
        aria-describedby={confirmEmailError ? "verify-email-error verify-email-help" : "verify-email-help"}
        class="input {confirmEmailError ? 'border-(--color-danger)' : ''}"
        placeholder="you@example.com"
        disabled={isResending}
      />
      <p id="verify-email-help" class="form-help">Use the same address you registered with.</p>
      {#if confirmEmailError}<p class="form-error" id="verify-email-error">{confirmEmailError}</p>{/if}
    </div>

    <button type="submit" disabled={isResending} class="btn btn-primary">
      {isResending ? "Sending..." : "Resend email"}
    </button>
  </form>
</div>
