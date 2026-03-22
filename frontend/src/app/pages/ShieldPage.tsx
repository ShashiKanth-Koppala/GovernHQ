import { Sidebar } from "../components/Sidebar";
import { useState } from "react";

export function ShieldPage() {
  const [enforcementMode, setEnforcementMode] = useState('Strict');
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [anomalySensitivity, setAnomalySensitivity] = useState(75);
  const [failMode, setFailMode] = useState('Block');
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricJustification, setBiometricJustification] = useState('');

  const blockedAgents = [
    {
      name: 'HELPER-2A',
      reason: '"Anomaly threshold exceeded"',
      blockedBy: 'Monitor',
      time: '14:32:07',
      details: 'Trust score dropped to 34.',
      secondaryInfo: 'Repeated anomalous reasoning pattern detected.',
      canReAllow: true,
    },
    {
      name: 'FRAUD-DET',
      reason: '"Reasoning loop — same query 47 times"',
      blockedBy: 'Monitor',
      time: '14:30:23',
      details: 'Agent submitted identical reasoning 47 times in 3 minutes.',
      secondaryInfo: 'Possible reasoning loop or prompt injection.',
      canReAllow: true,
    },
    {
      name: 'GHOST-X9',
      reason: '"Identity verification failed"',
      blockedBy: 'System',
      time: 'Yesterday',
      details: 'Agent could not verify identity.',
      secondaryInfo: 'Credentials permanently revoked. Cannot be re-allowed.',
      canReAllow: false, // Shadow/unverified agent
    },
  ];

  const handleAllowAgent = (agentName: string) => {
    setExpandedAgent(null);
    // Handle allow agent logic
  };

  const handleBlockAllAgents = () => {
    setShowBiometricModal(true);
  };

  const handleBiometricConfirm = () => {
    if (biometricJustification.trim()) {
      // Simulate biometric verification and block all agents
      setShowBiometricModal(false);
      setBiometricJustification('');
      // Handle emergency block
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] border border-[#1e293b]/30 overflow-clip relative rounded-[40px] shadow-[0px_4px_90px_0px_rgba(0,0,0,0.5),0px_0px_100px_0px_rgba(59,130,246,0.1)] size-full backdrop-blur-xl" data-name="Shield">
      {/* Sidebar */}
      <Sidebar activePage="security" />

      {/* Main Content Container */}
      <div className="absolute left-[101px] right-0 top-0 bottom-0 flex">
        {/* Middle Content - Now contains stats and blocked agents */}
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ width: 'calc(66.667% - 33px)' }}>
          <div className="p-[56px] pl-[39px] pr-[24px]">
            {/* Header */}
            <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Shield</h1>
            <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
              Real-time protection and monitoring for your AI agents
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-[16px] mb-[32px]">
              {/* Blocked Agents */}
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#475569] rounded-[12px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.2)] p-[21px]">
                <div className="font-['Mulish:Bold',sans-serif] font-bold text-[#ef4444] text-[64px] leading-[64px] mb-[8px]">
                  3
                </div>
                <div className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[14px]">
                  blocked<br />agents
                </div>
              </div>

              {/* Block Latency */}
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#475569] rounded-[12px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.2)] p-[21px]">
                <div className="font-['Mulish:Bold',sans-serif] font-bold text-[#31ba96] text-[64px] leading-[64px] mb-[8px]">
                  8ms
                </div>
                <div className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[14px] mb-[4px]">
                  block<br />latency
                </div>
                <div className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[11px]">
                  target &lt;10ms
                </div>
              </div>

              {/* Reasoning Evaluated */}
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#475569] rounded-[12px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.2)] p-[21px]">
                <div className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[64px] leading-[64px] mb-[8px]">
                  8,432
                </div>
                <div className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[14px]">
                  reasoning<br />evaluated<br />today
                </div>
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
                <h3 className="font-['Mulish:Bold',sans-serif] font-bold text-[#ef4444] text-[16px] uppercase tracking-wider">
                  EMERGENCY
                </h3>
              </div>

              <h4 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[18px] mb-[12px]">
                Block All Agents
              </h4>

              <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[14px] mb-[12px] leading-relaxed">
                Instantly block every agent. Revoke all credentials. Stop all reasoning and actions.
              </p>

              <p className="font-['Mulish:Regular',sans-serif] italic text-[#64748b] text-[13px] mb-[20px]">
                Requires CISO biometric authentication
              </p>

              <button
                onClick={handleBlockAllAgents}
                className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-['Mulish:Bold',sans-serif] font-bold text-[16px] px-[24px] py-[14px] rounded-[12px] transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
              >
                Block All Agents
              </button>
            </div>

            {/* Blocked Agents List */}
            <div>
              <div className="flex items-center gap-[10px] mb-[16px]">
                <div className="size-[24px] rounded-full border-2 border-[#64748b] flex items-center justify-center shrink-0">
                  <svg width="12" height="2" viewBox="0 0 12 2" fill="none">
                    <path d="M1 1H11" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[16px]">
                  Blocked Agents
                </h3>
              </div>

              <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[13px] mb-[20px] leading-relaxed">
                Agents blocked entirely. Cannot reason or act until re-allowed.
              </p>

              <div className="space-y-[12px]">
                {blockedAgents.map((agent, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/40 rounded-[12px] overflow-hidden transition-all"
                  >
                    {/* Agent Header - Clickable */}
                    <div
                      className="p-[18px] cursor-pointer hover:bg-[#1e293b]/30 transition-all"
                      onClick={() => setExpandedAgent(expandedAgent === agent.name ? null : agent.name)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-[8px]">
                          <div className="size-[8px] rounded-full bg-[#ef4444]" />
                          <h4 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[15px]">
                            {agent.name}
                          </h4>
                          <span className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[13px]">
                            {agent.reason}
                          </span>
                        </div>
                        <div className="flex items-center gap-[12px]">
                          <span className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[12px]">
                            {agent.time}
                          </span>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            className={`transition-transform ${expandedAgent === agent.name ? 'rotate-180' : ''}`}
                          >
                            <path d="M2 4L6 8L10 4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Agent Details - Expandable */}
                    {expandedAgent === agent.name && (
                      <div className="px-[18px] pb-[18px] pt-[0px] border-t border-[#334155]/30">
                        <div className="mt-[16px] space-y-[12px]">
                          <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[13px]">
                            Blocked by: {agent.blockedBy}
                          </p>
                          <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[13px]">
                            {agent.details}
                          </p>
                          <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[13px]">
                            {agent.secondaryInfo}
                          </p>
                          <p className="font-['Mulish:Regular',sans-serif] italic text-[#64748b] text-[12px] mt-[8px]">
                            Agent cannot reason or act until re-allowed.
                          </p>

                          {agent.canReAllow && (
                            <button
                              onClick={() => handleAllowAgent(agent.name)}
                              className="mt-[16px] bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981] text-[#10b981] font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[20px] py-[10px] rounded-[8px] transition-all"
                            >
                              Allow Agent
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Now contains protection controls and how GovernHQ protects */}
        <div className="shrink-0 overflow-y-auto bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-l border-[#1e293b]/50 shadow-[-12px_0_48px_0_rgba(0,0,0,0.7)] backdrop-blur-xl p-[48px] relative" style={{ width: 'calc(33.333% + 33px)' }}>
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#3b82f6]/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="space-y-[32px] relative z-10">
            {/* Protection Controls */}
            <div className="bg-gradient-to-br from-[#1e293b]/60 to-[#0f172a]/40 border border-[rgba(51,65,85,0.4)] rounded-[16px] p-[24px]">
              <h2 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[12px] uppercase tracking-wide mb-[24px]">
                Protection Controls
              </h2>

              <div className="space-y-[20px]">
                {/* Enforcement Mode */}
                <div>
                  <label className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[14px] mb-[8px] block">
                    Enforcement Mode
                  </label>
                  <div className="relative">
                    <select
                      value={enforcementMode}
                      onChange={(e) => setEnforcementMode(e.target.value)}
                      className="w-full bg-[#0f172a]/50 border border-[#334155]/50 rounded-[8px] px-[12px] py-[10px] pl-[36px] font-['Mulish:Regular',sans-serif] text-white text-[14px] focus:outline-none focus:border-[#3b82f6]/50 transition-all appearance-none cursor-pointer"
                    >
                      <option>Strict</option>
                      <option>Monitor</option>
                      <option>Audit</option>
                    </select>
                    <div className="absolute left-[12px] top-[10px] pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13 4L6 11L3 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[11px] mt-[6px]">
                    How strictly to enforce policies
                  </p>
                </div>

                {/* Risk Threshold */}
                <div>
                  <label className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[14px] mb-[8px] block">
                    Risk Threshold
                    <span className="text-[#f59e0b] ml-[8px] font-bold">{riskThreshold}%</span>
                  </label>
                  <div className="relative pt-[4px]">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={riskThreshold}
                      onChange={(e) => setRiskThreshold(Number(e.target.value))}
                      className="w-full h-[4px] bg-[#334155] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#f59e0b] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      style={{
                        background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${riskThreshold}%, #334155 ${riskThreshold}%, #334155 100%)`
                      }}
                    />
                  </div>
                  <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[11px] mt-[10px]">
                    Trigger on suspicious behavior
                  </p>
                </div>

                {/* Anomaly Sensitivity */}
                <div>
                  <label className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[14px] mb-[8px] block">
                    Anomaly Sensitivity
                    <span className="text-[#ef4444] ml-[8px] font-bold">{anomalySensitivity}%</span>
                  </label>
                  <div className="relative pt-[4px]">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={anomalySensitivity}
                      onChange={(e) => setAnomalySensitivity(Number(e.target.value))}
                      className="w-full h-[4px] bg-[#334155] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ef4444] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                      style={{
                        background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${anomalySensitivity}%, #334155 ${anomalySensitivity}%, #334155 100%)`
                      }}
                    />
                  </div>
                  <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[11px] mt-[10px]">
                    Higher = more alerts
                  </p>
                </div>

                {/* Fail Mode */}
                <div>
                  <label className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[14px] mb-[8px] block">
                    Fail Mode
                  </label>
                  <div className="relative">
                    <select
                      value={failMode}
                      onChange={(e) => setFailMode(e.target.value)}
                      className="w-full bg-[#0f172a]/50 border border-[#334155]/50 rounded-[8px] px-[12px] py-[10px] pl-[36px] font-['Mulish:Regular',sans-serif] text-white text-[14px] focus:outline-none focus:border-[#3b82f6]/50 transition-all appearance-none cursor-pointer"
                    >
                      <option>Block</option>
                      <option>Default on error</option>
                      <option>Allow on error</option>
                    </select>
                    <div className="absolute left-[12px] top-[10px] pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13 4L6 11L3 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[11px] mt-[6px]">
                    Default on error
                  </p>
                </div>
              </div>
            </div>

            {/* How GovernHQ Protects */}
            <div>
              <div className="flex items-center gap-[10px] mb-[24px]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16 6L8.5 13.5L4 9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[18px]">
                  How GovernHQ Protects
                </h2>
              </div>

              {/* Protection Layers */}
              <div className="space-y-[16px]">
                {/* 1 - GATE */}
                <div className="bg-[#0a1419]/60 border border-[#1e3a3f]/60 rounded-[12px] p-[20px]">
                  <div className="flex items-start gap-[16px]">
                    {/* Number */}
                    <span className="font-['Mulish:Bold',sans-serif] font-bold text-[#64748b] text-[28px] leading-none pt-[2px]">
                      1
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-[10px]">
                        <h3 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[16px] tracking-wide">
                          GATE
                        </h3>
                        <div className="flex items-center gap-[6px]">
                          <div className="size-[8px] rounded-full bg-[#10b981]" />
                          <span className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#10b981] text-[12px]">
                            Allowed
                          </span>
                        </div>
                      </div>

                      <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[13px] mb-[10px] leading-relaxed">
                        Intercepts reasoning. Blocks bad actions. Agent keeps running.
                      </p>

                      <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[11px]">
                        8,432 reasoning evaluated · 23 actions blocked · 5 actions paused · 1ms avg
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2 - MONITOR */}
                <div className="bg-[#0a1419]/60 border border-[#1e3a3f]/60 rounded-[12px] p-[20px]">
                  <div className="flex items-start gap-[16px]">
                    {/* Number */}
                    <span className="font-['Mulish:Bold',sans-serif] font-bold text-[#64748b] text-[28px] leading-none pt-[2px]">
                      2
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-[10px]">
                        <h3 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[16px] tracking-wide">
                          MONITOR
                        </h3>
                        <div className="flex items-center gap-[6px]">
                          <div className="size-[8px] rounded-full bg-[#10b981]" />
                          <span className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#10b981] text-[12px]">
                            Allowed
                          </span>
                        </div>
                      </div>

                      <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[13px] mb-[10px] leading-relaxed">
                        Watches reasoning patterns. Blocks bad agents.
                      </p>

                      <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[11px]">
                        2 anomalies today · 2 agents blocked
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3 - EMERGENCY */}
                <div className="bg-[#0a1419]/60 border border-[#1e3a3f]/60 rounded-[12px] p-[20px]">
                  <div className="flex items-start gap-[16px]">
                    {/* Number */}
                    <span className="font-['Mulish:Bold',sans-serif] font-bold text-[#64748b] text-[28px] leading-none pt-[2px]">
                      3
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-[10px]">
                        <h3 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[16px] tracking-wide">
                          EMERGENCY
                        </h3>
                        <div className="flex items-center gap-[6px]">
                          <div className="size-[8px] rounded-full bg-[#64748b]" />
                          <span className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[12px]">
                            Standby
                          </span>
                        </div>
                      </div>

                      <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[13px] mb-[10px] leading-relaxed">
                        Instantly blocks all agents.
                      </p>

                      <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[11px]">
                        Measured latency: 8ms
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Authentication Modal for Block All Agents */}
      {showBiometricModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => {
              setShowBiometricModal(false);
              setBiometricJustification('');
            }}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] bg-gradient-to-br from-[#1e293b]/95 to-[#0f172a]/90 border border-[#ef4444]/50 shadow-[0_0_50px_rgba(239,68,68,0.3)] backdrop-blur-xl rounded-[16px] p-[32px] z-50">
            <div className="flex items-center gap-[12px] mb-[24px]">
              <div className="size-[40px] rounded-full bg-[#ef4444]/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v9m0 3v.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[22px]">
                CISO Authorization Required
              </h3>
            </div>

            <p className="font-['Mulish:Regular',sans-serif] text-[#cbd5e1] text-[15px] mb-[6px]">
              This emergency action requires Chief Information Security Officer (CISO) biometric authentication and justification.
            </p>
            <p className="font-['Mulish:Bold',sans-serif] font-bold text-[#ef4444] text-[14px] mb-[24px]">
              All agents will be immediately blocked and credentials revoked.
            </p>

            {/* Biometric Scanner Visual */}
            <div className="mb-[24px] bg-[#0f172a]/50 border border-[#334155]/50 rounded-[12px] p-[24px] flex flex-col items-center">
              <div className="size-[120px] rounded-full bg-gradient-to-br from-[#ef4444]/20 to-[#dc2626]/10 border-2 border-[#ef4444]/40 flex items-center justify-center mb-[16px] relative overflow-hidden">
                {/* Fingerprint Icon */}
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <path d="M30 15C23.373 15 18 20.373 18 27C18 33.627 23.373 39 30 39" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  <path d="M30 21C26.686 21 24 23.686 24 27C24 30.314 26.686 33 30 33" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  <path d="M30 27V45" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  <path d="M36 27C36 23.686 33.314 21 30 21" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  <path d="M42 27C42 20.373 36.627 15 30 15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {/* Scanning line animation */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ef4444]/30 to-transparent animate-pulse" />
              </div>
              <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#ef4444] text-[14px]">
                Place finger on biometric scanner
              </p>
              <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[12px] mt-[4px]">
                Awaiting CISO fingerprint authentication...
              </p>
            </div>

            {/* Justification Input */}
            <div className="mb-[24px]">
              <label className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[14px] mb-[8px] block">
                Justification <span className="text-[#ef4444]">*</span>
              </label>
              <textarea
                value={biometricJustification}
                onChange={(e) => setBiometricJustification(e.target.value)}
                placeholder="Provide detailed justification for blocking all agents..."
                className="w-full bg-[#0f172a]/50 border border-[#334155]/50 rounded-[8px] px-[16px] py-[12px] font-['Mulish:Regular',sans-serif] text-white text-[14px] focus:outline-none focus:border-[#ef4444]/50 transition-all resize-none h-[100px]"
              />
              <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[11px] mt-[6px]">
                This justification will be logged and audited.
              </p>
            </div>

            <div className="flex gap-[12px]">
              <button
                onClick={() => {
                  setShowBiometricModal(false);
                  setBiometricJustification('');
                }}
                className="flex-1 bg-[#1e293b]/50 hover:bg-[#1e293b] border border-[#334155]/30 text-[#94a3b8] font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[12px] rounded-[8px] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBiometricConfirm}
                disabled={!biometricJustification.trim()}
                className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] disabled:bg-[#334155] disabled:cursor-not-allowed text-white font-['Mulish:Bold',sans-serif] font-bold text-[14px] px-[24px] py-[12px] rounded-[8px] shadow-[0_0_20px_rgba(239,68,68,0.5)] disabled:shadow-none transition-all"
              >
                Confirm Block All
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}