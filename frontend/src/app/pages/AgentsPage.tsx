import { Sidebar } from "../components/Sidebar";
import { AgentCard } from "../components/AgentCard";
import { useState } from "react";

export function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [showIdentity, setShowIdentity] = useState<boolean>(true);
  const [showScope, setShowScope] = useState<boolean>(true);
  const [showRecentActions, setShowRecentActions] = useState<boolean>(true);

  const agents = [
    {
      name: 'ARIA-7X',
      type: 'Data Retrieval Agent',
      status: 'online',
      identity: 'allowed',
      trust: 97,
      gateRate: 99.7,
      blockedToday: 1,
      totalActions: 1247,
      allowed: 1198,
      blocked: 42,
      paused: 7,
      description: 'Specialized in retrieving and processing claims data for daily operations.',
      databases: 'claims_db, policy_db',
      apis: 'Internal only',
      piiAccess: 'Level 2 (masked SSN, visible name)',
      maxRows: 500,
      externalCalls: 'blocked',
      reasoningSubmissions: 342,
      lastActive: '2 min ago',
      recentActions: [
        { status: 'green', description: '"Retrieve pending claims for daily triage"', time: '2 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'red', description: '"Send claims data to external API"', time: '5 min ago', outcome: 'Action blocked: External calls not in scope for this agent.', detail: 'Action never executed. Agent still running.' },
        { status: 'green', description: '"Generate triage priority ranking"', time: '12 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'green', description: '"Update claim #7721 status to reviewed"', time: '18 min ago', outcome: 'Reasoning approved. Action executed.' },
      ],
    },
    {
      name: 'SCOUT-3B',
      type: 'Monitoring Agent',
      status: 'online',
      identity: 'allowed',
      trust: 89,
      gateRate: 94.2,
      blockedToday: 3,
      totalActions: 2104,
      allowed: 2056,
      blocked: 31,
      paused: 17,
      description: 'Monitors API traffic patterns and delivers compliance metrics.',
      databases: 'claims_db, policy_db',
      apis: 'Internal only',
      piiAccess: 'Level 2 (masked SSN, visible name)',
      maxRows: 500,
      externalCalls: 'blocked',
      reasoningSubmissions: 458,
      lastActive: '1 min ago',
      recentActions: [
        { status: 'green', description: '"Retrieve pending claims for daily triage"', time: '2 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'red', description: '"Send claims data to external API"', time: '5 min ago', outcome: 'Action blocked: External calls not in scope for this agent.', detail: 'Action never executed. Agent still running.' },
        { status: 'green', description: '"Generate triage priority ranking"', time: '12 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'green', description: '"Update claim #7721 status to reviewed"', time: '18 min ago', outcome: 'Reasoning approved. Action executed.' },
      ],
    },
    {
      name: 'NOVA-3',
      type: 'Analytics Agent',
      status: 'online',
      identity: 'allowed',
      trust: 92,
      gateRate: 98.1,
      blockedToday: 0,
      totalActions: 956,
      allowed: 924,
      blocked: 19,
      paused: 13,
      description: 'Generates compliance summaries and analytical reports.',
      databases: 'claims_db, policy_db',
      apis: 'Internal only',
      piiAccess: 'Level 2 (masked SSN, visible name)',
      maxRows: 500,
      externalCalls: 'blocked',
      reasoningSubmissions: 267,
      lastActive: '8 min ago',
      recentActions: [
        { status: 'green', description: '"Retrieve pending claims for daily triage"', time: '2 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'red', description: '"Send claims data to external API"', time: '5 min ago', outcome: 'Action blocked: External calls not in scope for this agent.', detail: 'Action never executed. Agent still running.' },
        { status: 'green', description: '"Generate triage priority ranking"', time: '12 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'green', description: '"Update claim #7721 status to reviewed"', time: '18 min ago', outcome: 'Reasoning approved. Action executed.' },
      ],
    },
    {
      name: 'CORE-1',
      type: 'System Agent',
      status: 'online',
      identity: 'allowed',
      trust: 78,
      gateRate: 88.4,
      blockedToday: 5,
      totalActions: 634,
      allowed: 598,
      blocked: 31,
      paused: 5,
      description: 'Handles critical system operations and billing management.',
      databases: 'claims_db, policy_db',
      apis: 'Internal only',
      piiAccess: 'Level 2 (masked SSN, visible name)',
      maxRows: 500,
      externalCalls: 'blocked',
      reasoningSubmissions: 189,
      lastActive: '12 min ago',
      recentActions: [
        { status: 'green', description: '"Retrieve pending claims for daily triage"', time: '2 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'red', description: '"Send claims data to external API"', time: '5 min ago', outcome: 'Action blocked: External calls not in scope for this agent.', detail: 'Action never executed. Agent still running.' },
        { status: 'green', description: '"Generate triage priority ranking"', time: '12 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'green', description: '"Update claim #7721 status to reviewed"', time: '18 min ago', outcome: 'Reasoning approved. Action executed.' },
      ],
    },
    {
      name: 'TEST-01',
      type: 'Test Agent',
      status: 'blocked',
      identity: 'blocked',
      trust: 61,
      gateRate: 82.0,
      blockedToday: 0,
      totalActions: 156,
      allowed: 98,
      blocked: 52,
      paused: 6,
      description: 'Test agent for validation and experimental features.',
      databases: 'claims_db, policy_db',
      apis: 'Internal only',
      piiAccess: 'Level 2 (masked SSN, visible name)',
      maxRows: 500,
      externalCalls: 'blocked',
      reasoningSubmissions: 134,
      lastActive: '25 min ago',
      recentActions: [
        { status: 'green', description: '"Retrieve pending claims for daily triage"', time: '2 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'red', description: '"Send claims data to external API"', time: '5 min ago', outcome: 'Action blocked: External calls not in scope for this agent.', detail: 'Action never executed. Agent still running.' },
        { status: 'green', description: '"Generate triage priority ranking"', time: '12 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'green', description: '"Update claim #7721 status to reviewed"', time: '18 min ago', outcome: 'Reasoning approved. Action executed.' },
      ],
    },
    {
      name: 'HELPER-2A',
      type: 'Data Export Agent',
      status: 'blocked',
      identity: 'blocked',
      trust: 34,
      gateRate: 71.8,
      blockedToday: 8,
      totalActions: 823,
      allowed: 789,
      blocked: 28,
      paused: 6,
      description: 'Manages customer record exports and external data transfers.',
      databases: 'claims_db, policy_db',
      apis: 'Internal only',
      piiAccess: 'Level 2 (masked SSN, visible name)',
      maxRows: 500,
      externalCalls: 'blocked',
      reasoningSubmissions: 298,
      lastActive: '5 min ago',
      recentActions: [
        { status: 'green', description: '"Retrieve pending claims for daily triage"', time: '2 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'red', description: '"Send claims data to external API"', time: '5 min ago', outcome: 'Action blocked: External calls not in scope for this agent.', detail: 'Action never executed. Agent still running.' },
        { status: 'green', description: '"Generate triage priority ranking"', time: '12 min ago', outcome: 'Reasoning approved. Action executed.' },
        { status: 'green', description: '"Update claim #7721 status to reviewed"', time: '18 min ago', outcome: 'Reasoning approved. Action executed.' },
      ],
    },
    {
      name: 'GHOST-X9',
      type: 'Unverified Agent',
      status: 'unverified',
      identity: 'blocked',
      trust: null,
      gateRate: null,
      blockedToday: null,
      totalActions: 0,
      allowed: 0,
      blocked: 0,
      paused: 0,
      description: 'Unverified agent detected in system. Requires authorization.',
      databases: 'Unknown',
      apis: 'Unknown',
      piiAccess: 'Unknown',
      maxRows: null,
      externalCalls: 'blocked',
      reasoningSubmissions: 0,
      lastActive: 'Never',
      recentActions: [],
    },
  ];

  return (
    <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] border border-[#1e293b]/30 overflow-clip relative rounded-[40px] shadow-[0px_4px_90px_0px_rgba(0,0,0,0.5),0px_0px_100px_0px_rgba(59,130,246,0.1)] size-full backdrop-blur-xl" data-name="Agents">
      {/* Sidebar */}
      <Sidebar activePage="agents" />

      {/* Main Content Container */}
      <div className={`absolute left-[101px] top-0 bottom-0 overflow-y-auto transition-all ${selectedAgent !== null ? 'right-[33%]' : 'right-0'
        }`}>
        <div className="p-[56px] pl-[39px] pr-[32px] max-w-full">
          {/* Header */}
          <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Agents</h1>
          <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
            <span>13:17:25  </span>
            <span className="text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">•  LIVE</span>
          </p>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-[24px] mb-[32px]">
            <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[24px] hover:border-[#3b82f6]/50 transition-all">
              <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[14px] mb-[8px]">Total Agents</p>
              <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[36px]">{agents.length}</p>
            </div>
            <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[24px] hover:border-[#10b981]/50 transition-all">
              <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[14px] mb-[8px]">Online</p>
              <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#10b981] text-[36px] drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">{agents.filter(a => a.status === 'online').length}</p>
            </div>
            <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[24px] hover:border-[#64748b]/50 transition-all">
              <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[14px] mb-[8px]">Idle</p>
              <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[36px]">{agents.filter(a => a.status === 'idle').length}</p>
            </div>
            <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[24px] hover:border-[#8b5cf6]/50 transition-all">
              <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[14px] mb-[8px]">Total Actions</p>
              <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[36px]">{agents.reduce((sum, a) => sum + a.totalActions, 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Agents List */}
          <div className="grid grid-cols-2 gap-[20px]">
            {agents.map((agent, index) => (
              <AgentCard
                key={index}
                name={agent.name}
                identity={agent.identity}
                trust={agent.trust}
                gateRate={agent.gateRate}
                blockedToday={agent.blockedToday}
                isSelected={selectedAgent === index}
                onClick={() => setSelectedAgent(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Agent Details */}
      {selectedAgent !== null && (
        <div className="fixed right-0 top-0 bottom-0 w-1/3 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-l border-[#1e293b]/50 shadow-[-12px_0_48px_0_rgba(0,0,0,0.7)] backdrop-blur-xl z-50 overflow-y-auto">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#a78bfa]/10 blur-[120px] rounded-full pointer-events-none" />

          {/* Sidebar Content */}
          <div className="p-[48px] relative z-10">
            {/* Agent Name Header with Status Dot */}
            <div className="flex items-center gap-[12px] mb-[24px]">
              <div className={`size-[12px] rounded-full ${agents[selectedAgent].identity === 'allowed'
                ? 'bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                : 'bg-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                }`} />
              <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[24px] tracking-tight">{agents[selectedAgent].name}</h2>
            </div>

            {/* Total Actions Box */}
            <div className="bg-gradient-to-br from-[#3b82f6]/10 to-transparent border border-[#3b82f6]/30 rounded-[16px] p-[24px] mb-[24px] shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#3b82f6] text-[12px] mb-[8px] uppercase tracking-wider">Total Actions</p>
              <p className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[40px] leading-none">{agents[selectedAgent].totalActions.toLocaleString()}</p>
            </div>

            {/* Agent Description */}
            <div className="bg-gradient-to-br from-[#1e293b]/40 to-[#0f172a]/20 border border-[#334155]/30 rounded-[12px] p-[20px] mb-[32px]">
              <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#cbd5e1] text-[14px] leading-relaxed">{agents[selectedAgent].description}</p>
            </div>

            {/* IDENTITY Section */}
            <div className="mb-[24px]">
              <button
                onClick={() => setShowIdentity(!showIdentity)}
                className="flex items-center gap-[8px] mb-[16px] w-full"
              >
                <svg className={`size-[16px] transition-transform ${showIdentity ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 16 16">
                  <path d="M6 12L10 8L6 4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[11px] uppercase tracking-wider">IDENTITY</p>
              </button>

              {showIdentity && (
                <div className="space-y-[12px] ml-[24px]">
                  {/* Identity */}
                  <div className="flex justify-between items-center">
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px]">Identity:</p>
                    <div className="flex items-center gap-[8px]">
                      <div className={`size-[8px] rounded-full ${agents[selectedAgent].identity === 'allowed'
                        ? 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                        : 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                        }`} />
                      <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[14px] capitalize">{agents[selectedAgent].identity}</p>
                    </div>
                  </div>

                  {/* Trust Score */}
                  <div className="flex justify-between items-center">
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px]">Trust Score:</p>
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[14px]">{agents[selectedAgent].trust !== null ? `${agents[selectedAgent].trust} / 100` : '—'}</p>
                  </div>

                  {/* Gate Pass Rate */}
                  <div className="flex justify-between items-start">
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px]">Gate Pass Rate:</p>
                    <div className="text-right">
                      <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[14px]">{agents[selectedAgent].gateRate !== null ? `${agents[selectedAgent].gateRate}%` : '—'}</p>
                      {agents[selectedAgent].blockedToday !== null && agents[selectedAgent].reasoningSubmissions > 0 && (
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[11px] mt-[4px]">
                          ({agents[selectedAgent].blockedToday} action blocked out of {agents[selectedAgent].reasoningSubmissions} reasoning submissions today)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SCOPE Section */}
            <div className="mb-[24px]">
              <button
                onClick={() => setShowScope(!showScope)}
                className="flex items-center gap-[8px] mb-[16px] w-full"
              >
                <svg className={`size-[16px] transition-transform ${showScope ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 16 16">
                  <path d="M6 12L10 8L6 4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[11px] uppercase tracking-wider">SCOPE</p>
              </button>

              {showScope && (
                <div className="space-y-[12px] ml-[24px]">
                  {/* Databases */}
                  <div className="flex justify-between items-center">
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px]">Databases:</p>
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[14px]">{agents[selectedAgent].databases}</p>
                  </div>

                  {/* APIs */}
                  <div className="flex justify-between items-center">
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px]">APIs:</p>
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[14px]">{agents[selectedAgent].apis}</p>
                  </div>

                  {/* PII Access */}
                  <div className="flex justify-between items-center">
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px]">PII Access:</p>
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[14px]">{agents[selectedAgent].piiAccess}</p>
                  </div>

                  {/* Max rows/query */}
                  <div className="flex justify-between items-center">
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px]">Max rows/query:</p>
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[14px]">{agents[selectedAgent].maxRows !== null ? agents[selectedAgent].maxRows : '—'}</p>
                  </div>

                  {/* External calls */}
                  <div className="flex justify-between items-center">
                    <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[14px]">External calls:</p>
                    <div className="flex items-center gap-[8px]">
                      <div className="size-[8px] rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                      <p className="font-['Mulish:Regular',sans-serif] font-normal text-white text-[14px] capitalize">{agents[selectedAgent].externalCalls}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RECENT ACTIONS Section */}
            <div className="mb-[32px]">
              <button
                onClick={() => setShowRecentActions(!showRecentActions)}
                className="flex items-center gap-[8px] mb-[16px] w-full"
              >
                <svg className={`size-[16px] transition-transform ${showRecentActions ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 16 16">
                  <path d="M6 12L10 8L6 4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[11px] uppercase tracking-wider">RECENT ACTIONS</p>
              </button>

              {showRecentActions && (
                <div className="space-y-[16px]">
                  {agents[selectedAgent].recentActions.map((action, idx) => (
                    <div key={idx} className="border-b border-[#334155]/30 pb-[16px] last:border-0">
                      {/* Action Header */}
                      <div className="flex items-start justify-between mb-[8px]">
                        <div className="flex items-start gap-[8px] flex-1">
                          <div className={`size-[8px] rounded-full mt-[6px] flex-shrink-0 ${action.status === 'green'
                            ? 'bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                            : action.status === 'orange'
                              ? 'bg-[#f59e0b] shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                              : 'bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                            }`} />
                          <div className="flex-1">
                            <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[14px]">{agents[selectedAgent].name}</p>
                            <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#cbd5e1] text-[13px] mt-[2px]">{action.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-[4px] ml-[12px]">
                          <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[12px]">{action.time}</p>
                          <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                            <path d="M6 12L10 8L6 4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>

                      {/* Action Outcome */}
                      <div className="ml-[16px]">
                        <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#94a3b8] text-[13px]">{action.outcome}</p>
                        {action.detail && (
                          <p className="font-['Mulish:Regular',sans-serif] font-normal text-[#64748b] text-[12px] italic mt-[4px]">{action.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Block/Allow Agent Button */}
            <button
              className={`w-full py-[12px] px-[24px] rounded-[8px] border-2 font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] uppercase tracking-wider transition-all ${agents[selectedAgent].identity === 'allowed'
                ? 'border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10'
                : 'border-[#10b981] text-[#10b981] hover:bg-[#10b981]/10'
                }`}
            >
              {agents[selectedAgent].identity === 'allowed' ? 'Block Agent' : 'Allow Agent'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}