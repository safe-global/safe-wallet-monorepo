# Pluggable Analytics SDK (TypeScript)

---

## Goals

- **SOLID + DRY** principles
- **Easy to add/remove providers** (Adapter + Strategy + Composite patterns)
- **Type-safe events** via an EventMap
- **Middleware pipeline** (Chain of Responsibility pattern)
- **Consent gating, sampling, PII scrubbing** examples
- **Offline queue** with localStorage + retry on reconnect

## Implementation Notes for GA4 & Mixpanel

---

### GA4 (gtag.js)

- Event names **MUST** be letters/numbers/underscores only, no spaces; ideally `snake_case`; ≤40 chars.
- **≤25 parameters per event**. Avoid PII in payload.
- Set `user_id` via `gtag('config', MEASUREMENT_ID, { user_id, send_page_view:false })` to ensure it applies to future hits without triggering page view.
- If you manually send `page_view` (SPA), keep `send_page_view:false` in config.

### Mixpanel (JS)

- Use `mixpanel.track_pageview()` (or init with track_pageview options) for page views to avoid duplicate custom events.
- **Groups**: use `set_group(key, id)` and then `get_group(key, id).set({...})` for group profile traits.
- **EU data residency**: init with `api_host: 'https://api-eu.mixpanel.com'` if needed.
- Avoid reserved property prefixes (`$`, `mp_`). Scrub/rename if necessary.

### NEW: Provider Routing

- You can route specific events to only some providers without creating multiple analytics objects.
- **Two mechanisms:**
  1. **Per-call options**: `analytics.track(event, { includeProviders: ['mixpanel'] })`
  2. **Router function**: `builder.withRouter((event) => ({ includeProviders:['ga'] }))`
- `includeProviders` wins over `excludeProviders`.

---

## How to Use (Quick Start)

1. **Define your EventMap type** (compile-time safety)
2. **Build the analytics instance** with providers and middlewares
3. **Call** `analytics.track(event)`, `analytics.identify()`, `analytics.page()`

### File Layout Hint

*All in one file for demo; split into modules in prod:*

- **types** (events, context)
- **provider contracts** (ISP-friendly capabilities)
- **middleware contracts & helpers**
- **queue implementation** (localStorage-backed)
- **consent manager**
- **core**: Analytics + Builder (+ Router)
- **provider adapters**: Google Analytics (gtag), Mixpanel
- **example middlewares**: sampling, scrubPII
- **example usage**

---

## Code Implementation

### types.ts

```typescript
export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

// Your app defines a strongly-typed catalog of events.
// Example at bottom shows how to define AppEvents.
export type EventMap = Record<string, Record<string, unknown>>;

export type DeviceInfo = {
  userAgent?: string;
  screen?: { width?: number; height?: number; pixelRatio?: number };
};

export type PageContext = {
  url?: string;
  referrer?: string;
  title?: string;
  path?: string;
};

export type EventContext = {
  userId?: string; // known user id (post-identify). Do NOT send PII like emails.
  anonymousId?: string; // cookie/local id before identify
  sessionId?: string;
  page?: PageContext;
  device?: DeviceInfo;
  locale?: string;
  appVersion?: string;
  source?: 'web' | 'mobile' | 'server';
  test?: boolean; // e.g., true during e2e tests
};

export type AnalyticsEvent<K extends string = string, P extends Record<string, unknown> = Record<string, unknown>> = {
  name: K;
  payload: P;
  context?: EventContext;
  timestamp?: number; // epoch ms
};

export type ProviderInitOptions = {
  consent?: ConsentState;
  defaultContext?: EventContext;
};

export type ConsentCategories = 'analytics' | 'marketing' | 'functional' | 'personalization';
export type ConsentState = Partial<Record<ConsentCategories, boolean>> & { updatedAt?: number };

// Utility to deep-merge shallowish objects safely
function shallowMerge<T extends object>(base: T, patch?: Partial<T>): T {
  return Object.assign({}, base, patch || {}) as T;
}
```

### provider.ts — Provider contracts (ISP-friendly)

```typescript
export interface BaseProvider<E extends EventMap = EventMap> {
  /** Unique stable id, e.g., 'ga' or 'mixpanel' */
  readonly id: string;
  init?(opts: ProviderInitOptions): Promise<void> | void;
  /** Core capability: track */
  track<K extends keyof E & string>(event: AnalyticsEvent<K, E[K]>): void | Promise<void>;
  /** Control */
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  flush?(): Promise<void>;
  shutdown?(): Promise<void>;
}

// Interface Segregation: opt-in extra capabilities per provider
export interface IdentifyCapable {
  identify(userId: string, traits?: Record<string, unknown>): void | Promise<void>;
}

export interface GroupCapable {
  group(groupId: string, traits?: Record<string, unknown>): void | Promise<void>;
}

export interface PageCapable {
  page(ctx?: PageContext): void | Promise<void>;
}
```

### middleware.ts — Chain of Responsibility

```typescript
export type Middleware<E extends EventMap> = (
  event: AnalyticsEvent<keyof E & string, E[keyof E & string]>,
  next: (event: AnalyticsEvent<any, any>) => void
) => void;

class MiddlewareChain<E extends EventMap> {
  private chain: Middleware<E>[] = [];
  use(mw: Middleware<E>): this {
    this.chain.push(mw);
    return this;
  }
  run(event: AnalyticsEvent<any, any>, terminal: (e: AnalyticsEvent<any, any>) => void) {
    let idx = -1;
    const dispatch = (i: number, e: AnalyticsEvent<any, any>) => {
      if (i <= idx) throw new Error('next() called multiple times');
      idx = i;
      const mw = this.chain[i];
      if (!mw) return terminal(e);
      mw(e, (e2) => dispatch(i + 1, e2));
    };
    dispatch(0, event);
  }
}
```

### queue.ts — localStorage-backed resilient queue

```typescript
type QueuedItem = { e: AnalyticsEvent; ts: number };

class PersistentQueue {
  constructor(private key: string, private max = 1000, private ttlMs = 7 * 24 * 60 * 60 * 1000) {}

  private load(): QueuedItem[] {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const arr = JSON.parse(raw) as QueuedItem[];
      const now = Date.now();
      const fresh = arr.filter((x) => now - x.ts <= this.ttlMs);
      if (fresh.length !== arr.length) this.save(fresh);
      return fresh;
    } catch {
      return [];
    }
  }

  private save(items: QueuedItem[]) {
    try {
      localStorage.setItem(this.key, JSON.stringify(items.slice(-this.max)));
    } catch {
      // Swallow; storage may be full or blocked
    }
  }

  enqueue(e: AnalyticsEvent) {
    const items = this.load();
    items.push({ e, ts: Date.now() });
    this.save(items);
  }

  drain(maxItems = 100): AnalyticsEvent[] {
    const items = this.load();
    const slice = items.slice(0, maxItems);
    this.save(items.slice(maxItems));
    return slice.map((x) => x.e);
  }

  clear() {
    try { localStorage.removeItem(this.key); } catch {}
  }
}
```

### consent.ts — simple consent tracker

```typescript
class ConsentManager {
  private state: ConsentState;
  constructor(initial?: ConsentState) {
    this.state = { updatedAt: Date.now(), ...initial };
  }
  update(patch: ConsentState) {
    this.state = { ...this.state, ...patch, updatedAt: Date.now() };
  }
  get(): ConsentState { return this.state; }
  allows(category: ConsentCategories): boolean {
    // Default-deny unless explicitly granted
    return !!this.state[category];
  }
}
```

### routing.ts — optional provider router

```typescript
export type RouteDecision = { includeProviders?: string[]; excludeProviders?: string[] };
export type Router<E extends EventMap> = (event: AnalyticsEvent<keyof E & string, E[keyof E & string]>) => RouteDecision | void;
```

### analytics.ts — Core orchestrator

```typescript
type ProviderEntry<E extends EventMap> = { provider: BaseProvider<E>; enabled: boolean };

export type AnalyticsOptions<E extends EventMap> = {
  defaultContext?: EventContext;
  consent?: ConsentState;
  queueKey?: string; // localStorage key
  queueTtlMs?: number;
  queueMax?: number;
  onError?: (err: unknown, event?: AnalyticsEvent) => void;
  router?: Router<E>; // optional event router for provider-level routing
};

export type TrackOptions = RouteDecision; // per-call routing overrides

export class Analytics<E extends EventMap> {
  private providers = new Map<string, ProviderEntry<E>>();
  private middlewares = new MiddlewareChain<E>();
  private queue: PersistentQueue;
  private consent: ConsentManager;
  private defaultContext: EventContext;
  private onError?: (err: unknown, event?: AnalyticsEvent) => void;
  private router?: Router<E>;

  constructor(opts?: AnalyticsOptions<E>) {
    this.defaultContext = opts?.defaultContext || {};
    this.consent = new ConsentManager(opts?.consent);
    this.queue = new PersistentQueue(opts?.queueKey || '**analytics_queue**', opts?.queueMax || 1000, opts?.queueTtlMs || 7 * 24 * 60 * 60 * 1000);
    this.onError = opts?.onError;
    this.router = opts?.router;

    // Flush on reconnect
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flushQueue());
    }
  }

  /** Dependency Inversion: accept abstractions (providers), not concretes */
  addProvider(p: BaseProvider<E>): this {
    this.providers.set(p.id, { provider: p, enabled: true });
    p.init?.({ consent: this.consent.get(), defaultContext: this.defaultContext });
    return this;
  }

  removeProvider(id: string): this {
    const entry = this.providers.get(id);
    if (entry) {
      entry.provider.shutdown?.();
      this.providers.delete(id);
    }
    return this;
  }

  enableProvider(id: string): this { 
    const e = this.providers.get(id); 
    if (e) { 
      e.enabled = true; 
      e.provider.setEnabled(true); 
    } 
    return this; 
  }

  disableProvider(id: string): this { 
    const e = this.providers.get(id); 
    if (e) { 
      e.enabled = false; 
      e.provider.setEnabled(false); 
    } 
    return this; 
  }

  use(mw: Middleware<E>): this { 
    this.middlewares.use(mw); 
    return this; 
  }

  setRouter(router: Router<E>): this { 
    this.router = router; 
    return this; 
  }

  setConsent(patch: ConsentState): this {
    this.consent.update(patch);
    // bubble to providers
    for (const { provider } of this.providers.values()) {
      provider.init?.({ consent: this.consent.get(), defaultContext: this.defaultContext });
    }
    return this;
  }

  setDefaultContext(ctx: Partial<EventContext>): this {
    this.defaultContext = shallowMerge(this.defaultContext, ctx);
    return this;
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    for (const { provider, enabled } of this.providers.values()) {
      if (!enabled || !provider.isEnabled()) continue;
      const maybe = provider as unknown as IdentifyCapable;
      if (typeof (maybe as IdentifyCapable).identify === 'function') {
        try { maybe.identify(userId, traits); } catch (err) { this.onError?.(err); }
      }
    }
  }

  group(groupId: string, traits?: Record<string, unknown>) {
    for (const { provider, enabled } of this.providers.values()) {
      if (!enabled || !provider.isEnabled()) continue;
      const maybe = provider as unknown as GroupCapable;
      if (typeof maybe.group === 'function') {
        try { maybe.group(groupId, traits); } catch (err) { this.onError?.(err); }
      }
    }
  }

  page(ctx?: PageContext) {
    for (const { provider, enabled } of this.providers.values()) {
      if (!enabled || !provider.isEnabled()) continue;
      const maybe = provider as unknown as PageCapable;
      if (typeof maybe.page === 'function') {
        try { maybe.page(ctx); } catch (err) { this.onError?.(err); }
      }
    }
  }

  track(event: AnalyticsEvent<any, any>, options?: TrackOptions): void {
    const enriched: AnalyticsEvent<any, any> = {
      ...event,
      context: shallowMerge(this.defaultContext, event.context),
      timestamp: event.timestamp ?? Date.now(),
    };

    const dispatch = (e: AnalyticsEvent<any, any>) => {
      // Consent gate: only send analytics events if allowed
      if (!this.consent.allows('analytics')) {
        // store but do not send; can be flushed later when consent is granted
        this.queue.enqueue(e);
        return;
      }

      const online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
      if (!online) {
        this.queue.enqueue(e);
        return;
      }

      // Resolve routing: merge router(event) with per-call opts. include wins over exclude.
      const routeA = this.router ? this.router(e) || {} : {};
      const routeB = opts || {};
      const include = (routeA.includeProviders || routeB.includeProviders) as string[] | undefined;
      const exclude = [...(routeA.excludeProviders || []), ...(routeB.excludeProviders || [])];

      for (const { provider, enabled } of this.providers.values()) {
        if (!enabled || !provider.isEnabled()) continue;
        if (include && include.length && !include.includes(provider.id)) continue; // not in allowlist
        if (exclude.includes(provider.id)) continue; // explicitly excluded

        try {
          const maybePromise = provider.track(e);
          if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
            (maybePromise as Promise<void>).catch((err) => {
              this.queue.enqueue(e); // retry later if a provider fails transiently
              this.onError?.(err, e);
            });
          }
        } catch (err) {
          this.queue.enqueue(e);
          this.onError?.(err, e);
        }
      }
    };

    this.middlewares.run(event, dispatch);
  }

  async flush() {
    for (const { provider } of this.providers.values()) {
      await provider.flush?.();
    }
  }

  flushQueue(maxBatch = 200) {
    if (!this.consent.allows('analytics')) return; // still gated
    let batch = this.queue.drain(maxBatch);
    while (batch.length) {
      for (const e of batch) {
        // bypass middlewares on replay to avoid double processing
        for (const { provider, enabled } of this.providers.values()) {
          if (!enabled || !provider.isEnabled()) continue;
          try { provider.track(e); } catch { /* swallow, requeue next time on error */ }
        }
      }
      batch = this.queue.drain(maxBatch);
    }
  }
}

// Builder for ergonomic construction (Open/Closed: add providers without modifying Analytics)
export class AnalyticsBuilder<E extends EventMap> {
  static create<T extends SafeEventMap = SafeEventMap>(options?: AnalyticsOptions<T>): AnalyticsBuilder<T>
  
  addProvider(provider: BaseProvider<E>): this
  addProviders(providers: BaseProvider<E>[]): this
  withDefaultContext(context: Partial<EventContext>): this
  withConsent(consent: ConsentState): this
  withRouter(router: Router<E>): this
  withErrorHandler(handler: (err: unknown, event?: AnalyticsEvent) => void): this
  withDebugMode(enabled: boolean): this
  use(middleware: MiddlewareFunction): this
  addMiddleware(middleware: MiddlewareFunction): this
  addMiddlewares(middlewares: MiddlewareFunction[]): this
  build(): Analytics<E>
}
```

## Provider Adapters

### providers/googleAnalyticsProvider.ts — Adapter for gtag.js

```typescript
declare global {
  interface Window { gtag?: (...args: any[]) => void; mixpanel?: any }
}

export type GoogleAnalyticsOptions = {
  measurementId: string;
  gtag?: (...args: any[]) => void; // DI for testing
};

export class GoogleAnalyticsProvider<E extends EventMap = EventMap> implements BaseProvider<E>, IdentifyCapable, PageCapable {
  readonly id = 'ga';
  private _enabled = true;
  private gtag?: (...args: any[]) => void;
  private measurementId: string;

  constructor(opts: GoogleAnalyticsOptions) {
    this.measurementId = opts.measurementId;
    this.gtag = opts.gtag || (typeof window !== 'undefined' ? window.gtag : undefined);
  }

  isEnabled() { return this._enabled; }
  setEnabled(enabled: boolean) { this._enabled = enabled; }

  init() {
    // If gtag is not present, developer must add GA script in the app shell.
    if (!this.gtag) {
      console.warn('[GA] gtag not found. Did you include the GA script?');
    } else {
      // We manually control page_view in SPA flows; keep it disabled by default here.
      this.gtag('config', this.measurementId, { send_page_view: false });
    }
  }

  /**
   * Prefer setting user_id via config so it applies to subsequent events
   * WITHOUT sending an automatic page_view.
   */
  identify(userId: string) {
    if (!this._enabled || !this.gtag) return;
    this.gtag('config', this.measurementId, { user_id: userId, send_page_view: false });
  }

  page(ctx?: PageContext) {
    if (!this._enabled || !this.gtag) return;
    this.gtag('event', 'page_view', {
      page_title: ctx?.title,
      page_location: ctx?.url,
      page_path: ctx?.path,
      referrer: ctx?.referrer,
    });
  }

  private toGaEventName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_') // only letters, numbers, underscores
      .replace(/^_+|\_+$/g, '')
      .slice(0, 40); // GA4 limit
  }

  track(event: AnalyticsEvent) {
    if (!this._enabled || !this.gtag) return;
    const gaName = this.toGaEventName(event.name);
    // GA4 expects snake_case-ish event names and specific reserved param keys.
    // Keep payload tidy and ≤25 params.
    this.gtag('event', gaName, {
      ...event.payload,
      // Common context fields you may want to pass
      user_id: event?.context?.userId,
      page_location: event?.context?.page?.url,
      page_title: event?.context?.page?.title,
      page_path: event?.context?.page?.path,
    });
  }
}
```

### providers/mixpanelProvider.ts — Adapter for Mixpanel

```typescript
export type MixpanelOptions = {
  token: string;
  apiHost?: string; // e.g., 'https://api-eu.mixpanel.com' for EU residency
  initOptions?: Record<string, unknown>; // extra init options, e.g., track_pageview: 'url-with-path'
  mixpanel?: any; // DI for testing
};

export class MixpanelProvider<E extends EventMap = EventMap> implements BaseProvider<E>, IdentifyCapable, GroupCapable, PageCapable {
  readonly id = 'mixpanel';
  private _enabled = true;
  private mp: any;
  private token: string;
  private apiHost?: string;
  private initOptions?: Record<string, unknown>;

  constructor(opts: MixpanelOptions) {
    this.token = opts.token;
    this.apiHost = opts.apiHost;
    this.initOptions = opts.initOptions;
    this.mp = opts.mixpanel || (typeof window !== 'undefined' ? window.mixpanel : undefined);
  }

  isEnabled() { return this._enabled; }
  setEnabled(enabled: boolean) { this._enabled = enabled; }

  init() {
    if (!this.mp) {
      console.warn('[Mixpanel] global mixpanel not found. Did you load the SDK?');
      return;
    }
    if (!this.mp.__loaded) {
      try {
        this.mp.init(this.token, {
          batch_requests: true,
          ...(this.apiHost ? { api_host: this.apiHost } : {}),
          ...(this.initOptions || {}),
        });
      } catch {}
    }
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    if (!this._enabled || !this.mp) return;
    try {
      this.mp.identify(userId);
      if (traits && this.mp?.people?.set) this.mp.people.set(traits);
    } catch {}
  }

  group(groupId: string, traits?: Record<string, unknown>) {
    if (!this._enabled || !this.mp) return;
    try {
      // Attach user to the group, then set group profile traits
      if (this.mp?.set_group) this.mp.set_group('company', groupId);
      if (traits && this.mp?.get_group) this.mp.get_group('company', groupId).set(traits);
    } catch {}
  }

  page(ctx?: PageContext) {
    if (!this._enabled || !this.mp) return;
    try {
      if (typeof this.mp.track_pageview === 'function') {
        this.mp.track_pageview({ title: ctx?.title, page: ctx?.path, referrer: ctx?.referrer, url: ctx?.url });
      } else {
        // Fallback if using a minimal build; avoid naming collisions with your taxonomy
        this.mp.track('Page View', { title: ctx?.title, url: ctx?.url, path: ctx?.path, referrer: ctx?.referrer });
      }
    } catch {}
  }

  track(event: AnalyticsEvent) {
    if (!this._enabled || !this.mp) return;
    try {
      // Avoid reserved property prefixes ($, mp_) in payload keys.
      this.mp.track(event.name, { ...event.payload, ...flattenContext(event.context) });
    } catch {}
  }
}

function flattenContext(ctx?: EventContext) {
  if (!ctx) return {} as Record<string, unknown>;
  return {
    userId: ctx.userId,
    anonymousId: ctx.anonymousId,
    sessionId: ctx.sessionId,
    page_title: ctx.page?.title,
    page_url: ctx.page?.url,
    page_path: ctx.page?.path,
    locale: ctx.locale,
    appVersion: ctx.appVersion,
    source: ctx.source,
    test: ctx.test,
  } as Record<string, unknown>;
}
```

## Example Middlewares

### middlewares — examples (sampling, PII scrub, rename)

```typescript
export function samplingMiddleware<E extends EventMap>(rate: number): Middleware<E> {
  const p = Math.max(0, Math.min(1, rate));
  return (event, next) => {
    if (Math.random() < p) next(event); // keep
    // else drop silently
  };
}

const EMAIL_RE = /([a-zA-Z0-9*._+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g;
export function scrubPIIMiddleware<E extends EventMap>(): Middleware<E> {
  return (event, next) => {
    const scrub = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      const out: any = Array.isArray(obj) ? [] : {};
      for (const k of Object.keys(obj)) {
        const v = (obj as any)[k];
        if (typeof v === 'string') out[k] = v.replace(EMAIL_RE, '[redacted]');
        else out[k] = scrub(v);
      }
      return out;
    };
    next({ ...event, payload: scrub(event.payload) });
  };
}

// Example: rename event names or map payload keys per taxonomy alignment
export function renameEventMiddleware<E extends EventMap>(map: Record<string, string>): Middleware<E> {
  return (event, next) => {
    const newName = map[event.name] || event.name;
    next({ ...event, name: newName });
  };
}
```

## Complete Usage Example

### example.ts — Putting it together

```typescript
// 1) Define your event catalog for compile-time safety
export type AppEvents = {
  'User Signed In': { method: 'password' | 'wallet'; experiment?: string };
  'Clicked CTA': { label: string; page: string };
  'Funds Transferred': { amount: number; asset: string; network?: string };
  'Error Shown': { code: string; message?: string };
};

// 2) Build the instance
export const analytics = AnalyticsBuilder.create<AppEvents>({
  defaultContext: {
    device: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      screen: typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight, pixelRatio: window.devicePixelRatio } : undefined,
    },
    source: 'web',
  },
  consent: { analytics: true }, // default allow; wire to your CMP
  queueKey: '**myapp_analytics_queue**',
  // Global router example: route by event name
  router: (event) => {
    switch (event.name) {
      case 'Funds Transferred':
        return { includeProviders: ['mixpanel'] }; // business-critical to Mixpanel only
      case 'Clicked CTA':
        return { includeProviders: ['ga'] }; // send to GA only
      default:
        return; // send to all enabled providers
    }
  }
})
.addProvider(new GoogleAnalyticsProvider({ measurementId: 'G-XXXXXXX' }))
.addProvider(new MixpanelProvider({ token: 'mixpanel-token', apiHost: 'https://api-eu.mixpanel.com', initOptions: { /* track_pageview: 'url-with-path' */ } }))
.addMiddleware(samplingMiddleware<AppEvents>(1.0)) // set to <1 for sampling in high-traffic flows
.addMiddleware(scrubPIIMiddleware<AppEvents>())
// Optional: align taxonomy names across tools
.addMiddleware(renameEventMiddleware<AppEvents>({ 'Clicked CTA': 'cta_click' }))
.build();

// 3) Use it in your app
export function demoUsage() {
  analytics.page({ title: document.title, url: location.href, path: location.pathname, referrer: document.referrer });
  analytics.identify('user_123', { plan: 'pro' });
  analytics.track({
    name: 'User Signed In',
    payload: { method: 'wallet' },
    context: { locale: 'en-US' }
  });

  // Route per-call: only GA
  analytics.track({
    name: 'Clicked CTA',
    payload: { label: 'Get Started', page: 'Home' }
  }, { includeProviders: ['ga'] });

  // Route per-call: exclude GA
  analytics.track({
    name: 'Funds Transferred',
    payload: { amount: 1.2, asset: 'ETH', network: 'Base' }
  }, { excludeProviders: ['ga'] });
}
```

---

## Adding a New Provider (Guide)

```typescript
class NewProvider<E extends EventMap> implements BaseProvider<E>, IdentifyCapable, PageCapable {
  readonly id = 'newprovider';
  private _enabled = true;
  constructor(private options: { apiKey: string }) {}
  init() { /* load SDK or configure */ }
  isEnabled() { return this._enabled; }
  setEnabled(e: boolean) { this._enabled = e; }
  identify(userId: string) { /* ... */ }
  page(ctx?: PageContext) { /* ... */ }
  track(event: AnalyticsEvent) { /* map event.name/payload/context to SDK */ }
}
// Register: AnalyticsBuilder.create<AppEvents>().addProvider(new NewProvider({ apiKey: '...' }))
```

---

## Notes on SOLID & Patterns Mapping

### SOLID Principles

- **S (Single Responsibility)**:
  - Providers only know how to talk to their SDK.
  - Analytics orchestrates dispatch + consent + queue + routing.
  - Middlewares transform events.

- **O (Open/Closed)**:
  - Add new providers or middlewares without changing core.

- **L (Liskov Substitution)**:
  - All providers conform to BaseProvider and can be swapped.

- **I (Interface Segregation)**:
  - Identify/Page/Group are optional capability interfaces.

- **D (Dependency Inversion)**:
  - Analytics depends on BaseProvider abstraction; DI via builder.

### Design Patterns

- **Adapter**: GA/Mixpanel adapters.
- **Strategy**: Router chooses target providers at runtime.
- **Composite/Mediator**: Analytics broadcasts to many providers.
- **Chain of Responsibility**: Middleware pipeline.