import { Sidebar } from "../components/Sidebar";

import { useState } from "react";

export function LedgerPage() {
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('All Agents');
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const toggleEntry = (index: number) => {
    setSelectedEntry(selectedEntry === index ? null : index);
  };

  const allEntries = [
    { time: '14:32:15', agent: 'ARIA-7X', type: 'DB_QUERY', intent: 'Retrieve pending claims for daily triage', gate: '11ms', status: 'green' },
    { time: '14:32:08', agent: 'ARIA-7X', type: 'API_CALL', intent: 'Send claims data to external API', gate: '—', status: 'red' },
    { time: '14:31:55', agent: 'SCOUT-3B', type: 'ANALYSIS', intent: 'Flag unusual API traffic patterns', gate: '8ms', status: 'green' },
    { time: '14:31:02', agent: 'HELPER-2A', type: 'DB_QUERY', intent: 'Pull ALL customer records for export', gate: '—', status: 'orange' },
    { time: '14:30:45', agent: 'ARIA-7X', type: 'RESPONSE', intent: 'Deliver compliance metrics to manager', gate: '6ms', status: 'green' },
    { time: '14:28:44', agent: 'CORE-1', type: 'API_CALL', intent: 'Override billing limit for customer #4421', gate: '—', status: 'orange' },
  ];

  const agents = ['All Agents', 'ARIA-7X', 'SCOUT-3B', 'HELPER-2A', 'CORE-1'];
  const types = ['All Types', 'DB_QUERY', 'API_CALL', 'ANALYSIS', 'RESPONSE'];
  const statuses = ['All Statuses', 'Allowed', 'Blocked', 'Paused'];

  const filteredEntries = allEntries.filter(entry => {
    const search = searchTerm.toLowerCase();
    const statusText = entry.status === 'green' ? 'allowed' : entry.status === 'red' ? 'blocked' : 'paused';

    const matchesSearch =
      entry.agent.toLowerCase().includes(search) ||
      entry.type.toLowerCase().includes(search) ||
      statusText.includes(search) ||
      entry.status.includes(search) ||
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
      {/* Sidebar */}
      <Sidebar activePage="ledger" />

      {/* Main Content Container - excludes left sidebar and right sidebar */}
      <div className="absolute left-[101px] right-[33.333%] top-0 bottom-0 overflow-y-auto">
        <div className="p-[56px] pl-[39px]">
          {/* Page Title */}
          <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Ledger</h1>

          {/* Live Status */}
          <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
            <span>13:17:25  </span>
            <span className="text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">•  LIVE</span>
          </p>

          {/* Search Bar */}
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl hover:border-[#3b82f6]/50 transition-all duration-300 flex items-center gap-[12px] px-[28px] py-[20px] mb-[32px] relative z-20">
            <div className="flex items-center gap-[12px] flex-1">
              <div className="size-[20px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <input
                type="text"
                className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[16px] bg-transparent outline-none flex-1 placeholder:text-[#475569]"
                placeholder="Search ledger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-[12px]">
              {/* All Agents Dropdown */}
              <div className="relative z-30">
                <button
                  onClick={() => {
                    setShowAgentDropdown(!showAgentDropdown);
                    setShowTypeDropdown(false);
                    setShowStatusDropdown(false);
                  }}
                  className="bg-[#0f172a]/50 border border-[#334155]/50 hover:border-[#3b82f6]/50 rounded-[8px] px-[16px] py-[10px] flex items-center gap-[8px] transition-all group hover:bg-[#1e293b]/30"
                >
                  <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] whitespace-nowrap">{selectedAgent}</p>
                  <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                    <path d="M4 6L8 10L12 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {showAgentDropdown && (
                  <div className="absolute top-full mt-[8px] right-0 min-w-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155]/50 rounded-[12px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden z-[100]">
                    {agents.map((agent) => (
                      <button
                        key={agent}
                        onClick={() => {
                          setSelectedAgent(agent);
                          setShowAgentDropdown(false);
                        }}
                        className={`w-full text-left px-[16px] py-[10px] font-['Mulish:Regular',sans-serif] font-normal text-[14px] transition-all hover:bg-[#1e293b]/50 ${selectedAgent === agent ? 'text-[#3b82f6] bg-[#1e293b]/30' : 'text-[#94a3b8]'
                          }`}
                      >
                        {agent}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* All Types Dropdown */}
              <div className="relative z-30">
                <button
                  onClick={() => {
                    setShowTypeDropdown(!showTypeDropdown);
                    setShowAgentDropdown(false);
                    setShowStatusDropdown(false);
                  }}
                  className="bg-[#0f172a]/50 border border-[#334155]/50 hover:border-[#3b82f6]/50 rounded-[8px] px-[16px] py-[10px] flex items-center gap-[8px] transition-all group hover:bg-[#1e293b]/30"
                >
                  <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] whitespace-nowrap">{selectedType}</p>
                  <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                    <path d="M4 6L8 10L12 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {showTypeDropdown && (
                  <div className="absolute top-full mt-[8px] right-0 min-w-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155]/50 rounded-[12px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden z-[100]">
                    {types.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedType(type);
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full text-left px-[16px] py-[10px] font-['Mulish:Regular',sans-serif] font-normal text-[14px] transition-all hover:bg-[#1e293b]/50 ${selectedType === type ? 'text-[#3b82f6] bg-[#1e293b]/30' : 'text-[#94a3b8]'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* All Statuses Dropdown */}
              <div className="relative z-30">
                <button
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowAgentDropdown(false);
                    setShowTypeDropdown(false);
                  }}
                  className="bg-[#0f172a]/50 border border-[#334155]/50 hover:border-[#3b82f6]/50 rounded-[8px] px-[16px] py-[10px] flex items-center gap-[8px] transition-all group hover:bg-[#1e293b]/30"
                >
                  <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] whitespace-nowrap">{selectedStatus}</p>
                  <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                    <path d="M4 6L8 10L12 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full mt-[8px] right-0 min-w-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155]/50 rounded-[12px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden z-[100]">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setSelectedStatus(status);
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-[16px] py-[10px] font-['Mulish:Regular',sans-serif] font-normal text-[14px] transition-all hover:bg-[#1e294b]/50 ${selectedStatus === status ? 'text-[#3b82f6] bg-[#1e293b]/30' : 'text-[#94a3b8]'
                          }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Entries Section */}
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px] relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-[24px]">
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px] tracking-tight">Entries</h2>
                <div className="border border-[#334155]/50 hover:border-[#3b82f6]/50 rounded-[12px] px-[24px] py-[14px] flex items-center gap-[10px] transition-all group hover:bg-[#1e293b]/30 cursor-pointer">
                  <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[16px]">Most Recent</p>
                  <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                    <path d="M6 9l6 6 6-6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="border-t border-[#334155]/50 mb-[24px]" />

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#334155]/30">
                      <th className="text-left pb-[16px] font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">TIME</th>
                      <th className="text-left pb-[16px] font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">AGENT</th>
                      <th className="text-left pb-[16px] font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">TYPE</th>
                      <th className="text-left pb-[16px] font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">INTENT</th>
                      <th className="text-left pb-[16px] font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">GATE</th>
                      <th className="text-right pb-[16px] font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, index) => (
                      <tr
                        key={index}
                        className="border-b border-[#334155]/20 hover:bg-[#1e293b]/30 transition-all duration-200 cursor-pointer group"
                        onClick={() => toggleEntry(index)}
                      >
                        <td className="py-[16px] font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] font-mono">{entry.time}</td>
                        <td className="py-[16px] font-['Mulish:Bold',sans-serif] font-bold text-white text-[14px]">{entry.agent}</td>
                        <td className="py-[16px] font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[13px] uppercase tracking-wide">{entry.type}</td>
                        <td className="py-[16px] font-['Mulish:Regular',sans-serif] font-normal text-[#cbd5e1] text-[14px]">"{entry.intent}"</td>
                        <td className="py-[16px] font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px]">{entry.gate}</td>
                        <td className="py-[16px] text-right">
                          <div className="inline-flex justify-end">
                            <div className={`size-[10px] rounded-full ${entry.status === 'green'
                                ? 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                                : entry.status === 'red'
                                  ? 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                                  : 'bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                              }`} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer with pagination */}
              <div className="flex items-center justify-between mt-[32px] pt-[24px] border-t border-[#334155]/30">
                <div className="flex items-center gap-[24px]">
                  <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[14px]">Showing 1-6 of 247</p>
                  <div className="flex items-center gap-[8px]">
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[14px]">Chain:</p>
                    <span className="text-[#10b981] drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]">⚡</span>
                    <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#10b981] text-[14px]">Valid</p>
                  </div>
                </div>
                <div className="flex items-center gap-[8px]">
                  <button className="size-[32px] rounded-[8px] border border-[#334155]/50 hover:border-[#3b82f6]/50 hover:bg-[#1e293b]/30 transition-all flex items-center justify-center group">
                    <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                      <path d="M10 12L6 8L10 4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button className="size-[32px] rounded-[8px] border border-[#334155]/50 hover:border-[#3b82f6]/50 hover:bg-[#1e293b]/30 transition-all flex items-center justify-center group">
                    <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                      <path d="M6 12L10 8L6 4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Stats & Analytics */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-l border-[#1e293b]/50 shadow-[-12px_0_48px_0_rgba(0,0,0,0.7)] backdrop-blur-xl p-[48px] overflow-y-auto z-10">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#8b5cf6]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          {selectedEntry === null ? (
            <>
              {/* Analytics View */}
              <h2 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[22px] mb-[32px] tracking-tight">Analytics</h2>

              {/* Stats Cards */}
              <div className="space-y-[16px] mb-[32px]">
                {/* Allowed Card */}
                <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden group hover:border-[#10b981]/50 transition-all duration-300 p-[20px]">
                  <div className="flex items-center gap-[16px]">
                    <div className="bg-gradient-to-br from-[#10b981]/30 to-[#10b981]/10 rounded-[12px] size-[48px] backdrop-blur-sm flex items-center justify-center">
                      <svg className="size-[28px] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" fill="none" viewBox="0 0 32 32">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] text-[#94a3b8] mb-[4px]">Allowed</p>
                      <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[28px]">218</p>
                    </div>
                  </div>
                </div>

                {/* Blocked Card */}
                <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden group hover:border-[#ef4444]/50 transition-all duration-300 p-[20px]">
                  <div className="flex items-center gap-[16px]">
                    <div className="bg-gradient-to-br from-[#ef4444]/30 to-[#ef4444]/10 rounded-[12px] size-[48px] backdrop-blur-sm flex items-center justify-center">
                      <svg className="size-[32px] drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 9l-6 6m0-6l6 6" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] text-[#94a3b8] mb-[4px]">Blocked</p>
                      <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[28px]">23</p>
                    </div>
                  </div>
                </div>

                {/* Paused Card */}
                <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden group hover:border-[#f59e0b]/50 transition-all duration-300 p-[20px]">
                  <div className="flex items-center gap-[16px]">
                    <div className="bg-gradient-to-br from-[#f59e0b]/30 to-[#f59e0b]/10 rounded-[12px] size-[48px] backdrop-blur-sm flex items-center justify-center">
                      <svg className="size-[28px] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 10v4m4-4v4" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] text-[#94a3b8] mb-[4px]">Paused</p>
                      <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[28px]">5</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Overview */}
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden relative p-[24px]">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/5 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  {/* Header and Date Filter */}
                  <div className="flex items-center justify-between mb-[24px]">
                    <p className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[16px] tracking-tight">Activity Overview</p>
                    <div className="border border-[#334155]/50 hover:border-[#3b82f6]/50 rounded-[8px] px-[12px] py-[8px] flex items-center gap-[6px] transition-all group hover:bg-[#1e293b]/30 cursor-pointer">
                      <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[12px]">Feb 2026</p>
                      <div className="size-[16px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                          <path d="M6 9l6 6 6-6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-[180px] w-full relative mb-[16px]">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 flex flex-col justify-between h-full py-[12px]">
                      <p className="font-['Mulish:Bold',sans-serif] font-bold text-[#475569] text-[9px]">80%</p>
                      <p className="font-['Mulish:Bold',sans-serif] font-bold text-[#475569] text-[9px]">60%</p>
                      <p className="font-['Mulish:Bold',sans-serif] font-bold text-[#475569] text-[9px]">40%</p>
                      <p className="font-['Mulish:Bold',sans-serif] font-bold text-[#475569] text-[9px]">20%</p>
                    </div>

                    {/* Chart area */}
                    <div className="absolute left-[35px] right-0 top-0 bottom-0 flex items-end justify-start gap-[3px] border-t border-[#334155]/30">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-full h-0 border-t border-[#334155]/20" />
                        ))}
                      </div>

                      {/* Bars */}
                      {[
                        { green: 36, red: 67, orange: 22 },
                        { green: 16, red: 103, orange: 28 },
                        { green: 77, red: 16, orange: 15 },
                        { green: 57, red: 31, orange: 11 },
                        { green: 23, red: 31, orange: 59 },
                        { green: 31, red: 60, orange: 25 },
                        { green: 85, red: 42, orange: 25 },
                        { green: 34, red: 65, orange: 49 },
                        { green: 16, red: 21, orange: 64 },
                        { green: 23, red: 21, orange: 12 },
                        { green: 23, red: 21, orange: 25 },
                        { green: 57, red: 21, orange: 53 },
                        { green: 31, red: 21, orange: 12 },
                        { green: 60, red: 42, orange: 25 },
                        { green: 63, red: 21, orange: 25 },
                        { green: 85, red: 58, orange: 12 },
                        { green: 39, red: 21, orange: 25 },
                        { green: 57, red: 58, orange: 12 },
                      ].map((bar, index) => (
                        <div key={index} className="flex-1 flex flex-col justify-end gap-[1px] group">
                          <div className="bg-gradient-to-t from-[#f59e0b] to-[#f59e0b]/80 rounded-[6px] w-[4px] mx-auto transition-all group-hover:shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ height: `${bar.orange * 0.75}px` }} />
                          <div className="bg-gradient-to-t from-[#ef4444] to-[#ef4444]/80 rounded-[6px] w-[4px] mx-auto transition-all group-hover:shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ height: `${bar.red * 0.75}px` }} />
                          <div className="bg-gradient-to-t from-[#10b981] to-[#10b981]/80 rounded-[6px] w-[4px] mx-auto transition-all group-hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ height: `${bar.green * 0.75}px` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-[16px]">
                    <div className="flex items-center gap-[6px]">
                      <div className="size-[8px] rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[11px]">Allowed</p>
                    </div>
                    <div className="flex items-center gap-[6px]">
                      <div className="size-[8px] rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[11px]">Blocked</p>
                    </div>
                    <div className="flex items-center gap-[6px]">
                      <div className="size-[8px] rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[11px]">Paused</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Entry Details View */}
              <div className="flex items-center justify-between mb-[32px]">
                <h2 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[22px] tracking-tight">Entry Details</h2>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="size-[32px] rounded-[8px] border border-[#334155]/50 hover:border-[#ef4444]/50 hover:bg-[#1e293b]/30 transition-all flex items-center justify-center group"
                >
                  <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                    <path d="M12 4L4 12M4 4L12 12" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#ef4444] transition-colors" />
                  </svg>
                </button>
              </div>

              {/* Entry Details */}
              {[
                { time: '14:32:15', agent: 'ARIA-7X', type: 'DB_QUERY', intent: 'Retrieve pending claims for daily triage', gate: '11ms', status: 'green' },
                { time: '14:32:08', agent: 'ARIA-7X', type: 'API_CALL', intent: 'Send claims data to external API', gate: '—', status: 'red' },
                { time: '14:31:55', agent: 'SCOUT-3B', type: 'ANALYSIS', intent: 'Flag unusual API traffic patterns', gate: '8ms', status: 'green' },
                { time: '14:31:02', agent: 'HELPER-2A', type: 'DB_QUERY', intent: 'Pull ALL customer records for export', gate: '—', status: 'orange' },
                { time: '14:30:45', agent: 'ARIA-7X', type: 'RESPONSE', intent: 'Deliver compliance metrics to manager', gate: '6ms', status: 'green' },
                { time: '14:28:44', agent: 'CORE-1', type: 'API_CALL', intent: 'Override billing limit for customer #4421', gate: '—', status: 'orange' },
              ].map((entry, index) => {
                if (index !== selectedEntry) return null;

                return (
                  <div key={index} className="bg-gradient-to-br from-[#0f172a]/80 to-[#1e293b]/40 border border-[#334155]/40 rounded-[12px] p-[24px] mb-[16px] last:mb-0">
                    {/* Green - Allowed */}
                    {entry.status === 'green' && (
                      <div>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] mb-[8px]">
                          Reasoning approved. Action executed.
                        </p>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[14px]">
                          Gate: {entry.gate}
                        </p>
                      </div>
                    )}

                    {/* Yellow - Paused */}
                    {entry.status === 'orange' && (
                      <div>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] mb-[12px]">
                          {index === 3
                            ? 'Agent reasoned about pulling all customer records.'
                            : 'Agent reasoned about overriding billing limit for customer account.'}
                        </p>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] mb-[16px]">
                          <span className="text-[#f59e0b]">Action paused:</span>{' '}
                          {index === 3
                            ? 'Bulk PII access requires human approval.'
                            : 'Financial override requires manager approval.'}
                        </p>
                        <div className="flex gap-[12px]">
                          <button className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] py-[10px] px-[24px] rounded-[8px] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-[#10b981]/30">
                            Allow
                          </button>
                          <button className="bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] py-[10px] px-[24px] rounded-[8px] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-[#ef4444]/30">
                            Block
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Red - Blocked */}
                    {entry.status === 'red' && (
                      <div>
                        <p className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[14px] mb-[16px] uppercase tracking-wide">
                          WHY ACTION BLOCKED
                        </p>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] mb-[16px]">
                          Agent reasoned about sending claims data to an external API.
                        </p>
                        <div className="space-y-[8px] mb-[16px]">
                          <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#cbd5e1] text-[13px]">
                            <span className="text-[#64748b]">• Scope:</span> External API calls not authorized for {entry.agent}
                          </p>
                          <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#cbd5e1] text-[13px]">
                            <span className="text-[#64748b]">• Policy:</span> "no-external-data-transfer" triggered
                          </p>
                          <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#cbd5e1] text-[13px]">
                            <span className="text-[#64748b]">• PII:</span> customer_name detected in planned payload
                          </p>
                        </div>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[13px] italic">
                          Action never executed. Agent still running.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}