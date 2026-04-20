import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// ---------------------------------------------------------------------------
// Custom metric – track error rate separately
// ---------------------------------------------------------------------------
const errorRate = new Rate("errors");

// ---------------------------------------------------------------------------
// Load profile
// ---------------------------------------------------------------------------
export const options = {
  stages: [
    { duration: "30s", target: 10 },   // Ramp-up   : 0 → 10 VUs
    { duration: "1m",  target: 50 },   // Load      : hold 50 VUs
    { duration: "30s", target: 100 },  // Spike     : 50 → 100 VUs
    { duration: "30s", target: 0 },    // Ramp-down : back to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],  // 95% of requests must finish < 500 ms
    errors: ["rate<0.01"],             // Error rate must stay below 1%
  },
};

// ---------------------------------------------------------------------------
// Default function (executed by each VU on each iteration)
// ---------------------------------------------------------------------------
export default function () {
  const BASE_URL = __ENV.BASE_URL || "http://localhost:30080";

  // --- Test 1: Welcome endpoint ---
  const welcome = http.get(`${BASE_URL}/`);
  check(welcome, {
    "welcome: status 200": (r) => r.status === 200,
    "welcome: has message": (r) => r.json("message") !== undefined,
  });
  errorRate.add(welcome.status !== 200);

  sleep(0.2);

  // --- Test 2: Readiness probe ---
  const ready = http.get(`${BASE_URL}/readyz`);
  check(ready, {
    "readyz: status 200": (r) => r.status === 200,
  });

  sleep(0.2);

  // --- Test 3: Items endpoint ---
  const items = http.get(`${BASE_URL}/items`);
  check(items, {
    "items: status 200 or 503": (r) =>
      r.status === 200 || r.status === 503,
  });

  sleep(0.5);
}
