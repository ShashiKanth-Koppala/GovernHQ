import { Sidebar } from "../components/Sidebar";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

type Policy = {
  id: string;
  name: string;
  description: string;
  is_enabled: boolean;
  rule: any;
  created_at: string;
  organization_id: string;
};

export function PoliciesPage() {
  const { token, isLoading } = useAuth();
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ name: '', description: '', condition: '', action: 'block' });
  const [creating, setCreating] = useState(false);

  const fetchPolicies = (tok: string) => {
    apiGet('/govern/policies', tok).then(res => {
      if (res.data) setPolicies(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!token || isLoading) return;
    fetchPolicies(token);
  }, [token, isLoading]);

  const handleTogglePolicy = async (policy: Policy) => {
    if (!token) return;
    const updated = { is_enabled: !policy.is_enabled };
    const res = await apiPatch(`/govern/policies/${policy.id}`, token, updated);
    if (res.data) {
      setPolicies(prev => prev.map(p => p.id === policy.id ? { ...p, ...updated } : p));
      if (selectedPolicy?.id === policy.id) {
        setSelectedPolicy(prev => prev ? { ...prev, ...updated } : null);
      }
    }
  };

  const handleCreatePolicy = async () => {
    if (!token || !newPolicy.name || !newPolicy.condition) return;
    setCreating(true);
    const res = await apiPost('/govern/policies', token, {
      name: newPolicy.name,
      description: newPolicy.description,
      condition: newPolicy.condition,
      action: newPolicy.action,
    });
    setCreating(false);
    if (res.data) {
      setShowCreateModal(false);
      setNewPolicy({ name: '', description: '', condition: '', action: 'block' });
      fetchPolicies(token);
    }
  };

  const filteredPolicies = policies.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.rule?.condition || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0f1629] border border-[#1e293b]/30 overflow-clip relative rounded-[40px] shadow-[0px_4px_90px_0px_rgba(0,0,0,0.5),0px_0px_100px_0px_rgba(59,130,246,0.1)] size-full backdrop-blur-xl" data-name="Policies">
      <Sidebar activePage="policies" />

      <div className="absolute left-[101px] right-[33.333%] top-0 bottom-0 overflow-y-auto">
        <div className="p-[56px] pl-[39px]">
          <h1 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[28px] mb-[12px] tracking-tight">Policies</h1>
          <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#94a3b8] text-[16px] mb-[32px]">
            <span className="text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">•  LIVE</span>
          </p>

          {/* Search + Create */}
          <div className="flex items-center gap-[16px] mb-[32px]">
            <div className="flex-1 bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border border-[#334155]/30 rounded-[16px] px-[20px] py-[14px] flex items-center gap-[12px]">
              <input
                type="text"
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white text-[14px] outline-none flex-1 placeholder:text-[#475569]"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold text-[14px] px-[20px] py-[12px] rounded-[12px] transition-all whitespace-nowrap hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              + Create Policy
            </button>
          </div>

          {/* Policy List Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-[16px] mb-[12px] px-[20px]">
            <div className="text-[#64748b] text-[11px] uppercase tracking-wider font-semibold">Policy Name</div>
            <div className="text-[#64748b] text-[11px] uppercase tracking-wider font-semibold">Action</div>
            <div className="text-[#64748b] text-[11px] uppercase tracking-wider font-semibold">Status</div>
            <div className="text-[#64748b] text-[11px] uppercase tracking-wider font-semibold">Toggle</div>
          </div>

          {/* Policy List */}
          {loading ? (
            <p className="text-[#94a3b8] text-[14px] px-[20px]">Loading policies...</p>
          ) : filteredPolicies.length === 0 ? (
            <p className="text-[#94a3b8] text-[14px] px-[20px]">No policies found.</p>
          ) : (
            <div className="space-y-[12px]">
              {filteredPolicies.map((policy) => (
                <div
                  key={policy.id}
                  onClick={() => setSelectedPolicy(policy)}
                  className={`grid grid-cols-[2fr_1fr_1fr_80px] gap-[16px] bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/30 border rounded-[12px] p-[20px] cursor-pointer transition-all ${
                    selectedPolicy?.id === policy.id
                      ? 'border-[#3b82f6]/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'border-[#334155]/30 hover:border-[#334155]/50'
                  }`}
                >
                  <div>
                    <h3 className="font-semibold text-white text-[16px] mb-[4px]">{policy.name}</h3>
                    <p className="text-[#64748b] text-[13px]">{policy.rule?.condition || 'No condition set'}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-[14px] capitalize font-semibold ${
                      policy.rule?.action === 'block' ? 'text-[#ef4444]' :
                      policy.rule?.action === 'review' ? 'text-[#f59e0b]' : 'text-[#94a3b8]'
                    }`}>{policy.rule?.action || '—'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`font-semibold text-[12px] px-[10px] py-[4px] rounded-[6px] ${
                      policy.is_enabled
                        ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                        : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                    }`}>
                      {policy.is_enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-center" onClick={(e) => { e.stopPropagation(); handleTogglePolicy(policy); }}>
                    <div className={`w-[40px] h-[22px] rounded-full transition-all cursor-pointer relative ${policy.is_enabled ? 'bg-[#10b981]' : 'bg-[#334155]'}`}>
                      <div className={`absolute top-[3px] w-[16px] h-[16px] rounded-full bg-white transition-all ${policy.is_enabled ? 'left-[21px]' : 'left-[3px]'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Policy Details */}
      {selectedPolicy ? (
        <div className="absolute right-0 top-0 bottom-0 w-1/3 border-l border-[#1e293b]/50 bg-gradient-to-br from-[#1e293b] to-[#0f172a] shadow-[-12px_0_48px_0_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-y-auto">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#f59e0b]/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="p-[48px] relative z-10">
            <div className="flex items-start justify-between mb-[24px]">
              <h2 className="font-bold text-white text-[20px]">{selectedPolicy.name}</h2>
              <span className={`font-semibold text-[11px] px-[8px] py-[3px] rounded-[6px] ${
                selectedPolicy.is_enabled
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                  : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
              }`}>
                {selectedPolicy.is_enabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            {/* Rule Details */}
            <div className="mb-[32px]">
              <h3 className="font-semibold text-white text-[14px] mb-[12px]">Rule</h3>
              <div className="space-y-[12px]">
                <div className="flex items-center justify-between bg-[#0f172a]/30 border border-[#334155]/30 rounded-[8px] p-[12px]">
                  <span className="text-[#64748b] text-[13px]">Action</span>
                  <span className={`text-[13px] capitalize font-semibold ${
                    selectedPolicy.rule?.action === 'block' ? 'text-[#ef4444]' :
                    selectedPolicy.rule?.action === 'review' ? 'text-[#f59e0b]' : 'text-[#94a3b8]'
                  }`}>{selectedPolicy.rule?.action || '—'}</span>
                </div>
                <div className="flex items-center justify-between bg-[#0f172a]/30 border border-[#334155]/30 rounded-[8px] p-[12px]">
                  <span className="text-[#64748b] text-[13px]">Condition</span>
                  <span className="text-white text-[13px]">{selectedPolicy.rule?.condition || '—'}</span>
                </div>
                {selectedPolicy.description && (
                  <div className="bg-[#0f172a]/30 border border-[#334155]/30 rounded-[8px] p-[12px]">
                    <span className="text-[#64748b] text-[13px] block mb-[4px]">Description</span>
                    <span className="text-white text-[13px]">{selectedPolicy.description}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-[12px] mb-[32px] pb-[32px] border-b border-[#334155]/30">
              <div className="flex items-center justify-between">
                <span className="text-[#64748b] text-[12px]">Created</span>
                <span className="font-semibold text-[#94a3b8] text-[12px]">
                  {new Date(selectedPolicy.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-[12px]">
              <button
                onClick={() => handleTogglePolicy(selectedPolicy)}
                className={`w-full font-semibold text-[14px] px-[20px] py-[10px] rounded-[8px] transition-all border ${
                  selectedPolicy.is_enabled
                    ? 'border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b]/10'
                    : 'border-[#10b981] text-[#10b981] hover:bg-[#10b981]/10'
                }`}>
                {selectedPolicy.is_enabled ? 'Disable Policy' : 'Enable Policy'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute right-0 top-0 bottom-0 w-1/3 border-l border-[#1e293b]/50 bg-gradient-to-br from-[#1e293b] to-[#0f172a] shadow-[-12px_0_48px_0_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-y-auto">
          <div className="flex items-center justify-center h-full p-[24px]">
            <div className="text-center">
              <div className="text-[48px] mb-[16px]">📋</div>
              <p className="font-semibold text-[#64748b] text-[14px]">Select a policy to view details</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Policy Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowCreateModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-gradient-to-br from-[#1e293b]/95 to-[#0f172a]/90 border border-[#334155]/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl rounded-[16px] p-[32px] z-50">
            <h3 className="font-bold text-white text-[22px] mb-[24px]">Create Policy</h3>

            <div className="space-y-[16px] mb-[24px]">
              <div>
                <label className="font-semibold text-white text-[14px] mb-[8px] block">Policy Name <span className="text-[#ef4444]">*</span></label>
                <input
                  type="text"
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Block external API calls"
                  className="w-full bg-[#0f172a]/50 border border-[#334155]/50 rounded-[8px] px-[16px] py-[12px] text-white text-[14px] focus:outline-none focus:border-[#3b82f6]/50 placeholder:text-[#475569]"
                />
              </div>

              <div>
                <label className="font-semibold text-white text-[14px] mb-[8px] block">Condition <span className="text-[#ef4444]">*</span></label>
                <input
                  type="text"
                  value={newPolicy.condition}
                  onChange={(e) => setNewPolicy(p => ({ ...p, condition: e.target.value }))}
                  placeholder="e.g. external api"
                  className="w-full bg-[#0f172a]/50 border border-[#334155]/50 rounded-[8px] px-[16px] py-[12px] text-white text-[14px] focus:outline-none focus:border-[#3b82f6]/50 placeholder:text-[#475569]"
                />
                <p className="text-[#64748b] text-[12px] mt-[6px]">If agent intent contains this text, the action triggers.</p>
              </div>

              <div>
                <label className="font-semibold text-white text-[14px] mb-[8px] block">Action</label>
                <div className="flex gap-[12px]">
                  {['block', 'review', 'log'].map(action => (
                    <button
                      key={action}
                      onClick={() => setNewPolicy(p => ({ ...p, action }))}
                      className={`flex-1 py-[10px] rounded-[8px] border font-semibold text-[13px] capitalize transition-all ${
                        newPolicy.action === action
                          ? action === 'block' ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]' :
                            action === 'review' ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]' :
                            'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]'
                          : 'border-[#334155]/50 text-[#64748b] hover:border-[#334155]'
                      }`}>
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-white text-[14px] mb-[8px] block">Description</label>
                <input
                  type="text"
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy(p => ({ ...p, description: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full bg-[#0f172a]/50 border border-[#334155]/50 rounded-[8px] px-[16px] py-[12px] text-white text-[14px] focus:outline-none focus:border-[#3b82f6]/50 placeholder:text-[#475569]"
                />
              </div>
            </div>

            <div className="flex gap-[12px]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-[#1e293b]/50 border border-[#334155]/30 text-[#94a3b8] font-semibold text-[14px] px-[24px] py-[12px] rounded-[8px] transition-all">
                Cancel
              </button>
              <button
                onClick={handleCreatePolicy}
                disabled={!newPolicy.name || !newPolicy.condition || creating}
                className="flex-1 bg-gradient-to-r from-[#10b981] to-[#059669] disabled:bg-[#334155] disabled:cursor-not-allowed text-white font-bold text-[14px] px-[24px] py-[12px] rounded-[8px] transition-all">
                {creating ? 'Creating...' : 'Create Policy'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}