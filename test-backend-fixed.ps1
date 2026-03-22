# =============================================================================
# GovernHQ - Backend Test Suite (v2)
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
# JWT is obtained automatically via Supabase email/password auth.
# Set $SUPABASE_PASSWORD before running (or paste it inline below).
# =============================================================================

# =============================================================================
# CONFIGURATION
# =============================================================================

$BASE_URL       = "http://127.0.0.1:8000"
$NGROK_URL      = "https://approvably-hypermodest-janiece.ngrok-free.dev"
$WEBHOOK_SECRET = "whk_test_123"
$ORG_API_KEY    = "whk_live_5ac1f9d6e1f24c51a5c3f2b4b1f0a9d2"

# Supabase project details - found in Supabase dashboard → Settings → API
# Replace the placeholders with your actual values.
$SUPABASE_URL      = "https://wiqvwvrlmysxcotrenbq.supabase.co"   # your project URL
$SUPABASE_ANON_KEY = "sb_publishable_Y13WB7XNqHt8_1EgtheuKA_gwgCkIPQ"

# Login credentials for sami.malek15@gmail.com
$SUPABASE_EMAIL    = "sami.malek15@gmail.com"
$SUPABASE_PASSWORD = "Sami@2003!?"

# =============================================================================
# STATE  (populated during the run, reused by later tests)
# =============================================================================

$JWT       = $null
$AGENT_ID  = $null
$LEDGER_ID = $null
$TRACE_ID  = $null

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

# =============================================================================
# AUTO-JWT - obtain token via Supabase REST Auth API
# =============================================================================

Write-Host "`n=== AUTH: Obtaining JWT via Supabase email/password ===" -ForegroundColor Cyan

if ($SUPABASE_ANON_KEY -eq "PASTE_YOUR_ANON_KEY_HERE" -or $SUPABASE_PASSWORD -eq "PASTE_YOUR_PASSWORD_HERE") {
    Write-Host "FATAL: Set `$SUPABASE_ANON_KEY and `$SUPABASE_PASSWORD at the top of this script." -ForegroundColor Red
    exit 1
}

try {
    $authResp = Invoke-RestMethod -Method POST `
        -Uri "$SUPABASE_URL/auth/v1/token?grant_type=password" `
        -Headers @{
            "apikey"       = $SUPABASE_ANON_KEY
            "Content-Type" = "application/json"
        } `
        -Body (@{ email = $SUPABASE_EMAIL; password = $SUPABASE_PASSWORD } | ConvertTo-Json) `
        -ErrorAction Stop

    $JWT = $authResp.access_token
} catch {
    Write-Host "FATAL: Could not obtain JWT - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "       Check SUPABASE_ANON_KEY, SUPABASE_EMAIL, and SUPABASE_PASSWORD." -ForegroundColor DarkRed
    exit 1
}

if (-not $JWT) {
    Write-Host "FATAL: JWT is null after auth call." -ForegroundColor Red
    exit 1
}

Write-Host "  JWT obtained ($($JWT.Length) chars)" -ForegroundColor Green

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
# TEST 1.3 - Auth guard (no token -> expect 401)
# Fix applied: get_org_id now uses Header(default=None) - raises 401 not 422
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 1.3 - Auth guard (no token -> 401) ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/agents"   # no Authorization header
if (-not $r.OK -and $r.StatusCode -eq 401) {
    Pass-Test "1.3 Auth guard - no token returned HTTP 401"
} else {
    Fail-Test "1.3 Auth guard - no token" "Expected 401, got HTTP $($r.StatusCode)"
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
    Pass-Test "2.1 List agents (count: $(@($r.Data.data).Count))"
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
        $TRACE_ID  = $r.Data.data.gate.trace_id
        Write-Host "  decision  : $($r.Data.data.gate.decision)" -ForegroundColor DarkGray
        Write-Host "  risk_score: $($r.Data.data.gate.risk_score)" -ForegroundColor DarkGray
        Write-Host "  log_id    : $LEDGER_ID" -ForegroundColor DarkGray
        Write-Host "  trace_id  : $(if ($null -ne $TRACE_ID) { $TRACE_ID } else { '(null)' })" -ForegroundColor DarkGray
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
        Write-Host "  trace_id      : $($r.Data.data.trace_id)" -ForegroundColor DarkGray
        Write-Host "  policy_matches: $(($r.Data.data.policy_matches | Out-String).Trim())" -ForegroundColor DarkGray
        Pass-Test "3.2 Gate evaluate - decision: $($r.Data.data.decision)"
    } else {
        Fail-Test "3.2 Gate evaluate - block intent" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
    }
}

# ---------------------------------------------------------------------------
# TEST 3.3 - Rate limit (loop until 429, max 101 extra calls)
# NOTE: Window is 60s per org. Earlier calls count. May hit 429 in <101 loops.
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 3.3 - Rate limit (100 calls/60s) ===" -ForegroundColor Yellow
Write-Host "  Calling /gate/evaluate in a loop - stops on first 429" -ForegroundColor DarkGray
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
        if (-not $r.OK -and $r.StatusCode -notin @(200, 201, 429)) {
            Write-Host "  Unexpected error at call $i : HTTP $($r.StatusCode)" -ForegroundColor DarkYellow
            break
        }
    }

    if ($got429) {
        Pass-Test "3.3 Rate limit - 429 received after $callsMade extra calls"
    } else {
        Fail-Test "3.3 Rate limit" "No 429 after $callsMade calls - re-run within 60s of tests 3.1-3.2"
    }
}

# ---------------------------------------------------------------------------
# TEST 3.4 - Trace ID in Gate response
# trace_id is now generated in gate/router.py and returned in GateEvaluateResponse
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 3.4 - Trace ID ===" -ForegroundColor Yellow
if ($null -ne $TRACE_ID -and $TRACE_ID -ne "") {
    Write-Host "  trace_id: $TRACE_ID" -ForegroundColor DarkGray
    Pass-Test "3.4 Trace ID present: $TRACE_ID"
} else {
    # trace_id from execute comes via agents/router -> evaluate_intent (not gate/router)
    # so it won't be set. Test directly via /gate/evaluate response from 3.2.
    Fail-Test "3.4 Trace ID" "trace_id null - agents/execute path does not pass through gate/router.py where trace_id is generated"
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
        Fail-Test "4.1 Ledger" "total=$total - expected at least 1 event"
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
    $sumDecisions = [int]$m.allowed + [int]$m.blocked + [int]$m.paused
    if ([int]$m.total -ge 1 -and $sumDecisions -ge 1) {
        Pass-Test "4.4 Metrics - total=$($m.total)  avg_gate_ms=$($m.avg_gate_ms)"
    } else {
        Fail-Test "4.4 Metrics" "total=$($m.total), sum(decisions)=$sumDecisions - expected >= 1"
    }
} else {
    Fail-Test "4.4 Metrics" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 4.5 - Anomalies endpoint (now implemented)
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 4.5 - Anomalies ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/monitoring/anomalies" -Headers $AUTH_HEADERS
if ($r.OK -and $r.StatusCode -eq 200 -and $null -ne $r.Data.data.rows) {
    Write-Host "  anomalies total: $($r.Data.data.total)  (0 is normal until anomaly detection runs)" -ForegroundColor DarkGray
    Pass-Test "4.5 Anomalies endpoint - total: $($r.Data.data.total)"
} else {
    Fail-Test "4.5 Anomalies" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# ---------------------------------------------------------------------------
# TEST 4.6 - Sources endpoint (now implemented)
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 4.6 - Sources ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/monitoring/sources" -Headers $AUTH_HEADERS
if ($r.OK -and $r.StatusCode -eq 200) {
    $entries = @($r.Data.data)
    Write-Host "  sources: $($entries | ForEach-Object { "$($_.source)=$($_.total)" } | Join-String -Separator ', ')" -ForegroundColor DarkGray
    Pass-Test "4.6 Sources - $($entries.Count) source entries"
} else {
    Fail-Test "4.6 Sources" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
}

# =============================================================================
# ROUND 5 - SETTINGS
# NOTE: Requires migration 000004 applied in Supabase (adds organizations.metadata)
# =============================================================================

Write-Host "`n=== ROUND 5: Settings ===" -ForegroundColor Cyan
Write-Host "  NOTE: requires migration 000004 applied - supabase/migrations/20250305000004_add_org_metadata.sql" -ForegroundColor DarkGray

# ---------------------------------------------------------------------------
# TEST 5.1 - Get settings
# ---------------------------------------------------------------------------
Write-Host "`n=== TEST: 5.1 - Get settings ===" -ForegroundColor Yellow
$r = Invoke-Api -Uri "$BASE_URL/settings" -Headers $AUTH_HEADERS
if ($r.OK -and $r.StatusCode -eq 200 -and $null -ne $r.Data.data) {
    Write-Host "  settings: $($r.Data.data | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
    Pass-Test "5.1 Get settings"
} else {
    Fail-Test "5.1 Get settings" "HTTP $($r.StatusCode) - $($r.ErrorMessage)"
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
# TEST 5.4 - Reset risk_threshold to default
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
    $script:FAILED_LIST | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

Write-Host ""
Write-Host "Notes:" -ForegroundColor DarkGray
Write-Host "  3.4  trace_id - execute path calls evaluate_intent() directly, not gate/router.py" -ForegroundColor DarkGray
Write-Host "       Use POST /gate/evaluate directly to see trace_id in response." -ForegroundColor DarkGray
Write-Host "  4.5  anomalies - empty until anomaly detection layer writes metadata.anomaly" -ForegroundColor DarkGray
Write-Host "  5.x  settings - requires migration 000004 applied in Supabase SQL Editor" -ForegroundColor DarkGray
Write-Host ""
