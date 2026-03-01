type RateState = {
  failures: number;
  firstFailureAt: number;
  lastFailureAt: number;
};

const WINDOW_MS = 60_000;
const INITIAL_DELAY_MS = 3_000;
const MAX_DELAY_MS = 60_000;

const store = new Map<string, RateState>();

function key(tenantId: string, routeKey: string, actorKey: string): string {
  return `${tenantId}:${routeKey}:${actorKey}`;
}

function getOrInit(k: string): RateState {
  const now = Date.now();
  const current = store.get(k);

  if (!current || now - current.firstFailureAt > WINDOW_MS) {
    const reset: RateState = {
      failures: 0,
      firstFailureAt: now,
      lastFailureAt: now,
    };
    store.set(k, reset);
    return reset;
  }

  return current;
}

function failureDelayMs(failures: number): number {
  if (failures <= 5) {
    return 0;
  }

  const step = failures - 5;
  return Math.min(INITIAL_DELAY_MS * step, MAX_DELAY_MS);
}

export function checkThrottle(tenantId: string, routeKey: string, actorKey: string): number {
  const k = key(tenantId, routeKey, actorKey);
  const state = getOrInit(k);
  const delayMs = failureDelayMs(state.failures);

  if (delayMs <= 0) {
    return 0;
  }

  const elapsed = Date.now() - state.lastFailureAt;
  if (elapsed >= delayMs) {
    return 0;
  }

  return delayMs - elapsed;
}

export function registerFailure(tenantId: string, routeKey: string, actorKey: string): number {
  const k = key(tenantId, routeKey, actorKey);
  const state = getOrInit(k);
  state.failures += 1;
  state.lastFailureAt = Date.now();
  store.set(k, state);

  return failureDelayMs(state.failures);
}

export function registerSuccess(tenantId: string, routeKey: string, actorKey: string): void {
  const k = key(tenantId, routeKey, actorKey);
  store.delete(k);
}

export function __resetThrottleStore(): void {
  store.clear();
}