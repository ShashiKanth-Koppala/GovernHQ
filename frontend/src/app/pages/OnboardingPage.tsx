import { Sidebar } from "../components/Sidebar";
import { useState } from "react";

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    {
      number: 1,
      title: 'Connect Your Data Sources',
      description: 'Link your databases, APIs, and third-party services',
      icon: '🔗',
    },
    {
      number: 2,
      title: 'Configure Your Agents',
      description: 'Set up AI agents with specific roles and capabilities',
      icon: '🤖',
    },
    {
      number: 3,
      title: 'Define Access Rules',
      description: 'Establish security policies and permission levels',
      icon: '🛡️',
    },
    {
      number: 4,
      title: 'Launch & Monitor',
      description: 'Deploy your agents and track their performance',
      icon: '🚀',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] border border-[#1e293b]/30 overflow-clip relative rounded-[40px] shadow-[0px_4px_90px_0px_rgba(0,0,0,0.5),0px_0px_100px_0px_rgba(59,130,246,0.1)] size-full backdrop-blur-xl" data-name="Onboarding">
      {/* Sidebar */}
      <Sidebar activePage="onboarding" />

      {/* Main Content Container */}
      <div className="absolute left-[101px] right-0 top-0 bottom-0 overflow-y-auto">
        <div className="p-[56px] pl-[39px] pr-[56px] max-w-full">
          {/* Header */}
          <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Get Started</h1>
          <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
            Complete these steps to set up your AI agent platform
          </p>

          {/* Progress Bar */}
          <div className="mb-[48px]">
            <div className="flex items-center justify-between mb-[12px]">
              <span className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[14px]">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#31ba96] text-[14px]">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full h-[8px] bg-[#1e293b]/50 rounded-full overflow-hidden border border-[#334155]/30">
              <div 
                className="h-full bg-gradient-to-r from-[#31ba96] to-[#10b981] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(49,186,150,0.5)]"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-2 gap-[24px] mb-[48px]">
            {steps.map((step) => (
              <div
                key={step.number}
                onClick={() => setCurrentStep(step.number)}
                className={`bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px] cursor-pointer transition-all ${
                  currentStep === step.number
                    ? 'border-[#3b82f6]/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                    : 'border-[#334155]/30 hover:border-[#334155]/50'
                } ${
                  currentStep > step.number ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-[20px]">
                  <div className={`text-[48px] transition-transform ${currentStep === step.number ? 'scale-110' : ''}`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-[12px] mb-[8px]">
                      <span className={`font-['Mulish:Bold',sans-serif] font-bold text-[14px] px-[10px] py-[2px] rounded-full ${
                        currentStep > step.number
                          ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                          : currentStep === step.number
                          ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30'
                          : 'bg-[#64748b]/20 text-[#64748b] border border-[#64748b]/30'
                      }`}>
                        {currentStep > step.number ? '✓' : `Step ${step.number}`}
                      </span>
                    </div>
                    <h3 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[18px] mb-[8px]">
                      {step.title}
                    </h3>
                    <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[14px]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Current Step Details */}
          <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[40px]">
            {currentStep === 1 && (
              <div>
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[24px] mb-[24px]">Connect Your Data Sources</h2>
                <p className="font-['Mulish:Regular',sans-serif] text-[#cbd5e1] text-[16px] mb-[32px]">
                  Connect the databases and APIs that your agents will interact with. We support a wide range of data sources including PostgreSQL, MySQL, MongoDB, REST APIs, and more.
                </p>
                
                <div className="grid grid-cols-3 gap-[16px] mb-[32px]">
                  {['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'REST API', 'GraphQL'].map((source, index) => (
                    <button
                      key={index}
                      className="bg-[#0f172a]/30 border border-[#334155]/30 hover:border-[#3b82f6]/50 rounded-[12px] p-[20px] text-center transition-all group"
                    >
                      <div className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px] mb-[4px] group-hover:text-[#3b82f6] transition-colors">
                        {source}
                      </div>
                      <div className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[12px]">
                        Click to connect
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-[12px] p-[20px]">
                  <p className="font-['Mulish:Regular',sans-serif] text-[#93c5fd] text-[14px]">
                    💡 <span className="font-semibold">Tip:</span> You can add more data sources later from the Integrations page in Settings.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[24px] mb-[24px]">Configure Your Agents</h2>
                <p className="font-['Mulish:Regular',sans-serif] text-[#cbd5e1] text-[16px] mb-[32px]">
                  Set up AI agents with specific roles and capabilities. Each agent can be customized with different permissions, tools, and behavioral parameters.
                </p>

                <div className="space-y-[16px] mb-[32px]">
                  {['Data Analyst Agent', 'Customer Support Agent', 'Security Monitor Agent'].map((agentName, index) => (
                    <div key={index} className="bg-[#0f172a]/30 border border-[#334155]/30 rounded-[12px] p-[24px] flex items-center justify-between hover:border-[#334155]/50 transition-all">
                      <div>
                        <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px] mb-[4px]">
                          {agentName}
                        </h3>
                        <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[14px]">
                          Not configured
                        </p>
                      </div>
                      <button className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[20px] py-[8px] rounded-[8px] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                        Configure
                      </button>
                    </div>
                  ))}
                </div>

                <button className="w-full bg-[#0f172a]/30 border border-dashed border-[#334155]/50 hover:border-[#3b82f6]/50 rounded-[12px] p-[20px] font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] hover:text-[#3b82f6] text-[14px] transition-all">
                  + Create Custom Agent
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[24px] mb-[24px]">Define Access Rules</h2>
                <p className="font-['Mulish:Regular',sans-serif] text-[#cbd5e1] text-[16px] mb-[32px]">
                  Establish security policies and permission levels to control what your agents can access and modify. Set up allow/block rules for different resources.
                </p>

                <div className="space-y-[16px] mb-[32px]">
                  <div className="bg-[#0f172a]/30 border border-[#334155]/30 rounded-[12px] p-[24px]">
                    <div className="flex items-center justify-between mb-[16px]">
                      <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px]">
                        Default Access Policy
                      </h3>
                      <select className="bg-[#0f172a]/50 border border-[#334155]/30 rounded-[8px] px-[12px] py-[6px] font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[14px] focus:outline-none focus:border-[#3b82f6]/50">
                        <option>Allow All</option>
                        <option>Block All</option>
                        <option>Custom</option>
                      </select>
                    </div>
                    <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[14px]">
                      Set the default behavior for resources without explicit rules
                    </p>
                  </div>

                  <div className="bg-[#0f172a]/30 border border-[#334155]/30 rounded-[12px] p-[24px]">
                    <div className="flex items-center justify-between mb-[16px]">
                      <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px]">
                        Rate Limiting
                      </h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-[44px] h-[24px] bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-[#10b981]"></div>
                      </label>
                    </div>
                    <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[14px]">
                      Limit the number of requests agents can make per minute
                    </p>
                  </div>

                  <div className="bg-[#0f172a]/30 border border-[#334155]/30 rounded-[12px] p-[24px]">
                    <div className="flex items-center justify-between mb-[16px]">
                      <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px]">
                        Audit Logging
                      </h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-[44px] h-[24px] bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-[#10b981]"></div>
                      </label>
                    </div>
                    <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[14px]">
                      Track all agent actions in the ledger for compliance
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[24px] mb-[24px]">Launch & Monitor</h2>
                <p className="font-['Mulish:Regular',sans-serif] text-[#cbd5e1] text-[16px] mb-[32px]">
                  You're all set! Deploy your agents and start monitoring their performance in real-time.
                </p>

                <div className="grid grid-cols-2 gap-[16px] mb-[32px]">
                  <div className="bg-gradient-to-br from-[#10b981]/10 to-transparent border border-[#10b981]/30 rounded-[12px] p-[24px]">
                    <div className="text-[36px] mb-[12px]">✓</div>
                    <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px] mb-[4px]">
                      Configuration Complete
                    </h3>
                    <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[14px]">
                      Your platform is ready to go
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-[#3b82f6]/10 to-transparent border border-[#3b82f6]/30 rounded-[12px] p-[24px]">
                    <div className="text-[36px] mb-[12px]">📊</div>
                    <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px] mb-[4px]">
                      Real-Time Dashboard
                    </h3>
                    <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[14px]">
                      Monitor agent activity
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-[#8b5cf6]/10 to-transparent border border-[#8b5cf6]/30 rounded-[12px] p-[24px]">
                    <div className="text-[36px] mb-[12px]">📝</div>
                    <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px] mb-[4px]">
                      Complete Audit Trail
                    </h3>
                    <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[14px]">
                      Track all actions in ledger
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-[#f59e0b]/10 to-transparent border border-[#f59e0b]/30 rounded-[12px] p-[24px]">
                    <div className="text-[36px] mb-[12px]">🔔</div>
                    <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px] mb-[4px]">
                      Smart Alerts
                    </h3>
                    <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[14px]">
                      Get notified of important events
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#3b82f6]/10 to-[#8b5cf6]/10 border border-[#3b82f6]/30 rounded-[12px] p-[32px] text-center">
                  <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[18px] mb-[16px]">
                    Ready to launch your AI agents?
                  </p>
                  <button className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-['Mulish:Bold',sans-serif] font-bold text-[16px] px-[32px] py-[12px] rounded-[8px] shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all">
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-[40px] pt-[32px] border-t border-[#334155]/30">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="bg-[#1e293b]/50 hover:bg-[#1e293b] border border-[#334155]/30 text-[#94a3b8] font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[10px] rounded-[8px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                  className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[10px] rounded-[8px] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[10px] rounded-[8px] shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  Complete Setup ✓
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
