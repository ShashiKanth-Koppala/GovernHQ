interface AgentCardProps {
  name: string;
  identity: string;
  trust: number | null;
  gateRate: number | null;
  blockedToday: number | null;
  isSelected: boolean;
  onClick: () => void;
}

export function AgentCard({ name, identity, trust, gateRate, blockedToday, isSelected, onClick }: AgentCardProps) {
  return (
    <div
      className={`group bg-gradient-to-br from-[#1e293b]/40 to-[#0f172a]/20 border rounded-[12px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.2)] backdrop-blur-xl p-[20px] cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0px_8px_24px_0px_rgba(0,0,0,0.3)] ${isSelected
          ? 'border-[#3b82f6]/50 shadow-[0_0_24px_rgba(59,130,246,0.3)]'
          : 'border-[#334155]/30 hover:border-[#3b82f6]/30'
        }`}
      onClick={onClick}
    >
      {/* Agent Name with Status */}
      <div className="flex items-center gap-[12px]">
        <div className={`size-[12px] rounded-full ${identity === 'allowed'
            ? 'bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.6)]'
            : 'bg-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.6)]'
          }`} />
        <h3 className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[18px]">{name}</h3>
      </div>

      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-in-out">
        <div className="overflow-hidden">
          <div className="pt-[16px]">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-[12px]">
              {/* Trust */}
              <div className="bg-[#0f172a]/40 border border-[#334155]/20 rounded-[8px] p-[12px]">
                <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[10px] uppercase tracking-wider mb-[4px]">Trust</p>
                <p className="font-['Mulish:Bold',sans-serif] font-bold text-white text-[20px]">{trust !== null ? trust : '—'}</p>
              </div>

              {/* Gate Rate */}
              <div className="bg-[#0f172a]/40 border border-[#334155]/20 rounded-[8px] p-[12px]">
                <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[10px] uppercase tracking-wider mb-[4px]">Gate Rate</p>
                <p className="font-['Mulish:Bold',sans-serif] font-bold text-[#10b981] text-[20px]">{gateRate !== null ? `${gateRate}%` : '—'}</p>
              </div>

              {/* Blocked Today */}
              <div className="bg-[#0f172a]/40 border border-[#334155]/20 rounded-[8px] p-[12px]">
                <p className="font-['Mulish:SemiBold',sans-serif] font-semibold text-[#64748b] text-[10px] uppercase tracking-wider mb-[4px]">Blocked</p>
                <p className="font-['Mulish:Bold',sans-serif] font-bold text-[#ef4444] text-[20px]">{blockedToday !== null ? blockedToday : '—'}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-[12px] flex items-center gap-[8px]">
              <div className={`flex-1 px-[12px] py-[6px] rounded-[6px] text-center ${identity === 'allowed'
                  ? 'bg-[#10b981]/10 border border-[#10b981]/30'
                  : 'bg-[#ef4444]/10 border border-[#ef4444]/30'
                }`}>
                <p className={`font-['Mulish:SemiBold',sans-serif] font-semibold text-[12px] uppercase tracking-wider ${identity === 'allowed' ? 'text-[#10b981]' : 'text-[#ef4444]'
                  }`}>
                  {identity}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
