import { Sidebar } from "../components/Sidebar";
import { useState } from "react";

export function SettingsPage() {
  const [selectedTab, setSelectedTab] = useState<'organization' | 'api' | 'integrations' | 'billing'>('organization');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  const tabs = [
    { id: 'organization', label: 'Organization' },
    { id: 'api', label: 'API Keys' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'billing', label: 'Billing' },
  ] as const;

  const members = [
    { name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'Admin', status: 'active', joined: 'Jan 15, 2026' },
    { name: 'Marcus Rodriguez', email: 'marcus.r@company.com', role: 'Member', status: 'active', joined: 'Feb 3, 2026' },
    { name: 'Emily Watson', email: 'e.watson@company.com', role: 'Member', status: 'active', joined: 'Feb 28, 2026' },
    { name: 'David Kim', email: 'david.kim@company.com', role: 'Viewer', status: 'pending', joined: 'Mar 10, 2026' },
  ];

  const apiKeys = [
    { name: 'Production API Key', key: 'ak_prod_*********************xyz', created: 'Feb 15, 2026', lastUsed: '2 hours ago', status: 'active' },
    { name: 'Development Key', key: 'ak_dev_*********************abc', created: 'Jan 8, 2026', lastUsed: '5 min ago', status: 'active' },
    { name: 'Testing Environment', key: 'ak_test_*********************def', created: 'Mar 1, 2026', lastUsed: 'Never', status: 'inactive' },
  ];

  const integrations = [
    { name: 'Slack', description: 'Send notifications to Slack channels', status: 'connected', icon: '💬' },
    { name: 'GitHub', description: 'Sync with GitHub repositories', status: 'connected', icon: '⚙️' },
    { name: 'Salesforce', description: 'Connect to Salesforce CRM', status: 'available', icon: '☁️' },
    { name: 'Jira', description: 'Track issues and projects', status: 'available', icon: '📋' },
    { name: 'Datadog', description: 'Monitor and analyze metrics', status: 'connected', icon: '📊' },
    { name: 'PagerDuty', description: 'Incident management and alerts', status: 'available', icon: '🚨' },
  ];

  const handleGenerateKey = () => {
    if (newKeyName.trim()) {
      // Generate a mock API key
      const mockKey = 'ak_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setGeneratedKey(mockKey);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] border border-[#1e293b]/30 overflow-clip relative rounded-[40px] shadow-[0px_4px_90px_0px_rgba(0,0,0,0.5),0px_0px_100px_0px_rgba(59,130,246,0.1)] size-full backdrop-blur-xl" data-name="Settings">
      {/* Sidebar */}
      <Sidebar activePage="settings" />

      {/* Main Content Container */}
      <div className="absolute left-[101px] right-0 top-0 bottom-0 overflow-y-auto">
        <div className="p-[56px] pl-[39px] pr-[56px] max-w-full">
          {/* Header */}
          <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Settings</h1>
          <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
            Manage your organization, integrations, and billing
          </p>

          {/* Tabs */}
          <div className="flex gap-[8px] mb-[32px] border-b border-[#334155]/30">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`font-['Mulish:SemiBold',sans-serif] font-semibold text-[16px] px-[24px] py-[12px] rounded-t-[8px] transition-all ${
                  selectedTab === tab.id
                    ? 'text-white bg-[#1e293b]/50 border-t border-l border-r border-[#334155]/30'
                    : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#1e293b]/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Organization Tab */}
          {selectedTab === 'organization' && (
            <div className="space-y-[32px]">
              {/* Organization Details */}
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px]">
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px] mb-[24px]">Organization Details</h2>
                <div className="space-y-[20px]">
                  <div>
                    <label className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[14px] mb-[8px] block">Organization Name</label>
                    <input 
                      type="text" 
                      defaultValue="Acme Corporation" 
                      className="w-full bg-[#0f172a]/50 border border-[#334155]/30 rounded-[8px] px-[16px] py-[12px] font-['Mulish:Regular',sans-serif] text-white text-[16px] focus:outline-none focus:border-[#3b82f6]/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[14px] mb-[8px] block">Organization ID</label>
                    <input 
                      type="text" 
                      defaultValue="org_8h3j4k5l6m7n8o9p" 
                      disabled
                      className="w-full bg-[#0f172a]/30 border border-[#334155]/20 rounded-[8px] px-[16px] py-[12px] font-['Mulish:Regular',sans-serif] text-[#64748b] text-[16px] cursor-not-allowed"
                    />
                  </div>
                  <div className="flex gap-[12px] pt-[8px]">
                    <button className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[10px] rounded-[8px] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                      Save Changes
                    </button>
                    <button className="bg-[#1e293b]/50 hover:bg-[#1e293b] border border-[#334155]/30 text-[#94a3b8] font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[10px] rounded-[8px] transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px]">
                <div className="flex items-center justify-between mb-[24px]">
                  <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px]">Team Members</h2>
                  <button className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[20px] py-[8px] rounded-[8px] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                    + Invite Member
                  </button>
                </div>
                <div className="space-y-[12px]">
                  {members.map((member, index) => (
                    <div key={index} className="bg-[#0f172a]/30 border border-[#334155]/20 rounded-[12px] p-[20px] hover:border-[#334155]/40 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-[12px] mb-[4px]">
                            <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px]">{member.name}</h3>
                            <span className={`px-[10px] py-[2px] rounded-full text-[11px] font-['Mulish:SemiBold',sans-serif] font-semibold uppercase ${
                              member.status === 'active' 
                                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                                : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                            }`}>
                              {member.status}
                            </span>
                          </div>
                          <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[14px] mb-[4px]">{member.email}</p>
                          <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[12px]">Joined {member.joined}</p>
                        </div>
                        <div className="flex items-center gap-[12px]">
                          <select className="bg-[#0f172a]/50 border border-[#334155]/30 rounded-[8px] px-[12px] py-[6px] font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[14px] focus:outline-none focus:border-[#3b82f6]/50">
                            <option value="admin" selected={member.role === 'Admin'}>Admin</option>
                            <option value="member" selected={member.role === 'Member'}>Member</option>
                            <option value="viewer" selected={member.role === 'Viewer'}>Viewer</option>
                          </select>
                          <button className="text-[#ef4444] hover:text-[#dc2626] transition-colors">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M7.5 2.5H12.5M2.5 5H17.5M15.833 5L15.275 13.575C15.191 15.075 15.149 15.825 14.808 16.383C14.507 16.875 14.066 17.266 13.541 17.508C12.95 17.783 12.2 17.783 10.7 17.783H9.3C7.8 17.783 7.05 17.783 6.459 17.508C5.934 17.266 5.493 16.875 5.192 16.383C4.851 15.825 4.809 15.075 4.725 13.575L4.167 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {selectedTab === 'api' && (
            <div className="space-y-[32px]">
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px]">
                <div className="flex items-center justify-between mb-[24px]">
                  <div>
                    <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px] mb-[8px]">API Keys</h2>
                    <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[14px]">Manage your API keys for accessing the platform programmatically</p>
                  </div>
                  <button 
                    onClick={() => setShowNewKeyModal(true)}
                    className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[20px] py-[8px] rounded-[8px] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
                  >
                    + Generate New Key
                  </button>
                </div>

                <div className="space-y-[12px]">
                  {apiKeys.map((key, index) => (
                    <div key={index} className="bg-[#0f172a]/30 border border-[#334155]/20 rounded-[12px] p-[20px] hover:border-[#334155]/40 transition-all">
                      <div className="flex items-start justify-between mb-[12px]">
                        <div className="flex-1">
                          <div className="flex items-center gap-[12px] mb-[8px]">
                            <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px]">{key.name}</h3>
                            <span className={`px-[10px] py-[2px] rounded-full text-[11px] font-['Mulish:SemiBold',sans-serif] font-semibold uppercase ${
                              key.status === 'active' 
                                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                                : 'bg-[#64748b]/20 text-[#64748b] border border-[#64748b]/30'
                            }`}>
                              {key.status}
                            </span>
                          </div>
                          <div className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[14px] font-mono mb-[8px] bg-[#0f172a]/50 border border-[#334155]/20 rounded-[6px] px-[12px] py-[8px] inline-block">
                            {key.key}
                          </div>
                          <div className="flex gap-[16px] text-[12px] font-['Mulish:Regular',sans-serif] text-[#64748b]">
                            <span>Created: {key.created}</span>
                            <span>Last used: {key.lastUsed}</span>
                          </div>
                        </div>
                        <div className="flex gap-[8px]">
                          <button className="text-[#94a3b8] hover:text-white transition-colors p-[8px]" title="Copy">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path d="M6 6V4.5C6 3.672 6 3.258 6.169 2.954C6.319 2.69 6.565 2.444 6.829 2.294C7.133 2.125 7.547 2.125 8.375 2.125H13.625C14.453 2.125 14.867 2.125 15.171 2.294C15.435 2.444 15.681 2.69 15.831 2.954C16 3.258 16 3.672 16 4.5V9.75C16 10.578 16 10.992 15.831 11.296C15.681 11.56 15.435 11.806 15.171 11.956C14.867 12.125 14.453 12.125 13.625 12.125H12M4.375 15.875H9.625C10.453 15.875 10.867 15.875 11.171 15.706C11.435 15.556 11.681 15.31 11.831 15.046C12 14.742 12 14.328 12 13.5V8.25C12 7.422 12 7.008 11.831 6.704C11.681 6.44 11.435 6.194 11.171 6.044C10.867 5.875 10.453 5.875 9.625 5.875H4.375C3.547 5.875 3.133 5.875 2.829 6.044C2.565 6.194 2.319 6.44 2.169 6.704C2 7.008 2 7.422 2 8.25V13.5C2 14.328 2 14.742 2.169 15.046C2.319 15.31 2.565 15.556 2.829 15.706C3.133 15.875 3.547 15.875 4.375 15.875Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button className="text-[#ef4444] hover:text-[#dc2626] transition-colors p-[8px]" title="Delete">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.748 12.218C13.672 13.568 13.634 14.243 13.327 14.745C13.057 15.188 12.659 15.54 12.187 15.757C11.655 16 10.98 16 9.63 16H8.37C7.02 16 6.345 16 5.813 15.757C5.341 15.54 4.943 15.188 4.673 14.745C4.366 14.243 4.328 13.568 4.252 12.218L3.75 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {selectedTab === 'integrations' && (
            <div className="space-y-[32px]">
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px]">
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px] mb-[8px]">Integrations</h2>
                <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[14px] mb-[24px]">Connect third-party services to enhance your workflow</p>

                <div className="grid grid-cols-2 gap-[16px]">
                  {integrations.map((integration, index) => (
                    <div key={index} className="bg-[#0f172a]/30 border border-[#334155]/20 rounded-[12px] p-[24px] hover:border-[#334155]/40 transition-all">
                      <div className="flex items-start justify-between mb-[16px]">
                        <div className="flex items-center gap-[12px]">
                          <div className="text-[32px]">{integration.icon}</div>
                          <div>
                            <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px] mb-[4px]">{integration.name}</h3>
                            <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[13px]">{integration.description}</p>
                          </div>
                        </div>
                      </div>
                      {integration.status === 'connected' ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-[8px]">
                            <div className="size-[8px] rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <span className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#10b981] text-[13px]">Connected</span>
                          </div>
                          <button className="text-[#94a3b8] hover:text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[13px] transition-colors">
                            Configure
                          </button>
                        </div>
                      ) : (
                        <button className="w-full bg-gradient-to-r from-[#3b82f6]/20 to-[#2563eb]/20 hover:from-[#3b82f6]/30 hover:to-[#2563eb]/30 border border-[#3b82f6]/30 text-[#3b82f6] font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[20px] py-[8px] rounded-[8px] transition-all">
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {selectedTab === 'billing' && (
            <div className="space-y-[32px]">
              {/* Current Plan */}
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px]">
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px] mb-[24px]">Current Plan</h2>
                
                <div className="bg-gradient-to-br from-[#3b82f6]/10 to-transparent border border-[#3b82f6]/30 rounded-[12px] p-[24px] mb-[24px]">
                  <div className="flex items-start justify-between mb-[16px]">
                    <div>
                      <h3 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[24px] mb-[8px]">Professional Plan</h3>
                      <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[14px]">Perfect for growing teams and organizations</p>
                    </div>
                    <div className="text-right">
                      <p className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[32px]">$149<span className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[16px]">/mo</span></p>
                    </div>
                  </div>
                  
                  <div className="space-y-[8px] mb-[20px]">
                    <div className="flex items-center gap-[8px] text-[14px] font-['Mulish:Regular',sans-serif] text-[#cbd5e1]">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.333 4L6 11.333L2.667 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Unlimited agents</span>
                    </div>
                    <div className="flex items-center gap-[8px] text-[14px] font-['Mulish:Regular',sans-serif] text-[#cbd5e1]">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.333 4L6 11.333L2.667 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Advanced analytics</span>
                    </div>
                    <div className="flex items-center gap-[8px] text-[14px] font-['Mulish:Regular',sans-serif] text-[#cbd5e1]">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.333 4L6 11.333L2.667 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center gap-[8px] text-[14px] font-['Mulish:Regular',sans-serif] text-[#cbd5e1]">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.333 4L6 11.333L2.667 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Custom integrations</span>
                    </div>
                  </div>

                  <div className="flex gap-[12px]">
                    <button className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[10px] rounded-[8px] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                      Upgrade Plan
                    </button>
                    <button className="bg-[#1e293b]/50 hover:bg-[#1e293b] border border-[#334155]/30 text-[#94a3b8] font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[10px] rounded-[8px] transition-all">
                      Change Plan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-[16px]">
                  <div className="bg-[#0f172a]/30 border border-[#334155]/20 rounded-[12px] p-[20px]">
                    <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[12px] mb-[8px]">Billing Cycle</p>
                    <p className="font-['Mulish:Regular',sans-serif] text-white text-[18px]">Monthly</p>
                  </div>
                  <div className="bg-[#0f172a]/30 border border-[#334155]/20 rounded-[12px] p-[20px]">
                    <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[12px] mb-[8px]">Next Billing Date</p>
                    <p className="font-['Mulish:Regular',sans-serif] text-white text-[18px]">Apr 12, 2026</p>
                  </div>
                  <div className="bg-[#0f172a]/30 border border-[#334155]/20 rounded-[12px] p-[20px]">
                    <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[12px] mb-[8px]">Payment Method</p>
                    <p className="font-['Mulish:Regular',sans-serif] text-white text-[18px]">•••• 4242</p>
                  </div>
                </div>
              </div>

              {/* Billing History */}
              <div className="bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[32px]">
                <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px] mb-[24px]">Billing History</h2>
                <div className="space-y-[12px]">
                  {[
                    { date: 'Mar 12, 2026', amount: '$149.00', status: 'Paid', invoice: 'INV-2026-003' },
                    { date: 'Feb 12, 2026', amount: '$149.00', status: 'Paid', invoice: 'INV-2026-002' },
                    { date: 'Jan 12, 2026', amount: '$149.00', status: 'Paid', invoice: 'INV-2026-001' },
                  ].map((payment, index) => (
                    <div key={index} className="bg-[#0f172a]/30 border border-[#334155]/20 rounded-[12px] p-[20px] hover:border-[#334155]/40 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[24px]">
                          <div>
                            <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px] mb-[4px]">{payment.invoice}</p>
                            <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[14px]">{payment.date}</p>
                          </div>
                          <span className="px-[12px] py-[4px] rounded-full text-[11px] font-['Mulish:SemiBold',sans-serif] font-semibold uppercase bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                            {payment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-[24px]">
                          <p className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[18px]">{payment.amount}</p>
                          <button className="text-[#94a3b8] hover:text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[13px] transition-colors">
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New API Key Modal */}
      {showNewKeyModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => {
              setShowNewKeyModal(false);
              setNewKeyName('');
              setGeneratedKey('');
            }}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-gradient-to-br from-[#1e293b]/95 to-[#0f172a]/90 border border-[#334155]/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl rounded-[16px] p-[32px] z-50">
            <h3 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px] mb-[24px]">
              {generatedKey ? 'API Key Generated' : 'Generate New API Key'}
            </h3>
            
            {!generatedKey ? (
              <>
                <div className="mb-[24px]">
                  <label className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[14px] mb-[8px] block">Key Name</label>
                  <input 
                    type="text" 
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production API Key"
                    className="w-full bg-[#0f172a]/50 border border-[#334155]/30 rounded-[8px] px-[16px] py-[12px] font-['Mulish:Regular',sans-serif] text-white text-[16px] focus:outline-none focus:border-[#3b82f6]/50 transition-all"
                  />
                </div>
                <div className="flex gap-[12px]">
                  <button 
                    onClick={handleGenerateKey}
                    disabled={!newKeyName.trim()}
                    className="flex-1 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] disabled:from-[#334155] disabled:to-[#334155] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[10px] rounded-[8px] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all disabled:cursor-not-allowed"
                  >
                    Generate Key
                  </button>
                  <button 
                    onClick={() => {
                      setShowNewKeyModal(false);
                      setNewKeyName('');
                    }}
                    className="bg-[#1e293b]/50 hover:bg-[#1e293b] border border-[#334155]/30 text-[#94a3b8] font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[10px] rounded-[8px] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#0f172a]/50 border border-[#334155]/30 rounded-[8px] p-[16px] mb-[16px]">
                  <p className="font-['Mulish:Regular',sans-serif] text-[#f59e0b] text-[14px] mb-[12px]">⚠️ Make sure to copy your API key now. You won't be able to see it again!</p>
                  <div className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[14px] font-mono bg-[#0f172a]/50 border border-[#334155]/20 rounded-[6px] px-[12px] py-[10px] break-all">
                    {generatedKey}
                  </div>
                </div>
                <div className="flex gap-[12px]">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                    }}
                    className="flex-1 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[10px] rounded-[8px] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
                  >
                    Copy to Clipboard
                  </button>
                  <button 
                    onClick={() => {
                      setShowNewKeyModal(false);
                      setNewKeyName('');
                      setGeneratedKey('');
                    }}
                    className="bg-[#1e293b]/50 hover:bg-[#1e293b] border border-[#334155]/30 text-[#94a3b8] font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[24px] py-[10px] rounded-[8px] transition-all"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
