<script lang="ts">
  import { submitJson } from "@/lib/client/forms";
  import { registerSchema } from "@/lib/validation/schemas";

  let {
    redirectTo = "/auth/verify",
  }: {
    redirectTo?: string;
  } = $props();

  let email = $state("");
  let password = $state("");
  let firstName = $state("");
  let lastName = $state("");
  let errors = $state<Record<string, string[]>>({});
  let isSubmitting = $state(false);
  let generalError = $state("");

  function validate(): boolean {
    const result = registerSchema.safeParse({
      email,
      password,
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

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!validate() || isSubmitting) return;

    isSubmitting = true;
    generalError = "";

    try {
      const result = await submitJson("/api/auth/register", {
        email: email.trim(),
        password,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
      });
      window.location.assign(result.next || redirectTo);
    } catch (error: any) {
      errors = error.fields || {};
      generalError = error.detail || "Registration failed. Please check your input.";
    } finally {
      isSubmitting = false;
    }
  }

  const emailError = $derived(errors.email?.[0] || "");
  const passwordError = $derived(errors.password?.[0] || "");
  const firstNameError = $derived(errors.first_name?.[0] || "");
  const lastNameError = $derived(errors.last_name?.[0] || "");
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
      aria-describedby={emailError ? "register-email-error register-email-help" : "register-email-help"}
      class="input {emailError ? 'border-(--color-danger)' : ''}"
      placeholder="you@example.com"
      disabled={isSubmitting}
    />
    <p id="register-email-help" class="form-help">This address receives verification email and account notices.</p>
    {#if emailError}<p class="form-error" id="register-email-error">{emailError}</p>{/if}
  </div>

  <div class="grid gap-3 sm:grid-cols-2">
    <div class="space-y-1.5">
      <label for="firstName" class="label">First name</label>
      <input
        id="firstName"
        type="text"
        bind:value={firstName}
        autocomplete="given-name"
        aria-invalid={Boolean(firstNameError)}
        aria-describedby={firstNameError ? "register-first-name-error register-first-name-help" : "register-first-name-help"}
        class="input {firstNameError ? 'border-(--color-danger)' : ''}"
        placeholder="John"
        disabled={isSubmitting}
      />
      <p id="register-first-name-help" class="form-help">Optional. Helps make the account easier to recognize.</p>
      {#if firstNameError}<p class="form-error" id="register-first-name-error">{firstNameError}</p>{/if}
    </div>

    <div class="space-y-1.5">
      <label for="lastName" class="label">Last name</label>
      <input
        id="lastName"
        type="text"
        bind:value={lastName}
        autocomplete="family-name"
        aria-invalid={Boolean(lastNameError)}
        aria-describedby={lastNameError ? "register-last-name-error register-last-name-help" : "register-last-name-help"}
        class="input {lastNameError ? 'border-(--color-danger)' : ''}"
        placeholder="Doe"
        disabled={isSubmitting}
      />
      <p id="register-last-name-help" class="form-help">Optional. Anonymous identities use a separate flow.</p>
      {#if lastNameError}<p class="form-error" id="register-last-name-error">{lastNameError}</p>{/if}
    </div>
  </div>

  <div class="space-y-1.5">
    <label for="password" class="label">Password</label>
    <input
      id="password"
      type="password"
      bind:value={password}
      autocomplete="new-password"
      required
      aria-invalid={Boolean(passwordError)}
      aria-describedby={passwordError ? "register-password-error register-password-help" : "register-password-help"}
      class="input {passwordError ? 'border-(--color-danger)' : ''}"
      placeholder="At least 8 characters"
      disabled={isSubmitting}
    />
    <p id="register-password-help" class="form-help">You will need to verify your email before request creation is unlocked.</p>
    {#if passwordError}<p class="form-error" id="register-password-error">{passwordError}</p>{/if}
  </div>

  <button
    type="submit"
    disabled={isSubmitting}
    class="btn btn-primary w-full"
  >
    {isSubmitting ? "Creating account..." : "Create account"}
  </button>

  <p class="text-center text-sm text-(--color-text-secondary)">
    Already have an account? <a href="/auth/login" class="text-(--color-primary) font-medium hover:text-(--color-primary-light) transition-colors">Log in</a>
  </p>
</form>
