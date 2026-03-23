import { Sidebar } from "../components/Sidebar";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPost } from "@/lib/api";

export function LedgerPage() {
  const { token, isLoading } = useAuth();
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('All Agents');
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [chainStatus, setChainStatus] = useState<{valid: boolean, total: number} | null>(null);

  const fetchEntries = (tok: string) => {
    apiGet('/monitoring/ledger?limit=50', tok).then(res => {
      if (res.data?.rows) {
        const mapped = res.data.rows.map((row: any) => ({
          time: new Date(row.created_at).toLocaleTimeString(),
          agent: row.agent_id,
          type: row.metadata?.type || 'DB_QUERY',
          intent: row.action,
          gate: row.metadata?.gate_ms ? `${row.metadata.gate_ms}ms` : '—',
          status: row.status === 'allow' ? 'green' : row.status === 'block' ? 'red' : 'orange',
          logId: row.id,
        }));
        setAllEntries(mapped);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!token || isLoading) return;
    fetchEntries(token);
    apiGet('/audit/verify', token).then(res => {
      if (res.data) setChainStatus(res.data);
    });
  }, [token, isLoading]);

  const handleReview = async (entry: any, action: 'allow' | 'block') => {
    if (!token || !entry.logId) return;
    await apiPost(`/audit/review/${entry.logId}`, token, {
      action,
      reason: `Human reviewed and ${action}ed the action`
    });
    fetchEntries(token);
    setSelectedEntry(null);
  };

  const toggleEntry = (index: number) => {
    setSelectedEntry(selectedEntry === index ? null : index);
  };

  const agents = ['All Agents', ...Array.from(new Set(allEntries.map(e => e.agent)))];
  const types = ['All Types', 'DB_QUERY', 'API_CALL', 'ANALYSIS', 'RESPONSE'];
  const statuses = ['All Statuses', 'Allowed', 'Blocked', 'Paused'];

  const filteredEntries = allEntries.filter(entry => {
    const search = searchTerm.toLowerCase();
    const statusText = entry.status === 'green' ? 'allowed' : entry.status === 'red' ? 'blocked' : 'paused';
    const matchesSearch =
      entry.agent.toLowerCase().includes(search) ||
      entry.type.toLowerCase().includes(search) ||
      statusText.includes(search) ||
      entry.intent.toLowerCase().includes(search);
    const matchesAgent = selectedAgent === 'All Agents' || entry.agent === selectedAgent;
    const matchesType = selectedType === 'All Types' || entry.type === selectedType;
    const matchesStatus =
      selectedStatus === 'All Statuses' ||
      (selectedStatus === 'Allowed' && entry.status === 'green') ||
      (selectedStatus === 'Blocked' && entry.status === 'red') ||
      (selectedStatus === 'Paused' && entry.status === 'orange');
    return matchesSearch && matchesAgent && matchesType && matchesStatus;
  });

  return (
    <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] border border-[#1e293b]/30 overflow-clip relative rounded-[40px] shadow-[0px_4px_90px_0px_rgba(0,0,0,0.5),0px_0px_100px_0px_rgba(59,130,246,0.1)] size-full backdrop-blur-xl" data-name="Ledger">
      <Sidebar activePage="ledger" />

      <div className="absolute left-[101px] right-[33.333%] top-0 bottom-0 overflow-y-auto">
        <div className="p-[56px] pl-[39px]">
          <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Ledger</h1>

          <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
            <span className="text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">•  LIVE</span>
          </p>

          {/* Search Bar */}
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl hover:border-[#3b82f6]/50 transition-all duration-300 flex items-center gap-[12px] px-[28px] py-[20px] mb-[32px] relative z-20">
            <div className="flex items-center gap-[12px] flex-1">
              <input
                type="text"
                className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[16px] bg-transparent outline-none flex-1 placeholder:text-[#475569]"
                placeholder="Search ledger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-[12px]">
              {/* Agent Dropdown */}
              <div className="relative z-30">
                <button onClick={() => { setShowAgentDropdown(!showAgentDropdown); setShowTypeDropdown(false); setShowStatusDropdown(false); }}
                  className="bg-[#0f172a]/50 border border-[#334155]/50 hover:border-[#3b82f6]/50 rounded-[8px] px-[16px] py-[10px] flex items-center gap-[8px] transition-all">
                  <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] whitespace-nowrap">{selectedAgent}</p>
                </button>
                {showAgentDropdown && (
                  <div className="absolute top-full mt-[8px] right-0 min-w-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155]/50 rounded-[12px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden z-[100]">
                    {agents.map((agent) => (
                      <button key={agent} onClick={() => { setSelectedAgent(agent); setShowAgentDropdown(false); }}
                        className={`w-full text-left px-[16px] py-[10px] text-[14px] transition-all hover:bg-[#1e293b]/50 ${selectedAgent === agent ? 'text-[#3b82f6]' : 'text-[#94a3b8]'}`}>
                        {agent}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="relative z-30">
                <button onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowAgentDropdown(false); setShowTypeDropdown(false); }}
                  className="bg-[#0f172a]/50 border border-[#334155]/50 hover:border-[#3b82f6]/50 rounded-[8px] px-[16px] py-[10px] flex items-center gap-[8px] transition-all">
                  <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] whitespace-nowrap">{selectedStatus}</p>
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full mt-[8px] right-0 min-w-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155]/50 rounded-[12px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden z-[100]">
                    {statuses.map((status) => (
                      <button key={status} onClick={() => { setSelectedStatus(status); setShowStatusDropdown(false); }}
                        className={`w-full text-left px-[16px] py-[10px] text-[14px] transition-all hover:bg-[#1e293b]/50 ${selectedStatus === status ? 'text-[#3b82f6]' : 'text-[#94a3b8]'}`}>
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Entries Table */}
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px]">
            <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px] mb-[24px]">Entries</h2>
            <div className="border-t border-[#334155]/50 mb-[24px]" />

            {loading ? (
              <p className="text-[#94a3b8] text-[14px]">Loading...</p>
            ) : filteredEntries.length === 0 ? (
              <p className="text-[#94a3b8] text-[14px]">No entries found.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155]/30">
                    <th className="text-left pb-[16px] text-[#64748b] text-[11px] uppercase tracking-wider">TIME</th>
                    <th className="text-left pb-[16px] text-[#64748b] text-[11px] uppercase tracking-wider">AGENT</th>
                    <th className="text-left pb-[16px] text-[#64748b] text-[11px] uppercase tracking-wider">TYPE</th>
                    <th className="text-left pb-[16px] text-[#64748b] text-[11px] uppercase tracking-wider">INTENT</th>
                    <th className="text-left pb-[16px] text-[#64748b] text-[11px] uppercase tracking-wider">GATE</th>
                    <th className="text-right pb-[16px] text-[#64748b] text-[11px] uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => (
                    <>
                      <tr key={index} className="border-b border-[#334155]/20 hover:bg-[#1e293b]/30 transition-all cursor-pointer" onClick={() => toggleEntry(index)}>
                        <td className="py-[16px] text-[#94a3b8] text-[14px] font-mono">{entry.time}</td>
                        <td className="py-[16px] font-bold text-white text-[14px]">{entry.agent}</td>
                        <td className="py-[16px] text-[#64748b] text-[13px] uppercase">{entry.type}</td>
                        <td className="py-[16px] text-[#cbd5e1] text-[14px]">"{entry.intent}"</td>
                        <td className="py-[16px] text-[#94a3b8] text-[14px]">{entry.gate}</td>
                        <td className="py-[16px] text-right">
                          <div className={`inline-block size-[10px] rounded-full ${
                            entry.status === 'green' ? 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                            entry.status === 'red' ? 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                            'bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                          }`} />
                        </td>
                      </tr>
                      {selectedEntry === index && (
                        <tr key={`detail-${index}`}>
                          <td colSpan={6} className="pb-[16px]">
                            <div className="p-[16px] bg-[#0f172a]/50 border border-[#334155]/30 rounded-[12px]">
                              {entry.status === 'green' && (
                                <p className="text-[#94a3b8] text-[13px]">Reasoning approved. Action executed.</p>
                              )}
                              {entry.status === 'red' && (
                                <p className="text-[#ef4444] text-[13px]">Action blocked by policy. Action never executed. Agent still running.</p>
                              )}
                              {entry.status === 'orange' && (
                                <div>
                                  <p className="text-[#94a3b8] text-[13px] mb-[12px]">Action paused — requires human review.</p>
                                  <div className="flex gap-[12px]">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleReview(entry, 'allow'); }}
                                      className="flex-1 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold text-[14px] py-[10px] px-[20px] rounded-[8px] transition-all">
                                      Allow
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleReview(entry, 'block'); }}
                                      className="flex-1 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white font-semibold text-[14px] py-[10px] px-[20px] rounded-[8px] transition-all">
                                      Block
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex items-center justify-between mt-[32px] pt-[24px] border-t border-[#334155]/30">
              <p className="text-[#64748b] text-[14px]">Showing {filteredEntries.length} entries</p>
              <div className="flex items-center gap-[8px]">
                <span className={chainStatus?.valid ? "text-[#10b981]" : chainStatus === null ? "text-[#64748b]" : "text-[#ef4444]"}>⚡</span>
                <p className={`text-[14px] font-semibold ${chainStatus?.valid ? "text-[#10b981]" : chainStatus === null ? "text-[#64748b]" : "text-[#ef4444]"}`}>
                  {chainStatus === null
                    ? "Checking chain..."
                    : chainStatus.valid
                    ? `Chain Valid (${chainStatus.total} rows)`
                    : "Chain Broken!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-l border-[#1e293b]/50 backdrop-blur-xl p-[48px] overflow-y-auto z-10">
        <h2 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[22px] mb-[32px]">Analytics</h2>

        <div className="space-y-[16px]">
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] p-[20px]">
            <p className="text-[#94a3b8] text-[14px] mb-[4px]">Allowed</p>
            <p className="text-white text-[28px]">{allEntries.filter(e => e.status === 'green').length}</p>
          </div>
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] p-[20px]">
            <p className="text-[#94a3b8] text-[14px] mb-[4px]">Blocked</p>
            <p className="text-white text-[28px]">{allEntries.filter(e => e.status === 'red').length}</p>
          </div>
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] p-[20px]">
            <p className="text-[#94a3b8] text-[14px] mb-[4px]">Paused</p>
            <p className="text-white text-[28px]">{allEntries.filter(e => e.status === 'orange').length}</p>
          </div>

          {/* Chain Status Card */}
          <div className={`bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border rounded-[16px] p-[20px] ${
            chainStatus?.valid ? 'border-[#10b981]/30' :
            chainStatus === null ? 'border-[#334155]/30' :
            'border-[#ef4444]/30'}`}>
            <p className="text-[#94a3b8] text-[14px] mb-[4px]">Chain Integrity</p>
            <p className={`text-[20px] font-semibold ${
              chainStatus?.valid ? 'text-[#10b981]' :
              chainStatus === null ? 'text-[#64748b]' :
              'text-[#ef4444]'}`}>
              {chainStatus === null ? 'Checking...' : chainStatus.valid ? '✓ Valid' : '✗ Broken'}
            </p>
            {chainStatus && (
              <p className="text-[#64748b] text-[12px] mt-[4px]">{chainStatus.total} rows verified</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}