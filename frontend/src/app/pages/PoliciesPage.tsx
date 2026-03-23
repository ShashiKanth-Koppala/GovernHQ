import { Sidebar } from "../components/Sidebar";
import { useState } from "react";

type Policy = {
  id: number;
  name: string;
  description: string;
  category: string;
  status: 'Active' | 'Draft';
  agents: number;
  rules: string[];
  fullDescription: string;
  created: string;
  lastModified: string;
  activeAgents: string;
};

export function PoliciesPage() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const policies: Policy[] = [
    {
      id: 1,
      name: 'PII Access Control',
      description: 'Restrict access to personally identifiable information',
      category: 'Data Protection',
      status: 'Active',
      agents: 5,
      rules: [
        'Agents must have explicit authorization to access PII fields',
        'All PII access attempts are logged and monitored',
        'Customer consent is required for data exports',
        'Data must be encrypted in transit and at rest'
      ],
      fullDescription: 'This policy controls and restricts agent access to personally identifiable information (PII) to ensure compliance with data protection regulations. Only authorized agents with proper clearance can access sensitive customer data.',
      created: 'Feb 12, 2026',
      lastModified: 'Mar 14, 2026',
      activeAgents: '5 / 6'
    },
    {
      id: 2,
      name: 'External API Restrictions',
      description: 'Block unauthorized external API calls',
      category: 'Security',
      status: 'Active',
      agents: 8,
      rules: [
        'Only whitelisted APIs can be accessed',
        'All external calls require approval',
        'Rate limiting applies to all external requests',
        'API keys must be rotated every 30 days'
      ],
      fullDescription: 'Controls which external APIs agents can access to prevent unauthorized data exfiltration and ensure security compliance. All external API calls are monitored and logged.',
      created: 'Jan 08, 2026',
      lastModified: 'Mar 10, 2026',
      activeAgents: '8 / 8'
    },
    {
      id: 3,
      name: 'Billing Override Protection',
      description: 'Prevent agents from exceeding billing limits',
      category: 'Financial',
      status: 'Active',
      agents: 3,
      rules: [
        'Maximum transaction limit of $10,000',
        'Require approval for discounts over 20%',
        'Block refunds exceeding $1,000',
        'Alert on unusual spending patterns'
      ],
      fullDescription: 'Protects against financial risks by limiting agent authority on billing operations. Ensures all high-value transactions require human approval.',
      created: 'Feb 20, 2026',
      lastModified: 'Mar 05, 2026',
      activeAgents: '3 / 6'
    },
    {
      id: 4,
      name: 'Bulk Operation Limits',
      description: 'Limit large batch operations to tier-approved requests',
      category: 'Performance',
      status: 'Draft',
      agents: 2,
      rules: [
        'Maximum 1,000 records per batch operation',
        'Require approval for operations over 500 records',
        'Throttle requests to prevent system overload',
        'Monitor resource usage during bulk operations'
      ],
      fullDescription: 'Prevents system overload by limiting the size and frequency of bulk operations. Ensures infrastructure stability during high-volume processing.',
      created: 'Mar 01, 2026',
      lastModified: 'Mar 15, 2026',
      activeAgents: '2 / 6'
    }
  ];

  const filteredPolicies = policies.filter(policy =>
    policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] border border-[#1e293b]/30 overflow-clip relative rounded-[40px] shadow-[0px_4px_90px_0px_rgba(0,0,0,0.5),0px_0px_100px_0px_rgba(59,130,246,0.1)] size-full backdrop-blur-xl" data-name="Policies">
      {/* Sidebar */}
      <Sidebar activePage="policies" />

      {/* Main Content Container */}
      <div className="absolute left-[101px] right-[33.333%] top-0 bottom-0 overflow-y-auto">
        <div className="p-[56px] pl-[39px] pr-[39px]">
          {/* Header */}
          <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Policies</h1>
          <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
            Create and manage policies that govern agent behavior
          </p>

          {/* Search and Create */}
          <div className="flex items-center gap-[16px] mb-[32px]">
            <div className="flex-1 relative">
              <svg className="absolute left-[16px] top-1/2 -translate-y-1/2 size-[20px]" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1e293b]/30 border border-[#334155]/30 rounded-[12px] pl-[48px] pr-[16px] py-[12px] font-['Mulish:Regular',sans-serif] text-[#cbd5e1] text-[14px] placeholder:text-[#64748b] focus:outline-none focus:border-[#3b82f6]/50 transition-all"
              />
            </div>
            <button className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[20px] py-[12px] rounded-[12px] shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all whitespace-nowrap">
              + Create Policy
            </button>
          </div>

          {/* Policy List Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-[16px] mb-[12px] px-[20px]">
            <div className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">
              Policy Name
            </div>
            <div className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">
              Category
            </div>
            <div className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">
              Status
            </div>
            <div className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">
              Agents
            </div>
          </div>

          {/* Policy List */}
          <div className="space-y-[12px]">
            {filteredPolicies.map((policy) => (
              <div
                key={policy.id}
                onClick={() => setSelectedPolicy(policy)}
                className={`grid grid-cols-[2fr_1fr_1fr_80px] gap-[16px] bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border rounded-[12px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl p-[20px] cursor-pointer transition-all ${
                  selectedPolicy?.id === policy.id
                    ? 'border-[#3b82f6]/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                    : 'border-[#334155]/30 hover:border-[#334155]/50'
                }`}
              >
                <div>
                  <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px] mb-[4px]">
                    {policy.name}
                  </h3>
                  <p className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[13px]">
                    {policy.description}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[14px]">
                    {policy.category}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className={`font-['Mulish:SemiBold',sans-serif] font-semibold text-[12px] px-[10px] py-[4px] rounded-[6px] ${
                    policy.status === 'Active'
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                      : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                  }`}>
                    {policy.status}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[16px]">
                    {policy.agents}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Policy Details */}
      {selectedPolicy && (
        <div className="absolute right-0 top-0 bottom-0 w-1/3 border-l border-[#1e293b]/50 bg-gradient-to-br from-[#1e293b] to-[#0f172a] shadow-[-12px_0_48px_0_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-y-auto">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#f59e0b]/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="p-[48px] relative z-10">
            {/* Policy Header */}
            <div className="flex items-start justify-between mb-[24px]">
              <h2 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px]">
                {selectedPolicy.name}
              </h2>
              <span className={`font-['Mulish:SemiBold',sans-serif] font-semibold text-[11px] px-[8px] py-[3px] rounded-[6px] ${
                selectedPolicy.status === 'Active'
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                  : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
              }`}>
                {selectedPolicy.status}
              </span>
            </div>

            <div className="flex items-center gap-[16px] mb-[32px]">
              <span className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[13px]">
                {selectedPolicy.category}
              </span>
              <span className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[13px]">
                {selectedPolicy.agents} agents
              </span>
            </div>

            {/* Description */}
            <div className="mb-[32px]">
              <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[14px] mb-[12px]">
                Description
              </h3>
              <p className="font-['Mulish:Regular',sans-serif] text-[#94a3b8] text-[13px] leading-relaxed">
                {selectedPolicy.fullDescription}
              </p>
            </div>

            {/* Policy Rules */}
            <div className="mb-[32px]">
              <h3 className="font-['Mulish:SemiBold',sans-serif] font-semibold text-white text-[14px] mb-[16px]">
                Policy Rules
              </h3>
              <div className="space-y-[12px]">
                {selectedPolicy.rules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-[10px] bg-[#0f172a]/30 border border-[#334155]/30 rounded-[8px] p-[12px]">
                    <div className="size-[6px] rounded-full bg-[#10b981] mt-[6px] flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="font-['Mulish:Regular',sans-serif] text-[#cbd5e1] text-[13px] leading-relaxed">
                      {rule}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-[12px] mb-[32px] pb-[32px] border-b border-[#334155]/30">
              <div className="flex items-center justify-between">
                <span className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[12px]">
                  Created
                </span>
                <span className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[12px]">
                  {selectedPolicy.created}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[12px]">
                  Last Modified
                </span>
                <span className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[12px]">
                  {selectedPolicy.lastModified}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-['Mulish:Regular',sans-serif] text-[#64748b] text-[12px]">
                  Active Agents
                </span>
                <span className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#31ba96] text-[12px]">
                  {selectedPolicy.activeAgents}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-[12px]">
              <button className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[20px] py-[10px] rounded-[8px] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                Edit Policy
              </button>
              <button className="w-full bg-[#1e293b]/50 hover:bg-[#1e293b] border border-[#334155]/30 hover:border-[#3b82f6]/30 text-[#94a3b8] hover:text-white font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[20px] py-[10px] rounded-[8px] transition-all">
                Duplicate Policy
              </button>
              <button className="w-full bg-[#1e293b]/30 hover:bg-[#ef4444]/10 border border-[#334155]/30 hover:border-[#ef4444]/50 text-[#94a3b8] hover:text-[#ef4444] font-['Mulish:SemiBold',sans-serif] font-semibold text-[14px] px-[20px] py-[10px] rounded-[8px] transition-all">
                Delete Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for Right Sidebar */}
      {!selectedPolicy && (
        <div className="absolute right-0 top-0 bottom-0 w-1/3 border-l border-[#1e293b]/50 bg-gradient-to-br from-[#1e293b] to-[#0f172a] shadow-[-12px_0_48px_0_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-y-auto">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#64748b]/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-center h-full p-[24px] relative z-10">
            <div className="text-center">
              <div className="text-[48px] mb-[16px]">📋</div>
              <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[14px]">
                Select a policy to view details
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}