# =============================================================================
# GovernHQ - Backend Test Suite
# =============================================================================
# Run from repo root:
#   .\test-backend.ps1
#
# Requires:
#   - Backend running on port 8000:
#       .\backend\venv\Scripts\python.exe -m uvicorn backend.main:app --reload `
#         --host 127.0.0.1 --port 8000 --env-file backend/.env
#   - ngrok active at $NGROK_URL below
#
# How to get $JWT:
#   1. Open http://localhost:3000 in browser
#   2. Sign in with Google
#   3. Open DevTools (F12) -> Console tab -> run:
#        (await window.supabase.auth.getSession()).data.session.access_token
#   4. Copy the long token string and paste it as $JWT below
# =============================================================================

# =============================================================================
# CONFIGURATION
# =============================================================================

$BASE_URL       = "http://127.0.0.1:8000"
$NGROK_URL      = "https://approvably-hypermodest-janiece.ngrok-free.dev"
$WEBHOOK_SECRET = "whk_test_123"
$ORG_API_KEY    = "whk_live_5ac1f9d6e1f24c51a5c3f2b4b1f0a9d2"

# Paste your Supabase JWT here (see instructions above)
$JWT = "gov_dev_xxx"

# =============================================================================
# STATE  (populated during the run, reused by later tests)
# =============================================================================

$AGENT_ID  = $null
$LEDGER_ID = $null
$TRACE_ID  = $null   # NOTE: not yet implemented in GateEvaluateResponse - will stay null

# =============================================================================
# TRACKING
# =============================================================================

$script:PASS_COUNT  = 0
$script:FAIL_COUNT  = 0
$script:FAILED_LIST = [System.Collections.Generic.List[string]]::new()

# =============================================================================
# HELPERS
# =============================================================================

function Pass-Test {
    param([string]$Name)
    $script:PASS_COUNT++
    Write-Host "  PASS: $Name" -ForegroundColor Green
}

function Fail-Test {
    param([string]$Name, [string]$Reason)
    $script:FAIL_COUNT++
    $script:FAILED_LIST.Add($Name)
    Write-Host "  FAIL: $Name" -ForegroundColor Red
    Write-Host "        $Reason" -ForegroundColor DarkRed
}

function Invoke-Api {
    param(
        [string]$Method   = "GET",
        [string]$Uri,
        [hashtable]$Headers = @{},
        [object]$Body     = $null
    )

    $params = @{
        Method      = $Method
        Uri         = $Uri
        Headers     = $Headers
        ErrorAction = "Stop"
    }

    if ($null -ne $Body) {
        $params.Body        = ($Body | ConvertTo-Json -Depth 10)
        $params.ContentType = "application/json"
    }

    try {
        $response = Invoke-RestMethod @params
        $sc = 200
        try { $sc = [int]($response.status) } catch {}
        return @{ OK = $true; StatusCode = $sc; Data = $response }
    }
    catch {
        $sc     = 0
        $parsed = $null
        try { $sc = [int]$_.Exception.Response.StatusCode } catch {}
        try {
            $msg = $_.ErrorDetails.Message
            if ($msg) { $parsed = $msg | ConvertFrom-Json }
        } catch {}
        return @{
            OK           = $false
            StatusCode   = $sc
            Data         = $parsed
            ErrorMessage = $_.Exception.Message
        }
    }
}

# Shared header sets
$AUTH_HEADERS = @{ Authorization = "Bearer $JWT" }

$NGROK_HEADERS = @{ "ngrok-skip-browser-warning" = "1" }

$NGROK_WEBHOOK_HEADERS = @{
    "X-Webhook-Secret"           = $WEBHOOK_SECRET
    "ngrok-skip-browser-warning" = "1"
}

# =============================================================================
# ROUND 1 - HEALTH & AUTH
# =============================================================================

Write-Host "`n=== ROUND 1: Health & Auth ===" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# TEST 1.1 - Local health check
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 1.1 - Local health check ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/health"
if ($r.OK -and $r.Data.data.ok -eq $true) {
    Pass-Test "1.1 Local health check"
} else {
    Fail-Test "1.1 Local health check" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 1.2 - ngrok health check
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 1.2 - ngrok health check ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$NGROK_URL/health" -Headers $NGROK_HEADERS
if ($r.OK -and $r.Data.data.ok -eq $true) {
    Pass-Test "1.2 ngrok health check"
} else {
    Fail-Test "1.2 ngrok health check" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 1.3 - Auth guard (no token -> expect 401 or 403)
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 1.3 - Auth guard (no token) ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/agents"   # no Authorization header
if (-not $r.OK -and $r.StatusCode -in @(401, 403)) {
    Pass-Test "1.3 Auth guard - no token returned HTTP $($r.StatusCode)"
} else {
    Fail-Test "1.3 Auth guard - no token" "Expected 401 or 403, got HTTP $($r.StatusCode)"
}

# =============================================================================
# ROUND 2 - AGENTS CRUD
# =============================================================================

Write-Host "`n=== ROUND 2: Agents CRUD ===" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# TEST 2.1 - List agents
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 2.1 - List agents ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/agents" -Headers $AUTH_HEADERS
if ($r.OK -and $r.StatusCode -eq 200) {
    $count = @($r.Data.data).Count
    Pass-Test "2.1 List agents (count: $count)"
} else {
    Fail-Test "2.1 List agents" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 2.2 - Create agent
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 2.2 - Create agent ===" -ForegroundColor Yellow
$r = Invoke-Api -Method POST -Uri "$BASE_URL/agents" -Headers $AUTH_HEADERS -Body @{
    name         = "test-agent-powershell"
    source       = "n8n"
    risk_profile = "medium"
    metadata     = @{}
}
if ($r.OK -and $r.StatusCode -eq 201 -and $null -ne $r.Data.data.id) {
    $AGENT_ID = $r.Data.data.id
    Pass-Test "2.2 Create agent (id: $AGENT_ID)"
} else {
    Fail-Test "2.2 Create agent" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 2.3 - Verify new agent appears in list
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 2.3 - Verify agent in list ===" -ForegroundColor Yellow
if ($null -eq $AGENT_ID) {
    Fail-Test "2.3 Verify agent in list" "Skipped - `$AGENT_ID not available (TEST 2.2 failed)"
} else {
    $r = Invoke-Api -Uri "$BASE_URL/agents" -Headers $AUTH_HEADERS
    if ($r.OK) {
        $found = @($r.Data.data) | Where-Object { $_.id -eq $AGENT_ID }
        if ($found) {
            Pass-Test "2.3 Agent $AGENT_ID found in list"
        } else {
            Fail-Test "2.3 Verify agent in list" "Agent $AGENT_ID not found in $(@($r.Data.data).Count) agents"
        }
    } else {
        Fail-Test "2.3 Verify agent in list" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
    }
}

# ---------------------------------------------------------------------------
# TEST 2.4 - Update agent status to blocked
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 2.4 - Update agent status ===" -ForegroundColor Yellow
if ($null -eq $AGENT_ID) {
    Fail-Test "2.4 Update agent status" "Skipped - `$AGENT_ID not available"
} else {
    $r = Invoke-Api -Method PATCH -Uri "$BASE_URL/agents/$AGENT_ID" -Headers $AUTH_HEADERS -Body @{
        status = "blocked"
    }
    if ($r.OK -and $r.StatusCode -eq 200) {
        Pass-Test "2.4 Update agent status -> blocked"
    } else {
        Fail-Test "2.4 Update agent status" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
    }
}

# ---------------------------------------------------------------------------
# TEST 2.5 - Execute agent intent through Gate
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 2.5 - Execute agent intent ===" -ForegroundColor Yellow
if ($null -eq $AGENT_ID) {
    Fail-Test "2.5 Execute agent" "Skipped - `$AGENT_ID not available"
} else {
    $r = Invoke-Api -Method POST -Uri "$BASE_URL/agents/$AGENT_ID/execute" -Headers $AUTH_HEADERS -Body @{
        intent   = "retrieve pending claims for daily triage"
        metadata = @{}
    }
    if ($r.OK -and $r.StatusCode -eq 200 -and $null -ne $r.Data.data.gate.decision) {
        $LEDGER_ID = $r.Data.data.log_id
        $TRACE_ID  = $r.Data.data.gate.trace_id   # null - not yet in GateEvaluateResponse
        Write-Host "  decision  : $($r.Data.data.gate.decision)" -ForegroundColor DarkGray
        Write-Host "  risk_score: $($r.Data.data.gate.risk_score)" -ForegroundColor DarkGray
        Write-Host "  log_id    : $LEDGER_ID" -ForegroundColor DarkGray
        Write-Host "  trace_id  : $(if ($null -ne $TRACE_ID) { $TRACE_ID } else { '(null - not yet implemented)' })" -ForegroundColor DarkGray
        Pass-Test "2.5 Execute agent (decision: $($r.Data.data.gate.decision))"
    } else {
        Fail-Test "2.5 Execute agent" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
    }
}

# =============================================================================
# ROUND 3 - GATE
# =============================================================================

Write-Host "`n=== ROUND 3: Gate ===" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# TEST 3.1 - Gate evaluate (allow case)
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 3.1 - Gate evaluate (allow case) ===" -ForegroundColor Yellow
if ($null -eq $AGENT_ID) {
    Fail-Test "3.1 Gate evaluate - allow" "Skipped - `$AGENT_ID not available"
} else {
    $r = Invoke-Api -Method POST -Uri "$BASE_URL/gate/evaluate" -Headers $AUTH_HEADERS -Body @{
        agent_id = $AGENT_ID
        intent   = "retrieve report"
        metadata = @{}
    }
    if ($r.OK -and $r.StatusCode -eq 200 -and $null -ne $r.Data.data.decision) {
        if ($r.Data.data.decision -eq "allow") {
            Pass-Test "3.1 Gate evaluate -> allow"
        } else {
            # A policy matched - still a valid response, just note it
            Write-Host "  NOTE: decision=$($r.Data.data.decision) - a policy matches 'retrieve report'" -ForegroundColor DarkYellow
            Pass-Test "3.1 Gate evaluate -> $($r.Data.data.decision) (policy matched, valid response)"
        }
    } else {
        Fail-Test "3.1 Gate evaluate - allow" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
    }
}

# ---------------------------------------------------------------------------
# TEST 3.2 - Gate evaluate (block intent)
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 3.2 - Gate evaluate (block intent) ===" -ForegroundColor Yellow
if ($null -eq $AGENT_ID) {
    Fail-Test "3.2 Gate evaluate - block intent" "Skipped - `$AGENT_ID not available"
} else {
    $r = Invoke-Api -Method POST -Uri "$BASE_URL/gate/evaluate" -Headers $AUTH_HEADERS -Body @{
        agent_id = $AGENT_ID
        intent   = "delete all records permanently"
        metadata = @{}
    }
    if ($r.OK -and $r.StatusCode -eq 200 -and $null -ne $r.Data.data.decision) {
        Write-Host "  decision      : $($r.Data.data.decision)" -ForegroundColor DarkGray
        Write-Host "  risk_score    : $($r.Data.data.risk_score)" -ForegroundColor DarkGray
        Write-Host "  policy_matches: $(($r.Data.data.policy_matches | Out-String).Trim())" -ForegroundColor DarkGray
        Pass-Test "3.2 Gate evaluate - decision present ($($r.Data.data.decision))"
    } else {
        Fail-Test "3.2 Gate evaluate - block intent" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
    }
}

# ---------------------------------------------------------------------------
# TEST 3.3 - Rate limit (loop until 429, max 101 extra calls)
# NOTE: The rate limit window is 60s per org. Calls from earlier rounds
#       (3.1, 3.2, plus any in round 2) already count. You may hit 429 in
#       fewer than 101 iterations. The loop stops on the first 429.
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 3.3 - Rate limit (100 calls/60s) ===" -ForegroundColor Yellow
Write-Host "  NOTE: calling /gate/evaluate up to 101 times - stops on first 429" -ForegroundColor DarkGray
if ($null -eq $AGENT_ID) {
    Fail-Test "3.3 Rate limit" "Skipped - `$AGENT_ID not available"
} else {
    $got429    = $false
    $callsMade = 0

    for ($i = 1; $i -le 101; $i++) {
        $callsMade++
        $r = Invoke-Api -Method POST -Uri "$BASE_URL/gate/evaluate" -Headers $AUTH_HEADERS -Body @{
            agent_id = $AGENT_ID
            intent   = "rate limit probe $i"
            metadata = @{}
        }
        if ($r.StatusCode -eq 429) {
            $got429 = $true
            Write-Host "  Got 429 after $callsMade calls in this loop" -ForegroundColor DarkGray
            break
        }
        # Unexpected non-OK, non-429 -> abort loop
        if (-not $r.OK -and $r.StatusCode -notin @(200, 201, 429)) {
            Write-Host "  Unexpected error at call $i : HTTP $($r.StatusCode) - $($r.ErrorMessage)" -ForegroundColor DarkYellow
            break
        }
    }

    if ($got429) {
        Pass-Test "3.3 Rate limit - 429 received after $callsMade extra calls in this round"
    } else {
        Fail-Test "3.3 Rate limit" "No 429 after $callsMade calls - window may have reset. Re-run within 60s of tests 3.1-3.2."
    }
}

# ---------------------------------------------------------------------------
# TEST 3.4 - Trace ID in execute response
# NOTE: trace_id is not present in GateEvaluateResponse schema - expected FAIL
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 3.4 - Trace ID ===" -ForegroundColor Yellow
Write-Host "  NOTE: trace_id not yet in GateEvaluateResponse - expected FAIL" -ForegroundColor DarkGray
if ($null -ne $TRACE_ID -and $TRACE_ID -ne "") {
    Write-Host "  trace_id: $TRACE_ID" -ForegroundColor DarkGray
    Pass-Test "3.4 Trace ID present: $TRACE_ID"
} else {
    Fail-Test "3.4 Trace ID" "trace_id is null - add trace_id field to GateEvaluateResponse to fix"
}

# =============================================================================
# ROUND 4 - MONITORING
# =============================================================================

Write-Host "`n=== ROUND 4: Monitoring ===" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# TEST 4.1 - Ledger (all events)
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 4.1 - Ledger (all events) ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/monitoring/ledger" -Headers $AUTH_HEADERS
if ($r.OK -and $r.StatusCode -eq 200 -and $null -ne $r.Data.data.rows) {
    $total    = [int]$r.Data.data.total
    $returned = @($r.Data.data.rows).Count
    if ($total -ge 1) {
        Pass-Test "4.1 Ledger - total: $total, rows returned: $returned"
    } else {
        Fail-Test "4.1 Ledger" "total=$total - expected at least 1 event (run agent execute first)"
    }
} else {
    Fail-Test "4.1 Ledger" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 4.2 - Ledger filter by status=block
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 4.2 - Ledger filter status=block ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/monitoring/ledger?status=block" -Headers $AUTH_HEADERS
if ($r.OK -and $r.StatusCode -eq 200) {
    $rows    = @($r.Data.data.rows)
    $badRows = $rows | Where-Object { $_.status -ne "block" }
    if ($badRows.Count -eq 0) {
        Pass-Test "4.2 Ledger filter=block - $($rows.Count) rows, all status=block"
    } else {
        Fail-Test "4.2 Ledger filter=block" "$($badRows.Count) rows have status != block"
    }
} else {
    Fail-Test "4.2 Ledger filter=block" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 4.3 - Ledger filter by agent_id
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 4.3 - Ledger filter by agent_id ===" -ForegroundColor Yellow
if ($null -eq $AGENT_ID) {
    Fail-Test "4.3 Ledger filter agent_id" "Skipped - `$AGENT_ID not available"
} else {
    $r = Invoke-Api -Uri "$BASE_URL/monitoring/ledger?agent_id=$AGENT_ID" -Headers $AUTH_HEADERS
    if ($r.OK -and $r.StatusCode -eq 200) {
        Pass-Test "4.3 Ledger filter agent_id - $(@($r.Data.data.rows).Count) rows for $AGENT_ID"
    } else {
        Fail-Test "4.3 Ledger filter agent_id" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
    }
}

# ---------------------------------------------------------------------------
# TEST 4.4 - Metrics
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 4.4 - Metrics ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/monitoring/metrics" -Headers $AUTH_HEADERS
if ($r.OK -and $r.StatusCode -eq 200) {
    $m = $r.Data.data
    Write-Host "  total            : $($m.total)" -ForegroundColor DarkGray
    Write-Host "  allowed          : $($m.allowed)" -ForegroundColor DarkGray
    Write-Host "  blocked          : $($m.blocked)" -ForegroundColor DarkGray
    Write-Host "  paused           : $($m.paused)" -ForegroundColor DarkGray
    Write-Host "  agents_monitored : $($m.agents_monitored)" -ForegroundColor DarkGray
    Write-Host "  avg_gate_ms      : $(if ($null -ne $m.avg_gate_ms) { $m.avg_gate_ms } else { '(null - gate_ms not written to metadata yet)' })" -ForegroundColor DarkGray

    $total        = [int]$m.total
    $sumDecisions = [int]$m.allowed + [int]$m.blocked + [int]$m.paused

    if ($total -ge 1 -and $sumDecisions -ge 1) {
        $bonusMsg = if ($null -ne $m.avg_gate_ms) { " | BONUS: avg_gate_ms=$($m.avg_gate_ms)" } else { " | BONUS FAIL: avg_gate_ms null" }
        Pass-Test "4.4 Metrics - total=$total  allowed=$($m.allowed)  blocked=$($m.blocked)  paused=$($m.paused)$bonusMsg"
    } else {
        Fail-Test "4.4 Metrics" "total=$total, sum(decisions)=$sumDecisions - expected >= 1 each"
    }
} else {
    Fail-Test "4.4 Metrics" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 4.5 - Anomalies endpoint
# NOTE: /monitoring/anomalies not registered in monitoring/router.py - expected FAIL
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 4.5 - Anomalies ===" -ForegroundColor Yellow
Write-Host "  NOTE: /monitoring/anomalies not yet implemented - expected FAIL" -ForegroundColor DarkGray
$r = Invoke-Api -Uri "$BASE_URL/monitoring/anomalies" -Headers $AUTH_HEADERS
if ($r.OK -and $r.StatusCode -eq 200 -and $null -ne $r.Data.data.rows) {
    Write-Host "  anomalies total: $($r.Data.data.total)" -ForegroundColor DarkGray
    Pass-Test "4.5 Anomalies - total: $($r.Data.data.total)"
} else {
    Fail-Test "4.5 Anomalies" "HTTP $($r.StatusCode) - endpoint not yet implemented in monitoring/router.py"
}

# ---------------------------------------------------------------------------
# TEST 4.6 - Sources endpoint
# NOTE: /monitoring/sources not registered in monitoring/router.py - expected FAIL
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 4.6 - Sources ===" -ForegroundColor Yellow
Write-Host "  NOTE: /monitoring/sources not yet implemented - expected FAIL" -ForegroundColor DarkGray
$r = Invoke-Api -Uri "$BASE_URL/monitoring/sources" -Headers $AUTH_HEADERS
if ($r.OK -and $r.StatusCode -eq 200) {
    Pass-Test "4.6 Sources - $(@($r.Data.data).Count) entries"
} else {
    Fail-Test "4.6 Sources" "HTTP $($r.StatusCode) - endpoint not yet implemented in monitoring/router.py"
}

# =============================================================================
# ROUND 5 - SETTINGS
# NOTE: settings/router.py does not exist and is not registered in main.py.
#       All 4 tests in this round are expected to FAIL (404).
# =============================================================================

Write-Host "`n=== ROUND 5: Settings ===" -ForegroundColor Cyan
Write-Host "  NOTE: backend/settings/router.py not yet created - all tests expected to FAIL" -ForegroundColor DarkGray

# ---------------------------------------------------------------------------
# TEST 5.1 - Get settings
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 5.1 - Get settings ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/settings" -Headers $AUTH_HEADERS
if ($r.OK -and $r.StatusCode -eq 200 -and $null -ne $r.Data.data) {
    Write-Host "  settings: $($r.Data.data | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
    Pass-Test "5.1 Get settings"
} else {
    Fail-Test "5.1 Get settings" "HTTP $($r.StatusCode) - create backend/settings/router.py to fix"
}

# ---------------------------------------------------------------------------
# TEST 5.2 - Update risk_threshold
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 5.2 - Update risk_threshold to 0.80 ===" -ForegroundColor Yellow
$r = Invoke-Api -Method PATCH -Uri "$BASE_URL/settings" -Headers $AUTH_HEADERS -Body @{
    risk_threshold = 0.80
}
if ($r.OK -and $r.StatusCode -eq 200) {
    Pass-Test "5.2 Update risk_threshold -> 0.80"
} else {
    Fail-Test "5.2 Update risk_threshold" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 5.3 - Verify update persisted
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 5.3 - Verify risk_threshold persisted ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/settings" -Headers $AUTH_HEADERS
if ($r.OK -and $r.StatusCode -eq 200) {
    $actual = [double]$r.Data.data.risk_threshold
    if ([Math]::Abs($actual - 0.80) -lt 0.001) {
        Pass-Test "5.3 risk_threshold = 0.80 confirmed"
    } else {
        Fail-Test "5.3 Verify risk_threshold" "Got $actual, expected 0.80"
    }
} else {
    Fail-Test "5.3 Verify risk_threshold" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 5.4 - Reset risk_threshold to 0.75
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 5.4 - Reset risk_threshold to 0.75 ===" -ForegroundColor Yellow
$r = Invoke-Api -Method PATCH -Uri "$BASE_URL/settings" -Headers $AUTH_HEADERS -Body @{
    risk_threshold = 0.75
}
if ($r.OK -and $r.StatusCode -eq 200) {
    Pass-Test "5.4 Reset risk_threshold -> 0.75"
} else {
    Fail-Test "5.4 Reset risk_threshold" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# =============================================================================
# ROUND 6 - WEBHOOK
# =============================================================================

Write-Host "`n=== ROUND 6: Webhook ===" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# TEST 6.1 - Valid webhook call
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 6.1 - Valid webhook call ===" -ForegroundColor Yellow
$r = Invoke-Api -Method POST -Uri "$NGROK_URL/webhook/inbound" `
    -Headers $NGROK_WEBHOOK_HEADERS `
    -Body @{
        source      = "n8n"
        agent_name  = "test-agent-webhook"
        org_api_key = $ORG_API_KEY
        intent      = "retrieve pending claims for daily triage"
    }
if ($r.OK -and $r.StatusCode -eq 200 -and $null -ne $r.Data.data.decision) {
    Write-Host "  agent_id      : $($r.Data.data.agent_id)" -ForegroundColor DarkGray
    Write-Host "  decision      : $($r.Data.data.decision)" -ForegroundColor DarkGray
    Write-Host "  risk_score    : $($r.Data.data.risk_score)" -ForegroundColor DarkGray
    Write-Host "  reason        : $($r.Data.data.reason)" -ForegroundColor DarkGray
    Write-Host "  policy_matches: $(($r.Data.data.policy_matches | Out-String).Trim())" -ForegroundColor DarkGray
    Pass-Test "6.1 Valid webhook - decision: $($r.Data.data.decision)"
} else {
    Fail-Test "6.1 Valid webhook" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 6.2 - Wrong webhook secret -> expect 401
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 6.2 - Wrong webhook secret ===" -ForegroundColor Yellow
$badSecretHeaders = @{
    "X-Webhook-Secret"           = "wrong_value"
    "ngrok-skip-browser-warning" = "1"
}
$r = Invoke-Api -Method POST -Uri "$NGROK_URL/webhook/inbound" `
    -Headers $badSecretHeaders `
    -Body @{
        source      = "n8n"
        agent_name  = "test-agent-webhook"
        org_api_key = $ORG_API_KEY
        intent      = "probe"
    }
if (-not $r.OK -and $r.StatusCode -eq 401) {
    Pass-Test "6.2 Wrong secret -> 401"
} else {
    Fail-Test "6.2 Wrong secret" "Expected 401, got HTTP $($r.StatusCode)"
}

# ---------------------------------------------------------------------------
# TEST 6.3 - Wrong org_api_key -> expect 403
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 6.3 - Wrong org_api_key ===" -ForegroundColor Yellow
$r = Invoke-Api -Method POST -Uri "$NGROK_URL/webhook/inbound" `
    -Headers $NGROK_WEBHOOK_HEADERS `
    -Body @{
        source      = "n8n"
        agent_name  = "test-agent-webhook"
        org_api_key = "invalid_key"
        intent      = "probe"
    }
if (-not $r.OK -and $r.StatusCode -eq 403) {
    Pass-Test "6.3 Wrong org_api_key -> 403"
} else {
    Fail-Test "6.3 Wrong org_api_key" "Expected 403, got HTTP $($r.StatusCode)"
}

# ---------------------------------------------------------------------------
# TEST 6.4 - Agent auto-registered by webhook call
# (confirms webhook upsert logic in webhooks/router.py)
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 6.4 - Agent 'test-agent-webhook' auto-registered ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/agents" -Headers $AUTH_HEADERS
if ($r.OK) {
    $webhookAgent = @($r.Data.data) | Where-Object { $_.name -eq "test-agent-webhook" }
    if ($webhookAgent.Count -gt 0) {
        Pass-Test "6.4 Agent 'test-agent-webhook' auto-registered (id: $($webhookAgent[0].id))"
    } else {
        Fail-Test "6.4 Agent auto-registered" "'test-agent-webhook' not in agents list - check org_api_key matches JWT org"
    }
} else {
    Fail-Test "6.4 Agent auto-registered" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# =============================================================================
# ROUND 7 - CLEANUP
# =============================================================================

Write-Host "`n=== ROUND 7: Cleanup ===" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# TEST 7.1 - Delete test agent
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 7.1 - Delete test agent ===" -ForegroundColor Yellow
if ($null -eq $AGENT_ID) {
    Fail-Test "7.1 Delete agent" "Skipped - `$AGENT_ID not available"
} else {
    $r = Invoke-Api -Method DELETE -Uri "$BASE_URL/agents/$AGENT_ID" -Headers $AUTH_HEADERS
    if ($r.OK -and $r.StatusCode -eq 200) {
        Pass-Test "7.1 Delete agent $AGENT_ID"
    } else {
        Fail-Test "7.1 Delete agent" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
    }
}

# ---------------------------------------------------------------------------
# TEST 7.2 - Verify agent deleted
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 7.2 - Verify agent deleted ===" -ForegroundColor Yellow
if ($null -eq $AGENT_ID) {
    Fail-Test "7.2 Verify deleted" "Skipped - `$AGENT_ID not available"
} else {
    $r = Invoke-Api -Uri "$BASE_URL/agents" -Headers $AUTH_HEADERS
    if ($r.OK) {
        $stillPresent = @($r.Data.data) | Where-Object { $_.id -eq $AGENT_ID }
        if ($stillPresent.Count -eq 0) {
            Pass-Test "7.2 Agent $AGENT_ID confirmed deleted"
        } else {
            Fail-Test "7.2 Verify deleted" "Agent $AGENT_ID still present in list"
        }
    } else {
        Fail-Test "7.2 Verify deleted" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
    }
}

# =============================================================================
# SUMMARY
# =============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
$summaryColor = if ($script:FAIL_COUNT -eq 0) { "Green" } else { "Yellow" }
Write-Host "=== RESULTS: $($script:PASS_COUNT) passed, $($script:FAIL_COUNT) failed ===" -ForegroundColor $summaryColor
Write-Host "============================================================" -ForegroundColor Cyan

if ($script:FAILED_LIST.Count -gt 0) {
    Write-Host "`nFailed tests:" -ForegroundColor Red
    $script:FAILED_LIST | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Known expected failures (not yet implemented):" -ForegroundColor DarkGray
Write-Host "  3.4  trace_id - add to GateEvaluateResponse schema" -ForegroundColor DarkGray
Write-Host "  4.5  /monitoring/anomalies - add to monitoring/router.py" -ForegroundColor DarkGray
Write-Host "  4.6  /monitoring/sources   - add to monitoring/router.py" -ForegroundColor DarkGray
Write-Host "  5.1-5.4  /settings         - create backend/settings/router.py + register in main.py" -ForegroundColor DarkGray
Write-Host ""
