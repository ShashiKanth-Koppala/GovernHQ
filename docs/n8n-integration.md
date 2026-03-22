# GovernHQ × n8n Integration Guide

> **For collaborators:** Everything you need to run, test, and extend the GovernHQ governance layer.

---

## What was built

GovernHQ sits between your n8n workflows and the actions they execute. Every agent intent is evaluated by the **Gate** before it runs. The Gate queries your org's policies in Supabase and returns `allow`, `pause`, or `block`. Every decision is logged to `ledger_events` for audit.

```text
n8n Cloud workflow
  └─► POST /webhook/inbound  (GovernHQ FastAPI backend, tunnelled via ngrok)
         ├─► organizations table  — verify org_api_key
         ├─► agents table         — upsert agent by name+source+org
         ├─► policies table       — evaluate intent against enabled rules
         ├─► ledger_events table  — log every decision
         └─► { decision, risk_score, reason, policy_matches, agent_id }
  └─► IF decision == allow  → continue
  └─► IF decision == pause  → Slack approval request
  └─► IF decision == block  → alert + halt
```

---

## Live credentials (current session)

| Key | Value |
| --- | ----- |
| **Org ID** | `bb68d152-08a4-4af9-8733-6b3124119af5` |
| **Org API key** (`org_api_key`) | `whk_live_5ac1f9d6e1f24c51a5c3f2b4b1f0a9d2` |
| **Webhook secret** (`X-Webhook-Secret`) | `whk_test_123` |
| **Supabase project** | `https://wiqvwvrlmysxcotrenbq.supabase.co` |
| **n8n cloud workspace** | `https://samiworkflows.app.n8n.cloud` |
| **n8n webhook path** | `govhq-intent` |
| **ngrok URL** (session — changes on restart) | `https://approvably-hypermodest-janiece.ngrok-free.dev` |

> **Security note:** `WEBHOOK_SECRET` and `org_api_key` must be different values in production. Rotate either in Supabase SQL Editor + `backend/.env`.

---

## Supabase schema — what was added

| Table | Column added | Purpose |
| ----- | ------------ | ------- |
| `organizations` | `api_key text unique` | Identifies caller org in webhook (migration 000003) |
| `ledger_events` | `organization_id uuid` | Scopes audit log per org (migration 000002) |
| `ledger_events` | `status` constraint | Enforces `allow / pause / block` values |
| `agents` | `source`, `metadata`, `risk_profile` | Tracks n8n/zapier origin + last_seen (migration 000001) |

**Set your org api_key (run once in Supabase SQL Editor):**

```sql
update organizations
set api_key = 'whk_live_5ac1f9d6e1f24c51a5c3f2b4b1f0a9d2'
where id = 'bb68d152-08a4-4af9-8733-6b3124119af5';
```

**Reload PostgREST schema cache after any ALTER TABLE:**

```sql
notify pgrst, 'reload schema';
```

---

## Gate configuration — how policies work

Policies are created in **GovernHQ → Policies tab** (frontend) or directly in Supabase.

Each policy has a `rule` jsonb field:

```json
{ "action": "block" | "review" | "log", "condition": "<intent substring>" }
```

| Policy action | Gate decision | Risk score | Meaning |
| ------------- | ------------- | ---------- | ------- |
| `block` | `block` | 0.95 | Intent matched — action halted |
| `review` | `pause` | 0.70 | Intent matched — awaiting human approval |
| `log` | `allow` | 0.20 | Intent logged but allowed |
| _(no match)_ | `allow` | 0.20 | No policy fired |

Priority: `block` > `review` > `log` > no match.

**Example — block all external data transfers:**

```sql
insert into policies (organization_id, name, description, rule, is_enabled)
values (
  'bb68d152-08a4-4af9-8733-6b3124119af5',
  'No external transfer',
  'Block any intent mentioning external API or data export',
  '{"action":"block","condition":"external api"}',
  true
);
```

---

## Start the stack (two terminals)

Run both commands simultaneously — open two PowerShell tabs:

**Terminal 1 — FastAPI backend:**

```powershell
.\backend\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 --env-file backend/.env
```

**Terminal 2 — ngrok tunnel:**

```powershell
ngrok http http://localhost:8000 --host-header=rewrite
```

Copy the `https://` Forwarding URL from the ngrok output.
Update `ENV — URL Config` node in n8n (the `BASE_URL` field) with the new URL.

**Verify the stack is up:**

```powershell
Invoke-RestMethod -Method GET `
  -Uri "https://<YOUR_NGROK_URL>/health" `
  -Headers @{ "ngrok-skip-browser-warning" = "1" }
# → { data: { ok: true, service: "governhq-backend" }, error: null, status: 200 }
```

---

## backend/.env (required variables)

```env
SUPABASE_URL=https://wiqvwvrlmysxcotrenbq.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_<your_secret_key>   # sb_secret_* format — NOT the publishable key
WEBHOOK_SECRET=whk_test_123
```

> **Critical:** `SUPABASE_SERVICE_KEY` must be the `sb_secret_*` key from
> Supabase → Project Settings → API → Secret keys.
> Using the publishable key causes all service queries to return `[]` (RLS blocks everything).

---

## Test the webhook directly (PowerShell)

**Test via n8n cloud webhook (triggers the full workflow):**

```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://samiworkflows.app.n8n.cloud/webhook-test/govhq-intent" `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"intent":"retrieve pending claims for daily triage"}'
# → { message: "Workflow was started" }
```

**Test backend directly via ngrok (bypasses n8n):**

```powershell
$body = @{
  source      = "n8n"
  agent_name  = "test-agent"
  org_api_key = "whk_live_5ac1f9d6e1f24c51a5c3f2b4b1f0a9d2"
  intent      = "retrieve pending claims for daily triage"
} | ConvertTo-Json

Invoke-RestMethod -Method POST `
  -Uri "https://<YOUR_NGROK_URL>/webhook/inbound" `
  -Headers @{
    "Content-Type"               = "application/json"
    "X-Webhook-Secret"           = "whk_test_123"
    "ngrok-skip-browser-warning" = "1"
  } `
  -Body $body
```

Expected response:

```json
{
  "data": {
    "agent_id": "<uuid>",
    "decision": "allow",
    "risk_score": 0.2,
    "reason": "No blocking policy matched.",
    "policy_matches": []
  },
  "error": null,
  "status": 200
}
```

---

## n8n workflow — how it works

The workflow has 11 nodes:

```text
Inbound Webhook
  └─► ENV — URL Config        ← change BASE_URL here when ngrok restarts
        └─► Build Request Body  ← Code node: validates intent, builds JSON body
              └─► GovernHQ Gate  ← POST /webhook/inbound (continueOnFail=true)
                    └─► Response Guard  ← catches HTTP errors / timeouts
                          ├─► (error)  Error — Log
                          └─► (ok)     Decision — Allow?
                                ├─► (allow)  Allowed — Continue
                                └─► (not allow)  Decision — Pause?
                                      ├─► (pause)  Pause — Notify Slack
                                      └─► (block)  Block — Alert
```

**To switch from ngrok to Render/production URL:**
Open `ENV — URL Config` node → change `BASE_URL` value → remove the `ngrok-skip-browser-warning` header from `GovernHQ Gate` node.

**To connect Slack:**
n8n → Credentials → New → Slack OAuth2 → complete OAuth flow →
open `Pause — Notify Slack` node → select the credential → set channel to `#approvals`.

---

## End-to-end test checklist

```text
□ Allow
  POST govhq-intent with intent: "retrieve pending claims for daily triage"
  No matching policy → decision: "allow" → Allowed — Continue reached
  Check Ledger tab: new row with status=allow

□ Block
  Policies tab → New policy: action=block, condition=retrieve
  Re-run same intent
  → decision: "block" → Block — Alert reached
  Check Ledger tab: new row with status=block

□ Pause
  Policies tab → edit policy to action=review (or create new one)
  Re-run same intent
  → decision: "pause" → Pause — Notify Slack reached
  Check Ledger tab: new row with status=pause

□ Error path
  Stop the backend (Ctrl+C), run workflow
  → Response Guard false branch → Error — Log reached
  error_message field shows the timeout/connection error

□ Agent auto-register
  After any successful POST, open GovernHQ → Agents tab
  "Webhook Agent" should appear with source=n8n, status=active
  metadata.last_seen updates on every subsequent call
```

---

## Workflow JSON (import into n8n)

```json
{
  "name": "GovernHQ Gate (Production)",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "govhq-intent",
        "responseMode": "onReceived",
        "options": {}
      },
      "id": "node-wh-01",
      "name": "Inbound Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 300],
      "webhookId": "b1c2d3e4-f5a6-7890-abcd-ef1234567890"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "env-url",
              "name": "BASE_URL",
              "value": "https://approvably-hypermodest-janiece.ngrok-free.dev",
              "type": "string"
            },
            {
              "id": "env-intent",
              "name": "intent",
              "value": "={{ $json.body.intent }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "id": "node-set-02",
      "name": "ENV — URL Config",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3,
      "position": [220, 300]
    },
    {
      "parameters": {
        "jsCode": "const d = $input.item.json;\n\nif (!d.intent || !d.intent.trim()) {\n  throw new Error('Missing or empty intent in webhook body');\n}\n\nreturn [{\n  json: {\n    BASE_URL: d.BASE_URL,\n    body: {\n      source: 'n8n',\n      agent_name: 'Webhook Agent',\n      org_api_key: 'whk_live_5ac1f9d6e1f24c51a5c3f2b4b1f0a9d2',\n      intent: d.intent.trim()\n    }\n  }\n}];"
      },
      "id": "node-code-03",
      "name": "Build Request Body",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [440, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $json.BASE_URL }}/webhook/inbound",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type",               "value": "application/json" },
            { "name": "X-Webhook-Secret",           "value": "whk_test_123" },
            { "name": "ngrok-skip-browser-warning", "value": "1" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ $json.body }}",
        "options": { "timeout": 10000 }
      },
      "id": "node-http-04",
      "name": "GovernHQ Gate",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [660, 300],
      "continueOnFail": true
    },
    {
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": true },
          "conditions": [
            {
              "id": "guard-decision",
              "leftValue": "={{ ($json.data || {}).decision || '' }}",
              "rightValue": "",
              "operator": { "type": "string", "operation": "notEmpty" }
            }
          ],
          "combinator": "and"
        }
      },
      "id": "node-if-05",
      "name": "Response Guard",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [880, 300]
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "err-msg",
              "name": "error_message",
              "value": "={{ 'GovernHQ Gate failed — ' + ($json.error || 'No decision returned') }}",
              "type": "string"
            },
            {
              "id": "err-code",
              "name": "status_code",
              "value": "={{ $json.statusCode || $json.status || 0 }}",
              "type": "number"
            },
            {
              "id": "err-body",
              "name": "raw_response",
              "value": "={{ $json }}",
              "type": "object"
            }
          ]
        }
      },
      "id": "node-set-06",
      "name": "Error — Log",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3,
      "position": [1100, 520]
    },
    {
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": true },
          "conditions": [
            {
              "id": "cond-allow",
              "leftValue": "={{ $json.data.decision }}",
              "rightValue": "allow",
              "operator": { "type": "string", "operation": "equals" }
            }
          ],
          "combinator": "and"
        }
      },
      "id": "node-if-07",
      "name": "Decision — Allow?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1100, 160]
    },
    {
      "parameters": {},
      "id": "node-noop-08",
      "name": "Allowed — Continue",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [1320, 40]
    },
    {
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": true },
          "conditions": [
            {
              "id": "cond-pause",
              "leftValue": "={{ $json.data.decision }}",
              "rightValue": "pause",
              "operator": { "type": "string", "operation": "equals" }
            }
          ],
          "combinator": "and"
        }
      },
      "id": "node-if-09",
      "name": "Decision — Pause?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1320, 300]
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "resource": "message",
        "operation": "post",
        "channel": { "__rl": true, "value": "#approvals", "mode": "name" },
        "text": "={{ '⏸ *GovernHQ — Action Paused (Human Approval Required)*\\n\\nAgent: `' + $json.data.agent_id + '`\\nRisk Score: ' + $json.data.risk_score + '\\nReason: ' + $json.data.reason + '\\nPolicies matched: ' + ($json.data.policy_matches.length ? $json.data.policy_matches.join(', ') : 'none') + '\\n\\nReply *approve* or *reject* in this thread.' }}",
        "otherOptions": {}
      },
      "id": "node-slack-10",
      "name": "Pause — Notify Slack",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2,
      "position": [1540, 180],
      "credentials": {
        "slackOAuth2Api": {
          "id": "REPLACE_WITH_YOUR_SLACK_CREDENTIAL_ID",
          "name": "Slack account — GovernHQ"
        }
      }
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "blk-alert",
              "name": "alert",
              "value": "={{ '🚫 BLOCKED — ' + $json.data.reason + ' | Policies: ' + ($json.data.policy_matches.length ? $json.data.policy_matches.join(', ') : 'none') }}",
              "type": "string"
            },
            {
              "id": "blk-score",
              "name": "risk_score",
              "value": "={{ $json.data.risk_score }}",
              "type": "number"
            },
            {
              "id": "blk-agent",
              "name": "agent_id",
              "value": "={{ $json.data.agent_id }}",
              "type": "string"
            }
          ]
        }
      },
      "id": "node-set-11",
      "name": "Block — Alert",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3,
      "position": [1540, 420]
    }
  ],
  "connections": {
    "Inbound Webhook":    { "main": [[{ "node": "ENV — URL Config",    "type": "main", "index": 0 }]] },
    "ENV — URL Config":   { "main": [[{ "node": "Build Request Body",  "type": "main", "index": 0 }]] },
    "Build Request Body": { "main": [[{ "node": "GovernHQ Gate",        "type": "main", "index": 0 }]] },
    "GovernHQ Gate":      { "main": [[{ "node": "Response Guard",       "type": "main", "index": 0 }]] },
    "Response Guard": {
      "main": [
        [{ "node": "Decision — Allow?", "type": "main", "index": 0 }],
        [{ "node": "Error — Log",       "type": "main", "index": 0 }]
      ]
    },
    "Decision — Allow?": {
      "main": [
        [{ "node": "Allowed — Continue", "type": "main", "index": 0 }],
        [{ "node": "Decision — Pause?",  "type": "main", "index": 0 }]
      ]
    },
    "Decision — Pause?": {
      "main": [
        [{ "node": "Pause — Notify Slack", "type": "main", "index": 0 }],
        [{ "node": "Block — Alert",        "type": "main", "index": 0 }]
      ]
    }
  },
  "settings": { "executionOrder": "v1" },
  "pinData": {}
}
```
