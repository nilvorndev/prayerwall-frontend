<script lang="ts">
  import { submitJson } from "@/lib/client/forms";
  import { loginSchema } from "@/lib/validation/schemas";

  let {
    redirectTo = "/account",
  }: {
    redirectTo?: string;
  } = $props();

  let email = $state("");
  let password = $state("");
  let errors = $state<Record<string, string[]>>({});
  let isSubmitting = $state(false);
  let generalError = $state("");

  function validate(): boolean {
    const result = loginSchema.safeParse({
      email,
      password,
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
      await submitJson("/api/auth/login", {
        email: email.trim(),
        password,
      });
      window.location.assign(redirectTo);
    } catch (error: any) {
      errors = error.fields || {};
      generalError = error.detail || "Invalid email or password.";
    } finally {
      isSubmitting = false;
    }
  }

  const emailError = $derived(errors.email?.[0] || "");
  const passwordError = $derived(errors.password?.[0] || "");
</script>

<form onsubmit={handleSubmit} class="space-y-5" novalidate>
  {#if generalError}
    <div class="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3 text-sm text-(--color-danger)">
      {generalError}
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
      aria-invalid={Boolean(emailError)}
      aria-describedby={emailError ? "login-email-error login-email-help" : "login-email-help"}
      class="input {emailError ? 'border-(--color-danger)' : ''}"
      placeholder="you@example.com"
      disabled={isSubmitting}
    />
    <p id="login-email-help" class="form-help">Use the email linked to your registered account.</p>
    {#if emailError}<p class="form-error" id="login-email-error">{emailError}</p>{/if}
  </div>

  <div class="space-y-1.5">
    <label for="password" class="label">Password</label>
    <input
      id="password"
      type="password"
      bind:value={password}
      autocomplete="current-password"
      required
      aria-invalid={Boolean(passwordError)}
      aria-describedby={passwordError ? "login-password-error login-password-help" : "login-password-help"}
      class="input {passwordError ? 'border-(--color-danger)' : ''}"
      placeholder="Your password"
      disabled={isSubmitting}
    />
    <p id="login-password-help" class="form-help">Anonymous users should use the anonymous access flow instead.</p>
    {#if passwordError}<p class="form-error" id="login-password-error">{passwordError}</p>{/if}
  </div>

  <button
    type="submit"
    disabled={isSubmitting}
    class="btn btn-primary w-full"
  >
    {isSubmitting ? "Signing in..." : "Log in"}
  </button>

  <p class="text-center text-sm text-(--color-text-secondary)">
    Don't have an account? <a href="/auth/register" class="text-(--color-primary) font-medium hover:text-(--color-primary-light) transition-colors">Sign up</a>
  </p>
</form>
