import { Sidebar } from "../components/Sidebar";
import { AgentCard } from "../components/AgentCard";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPatch } from "@/lib/api";

export function AgentsPage() {
  const { token, isLoading } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [showIdentity, setShowIdentity] = useState<boolean>(true);
  const [showScope, setShowScope] = useState<boolean>(true);
  const [showRecentActions, setShowRecentActions] = useState<boolean>(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [agentStats, setAgentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

const [allStats, setAllStats] = useState<Record<string, any>>({});

useEffect(() => {
  if (!token || isLoading) return;
  apiGet('/agents', token).then(async res => {
    if (res.data) {
      setAgents(res.data);
      // Fetch stats for each agent
      const statsMap: Record<string, any> = {};
      await Promise.all(res.data.map(async (agent: any) => {
        const s = await apiGet(`/agents/${agent.id}/stats`, token);
        if (s.data) statsMap[agent.id] = s.data;
        setAllStats({...statsMap});
      }));
      setAllStats(statsMap);
    }
    setLoading(false);
  });
}, [token, isLoading]);

  // Reset when agent selection changes
  useEffect(() => {
    setAgentStats(null);
    setRecentActions([]);
  }, [selectedAgent]);

  // Fetch stats and recent actions when agent selected
  useEffect(() => {
    if (selectedAgent === null || !token || isLoading || !agents[selectedAgent]) return;
    const agentId = agents[selectedAgent].id;

    apiGet(`/monitoring/ledger?agent_id=${agentId}&limit=5`, token).then(res => {
      if (res.data?.rows) {
        setRecentActions(res.data.rows.map((row: any) => ({
          status: row.status === 'allow' ? 'green' : row.status === 'block' ? 'red' : 'orange',
          description: `"${row.action}"`,
          time: new Date(row.created_at).toLocaleTimeString(),
          outcome: row.status === 'allow'
            ? 'Reasoning approved. Action executed.'
            : row.status === 'block'
            ? 'Action blocked by policy.'
            : 'Action paused for review.',
          detail: row.status === 'block' ? 'Action never executed. Agent still running.' : null,
        })));
      }
    });

    apiGet(`/agents/${agentId}/stats`, token).then(res => {
      if (res.data) setAgentStats(res.data);
    });
  }, [selectedAgent, agents, token, isLoading]);

  const handleBlockAllow = async (agent: any) => {
    if (!token) return;
    const newStatus = agent.status === 'blocked' ? 'active' : 'blocked';
    await apiPatch(`/agents/${agent.id}`, token, { status: newStatus });
    const res = await apiGet('/agents', token);
    if (res.data) setAgents(res.data);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] size-full rounded-[40px] flex items-center justify-center">
        <p className="text-[#94a3b8]">Loading agents...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] border border-[#1e293b]/30 overflow-clip relative rounded-[40px] shadow-[0px_4px_90px_0px_rgba(0,0,0,0.5),0px_0px_100px_0px_rgba(59,130,246,0.1)] size-full backdrop-blur-xl" data-name="Agents">
      <Sidebar activePage="agents" />

      <div className={`absolute left-[101px] top-0 bottom-0 overflow-y-auto transition-all ${selectedAgent !== null ? 'right-[33%]' : 'right-0'}`}>
        <div className="p-[56px] pl-[39px] pr-[32px] max-w-full">
          <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Agents</h1>
          <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
            <span className="text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">•  LIVE</span>
          </p>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-[24px] mb-[32px]">
            <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] p-[24px] hover:border-[#3b82f6]/50 transition-all">
              <p className="text-[#94a3b8] text-[14px] mb-[8px]">Total Agents</p>
              <p className="text-white text-[36px]">{agents.length}</p>
            </div>
            <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] p-[24px] hover:border-[#10b981]/50 transition-all">
              <p className="text-[#94a3b8] text-[14px] mb-[8px]">Active</p>
              <p className="text-[#10b981] text-[36px]">{agents.filter(a => a.status === 'active').length}</p>
            </div>
            <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] p-[24px] hover:border-[#ef4444]/50 transition-all">
              <p className="text-[#94a3b8] text-[14px] mb-[8px]">Blocked</p>
              <p className="text-[#ef4444] text-[36px]">{agents.filter(a => a.status === 'blocked').length}</p>
            </div>
            <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] p-[24px] hover:border-[#8b5cf6]/50 transition-all">
              <p className="text-[#94a3b8] text-[14px] mb-[8px]">Sources</p>
              <p className="text-white text-[36px]">{new Set(agents.map(a => a.source)).size}</p>
            </div>
          </div>

          {/* Agents List */}
          {agents.length === 0 ? (
            <p className="text-[#94a3b8] text-[14px]">No agents registered yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-[20px]">
              {agents.map((agent, index) => (
                <AgentCard
                  key={agent.id}
                  name={agent.name}
                  identity={agent.status === 'blocked' ? 'blocked' : 'allowed'}
                  trust={allStats[agent.id]?.trust_score ?? null}
                  gateRate={allStats[agent.id]?.gate_rate ?? null}
                  blockedToday={allStats[agent.id]?.blocked ?? null}
                  isSelected={selectedAgent === index}
                  onClick={() => setSelectedAgent(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Agent Details */}
      {selectedAgent !== null && agents[selectedAgent] && (
        <div className="fixed right-0 top-0 bottom-0 w-1/3 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-l border-[#1e293b]/50 shadow-[-12px_0_48px_0_rgba(0,0,0,0.7)] backdrop-blur-xl z-50 overflow-y-auto">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#a78bfa]/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="p-[48px] relative z-10">

            {/* Agent Name Header */}
            <div className="flex items-center gap-[12px] mb-[24px]">
              <div className={`size-[12px] rounded-full ${agents[selectedAgent].status === 'active'
                ? 'bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                : 'bg-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.6)]'}`} />
              <h2 className="font-bold text-white text-[24px] tracking-tight">{agents[selectedAgent].name}</h2>
            </div>

            {/* Source Badge */}
            <div className="bg-gradient-to-br from-[#3b82f6]/10 to-transparent border border-[#3b82f6]/30 rounded-[16px] p-[24px] mb-[24px]">
              <p className="text-[#3b82f6] text-[12px] mb-[8px] uppercase tracking-wider">Source</p>
              <p className="font-bold text-white text-[28px]">{agents[selectedAgent].source?.toUpperCase() || '—'}</p>
            </div>

            {/* Risk Profile + Status */}
            <div className="bg-gradient-to-br from-[#1e293b]/40 to-[#0f172a]/20 border border-[#334155]/30 rounded-[12px] p-[20px] mb-[32px]">
              <div className="flex justify-between items-center">
                <p className="text-[#94a3b8] text-[14px]">Risk Profile</p>
                <p className={`text-[14px] font-semibold capitalize ${
                  agents[selectedAgent].risk_profile === 'high' ? 'text-[#ef4444]' :
                  agents[selectedAgent].risk_profile === 'medium' ? 'text-[#f59e0b]' :
                  'text-[#10b981]'}`}>
                  {agents[selectedAgent].risk_profile}
                </p>
              </div>
              <div className="flex justify-between items-center mt-[12px]">
                <p className="text-[#94a3b8] text-[14px]">Status</p>
                <p className={`text-[14px] font-semibold capitalize ${
                  agents[selectedAgent].status === 'active' ? 'text-[#10b981]' :
                  agents[selectedAgent].status === 'blocked' ? 'text-[#ef4444]' :
                  'text-[#f59e0b]'}`}>
                  {agents[selectedAgent].status}
                </p>
              </div>
            </div>

            {/* IDENTITY Section */}
            <div className="mb-[24px]">
              <button onClick={() => setShowIdentity(!showIdentity)} className="flex items-center gap-[8px] mb-[16px] w-full">
                <svg className={`size-[16px] transition-transform ${showIdentity ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 16 16">
                  <path d="M6 12L10 8L6 4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[#94a3b8] text-[11px] uppercase tracking-wider font-semibold">IDENTITY</p>
              </button>
              {showIdentity && (
                <div className="space-y-[12px] ml-[24px]">
                  <div className="flex justify-between items-center">
                    <p className="text-[#94a3b8] text-[14px]">Agent ID:</p>
                    <p className="text-white text-[12px] font-mono">{agents[selectedAgent].id?.slice(0, 8)}...</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#94a3b8] text-[14px]">Identity:</p>
                    <div className="flex items-center gap-[8px]">
                      <div className={`size-[8px] rounded-full ${agents[selectedAgent].status === 'active' ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
                      <p className="text-white text-[14px] capitalize">{agents[selectedAgent].status === 'active' ? 'verified' : 'blocked'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#94a3b8] text-[14px]">Trust Score:</p>
                    <p className={`text-[14px] font-semibold ${
                      (agentStats?.trust_score ?? 100) >= 70 ? 'text-[#10b981]' :
                      (agentStats?.trust_score ?? 100) >= 40 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                    }`}>{agentStats ? `${agentStats.trust_score} / 100` : '—'}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#94a3b8] text-[14px]">Gate Rate:</p>
                    <p className="text-white text-[14px]">{agentStats ? `${agentStats.gate_rate}%` : '—'}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#94a3b8] text-[14px]">Total Actions:</p>
                    <p className="text-white text-[14px]">{agentStats ? agentStats.total : '—'}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#94a3b8] text-[14px]">Blocked:</p>
                    <p className="text-[#ef4444] text-[14px]">{agentStats ? agentStats.blocked : '—'}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#94a3b8] text-[14px]">Anomalies:</p>
                    <p className="text-[#f59e0b] text-[14px]">{agentStats ? agentStats.anomalies : '—'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* SCOPE Section */}
            <div className="mb-[24px]">
              <button onClick={() => setShowScope(!showScope)} className="flex items-center gap-[8px] mb-[16px] w-full">
                <svg className={`size-[16px] transition-transform ${showScope ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 16 16">
                  <path d="M6 12L10 8L6 4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[#94a3b8] text-[11px] uppercase tracking-wider font-semibold">SCOPE</p>
              </button>
              {showScope && (
                <div className="space-y-[12px] ml-[24px]">
                  <div className="flex justify-between items-center">
                    <p className="text-[#94a3b8] text-[14px]">Source:</p>
                    <p className="text-white text-[14px] capitalize">{agents[selectedAgent].source}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#94a3b8] text-[14px]">Risk Profile:</p>
                    <p className="text-white text-[14px] capitalize">{agents[selectedAgent].risk_profile}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#94a3b8] text-[14px]">External calls:</p>
                    <div className="flex items-center gap-[8px]">
                      <div className="size-[8px] rounded-full bg-[#ef4444]" />
                      <p className="text-white text-[14px]">blocked</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RECENT ACTIONS Section */}
            <div className="mb-[32px]">
              <button onClick={() => setShowRecentActions(!showRecentActions)} className="flex items-center gap-[8px] mb-[16px] w-full">
                <svg className={`size-[16px] transition-transform ${showRecentActions ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 16 16">
                  <path d="M6 12L10 8L6 4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[#94a3b8] text-[11px] uppercase tracking-wider font-semibold">RECENT ACTIONS</p>
              </button>
              {showRecentActions && (
                <div className="space-y-[16px]">
                  {recentActions.length === 0 ? (
                    <p className="text-[#64748b] text-[13px] ml-[24px]">No recent actions.</p>
                  ) : recentActions.map((action, idx) => (
                    <div key={idx} className="border-b border-[#334155]/30 pb-[16px] last:border-0">
                      <div className="flex items-start gap-[8px]">
                        <div className={`size-[8px] rounded-full mt-[6px] flex-shrink-0 ${
                          action.status === 'green' ? 'bg-[#10b981]' :
                          action.status === 'orange' ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'}`} />
                        <div className="flex-1">
                          <p className="text-[#cbd5e1] text-[13px]">{action.description}</p>
                          <p className="text-[#94a3b8] text-[12px] mt-[4px]">{action.outcome}</p>
                          {action.detail && <p className="text-[#64748b] text-[11px] italic mt-[2px]">{action.detail}</p>}
                          <p className="text-[#64748b] text-[11px] mt-[4px]">{action.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Block/Allow Agent Button */}
            <button
              onClick={() => handleBlockAllow(agents[selectedAgent])}
              className={`w-full py-[12px] px-[24px] rounded-[8px] border-2 font-semibold text-[14px] uppercase tracking-wider transition-all ${
                agents[selectedAgent].status === 'active'
                  ? 'border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10'
                  : 'border-[#10b981] text-[#10b981] hover:bg-[#10b981]/10'}`}>
              {agents[selectedAgent].status === 'active' ? 'Block Agent' : 'Allow Agent'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}