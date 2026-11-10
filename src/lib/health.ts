export type HealthStatus = { ok: true; service: string };

/** Minimal function used to prove the test setup works. */
export function healthStatus(): HealthStatus {
  return { ok: true, service: "boost-posts" };
}
