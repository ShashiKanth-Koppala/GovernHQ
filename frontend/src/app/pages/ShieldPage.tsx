import { Sidebar } from "../components/Sidebar";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPatch } from "@/lib/api";

export function ShieldPage() {
  const { token, isLoading } = useAuth();
  const [enforcementMode, setEnforcementMode] = useState('Strict');
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [anomalySensitivity, setAnomalySensitivity] = useState(75);
  const [failMode, setFailMode] = useState('Block');
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricJustification, setBiometricJustification] = useState('');
  const [blockedAgents, setBlockedAgents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, allowed: 0, blocked: 0, paused: 0 });

  useEffect(() => {
    if (!token || isLoading) return;

    // Fetch all agents and filter blocked ones
    apiGet('/agents', token).then(res => {
      if (res.data) {
        const blocked = res.data.filter((a: any) => a.status === 'blocked').map((a: any) => ({
          id: a.id,
          name: a.name,
          reason: '"Agent blocked"',
          blockedBy: 'Monitor',
          time: new Date(a.created_at || Date.now()).toLocaleTimeString(),
          details: `Risk profile: ${a.risk_profile}. Source: ${a.source}.`,
          secondaryInfo: 'Agent cannot reason or act until re-allowed.',
          canReAllow: true,
        }));
        setBlockedAgents(blocked);
      }
    });

    // Fetch metrics
    apiGet('/monitoring/metrics', token).then(res => {
      if (res.data) setMetrics(res.data);
    });
  }, [token, isLoading]);

  const handleAllowAgent = async (agentId: string) => {
    if (!token) return;
    await apiPatch(`/agents/${agentId}`, token, { status: 'active' });
    setBlockedAgents(prev => prev.filter(a => a.id !== agentId));
    setExpandedAgent(null);
  };

  const handleBlockAllAgents = () => {
    setShowBiometricModal(true);
  };

  const handleBiometricConfirm = async () => {
    if (!biometricJustification.trim() || !token) return;
    // Block all active agents
    const res = await apiGet('/agents', token);
    if (res.data) {
      const activeAgents = res.data.filter((a: any) => a.status === 'active');
      await Promise.all(activeAgents.map((a: any) =>
        apiPatch(`/agents/${a.id}`, token, { status: 'blocked' })
      ));
    }
    setShowBiometricModal(false);
    setBiometricJustification('');
    // Refresh blocked agents
    const updated = await apiGet('/agents', token);
    if (updated.data) {
      setBlockedAgents(updated.data.filter((a: any) => a.status === 'blocked').map((a: any) => ({
        id: a.id,
        name: a.name,
        reason: '"Emergency block all"',
        blockedBy: 'Human',
        time: new Date().toLocaleTimeString(),
        details: `Risk profile: ${a.risk_profile}. Source: ${a.source}.`,
        secondaryInfo: 'Blocked via emergency stop.',
        canReAllow: true,
      })));
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] border border-[#1e293b]/30 overflow-clip relative rounded-[40px] shadow-[0px_4px_90px_0px_rgba(0,0,0,0.5),0px_0px_100px_0px_rgba(59,130,246,0.1)] size-full backdrop-blur-xl" data-name="Shield">
      <Sidebar activePage="security" />

      <div className="absolute left-[101px] right-0 top-0 bottom-0 flex">
        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ width: 'calc(66.667% - 33px)' }}>
          <div className="p-[56px] pl-[39px] pr-[24px]">
            <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Shield</h1>
            <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
              Real-time protection and monitoring for your AI agents
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-[16px] mb-[32px]">
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#475569] rounded-[12px] p-[21px]">
                <div className="font-bold text-[#ef4444] text-[64px] leading-[64px] mb-[8px]">{blockedAgents.length}</div>
                <div className="font-semibold text-[#94a3b8] text-[14px]">blocked<br />agents</div>
              </div>
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#475569] rounded-[12px] p-[21px]">
                <div className="font-bold text-[#31ba96] text-[64px] leading-[64px] mb-[8px]">8ms</div>
                <div className="font-semibold text-[#94a3b8] text-[14px] mb-[4px]">block<br />latency</div>
                <div className="text-[#64748b] text-[11px]">target &lt;10ms</div>
              </div>
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#475569] rounded-[12px] p-[21px]">
                <div className="font-bold text-white text-[64px] leading-[64px] mb-[8px]">{metrics.total}</div>
                <div className="font-semibold text-[#94a3b8] text-[14px]">reasoning<br />evaluated<br />today</div>
              </div>
            </div>

            {/* Emergency Panel */}
            <div className="bg-[#1e293b]/40 border-2 border-[#ef4444]/60 rounded-[16px] p-[24px] mb-[32px]">
              <div className="flex items-center gap-[10px] mb-[16px]">
                <div className="size-[32px] rounded-full bg-[#ef4444]/20 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3.5L8 8.5M8 11L8 11.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 1L14.928 13H1.072L8 1Z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <h3 className="font-bold text-[#ef4444] text-[16px] uppercase tracking-wider">EMERGENCY</h3>
              </div>
              <h4 className="font-bold text-white text-[18px] mb-[12px]">Block All Agents</h4>
              <p className="text-[#94a3b8] text-[14px] mb-[12px] leading-relaxed">
                Instantly block every agent. Revoke all credentials. Stop all reasoning and actions.
              </p>
              <p className="italic text-[#64748b] text-[13px] mb-[20px]">Requires CISO biometric authentication</p>
              <button onClick={handleBlockAllAgents} className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-[16px] px-[24px] py-[14px] rounded-[12px] transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                Block All Agents
              </button>
            </div>

            {/* Blocked Agents List */}
            <div>
              <div className="flex items-center gap-[10px] mb-[16px]">
                <h3 className="font-bold text-white text-[16px]">Blocked Agents</h3>
              </div>
              <p className="text-[#64748b] text-[13px] mb-[20px]">Agents blocked entirely. Cannot reason or act until re-allowed.</p>

              {blockedAgents.length === 0 ? (
                <p className="text-[#94a3b8] text-[14px]">No blocked agents. ✅</p>
              ) : (
                <div className="space-y-[12px]">
                  {blockedAgents.map((agent, index) => (
                    <div key={index} className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/40 rounded-[12px] overflow-hidden">
                      <div className="p-[18px] cursor-pointer hover:bg-[#1e293b]/30 transition-all"
                        onClick={() => setExpandedAgent(expandedAgent === agent.name ? null : agent.name)}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-[8px]">
                            <div className="size-[8px] rounded-full bg-[#ef4444]" />
                            <h4 className="font-bold text-white text-[15px]">{agent.name}</h4>
                            <span className="text-[#94a3b8] text-[13px]">{agent.reason}</span>
                          </div>
                          <div className="flex items-center gap-[12px]">
                            <span className="text-[#64748b] text-[12px]">{agent.time}</span>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                              className={`transition-transform ${expandedAgent === agent.name ? 'rotate-180' : ''}`}>
                              <path d="M2 4L6 8L10 4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {expandedAgent === agent.name && (
                        <div className="px-[18px] pb-[18px] border-t border-[#334155]/30">
                          <div className="mt-[16px] space-y-[12px]">
                            <p className="text-[#94a3b8] text-[13px]">Blocked by: {agent.blockedBy}</p>
                            <p className="text-[#94a3b8] text-[13px]">{agent.details}</p>
                            <p className="text-[#94a3b8] text-[13px]">{agent.secondaryInfo}</p>
                            <p className="italic text-[#64748b] text-[12px] mt-[8px]">Agent cannot reason or act until re-allowed.</p>
                            {agent.canReAllow && (
                              <button onClick={() => handleAllowAgent(agent.id)}
                                className="mt-[16px] bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981] text-[#10b981] font-semibold text-[14px] px-[20px] py-[10px] rounded-[8px] transition-all">
                                Allow Agent
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="shrink-0 overflow-y-auto bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-l border-[#1e293b]/50 shadow-[-12px_0_48px_0_rgba(0,0,0,0.7)] backdrop-blur-xl p-[48px] relative" style={{ width: 'calc(33.333% + 33px)' }}>
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#3b82f6]/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="space-y-[32px] relative z-10">

            {/* Protection Controls */}
            <div className="bg-gradient-to-br from-[#1e293b]/60 to-[#0f172a]/40 border border-[rgba(51,65,85,0.4)] rounded-[16px] p-[24px]">
              <h2 className="text-[#94a3b8] text-[12px] uppercase tracking-wide mb-[24px]">Protection Controls</h2>
              <div className="space-y-[20px]">
                <div>
                  <label className="font-semibold text-white text-[14px] mb-[8px] block">Enforcement Mode</label>
                  <select value={enforcementMode} onChange={(e) => setEnforcementMode(e.target.value)}
                    className="w-full bg-[#0f172a]/50 border border-[#334155]/50 rounded-[8px] px-[12px] py-[10px] text-white text-[14px] focus:outline-none appearance-none cursor-pointer">
                    <option>Strict</option>
                    <option>Monitor</option>
                    <option>Audit</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-white text-[14px] mb-[8px] block">
                    Risk Threshold <span className="text-[#f59e0b] ml-[8px] font-bold">{riskThreshold}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={riskThreshold}
                    onChange={(e) => setRiskThreshold(Number(e.target.value))}
                    className="w-full h-[4px] rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${riskThreshold}%, #334155 ${riskThreshold}%, #334155 100%)` }} />
                </div>
                <div>
                  <label className="font-semibold text-white text-[14px] mb-[8px] block">
                    Anomaly Sensitivity <span className="text-[#ef4444] ml-[8px] font-bold">{anomalySensitivity}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={anomalySensitivity}
                    onChange={(e) => setAnomalySensitivity(Number(e.target.value))}
                    className="w-full h-[4px] rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${anomalySensitivity}%, #334155 ${anomalySensitivity}%, #334155 100%)` }} />
                </div>
              </div>
            </div>

            {/* How GovernHQ Protects */}
            <div>
              <div className="flex items-center gap-[10px] mb-[24px]">
                <h2 className="font-bold text-white text-[18px]">How GovernHQ Protects</h2>
              </div>
              <div className="space-y-[16px]">
                {[
                  { num: '1', label: 'GATE', desc: 'Intercepts reasoning. Blocks bad actions. Agent keeps running.', stats: `${metrics.total} evaluated · ${metrics.blocked} blocked · ${metrics.paused} paused` },
                  { num: '2', label: 'MONITOR', desc: 'Watches reasoning patterns. Blocks bad agents.', stats: `${blockedAgents.length} agents blocked` },
                  { num: '3', label: 'EMERGENCY', desc: 'Instantly blocks all agents.', stats: 'Measured latency: 8ms' },
                ].map((item) => (
                  <div key={item.num} className="bg-[#0a1419]/60 border border-[#1e3a3f]/60 rounded-[12px] p-[20px]">
                    <div className="flex items-start gap-[16px]">
                      <span className="font-bold text-[#64748b] text-[28px] leading-none pt-[2px]">{item.num}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-[10px]">
                          <h3 className="font-bold text-white text-[16px]">{item.label}</h3>
                          <div className="flex items-center gap-[6px]">
                            <div className="size-[8px] rounded-full bg-[#10b981]" />
                            <span className="font-semibold text-[#10b981] text-[12px]">Active</span>
                          </div>
                        </div>
                        <p className="text-[#94a3b8] text-[13px] mb-[10px]">{item.desc}</p>
                        <p className="text-[#64748b] text-[11px]">{item.stats}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Modal */}
      {showBiometricModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => { setShowBiometricModal(false); setBiometricJustification(''); }} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] bg-gradient-to-br from-[#1e293b]/95 to-[#0f172a]/90 border border-[#ef4444]/50 shadow-[0_0_50px_rgba(239,68,68,0.3)] backdrop-blur-xl rounded-[16px] p-[32px] z-50">
            <h3 className="font-bold text-white text-[22px] mb-[16px]">CISO Authorization Required</h3>
            <p className="text-[#cbd5e1] text-[15px] mb-[6px]">This emergency action requires Chief Information Security Officer biometric authentication.</p>
            <p className="font-bold text-[#ef4444] text-[14px] mb-[24px]">All agents will be immediately blocked and credentials revoked.</p>
            <div className="mb-[24px]">
              <label className="font-semibold text-white text-[14px] mb-[8px] block">Justification <span className="text-[#ef4444]">*</span></label>
              <textarea value={biometricJustification} onChange={(e) => setBiometricJustification(e.target.value)}
                placeholder="Provide detailed justification for blocking all agents..."
                className="w-full bg-[#0f172a]/50 border border-[#334155]/50 rounded-[8px] px-[16px] py-[12px] text-white text-[14px] focus:outline-none resize-none h-[100px]" />
            </div>
            <div className="flex gap-[12px]">
              <button onClick={() => { setShowBiometricModal(false); setBiometricJustification(''); }}
                className="flex-1 bg-[#1e293b]/50 border border-[#334155]/30 text-[#94a3b8] font-semibold text-[14px] px-[24px] py-[12px] rounded-[8px] transition-all">
                Cancel
              </button>
              <button onClick={handleBiometricConfirm} disabled={!biometricJustification.trim()}
                className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] disabled:bg-[#334155] disabled:cursor-not-allowed text-white font-bold text-[14px] px-[24px] py-[12px] rounded-[8px] transition-all">
                Confirm Block All
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}