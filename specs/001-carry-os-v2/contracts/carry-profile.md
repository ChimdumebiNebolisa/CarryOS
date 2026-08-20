# Contract: POST /api/carry-profile

## Request

- Method: POST only
- Content-Type: `application/json`
- Body limit: 8 KB
- No authentication

```json
{
  "event": {
    "name": "Calculus II exam",
    "type": "exam-lab",
    "description": "Closed-book exam. Non-graphing calculators are allowed.",
    "location": "Science Building",
    "explicitInstructions": "Bring student ID."
  },
  "registeredItems": [
    { "itemId": "laptop", "name": "Laptop sleeve", "category": "Tech" }
  ]
}
```

### Field limits

| Field | Max |
|-------|-----|
| event.name | 120 |
| event.description | 1500 |
| event.location | 200 |
| event.explicitInstructions | 800 |
| registeredItems | 20 |
| event.type | class \| exam-lab \| internship \| other |

`registeredItems` MUST match the server registry by `itemId`. Client-supplied names cannot expand the registry.

## Success response (200)

```json
{
  "source": "model",
  "requiredItems": [
    {
      "itemId": "calculator",
      "confidence": 0.91,
      "reason": "Exam instructions allow a calculator.",
      "evidenceType": "explicit"
    }
  ],
  "optionalItems": [],
  "excludedItems": [],
  "unregisteredSuggestions": []
}
```

`source` is `model` or `fallback`. Fallback responses MUST be labeled in UI as deterministic fallback.

## Error responses

| Status | When | Body |
|--------|------|------|
| 400 | Invalid JSON, schema, unknown registered IDs, over-length fields | `{ "error": "safe message", "code": "invalid-request" }` |
| 415 | Missing/invalid content type | `{ "error": "...", "code": "unsupported-media-type" }` |
| 413 | Body > 8 KB | `{ "error": "...", "code": "payload-too-large" }` |
| 429 | Throttled | `{ "error": "Suggestions are temporarily limited. Try again shortly.", "code": "rate-limited" }` |
| 405 | Non-POST | `{ "error": "...", "code": "method-not-allowed" }` |
| 200 fallback | Missing credentials, timeout, network, invalid schema after one retry | Success shape with `source: "fallback"` |

Provider errors MUST NOT be forwarded. No raw model JSON on failure.

## Provider timeout and retry

- Hard timeout (8s recommended)
- At most one schema-repair retry when output is malformed
- Then fallback

## Rate limit

- Pluggable limiter
- Local/preview: per-instance, e.g. 8 requests / 10 minutes / IP-or-anon bucket
- 429 on exceed
- Behavior unit-tested with a fake clock/store

## Security

- Event text is untrusted data, not system instruction
- Model has no tools
- Output is schema-validated before client
- Reasons rendered as text, never HTML
- No `OPENAI_*` in client bundle
