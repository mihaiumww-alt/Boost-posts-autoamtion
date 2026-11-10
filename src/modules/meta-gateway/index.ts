/**
 * Meta Gateway: the ONLY module allowed to call Meta's APIs. Pins the API version, paces requests, maps errors,
 * and enforces the write guard (never ACTIVE, writes off by default, test-account allowlist).
 *
 * Public entry point of this module. Other modules and pages import only from
 * "@/modules/meta-gateway", never from files inside this folder.
 */
export {};
