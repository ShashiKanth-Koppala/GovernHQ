import { Sidebar } from "../components/Sidebar";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPost } from "@/lib/api";

export function OverviewPage() {
  const { token, isLoading } = useAuth();
  const [expandedLogItems, setExpandedLogItems] = useState<Set<number>>(new Set());
  const [expandedSidebarItems, setExpandedSidebarItems] = useState<Set<number>>(new Set());
  const [decisionLog, setDecisionLog] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, allowed: 0, blocked: 0, paused: 0, agents_monitored: 0 });

  const fetchDecisionLog = async (tok: string, agentMap: Record<string, string>) => {
    const res = await apiGet('/monitoring/ledger?limit=50', tok);
    if (res.data?.rows) {
      const mapped = res.data.rows.map((row: any) => ({
        agent: agentMap[row.agent_id] || row.agent_id?.slice(0, 8) || 'Unknown',
        status: row.status === 'allow' ? 'green' : row.status === 'block' ? 'red' : 'orange',
        description: row.action,
        time: new Date(row.created_at).toLocaleTimeString(),
        gateTime: row.metadata?.gate_ms || null,
        reasoning: row.metadata?.reasoning || null,
        blockReason: row.status === 'block' ? 'Blocked by policy.' : null,
        pauseReason: row.status === 'pause' ? 'Action requires human review.' : null,
        logId: row.id,
      }));
      setDecisionLog(mapped);
      setPendingActions(mapped.filter((e: any) => e.status === 'orange').slice(0, 3));
    }
  };

  useEffect(() => {
    if (!token || isLoading) return;

    apiGet('/monitoring/metrics', token).then(res => {
      if (res.data) setMetrics(res.data);
    });

    // Fetch agents first for name lookup, then ledger
    apiGet('/agents', token).then(agentsRes => {
      const map: Record<string, string> = {};
      if (agentsRes.data) {
        agentsRes.data.forEach((a: any) => { map[a.id] = a.name; });
      }
      fetchDecisionLog(token, map);
    });
  }, [token, isLoading]);

  const handleReview = async (logId: string, action: 'allow' | 'block') => {
    if (!token) return;
    await apiPost(`/audit/review/${logId}`, token, {
      action,
      reason: `Human reviewed and ${action}ed the action`
    });
    apiGet('/agents', token).then(agentsRes => {
      const map: Record<string, string> = {};
      if (agentsRes.data) {
        agentsRes.data.forEach((a: any) => { map[a.id] = a.name; });
      }
      fetchDecisionLog(token, map);
    });
  };

  const toggleLogItem = (index: number) => {
    const newExpanded = new Set(expandedLogItems);
    if (newExpanded.has(index)) newExpanded.delete(index);
    else newExpanded.add(index);
    setExpandedLogItems(newExpanded);
  };

  const toggleSidebarItem = (index: number) => {
    const newExpanded = new Set(expandedSidebarItems);
    if (newExpanded.has(index)) newExpanded.delete(index);
    else newExpanded.add(index);
    setExpandedSidebarItems(newExpanded);
  };

  return (
    <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] border border-[#1e293b]/30 overflow-clip relative rounded-[40px] shadow-[0px_4px_90px_0px_rgba(0,0,0,0.5),0px_0px_100px_0px_rgba(59,130,246,0.1)] size-full backdrop-blur-xl" data-name="Overview">
      <Sidebar activePage="overview" />

      <div className="absolute left-[101px] right-[33.333%] top-0 bottom-0 overflow-y-auto z-0">
        <div className="p-[56px] pl-[39px] max-w-full">
          <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Overview</h1>
          <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
            <span className="text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">•  LIVE</span>
          </p>

          {/* Stats Bar */}
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px] mb-[24px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 to-transparent pointer-events-none" />
            <div className="flex items-end justify-start h-[60px] gap-[6px] relative z-10">
              {[25, 8, 16, 33, 30, 16, 33, 25, 8, 16, 25, 30, 16, 33, 25, 8, 16, 25, 30, 16, 33, 0, 16].map((height, index) => (
                <div key={index} className="flex-1 bg-gradient-to-t from-[#3b82f6]/30 to-[#3b82f6]/10 rounded-t-[3px] transition-all duration-300" style={{ height: `${height}px` }} />
              ))}
              <div className="flex-1 bg-gradient-to-t from-[#3b82f6] to-[#60a5fa] rounded-t-[3px] shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse" style={{ height: '60px' }} />
              {[16, 33].map((height, index) => (
                <div key={`end-${index}`} className="flex-1 bg-gradient-to-t from-[#3b82f6]/30 to-[#3b82f6]/10 rounded-t-[3px]" style={{ height: `${height}px` }} />
              ))}
            </div>
          </div>

          {/* Decision Log */}
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-[24px]">
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px] tracking-tight">Decision Log</h2>
              </div>
              <div className="border-t border-[#334155]/50 mb-[24px]" />

              {decisionLog.length === 0 ? (
                <p className="text-[#94a3b8] text-[14px]">No decisions yet.</p>
              ) : (
                <div className="space-y-[20px] max-h-[600px] overflow-y-auto pr-[8px]">
                  {decisionLog.map((entry, index) => (
                    <div key={index} className="group -mx-4 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-[#1e293b]/30">
                      <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={() => toggleLogItem(index)}>
                        <div className="flex-1 min-w-0">
                          <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[18px] text-[#e2e8f0] mb-[8px]">
                            <span>{entry.agent}  </span>
                            <span className={`${entry.status === 'green' ? 'text-[#10b981]' : entry.status === 'red' ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>•</span>
                          </p>
                          <p className="font-['Mulish:Regular',sans-serif] font-normal text-[16px] text-[#94a3b8]">{entry.description}</p>
                        </div>
                        <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[18px] text-[#cbd5e1] whitespace-nowrap font-mono">{entry.time}</p>
                      </div>

                      {entry.status === 'green' && expandedLogItems.has(index) && (
                        <div className="mt-[16px] pt-[16px] border-t border-[#334155]/30">
                          <p className="text-[#94a3b8] text-[14px] mb-[8px]">Reasoning approved. Action executed.</p>
                          {entry.gateTime && <p className="text-[#64748b] text-[13px]">Gate: {entry.gateTime}ms</p>}
                        </div>
                      )}

                      {entry.status === 'red' && expandedLogItems.has(index) && (
                        <div className="mt-[16px] pt-[16px] border-t border-[#334155]/30">
                          <p className="text-[#94a3b8] text-[14px] mb-[8px]">{entry.blockReason}</p>
                          <p className="italic text-[#64748b] text-[13px]">Action never executed. Agent still running.</p>
                        </div>
                      )}

                      {entry.status === 'orange' && expandedLogItems.has(index) && (
                        <div className="mt-[16px] pt-[16px] border-t border-[#334155]/30">
                          <p className="text-[#94a3b8] text-[14px] mb-[12px]">{entry.pauseReason}</p>
                          <div className="flex gap-[12px]">
                            <button onClick={() => handleReview(entry.logId, 'allow')} className="flex-1 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold text-[14px] py-[10px] px-[20px] rounded-[8px] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">Allow</button>
                            <button onClick={() => handleReview(entry.logId, 'block')} className="flex-1 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white font-semibold text-[14px] py-[10px] px-[20px] rounded-[8px] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all">Block</button>
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
      </div>

      {/* Right Sidebar */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-l border-[#1e293b]/50 shadow-[-12px_0_48px_0_rgba(0,0,0,0.7)] backdrop-blur-xl p-[48px] overflow-y-auto z-10">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#6366f1]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[22px] mb-[32px] tracking-tight">System Status</h2>

          {/* Real Stats */}
          <div className="space-y-[24px] mb-[48px]">
            {[
              { label: 'Agents Monitored', value: String(metrics.agents_monitored), percentage: 75, color: 'from-[#8b5cf6] to-[#6366f1]' },
              { label: 'Allowed', value: String(metrics.allowed), percentage: metrics.total ? Math.round((metrics.allowed / metrics.total) * 100) : 0, color: 'from-[#10b981] to-[#059669]' },
              { label: 'Blocked', value: String(metrics.blocked), percentage: metrics.total ? Math.round((metrics.blocked / metrics.total) * 100) : 0, color: 'from-[#ef4444] to-[#dc2626]' },
              { label: 'Paused', value: String(metrics.paused), percentage: metrics.total ? Math.round((metrics.paused / metrics.total) * 100) : 0, color: 'from-[#f59e0b] to-[#d97706]' },
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-[8px]">
                  <p className="font-['Mulish:Medium',sans-serif] font-medium text-[#94a3b8] text-[13px]">{stat.label}</p>
                  <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#cbd5e1] text-[13px] font-mono">{stat.value}</p>
                </div>
                <div className="w-full bg-[#1e293b]/50 h-[6px] rounded-full overflow-hidden">
                  <div className={`bg-gradient-to-r ${stat.color} h-full rounded-full transition-all duration-500`} style={{ width: `${stat.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Pending Actions */}
          <div className="mb-[32px]">
            <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[18px] mb-[20px] tracking-tight">Pending Actions</h3>
            {pendingActions.length === 0 ? (
              <p className="text-[#64748b] text-[13px]">No pending actions.</p>
            ) : (
              <div className="space-y-[12px]">
                {pendingActions.map((item, index) => (
                  <div key={index} className="bg-[#1e293b]/30 rounded-lg p-[12px] border border-[#334155]/20 hover:border-[#f59e0b]/30 transition-all">
                    <div className="cursor-pointer" onClick={() => toggleSidebarItem(index)}>
                      <div className="flex items-start gap-[12px]">
                        <div className="w-[6px] h-[6px] rounded-full bg-[#f59e0b] mt-[6px] shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#e2e8f0] text-[13px] mb-[4px]">{item.agent}</p>
                          <p className="text-[#94a3b8] text-[11px] mb-[2px] truncate">{item.description}</p>
                          <p className="text-[#64748b] text-[10px]">{item.time}</p>
                        </div>
                      </div>
                    </div>
                    {expandedSidebarItems.has(index) && (
                      <div className="mt-[12px] pt-[12px] border-t border-[#334155]/30 flex gap-[8px]">
                        <button onClick={() => handleReview(item.logId, 'allow')} className="flex-1 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold text-[11px] py-[8px] px-[12px] rounded-[6px] transition-all">ALLOW</button>
                        <button onClick={() => handleReview(item.logId, 'block')} className="flex-1 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white font-semibold text-[11px] py-[8px] px-[12px] rounded-[6px] transition-all">BLOCK</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Track agent actions card */}
          <div className="bg-gradient-to-br from-[#1e293b]/70 to-[#0f172a]/50 border border-[#334155]/30 rounded-[16px] p-[24px] backdrop-blur-xl relative overflow-hidden group hover:border-[#3b82f6]/50 transition-all duration-300">
            <div className="relative z-10">
              <h3 className="font-semibold text-white text-[16px] mb-[12px]">Track agent actions</h3>
              <p className="text-[#94a3b8] text-[12px] mb-[24px] leading-[21px]">The permanent, tamper-proof record of every gate decision on every action.</p>
              <button
                onClick={() => window.location.href = '/ledger'}
                className="w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white font-semibold text-[13px] py-[12px] px-[24px] rounded-[10px] tracking-[1.5px] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all">
                VIEW LEDGER
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
