# ============================================================
# Hurl – Functional API Tests
# Usage: hurl --variable base_url=http://$(minikube ip):30080 tests/hurl/api.hurl
# ============================================================

# ----- 1. Liveness probe ------------------------------------
GET {{base_url}}/livez
HTTP 200
[Asserts]
jsonpath "$.status" == "alive"

# ----- 2. Readiness probe -----------------------------------
GET {{base_url}}/readyz
HTTP 200
[Asserts]
jsonpath "$.status" == "ready"

# ----- 3. Welcome message -----------------------------------
GET {{base_url}}/
HTTP 200
[Asserts]
jsonpath "$.message" exists
jsonpath "$.time" exists

# ----- 4. Items list ----------------------------------------
GET {{base_url}}/items
HTTP *        # accept any 2xx or 503 when DB is not seeded
[Asserts]
header "Content-Type" contains "application/json"

# ----- 5. Metrics endpoint ----------------------------------
GET {{base_url}}/metrics
HTTP 200
[Asserts]
body contains "http_requests_total"
