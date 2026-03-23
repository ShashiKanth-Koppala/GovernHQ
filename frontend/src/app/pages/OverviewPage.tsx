import { Sidebar } from "../components/Sidebar";
import { useState } from "react";

export function OverviewPage() {
  const [expandedLogItems, setExpandedLogItems] = useState<Set<number>>(new Set());
  const [expandedSidebarItems, setExpandedSidebarItems] = useState<Set<number>>(new Set());

  const toggleLogItem = (index: number) => {
    const newExpanded = new Set(expandedLogItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogItems(newExpanded);
  };

  const toggleSidebarItem = (index: number) => {
    const newExpanded = new Set(expandedSidebarItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSidebarItems(newExpanded);
  };

  return (
    <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] border border-[#1e293b]/30 overflow-clip relative rounded-[40px] shadow-[0px_4px_90px_0px_rgba(0,0,0,0.5),0px_0px_100px_0px_rgba(59,130,246,0.1)] size-full backdrop-blur-xl" data-name="Overview">
      {/* Sidebar */}
      <Sidebar activePage="overview" />

      {/* Main Content Container - excludes left sidebar and right sidebar */}
      <div className="absolute left-[101px] right-[33.333%] top-0 bottom-0 overflow-y-auto z-0">
        <div className="p-[56px] pl-[39px] max-w-full">
          {/* Header */}
          <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Overview</h1>
          <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
            <span>13:17:25  </span>
            <span className="text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">•  LIVE</span>
          </p>

          {/* Stats Bar Chart */}
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px] mb-[24px] relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 to-transparent pointer-events-none" />
            
            <div className="flex items-end justify-start h-[60px] gap-[6px] relative z-10">
              {[25, 8, 16, 33, 30, 16, 33, 25, 8, 16, 25, 30, 16, 33, 25, 8, 16, 25, 30, 16, 33, 0, 16].map((height, index) => (
                <div key={index} className="flex-1 bg-gradient-to-t from-[#3b82f6]/30 to-[#3b82f6]/10 rounded-t-[3px] transition-all duration-300 hover:from-[#3b82f6]/50 hover:to-[#3b82f6]/20" style={{ height: `${height}px` }} />
              ))}
              <div className="flex-1 bg-gradient-to-t from-[#3b82f6] to-[#60a5fa] rounded-t-[3px] shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse" style={{ height: '60px' }} />
              {[16, 33].map((height, index) => (
                <div key={`end-${index}`} className="flex-1 bg-gradient-to-t from-[#3b82f6]/30 to-[#3b82f6]/10 rounded-t-[3px] transition-all duration-300 hover:from-[#3b82f6]/50 hover:to-[#3b82f6]/20" style={{ height: `${height}px` }} />
              ))}
            </div>
          </div>

          {/* Decision Log */}
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px] relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-[24px]">
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px] tracking-tight">Decision Log</h2>
                <button className="text-[#64748b] hover:text-[#94a3b8] transition-colors">
                  <svg width="25" height="5" viewBox="0 0 25 5" fill="none">
                    <circle cx="2.5" cy="2.5" r="2.5" fill="currentColor" />
                    <circle cx="12.5" cy="2.5" r="2.5" fill="currentColor" />
                    <circle cx="22.5" cy="2.5" r="2.5" fill="currentColor" />
                  </svg>
                </button>
              </div>

              <div className="border-t border-[#334155]/50 mb-[24px]" />

              <div className="space-y-[20px]">
                {[
                  { agent: 'ARIA-7X', status: 'red', description: 'Send claims data to external API', time: '13:02:21', gateTime: 8, reasoning: 'Agent wanted to send data externally.', blockReason: 'External calls not in scope for this agent.' },
                  { agent: 'HELPER-2A', status: 'orange', description: 'Pull ALL customer records for export', time: '12:12:59', gateTime: 12, reasoning: 'Agent wants bulk access to all customer records.', pauseReason: 'Bulk PII access requires human approval.' },
                  { agent: 'SCOUT-3B', status: 'orange', description: 'Send report to partner API', time: '12:12:43', gateTime: 15, reasoning: 'Agent wants to transmit data to external partner service.', pauseReason: 'External API transmission requires verification.' },
                  { agent: 'ARIA-7X', status: 'green', description: 'Retrieve pending claims for daily triage', time: '12:01:97', gateTime: 11 },
                  { agent: 'SCOUT-3B', status: 'green', description: 'Flag unusual API traffic patterns', time: '11:31:86', gateTime: 9 },
                  { agent: 'NOVA-3', status: 'green', description: 'Generate compliance summary for Q4', time: '10:59:03', gateTime: 14 },
                  { agent: 'CORE-1', status: 'red', description: 'Override billing limit for customer #4421', time: '10:54:90', gateTime: 7, reasoning: 'Agent wanted to override established billing limits.', blockReason: 'Financial overrides require explicit authorization.' },
                ].map((entry, index) => (
                  <div 
                    key={index} 
                    className="group -mx-4 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-[#1e293b]/30"
                  >
                    <div 
                      className={`flex items-start justify-between gap-4 ${(entry.status === 'red' || entry.status === 'green' || entry.status === 'orange') ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (entry.status === 'red' || entry.status === 'green' || entry.status === 'orange') {
                          toggleLogItem(index);
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[18px] text-[#e2e8f0] mb-[8px] group-hover:text-white transition-colors duration-200">
                          <span>{entry.agent}  </span>
                          <span className={`${
                            entry.status === 'green' 
                              ? 'text-[#10b981] drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]' 
                              : entry.status === 'red' 
                              ? 'text-[#ef4444] drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]' 
                              : 'text-[#f59e0b] drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                          }`}>•</span>
                        </p>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[16px] text-[#94a3b8] opacity-70 group-hover:opacity-100 transition-opacity duration-200">{entry.description}</p>
                      </div>
                      <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[18px] text-[#cbd5e1] whitespace-nowrap font-mono">{entry.time}</p>
                    </div>
                    
                    {/* Expanded content for green status items */}
                    {entry.status === 'green' && expandedLogItems.has(index) && (
                      <div className="mt-[16px] pt-[16px] border-t border-[#334155]/30">
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] mb-[8px]">
                          Reasoning approved. Action executed.
                        </p>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[13px]">
                          Gate: {entry.gateTime}ms
                        </p>
                      </div>
                    )}
                    
                    {/* Expanded content for red status items */}
                    {entry.status === 'red' && expandedLogItems.has(index) && (
                      <div className="mt-[16px] pt-[16px] border-t border-[#334155]/30">
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] mb-[8px]">
                          Reasoning evaluated: {entry.reasoning}
                        </p>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] mb-[8px]">
                          Action blocked: {entry.blockReason}
                        </p>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal italic text-[#64748b] text-[13px]">
                          Action never executed. Agent still running.
                        </p>
                      </div>
                    )}
                    
                    {/* Expanded content for orange status items */}
                    {entry.status === 'orange' && expandedLogItems.has(index) && (
                      <div className="mt-[16px] pt-[16px] border-t border-[#334155]/30">
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] mb-[8px]">
                          Reasoning evaluated: {entry.reasoning}
                        </p>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px] mb-[12px]">
                          Action paused: {entry.pauseReason}
                        </p>
                        <div className="flex gap-[12px]">
                          <button className="flex-1 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] py-[10px] px-[20px] rounded-[8px] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                            Allow
                          </button>
                          <button className="flex-1 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] py-[10px] px-[20px] rounded-[8px] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                            Block
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - System Status */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-l border-[#1e293b]/50 shadow-[-12px_0_48px_0_rgba(0,0,0,0.7)] backdrop-blur-xl p-[48px] overflow-y-auto z-10">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#6366f1]/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[22px] mb-[32px] tracking-tight">System Status</h2>

          {/* Stats */}
          <div className="space-y-[24px] mb-[48px]">
            {[
              { label: 'Agents Online', value: '52', percentage: 75, color: 'from-[#8b5cf6] to-[#6366f1]' },
              { label: 'Allowed', value: '8,404', percentage: 85, color: 'from-[#10b981] to-[#059669]' },
              { label: 'Blocked', value: '23', percentage: 10, color: 'from-[#ef4444] to-[#dc2626]' },
              { label: 'Paused', value: '2', percentage: 5, color: 'from-[#f59e0b] to-[#d97706]' },
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-[8px]">
                  <p className="font-['Mulish:Medium',sans-serif] font-medium text-[#94a3b8] text-[13px]">{stat.label}</p>
                  <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#cbd5e1] text-[13px] font-mono">{stat.value}</p>
                </div>
                <div className="w-full bg-[#1e293b]/50 h-[6px] rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className={`bg-gradient-to-r ${stat.color} h-full rounded-full transition-all duration-500 shadow-[0_0_10px_currentColor]`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Track agent actions card */}
          <div className="bg-gradient-to-br from-[#1e293b]/70 to-[#0f172a]/50 border border-[#334155]/30 rounded-[16px] p-[24px] backdrop-blur-xl relative overflow-hidden group hover:border-[#3b82f6]/50 transition-all duration-300 mb-[32px]">
            {/* Hover glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/0 to-[#6366f1]/0 group-hover:from-[#3b82f6]/10 group-hover:to-[#6366f1]/10 transition-all duration-300 pointer-events-none" />
            
            <div className="relative z-10">
              <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px] mb-[12px] tracking-tight">Track agent actions</h3>
              <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[12px] mb-[24px] leading-[21px]">
                The permanent, tamper-proof record of every gate decision on every action.
              </p>
              <button className="w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[13px] py-[12px] px-[24px] rounded-[10px] tracking-[1.5px] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                VIEW LEDGER
              </button>
            </div>
          </div>

          {/* Pending Actions */}
          <div className="mb-[32px]">
            <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[18px] mb-[20px] tracking-tight">Pending Actions</h3>
            <div className="space-y-[12px]">
              {[
                { agent: 'HELPER-2A', action: 'Export user data', time: '5 min ago', status: 'yellow' },
                { agent: 'SCOUT-3B', action: 'Send report to partner API', time: '12 min ago', status: 'yellow' },
              ].map((item, index) => (
                <div key={index} className="bg-[#1e293b]/30 rounded-lg p-[12px] border border-[#334155]/20 hover:border-[#f59e0b]/30 transition-all">
                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleSidebarItem(index)}
                  >
                    <div className="flex items-start gap-[12px]">
                      <div className="w-[6px] h-[6px] rounded-full bg-[#f59e0b] mt-[6px] shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                      <div className="flex-1 min-w-0">
                        <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#e2e8f0] text-[13px] mb-[4px]">{item.agent}</p>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[11px] mb-[2px]">{item.action}</p>
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[10px]">{item.time}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded content with Allow/Block buttons */}
                  {expandedSidebarItems.has(index) && (
                    <div className="mt-[12px] pt-[12px] border-t border-[#334155]/30 flex gap-[8px]">
                      <button className="flex-1 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[11px] py-[8px] px-[12px] rounded-[6px] hover:shadow-[0_0_16px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                        ALLOW
                      </button>
                      <button className="flex-1 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[11px] py-[8px] px-[12px] rounded-[6px] hover:shadow-[0_0_16px_rgba(239,68,68,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                        BLOCK
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mb-[32px]">
            <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[18px] mb-[20px] tracking-tight">Recent Activity</h3>
            <div className="space-y-[16px]">
              {[
                { action: 'Policy updated', time: '2 min ago', color: 'text-[#3b82f6]' },
                { action: 'New agent deployed', time: '15 min ago', color: 'text-[#10b981]' },
                { action: 'Alert triggered', time: '1 hour ago', color: 'text-[#f59e0b]' },
                { action: 'System check completed', time: '2 hours ago', color: 'text-[#8b5cf6]' },
                { action: 'Database backup', time: '3 hours ago', color: 'text-[#3b82f6]' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-[12px] p-[12px] rounded-lg hover:bg-[#1e293b]/30 transition-all">
                  <div className={`w-[6px] h-[6px] rounded-full ${activity.color.replace('text-', 'bg-')} mt-[6px] shadow-[0_0_8px_currentColor]`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-['Mulish:Medium',sans-serif] font-medium text-[#e2e8f0] text-[13px] mb-[4px]">{activity.action}</p>
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[11px]">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-gradient-to-br from-[#1e293b]/70 to-[#0f172a]/50 border border-[#334155]/30 rounded-[16px] p-[24px] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px] mb-[16px] tracking-tight">System Health</h3>
              <div className="space-y-[12px]">
                {[
                  { metric: 'CPU Usage', value: '45%', status: 'good' },
                  { metric: 'Memory', value: '62%', status: 'good' },
                  { metric: 'Network', value: '28%', status: 'good' },
                  { metric: 'Storage', value: '81%', status: 'warning' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <p className="font-['Mulish:Medium',sans-serif] font-medium text-[#94a3b8] text-[12px]">{item.metric}</p>
                    <div className="flex items-center gap-[8px]">
                      <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#cbd5e1] text-[12px] font-mono">{item.value}</p>
                      <div className={`w-[6px] h-[6px] rounded-full ${item.status === 'good' ? 'bg-[#10b981]' : 'bg-[#f59e0b]'} shadow-[0_0_6px_currentColor]`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}