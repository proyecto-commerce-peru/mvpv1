import { __resetThrottleStore, checkThrottle, registerFailure, registerSuccess } from "@/lib/server/rate-limit";

describe("rate-limit progressive throttle", () => {
  beforeEach(() => {
    __resetThrottleStore();
  });

  it("applies delay after 5 failures", () => {
    const tenantId = "tenant-a";
    const route = "auth:login";
    const actor = "user@example.com:127.0.0.1";

    for (let i = 0; i < 5; i += 1) {
      registerFailure(tenantId, route, actor);
    }

    expect(checkThrottle(tenantId, route, actor)).toBe(0);

    registerFailure(tenantId, route, actor);
    const waitMs = checkThrottle(tenantId, route, actor);

    expect(waitMs).toBeGreaterThan(0);
    expect(waitMs).toBeLessThanOrEqual(3000);
  });

  it("resets failures after success", () => {
    const tenantId = "tenant-a";
    const route = "auth:login";
    const actor = "user@example.com:127.0.0.1";

    for (let i = 0; i < 8; i += 1) {
      registerFailure(tenantId, route, actor);
    }

    expect(checkThrottle(tenantId, route, actor)).toBeGreaterThan(0);
    registerSuccess(tenantId, route, actor);
    expect(checkThrottle(tenantId, route, actor)).toBe(0);
  });
});