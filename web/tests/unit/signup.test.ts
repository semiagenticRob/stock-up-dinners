import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attachSignupForm, type SignupDeps } from '@/scripts/signup';

function buildForm(extraInputs: Record<string, string> = {}): HTMLFormElement {
  const form = document.createElement('form');
  form.setAttribute('data-signup-form', '');

  const email = document.createElement('input');
  email.type = 'email';
  email.name = 'email';
  email.required = true;
  form.appendChild(email);

  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Send the plan';
  form.appendChild(button);

  const helper = document.createElement('p');
  helper.className = 'helper';
  helper.setAttribute('data-helper', '');
  helper.textContent = 'No spam.';
  form.appendChild(helper);

  for (const [k, v] of Object.entries(extraInputs)) {
    const i = document.createElement('input');
    i.type = 'hidden';
    i.name = k;
    i.value = v;
    form.appendChild(i);
  }

  document.body.appendChild(form);
  return form;
}

function buildDeps(overrides: Partial<SignupDeps> = {}): SignupDeps {
  return {
    fetch: vi.fn(async () => new Response(null, { status: 200 })),
    navigate: vi.fn(),
    track: vi.fn(),
    getUtm: () => ({}),
    subscribeUrl: 'https://app.beehiiv.com/form_submissions/test-form-id',
    redirectDelayMs: 0,
    ...overrides,
  };
}

beforeEach(() => {
  document.body.replaceChildren();
});

describe('attachSignupForm', () => {
  it('POSTs email to the subscribe URL and navigates to /thanks on success', async () => {
    const form = buildForm();
    const deps = buildDeps();
    attachSignupForm(form, deps);

    (form.querySelector('input[type=email]') as HTMLInputElement).value = 'a@b.co';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(r => setTimeout(r, 0));

    expect(deps.fetch).toHaveBeenCalledOnce();
    const [url, init] = (deps.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://app.beehiiv.com/form_submissions/test-form-id');
    expect(init.method).toBe('POST');
    const body = init.body as URLSearchParams;
    expect(body.get('email')).toBe('a@b.co');

    expect(deps.track).toHaveBeenCalledWith('signup_attempt', expect.any(Object));
    expect(deps.track).toHaveBeenCalledWith('signup_complete', expect.any(Object));
    expect(deps.navigate).toHaveBeenCalledWith('/thanks');
  });

  it('forwards UTM params in the POST body', async () => {
    const form = buildForm();
    const deps = buildDeps({
      getUtm: () => ({ utm_source: 'pinterest', utm_medium: 'pin' }),
    });
    attachSignupForm(form, deps);

    (form.querySelector('input[type=email]') as HTMLInputElement).value = 'x@y.co';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    const init = (deps.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const body = init.body as URLSearchParams;
    expect(body.get('utm_source')).toBe('pinterest');
    expect(body.get('utm_medium')).toBe('pin');
  });

  it('shows error helper text and re-enables the button on fetch failure', async () => {
    const form = buildForm();
    const deps = buildDeps({
      fetch: vi.fn(async () => new Response(null, { status: 500 })),
    });
    attachSignupForm(form, deps);

    (form.querySelector('input[type=email]') as HTMLInputElement).value = 'a@b.co';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(deps.track).toHaveBeenCalledWith('signup_error', expect.any(Object));
    expect(deps.navigate).not.toHaveBeenCalled();
    const helper = form.querySelector('[data-helper]') as HTMLElement;
    expect(helper.classList.contains('helper--error')).toBe(true);
    const button = form.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('shows error and skips fetch on invalid email', async () => {
    const form = buildForm();
    const deps = buildDeps();
    attachSignupForm(form, deps);

    (form.querySelector('input[type=email]') as HTMLInputElement).value = 'not-an-email';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(deps.fetch).not.toHaveBeenCalled();
    const helper = form.querySelector('[data-helper]') as HTMLElement;
    expect(helper.classList.contains('helper--error')).toBe(true);
  });

  it('disables the button while submitting and re-enables on completion', async () => {
    const form = buildForm();
    let resolveFetch: (r: Response) => void = () => {};
    const fetchPromise = new Promise<Response>(r => { resolveFetch = r; });
    const deps = buildDeps({ fetch: vi.fn(() => fetchPromise) });
    attachSignupForm(form, deps);

    (form.querySelector('input[type=email]') as HTMLInputElement).value = 'a@b.co';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    const button = form.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    resolveFetch(new Response(null, { status: 200 }));
    await new Promise(r => setTimeout(r, 0));
    expect(button.disabled).toBe(false);
  });
});
