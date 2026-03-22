## How GovernHQ Makes Decisions

### The Three Outcomes

Every time an agent wants to do something, it sends its **intent** — a plain text description of what it's about to do — to the Gate. The Gate returns one of three decisions:

**Allow** — the action is clean. No matching block or review policy, risk score below threshold. The agent executes its tool normally.

**Pause** — the action is suspicious but not certain enough to stop outright. A policy with `action: "review"` matched, or the risk score landed in the middle range (≥0.45). The action is held. It appears in the Review Queue for a human to approve, reject, or defer. The agent waits.

**Block** — the action is forbidden. A policy with `action: "block"` matched, or the risk score crossed the hard threshold (≥0.75). The tool call never executes. `GovernHQBlockedError` is raised. The agent stops.

---

### What Exactly Gets Blocked — The Agent or the Action?

This is the key distinction. **GovernHQ blocks the action, not the agent.**

The agent itself stays registered, stays active, and can send future intents. What gets stopped is the specific tool call it was about to make. Think of it like a bouncer at a door — the person isn't banned from the building, just this particular door at this particular moment.

The only way an agent itself gets blocked is if a human goes into the Agents tab and manually sets its status to `blocked` — which prevents it from executing anything until re-enabled. That's an administrative action, not an automated Gate decision.

---

### The Full Decision Pipeline

Here is the exact sequence every intent goes through:

```
Agent sends intent
        ↓
1. IDENTITY CHECK
   Is the JWT valid? Does org_id resolve?
   Is the agent registered under this org?
   → No: 401/403, request rejected before Gate even runs

2. RATE LIMIT CHECK
   Has this org exceeded 100 Gate calls in 60 seconds?
   → Yes: 429, request rejected

3. ANOMALY DETECTION  ← runs BEFORE scoring
   detect_anomalies(agent_id, org_id) checks 3 rules:
   - High frequency: >10 calls in 60 seconds → anomaly_score = 1.0
   - Repeated blocks: >3 blocks in last 5 minutes → anomaly_score = 1.0
   - Risk spike: previous risk_score > 0.95 → anomaly_score = 1.0
   → Clean: anomaly_score = 0.0

4. POLICY EVALUATION
   Query policies table (is_enabled=true, org-scoped)
   Match rule.condition as substring of intent (case-insensitive)
   → Determine intent_action: block / review / log / none

5. RISK SCORING
   Weighted formula:
   agent_score  = risk_profile weight  (high=1.0, medium=0.85, low=0.70)
   intent_score = policy action weight (block=0.95, review=0.65, log=0.25, none=0.10)
   anomaly_score = 1.0 if anomaly detected, else 0.0

   final_score = (agent_score × 0.30)
               + (intent_score × 0.50)
               + (anomaly_score × 0.20)

6. THRESHOLD DECISION
   final_score ≥ 0.75 → BLOCK
   final_score ≥ 0.45 → PAUSE
   final_score < 0.45 → ALLOW

7. AUDIT LOG
   Every decision written to ledger_events with:
   trace_id, gate_ms, risk_score, anomaly flag, org_id
```

---

### When Does Anomaly Detection Change the Outcome?

By itself, anomaly detection doesn't directly decide the outcome — it feeds the risk score. But because it carries a 20% weight and pushes `anomaly_score` to 1.0, it can tip a borderline decision over a threshold.

**Example — anomaly pushes allow to pause:**
An agent with `risk_profile=low` sends an innocuous intent that matches only a `log` policy:
- Without anomaly: `(0.70×0.30) + (0.25×0.50) + (0.0×0.20)` = 0.21 + 0.125 + 0 = **0.335 → allow**
- With anomaly detected: `(0.70×0.30) + (0.25×0.50) + (1.0×0.20)` = 0.21 + 0.125 + 0.2 = **0.535 → pause**

**Example — anomaly pushes pause to block:**
An agent with `risk_profile=medium` hits a `review` policy:
- Without anomaly: `(0.85×0.30) + (0.65×0.50) + (0.0×0.20)` = 0.255 + 0.325 + 0 = **0.58 → pause**
- With anomaly: `(0.85×0.30) + (0.65×0.50) + (1.0×0.20)` = 0.255 + 0.325 + 0.2 = **0.78 → block**

---

### Practical Summary

| Scenario | What happens |
|----------|-------------|
| Normal agent, clean intent, no matching policy | allow — tool executes |
| Intent matches a "review" policy | pause — goes to Review Queue |
| Intent matches a "block" policy | block — tool never runs |
| Clean intent but agent is behaving anomalously | risk score rises, may tip to pause or block |
| Agent manually set to blocked in UI | all executions rejected regardless of Gate |
| Rate limit exceeded | 429 — Gate doesn't even evaluate |

The design principle is: **the Gate governs behavior, not identity**. An agent is a registered entity with a risk profile. Each individual action it takes gets independently evaluated against the current policies and its current behavioral pattern. A well-behaved high-risk agent can still get through. A low-risk agent behaving anomalously will get caught.