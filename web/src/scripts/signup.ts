import type { UtmParams } from './utm';
import type { AnalyticsEvent } from './analytics';

export interface SignupDeps {
  fetch: typeof fetch;
  navigate: (url: string) => void;
  track: (event: AnalyticsEvent, params?: Record<string, unknown>) => void;
  getUtm: () => UtmParams;
  subscribeUrl: string;
  redirectDelayMs?: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function attachSignupForm(form: HTMLFormElement, deps: SignupDeps): void {
  const emailInput = form.querySelector<HTMLInputElement>('input[type="email"]');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"], button:not([type])');
  const helper = form.querySelector<HTMLElement>('[data-helper]');

  if (!emailInput || !button) return;

  const originalHelperText = helper?.textContent ?? '';
  const originalButtonText = button.textContent ?? 'Send the plan';
  const redirectDelayMs = deps.redirectDelayMs ?? 800;

  const setHelper = (text: string, kind: 'idle' | 'error' | 'success') => {
    if (!helper) return;
    helper.textContent = text;
    helper.classList.remove('helper--error', 'helper--success');
    if (kind === 'error') helper.classList.add('helper--error');
    if (kind === 'success') helper.classList.add('helper--success');
  };

  const resetHelper = () => setHelper(originalHelperText, 'idle');

  let submitted = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitted) return;

    const email = emailInput.value.trim();
    if (!EMAIL_RE.test(email)) {
      setHelper('Please enter a valid email address.', 'error');
      return;
    }

    resetHelper();
    button.disabled = true;
    button.textContent = 'Sending…';
    deps.track('signup_attempt', { source: 'web' });

    try {
      const body = new URLSearchParams();
      body.set('email', email);
      const utm = deps.getUtm();
      for (const [k, v] of Object.entries(utm)) {
        if (v) body.set(k, v);
      }

      const res = await deps.fetch(deps.subscribeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      deps.track('signup_complete', { ...utm });
      setHelper('Got it — check your email.', 'success');
      button.textContent = 'Sent ✓';
      button.disabled = false;
      submitted = true;

      setTimeout(() => deps.navigate('/thanks'), redirectDelayMs);
    } catch (err) {
      deps.track('signup_error', { message: String(err) });
      setHelper('Something went wrong. Try again or email hi@stockupdinners.com.', 'error');
      button.disabled = false;
      button.textContent = originalButtonText;
    }
  });
}
