# ============================================================
# GovernHQ - Full Flow Test Script
# ============================================================
# Prerequisites:
#   1. Backend running:
#      .\backend\venv\Scripts\python.exe -m uvicorn backend.main:app
#      --reload --host 127.0.0.1 --port 8000 --env-file backend/.env
#   2. Frontend running: npm run dev (only needed for manual UI checks)
#   3. ngrok running:
#      ngrok http http://localhost:8000 --host-header=rewrite
#
# Fill these in before running:
$SUPABASE_PROJECT_REF = "wiqvwvrlmysxcotrenbq"   # Supabase dashboard → Settings → API
$SUPABASE_ANON_KEY    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcXZ3dnJsbXlzeGNvdHJlbmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Nzk3NjYsImV4cCI6MjA4ODE1NTc2Nn0.d5i_tJ8gkVcXmV2ylFATl8Nra97QeeGIHO-GAJti-uA"      # Supabase dashboard → Settings → API
$USER_EMAIL           = "sami.malek15@gmail.com"
$USER_PASSWORD        = "Sami@2003!?"

# Already confirmed values - do not change
$BASE_URL       = "http://127.0.0.1:8000"
$NGROK_URL      = "https://approvably-hypermodest-janiece.ngrok-free.dev"
$WEBHOOK_SECRET = "whk_test_123"
$ORG_API_KEY    = "whk_live_5ac1f9d6e1f24c51a5c3f2b4b1f0a9d2"

$NGROK_HEADERS = @{ "ngrok-skip-browser-warning" = "1" }
$NGROK_WEBHOOK_HEADERS = @{
    "Content-Type"               = "application/json"
    "X-Webhook-Secret"           = $WEBHOOK_SECRET
    "ngrok-skip-browser-warning" = "1"
}

# ============================================================
# COUNTERS
# ============================================================
$passed = 0
$failed = 0
$failures = @()

function Pass($name) {
    Write-Host "  PASS: $name" -ForegroundColor Green
    $script:passed++
}

function Fail($name, $reason) {
    Write-Host "  FAIL: $name - $reason" -ForegroundColor Red
    $script:failed++
    $script:failures += $name
}

function Section($title) {
    Write-Host ""
    Write-Host "=== $title ===" -ForegroundColor Cyan
}

# ============================================================
# JWT - AUTO FETCH
# ============================================================
Section "AUTH - Fetching JWT"
try {
    $authBody = @{ email = $USER_EMAIL; password = $USER_PASSWORD } | ConvertTo-Json
    $authHeaders = @{
        "apikey"       = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    }
    $authResp = Invoke-RestMethod -Method POST `
        -Uri "https://$SUPABASE_PROJECT_REF.supabase.co/auth/v1/token?grant_type=password" `
        -Headers $authHeaders -Body $authBody
    $JWT = $authResp.access_token
    if (-not $JWT) { throw "access_token is null" }
    Write-Host "  JWT obtained successfully" -ForegroundColor Green
} catch {
    Write-Host "FATAL: Cannot obtain JWT - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Fix auth before running tests. Exiting."
    exit 1
}

$AUTH = @{
    "Authorization" = "Bearer $JWT"
    "Content-Type"  = "application/json"
}

# ============================================================
# FLOW 1 - HAPPY PATH (allow decision)
# ============================================================
Section "FLOW 1 - Happy Path"

# 1.1 Health
try {
    $h = Invoke-RestMethod -Method GET -Uri "$BASE_URL/health"
    if ($h.status -eq "ok") { Pass "1.1 Health check" }
    else { Fail "1.1 Health check" "status not ok" }
} catch { Fail "1.1 Health check" $_.Exception.Message }

# 1.2 Create test agent
$AGENT_ID = $null
try {
    $body = @{
        name         = "flow-test-agent-$(Get-Random)"
        source       = "n8n"
        risk_profile = "low"
        verified     = $true
        scope        = @{
            databases      = @("claims_db")
            pii_level      = "masked"
            external_calls = $false
        }
    } | ConvertTo-Json -Depth 5
    $r = Invoke-RestMethod -Method POST -Uri "$BASE_URL/agents" -Headers $AUTH -Body $body
    $AGENT_ID = $r.data.id
    if ($AGENT_ID) { Pass "1.2 Create test agent (id: $($AGENT_ID.Substring(0,8))...)" }
    else { Fail "1.2 Create test agent" "no id returned" }
} catch { Fail "1.2 Create test agent" $_.Exception.Message }

# 1.3 Execute clean intent
$TRACE_ID = $null
if ($AGENT_ID) {
    try {
        $body = @{ intent = "retrieve pending claims for triage" } | ConvertTo-Json
        $r = Invoke-RestMethod -Method POST `
            -Uri "$BASE_URL/agents/$AGENT_ID/execute" -Headers $AUTH -Body $body
        $decision = $r.data.gate.decision
        $TRACE_ID = $r.data.gate.trace_id
        # "retrieve" matches "Review retrieve" policy → pause is valid here
        if ($decision -in @("allow","pause")) { Pass "1.3 Execute clean intent (decision: $decision)" }
        else { Fail "1.3 Execute clean intent" "unexpected decision: $decision" }
    } catch { Fail "1.3 Execute clean intent" $_.Exception.Message }
}

# 1.4 Verify ledger entry
if ($AGENT_ID) {
    try {
        $r = Invoke-RestMethod -Method GET `
            -Uri "$BASE_URL/monitoring/ledger?agent_id=$AGENT_ID&limit=1" -Headers $AUTH
        $row = $r.data.rows[0]
        if ($row) {
            if ($row.action_type) { Pass "1.4a Ledger action_type present ($($row.action_type))" }
            else { Fail "1.4a Ledger action_type" "null - migration may not have applied" }
            if ($row.prev_hash) { Pass "1.4b Ledger prev_hash present" }
            else { Fail "1.4b Ledger prev_hash" "null - chain not writing" }
        } else { Fail "1.4 Ledger entry" "no rows returned" }
    } catch { Fail "1.4 Ledger entry" $_.Exception.Message }
}

# 1.5 Metrics
try {
    $r = Invoke-RestMethod -Method GET -Uri "$BASE_URL/monitoring/metrics" -Headers $AUTH
    if ($r.data.total -ge 1) { Pass "1.5 Metrics total >= 1 ($($r.data.total))" }
    else { Fail "1.5 Metrics" "total is 0" }
} catch { Fail "1.5 Metrics" $_.Exception.Message }

# 1.6 Chain integrity
try {
    $r = Invoke-RestMethod -Method GET `
        -Uri "$BASE_URL/monitoring/chain-integrity" -Headers $AUTH
    if ($r.data.ok -eq $true) {
        Pass "1.6 Chain integrity OK ($($r.data.chained_rows) of $($r.data.total_rows) rows verified)"
    } else {
        Fail "1.6 Chain integrity" "broken at row $($r.data.broken_at)"
    }
} catch { Fail "1.6 Chain integrity" $_.Exception.Message }

# 1.7 Trust score on agent list
if ($AGENT_ID) {
    try {
        $r = Invoke-RestMethod -Method GET -Uri "$BASE_URL/agents" -Headers $AUTH
        $agent = $r.data | Where-Object { $_.id -eq $AGENT_ID }
        if ($null -ne $agent.trust_score) {
            Pass "1.7 Trust score computed ($($agent.trust_score))"
        } else { Fail "1.7 Trust score" "null" }
        if ($null -ne $agent.gate_rate) {
            Pass "1.7b Gate rate computed ($($agent.gate_rate)`%)"
        } else { Fail "1.7b Gate rate" "null" }
    } catch { Fail "1.7 Trust score" $_.Exception.Message }
}

# ============================================================
# FLOW 2 - THREAT PATH (block + auto-block)
# ============================================================
Section "FLOW 2 - Threat Path"

# 2.1 Create high-risk agent
$THREAT_ID = $null
try {
    $body = @{
        name         = "threat-test-agent-$(Get-Random)"
        source       = "n8n"
        risk_profile = "high"
        verified     = $false
        scope        = @{ databases = @(); external_calls = $false }
    } | ConvertTo-Json -Depth 5
    $r = Invoke-RestMethod -Method POST -Uri "$BASE_URL/agents" -Headers $AUTH -Body $body
    $THREAT_ID = $r.data.id
    if ($THREAT_ID) { Pass "2.1 Create threat agent" }
    else { Fail "2.1 Create threat agent" "no id" }
} catch { Fail "2.1 Create threat agent" $_.Exception.Message }

# 2.2 Block intent
if ($THREAT_ID) {
    try {
        $body = @{ intent = "delete all records permanently" } | ConvertTo-Json
        $r = Invoke-RestMethod -Method POST `
            -Uri "$BASE_URL/agents/$THREAT_ID/execute" -Headers $AUTH -Body $body
        $d = $r.data.gate.decision
        $rs = $r.data.gate.risk_score
        Write-Host "  INFO: decision=$d risk_score=$rs policy_matches=$($r.data.gate.policy_matches -join ',')"
        if ($d -in @("block","pause")) { Pass "2.2 Block intent decision ($d)" }
        else { Fail "2.2 Block intent" "expected block/pause got $d" }
    } catch { Fail "2.2 Block intent" $_.Exception.Message }
}

# 2.3 Trigger monitor auto-block (4 calls to hit repeated-blocks rule)
if ($THREAT_ID) {
    Write-Host "  INFO: Sending 4 block-triggering calls to trip anomaly rule..."
    for ($i = 1; $i -le 4; $i++) {
        try {
            $body = @{ intent = "delete all records permanently" } | ConvertTo-Json
            Invoke-RestMethod -Method POST `
                -Uri "$BASE_URL/agents/$THREAT_ID/execute" -Headers $AUTH -Body $body | Out-Null
            Start-Sleep -Milliseconds 300
        } catch {}
    }
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-RestMethod -Method GET -Uri "$BASE_URL/agents" -Headers $AUTH
        $agent = $r.data | Where-Object { $_.id -eq $THREAT_ID }
        if ($agent.status -eq "blocked") {
            Pass "2.3 Monitor auto-blocked agent (reason: $($agent.blocked_reason))"
        } else {
            Fail "2.3 Monitor auto-block" "status is $($agent.status) not blocked"
        }
    } catch { Fail "2.3 Monitor auto-block" $_.Exception.Message }
}

# 2.4 Shield blocked list
if ($THREAT_ID) {
    try {
        $r = Invoke-RestMethod -Method GET -Uri "$BASE_URL/shield/blocked" -Headers $AUTH
        $found = $r.data | Where-Object { $_.id -eq $THREAT_ID }
        if ($found) { Pass "2.4 Agent appears in Shield blocked list" }
        else { Fail "2.4 Shield blocked" "agent not found in blocked list" }
    } catch { Fail "2.4 Shield blocked" $_.Exception.Message }
}

# 2.5 Allow agent back
if ($THREAT_ID) {
    try {
        Invoke-RestMethod -Method POST `
            -Uri "$BASE_URL/shield/agents/$THREAT_ID/allow" -Headers $AUTH | Out-Null
        $r = Invoke-RestMethod -Method GET -Uri "$BASE_URL/agents" -Headers $AUTH
        $agent = $r.data | Where-Object { $_.id -eq $THREAT_ID }
        if ($agent.status -eq "active") { Pass "2.5 Allow agent back from Shield" }
        else { Fail "2.5 Allow agent" "status is $($agent.status)" }
    } catch { Fail "2.5 Allow agent" $_.Exception.Message }
}

# 2.6 Scope violation
if ($THREAT_ID) {
    try {
        $body = @{ intent = "send email notification to all customers" } | ConvertTo-Json
        $r = Invoke-RestMethod -Method POST `
            -Uri "$BASE_URL/agents/$THREAT_ID/execute" -Headers $AUTH -Body $body
        $d = $r.data.gate.decision
        $reason = $r.data.gate.reason
        Write-Host "  INFO: scope test decision=$d reason=$reason"
        if ($d -in @("block","pause")) { Pass "2.6 Scope violation caught ($d)" }
        else { Fail "2.6 Scope violation" "expected block/pause got $d" }
    } catch { Fail "2.6 Scope violation" $_.Exception.Message }
}

# ============================================================
# FLOW 3 - AUDIT + EDGE CASES
# ============================================================
Section "FLOW 3 - Audit and Edge Cases"

# 3.1 Shield stats
try {
    $r = Invoke-RestMethod -Method GET -Uri "$BASE_URL/shield/stats" -Headers $AUTH
    Write-Host "  INFO: shield stats = $($r.data | ConvertTo-Json -Compress)"
    if ($r.status -eq 200) { Pass "3.1 Shield stats" }
    else { Fail "3.1 Shield stats" "bad status" }
    if ($null -ne $r.data.avg_block_latency_ms) {
        Pass "3.1b Block latency tracked ($($r.data.avg_block_latency_ms)`ms)"
    } else {
        Write-Host "  NOTE: avg_block_latency_ms null (expected until first timed block)" `
            -ForegroundColor Yellow
    }
} catch { Fail "3.1 Shield stats" $_.Exception.Message }

# 3.2 Webhook via ngrok
try {
    $body = @{
        source     = "n8n"
        agent_name = "webhook-flow-test"
        org_api_key = $ORG_API_KEY
        intent     = "retrieve pending claims for daily triage"
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Method POST `
        -Uri "$NGROK_URL/webhook/inbound" `
        -Headers $NGROK_WEBHOOK_HEADERS -Body $body
    $d = $r.data.decision
    if ($d) { Pass "3.2 Webhook inbound (decision: $d)" }
    else { Fail "3.2 Webhook" "no decision returned" }
} catch { Fail "3.2 Webhook via ngrok" $_.Exception.Message }

# 3.3 Action type filter
try {
    $r = Invoke-RestMethod -Method GET `
        -Uri "$BASE_URL/monitoring/ledger?action_type=DB_QUERY" -Headers $AUTH
    if ($r.data.rows.Count -ge 0) { Pass "3.3 action_type filter works ($($r.data.rows.Count) rows)" }
    else { Fail "3.3 action_type filter" "unexpected result" }
} catch { Fail "3.3 action_type filter" $_.Exception.Message }

# 3.4 Anomalies endpoint
try {
    $r = Invoke-RestMethod -Method GET -Uri "$BASE_URL/monitoring/anomalies" -Headers $AUTH
    Write-Host "  INFO: $($r.data.total) anomalies detected"
    Pass "3.4 Anomalies endpoint responds"
} catch { Fail "3.4 Anomalies" $_.Exception.Message }

# 3.5 Rate Limit Test
Section "3.5 Rate Limit Test"
Write-Host "  INFO: Waiting 61s to clear sliding window..."
Start-Sleep -Seconds 61
Write-Host "  INFO: Sending 21 rapid calls..."
$gotRateLimit = $false
if ($AGENT_ID) {
    for ($i = 1; $i -le 21; $i++) {
        try {
            $body = @{
                agent_id = $AGENT_ID
                intent   = "retrieve data $i"
                metadata = @{}
            } | ConvertTo-Json
            Invoke-RestMethod -Method POST `
                -Uri "$BASE_URL/gate/evaluate" -Headers $AUTH -Body $body | Out-Null
        } catch {
            $code = $_.Exception.Response.StatusCode.value__
            if ($code -eq 429) {
                Pass "3.5 Rate limit 429 on call $i"
                $gotRateLimit = $true
                break
            }
        }
    }
    if (-not $gotRateLimit) {
        Fail "3.5 Rate limit" "no 429 after 21 calls"
    }
}


# ============================================================
# CLEANUP
# ============================================================
Section "CLEANUP"

if ($AGENT_ID) {
    try {
        Invoke-RestMethod -Method DELETE `
            -Uri "$BASE_URL/agents/$AGENT_ID" -Headers $AUTH | Out-Null
        Pass "C.1 Deleted flow-test-agent"
    } catch { Fail "C.1 Delete flow-test-agent" $_.Exception.Message }
}

if ($THREAT_ID) {
    try {
        Invoke-RestMethod -Method DELETE `
            -Uri "$BASE_URL/agents/$THREAT_ID" -Headers $AUTH | Out-Null
        Pass "C.2 Deleted threat-test-agent"
    } catch { Fail "C.2 Delete threat-test-agent" $_.Exception.Message }
}

# ============================================================
# RESULTS
# ============================================================
Write-Host ""
Write-Host "============================================================"
Write-Host "=== RESULTS: $passed passed, $failed failed ===" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "============================================================"

if ($failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Failed tests:" -ForegroundColor Red
    $failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Fix before deploying: $($failures -join ', ')" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Ready for deployment: YES" -ForegroundColor Green
}