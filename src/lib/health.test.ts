import { describe, expect, it } from "vitest";
import { healthStatus } from "@/lib/health";

describe("healthStatus", () => {
  it("reports the service as ok", () => {
    expect(healthStatus()).toEqual({ ok: true, service: "boost-posts" });
  });
});
