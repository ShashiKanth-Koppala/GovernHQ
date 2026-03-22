import { Link, useNavigate } from "react-router";
import { useAuth } from "@/lib/auth-context";


type SidebarProps = {
  activePage?: 'overview' | 'ledger' | 'agents' | 'security' | 'policies' | 'onboarding' | 'settings';
};

export function Sidebar({ activePage = 'overview' }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="absolute bg-gradient-to-b from-[#1e293b]/80 to-[#0f172a]/60 border border-[#334155]/30 h-full left-0 rounded-[16px] shadow-[0px_8px_50px_0px_rgba(0,0,0,0.4)] backdrop-blur-xl top-0 w-[101px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Scrollable inner wrapper for absolute positioning */}
      <div className="relative min-h-[1000px] w-full">
        {/* Logo */}
        <Link to="/" className="block absolute left-[14px] size-[72px] top-[43px] hover:scale-110 transition-transform duration-300 z-50">
          <svg className="absolute block size-full drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]" fill="none" preserveAspectRatio="none" viewBox="0 0 72 72">
            <defs>
              <linearGradient id="shieldGradient1" x1="36" y1="12" x2="36" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="shieldGradient2" x1="36" y1="12" x2="36" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="shieldGradient3" x1="36" y1="20" x2="36" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <filter id="shieldGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              </filter>
              <filter id="emblemBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
              </filter>
            </defs>

            {/* Main shield - single clean outline */}
            <path
              d="M36 12 L52 18 C52 18 52 28 52 36 C52 44 48 52 36 58 C24 52 20 44 20 36 C20 28 20 18 20 18 Z"
              fill="url(#shieldGradient1)"
              stroke="url(#shieldGradient2)"
              strokeWidth="1.5"
              filter="url(#shieldGlow)"
            />

            {/* Center emblem - geometric lines */}
            <line x1="36" y1="26" x2="36" y2="46" stroke="url(#shieldGradient3)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" filter="url(#emblemBlur)" />
            <line x1="28" y1="34" x2="44" y2="34" stroke="url(#shieldGradient3)" strokeWidth="2" strokeLinecap="round" opacity="0.7" filter="url(#emblemBlur)" />
            <circle cx="36" cy="34" r="5" fill="none" stroke="url(#shieldGradient3)" strokeWidth="2" opacity="0.6" filter="url(#emblemBlur)" />

            {/* Corner details */}
            <circle cx="36" cy="34" r="2" fill="#60a5fa" opacity="0.8" filter="url(#emblemBlur)" />

            {/* Subtle tech lines on sides */}
            <path d="M24 30 L26 30" stroke="#60a5fa" strokeWidth="0.8" opacity="0.4" />
            <path d="M24 36 L26 36" stroke="#60a5fa" strokeWidth="0.8" opacity="0.4" />
            <path d="M46 30 L48 30" stroke="#60a5fa" strokeWidth="0.8" opacity="0.4" />
            <path d="M46 36 L48 36" stroke="#60a5fa" strokeWidth="0.8" opacity="0.4" />
          </svg>
        </Link>

        {/* Dashboard Icon */}
        <Link to="/" className="absolute left-[20px] top-[169px] group">
          {activePage === 'overview' && (
            <>
              <div className="bg-gradient-to-br from-[#3b82f6] to-[#6366f1] rounded-[12px] size-[60px] shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/50 to-transparent rounded-[12px] blur-sm" />
            </>
          )}
          <div className={`absolute left-[16px] top-[15px] size-[30px] ${activePage !== 'overview' ? 'group-hover:scale-110 transition-transform' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={activePage === 'overview' ? 'white' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-full ${activePage !== 'overview' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}`}>
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
          </div>
        </Link>

        {/* Robot Icon */}
        <Link to="/agents" className="absolute left-[20px] top-[258px] group">
          {activePage === 'agents' && (
            <>
              <div className="bg-gradient-to-br from-[#6366f1] to-[#7c3aed] rounded-[12px] size-[60px] shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/50 to-transparent rounded-[12px] blur-sm" />
            </>
          )}
          <div className={`absolute left-[12px] top-[12px] size-[36px] ${activePage !== 'agents' ? 'group-hover:scale-110 transition-transform' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={activePage === 'agents' ? 'white' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-full ${activePage !== 'agents' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}`}>
              <rect width="16" height="12" x="4" y="8" rx="2" />
              <path d="M2 14h2" />
              <path d="M20 14h2" />
              <path d="M15 13v2" />
              <path d="M9 13v2" />
              <path d="M12 8V4" />
              <path d="M12 4L10 2" />
            </svg>
          </div>
        </Link>

        {/* Ledger Icon */}
        <Link to="/ledger" className="absolute left-[20px] top-[348px] group">
          {activePage === 'ledger' && (
            <>
              <div className="bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] rounded-[12px] size-[60px] shadow-[0_0_20px_rgba(124,58,237,0.5)]" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/50 to-transparent rounded-[12px] blur-sm" />
            </>
          )}
          <div className={`absolute left-[12px] top-[12px] overflow-clip size-[36px] ${activePage !== 'ledger' ? 'group-hover:scale-110 transition-transform' : ''}`}>
            <div className="absolute inset-[16.67%_12.5%]">
              <div className="absolute inset-[-6.25%_-5.56%]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={activePage === 'ledger' ? 'white' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-full ${activePage !== 'ledger' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}`}>
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Shield Icon */}
        <Link to="/shield" className="absolute left-[20px] top-[438px] group">
          {activePage === 'security' && (
            <>
              <div className="bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] rounded-[12px] size-[60px] shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/50 to-transparent rounded-[12px] blur-sm" />
            </>
          )}
          <div className={`absolute left-[16px] top-[15px] overflow-clip size-[28px] ${activePage !== 'security' ? 'group-hover:scale-110 transition-transform' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={activePage === 'security' ? 'white' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-full ${activePage !== 'security' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}`}>
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.89 0 4.78.29 7 2a1 1 0 0 1 1 1v7z" />
            </svg>
          </div>
        </Link>

        {/* Policies Icon */}
        <Link to="/policies" className="absolute left-[20px] top-[529px] group">
          {activePage === 'policies' && (
            <>
              <div className="bg-gradient-to-br from-[#a78bfa] to-[#c084fc] rounded-[12px] size-[60px] shadow-[0_0_20px_rgba(167,139,250,0.5)]" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/50 to-transparent rounded-[12px] blur-sm" />
            </>
          )}
          {activePage !== 'policies' && (
            <div className="rounded-[12px] size-[60px] bg-[#1e293b]/30 border border-[#334155]/30 backdrop-blur-sm group-hover:bg-[#1e293b]/50 group-hover:border-[#a78bfa]/30 transition-all" />
          )}
          <div className={`absolute left-[15px] top-[15px] size-[30px] ${activePage !== 'policies' ? 'group-hover:scale-110 transition-transform' : ''}`}>
            <svg className="block size-full drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke={activePage === 'policies' ? 'white' : '#64748b'} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className={activePage !== 'policies' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''} />
            </svg>
          </div>
        </Link>

        {/* Onboarding Icon */}
        <Link to="/onboarding" className="absolute left-[20px] top-[619px] group">
          {activePage === 'onboarding' && (
            <>
              <div className="bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-[12px] size-[60px] shadow-[0_0_20px_rgba(192,132,252,0.5)]" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#c084fc]/50 to-transparent rounded-[12px] blur-sm" />
            </>
          )}
          {activePage !== 'onboarding' && (
            <div className="rounded-[12px] size-[60px] bg-[#1e293b]/30 border border-[#334155]/30 backdrop-blur-sm group-hover:bg-[#1e293b]/50 group-hover:border-[#c084fc]/30 transition-all" />
          )}
          <div className={`absolute left-[12px] top-[10px] size-[36px] ${activePage !== 'onboarding' ? 'group-hover:scale-110 transition-transform' : ''}`}>
            <svg className="block size-full drop-shadow-[0_0_8px_rgba(192,132,252,0.3)]" fill="none" viewBox="0 0 36 36" strokeLinecap="round" strokeLinejoin="round">
              {/* Rocket body - rounder and chubbier */}
              <path
                d="M18 5 C18 5 20 6 22 11 C23 14 23.5 17 23.5 20 L23.5 24 C23.5 26.5 21.5 28 18 28 C14.5 28 12.5 26.5 12.5 24 L12.5 20 C12.5 17 13 14 14 11 C16 6 18 5 18 5 Z"
                stroke={activePage === 'onboarding' ? 'white' : '#64748b'}
                strokeWidth="2.5"
                className={activePage !== 'onboarding' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}
              />

              {/* Left fin - smaller and rounder */}
              <path
                d="M13 21 Q10 23 8 26 L10 27 Q12 24 13 23 Z"
                stroke={activePage === 'onboarding' ? 'white' : '#64748b'}
                strokeWidth="2.5"
                className={activePage !== 'onboarding' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}
              />

              {/* Right fin - smaller and rounder */}
              <path
                d="M23 21 Q26 23 28 26 L26 27 Q24 24 23 23 Z"
                stroke={activePage === 'onboarding' ? 'white' : '#64748b'}
                strokeWidth="2.5"
                className={activePage !== 'onboarding' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}
              />

              {/* Big cute window/porthole */}
              <circle
                cx="18"
                cy="13"
                r="3.5"
                stroke={activePage === 'onboarding' ? 'white' : '#64748b'}
                strokeWidth="2.5"
                className={activePage !== 'onboarding' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}
              />

              {/* Cute inner circle for window reflection */}
              <circle
                cx="19"
                cy="12"
                r="1"
                fill={activePage === 'onboarding' ? 'white' : '#64748b'}
                className={activePage !== 'onboarding' ? 'group-hover:fill-[#94a3b8] transition-colors' : ''}
              />

              {/* Exhaust flames - curvier and playful */}
              <path
                d="M15.5 28 Q15 30 15.5 32"
                stroke={activePage === 'onboarding' ? 'white' : '#64748b'}
                strokeWidth="2"
                className={activePage !== 'onboarding' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}
              />
              <path
                d="M18 28 Q18 31 18 33"
                stroke={activePage === 'onboarding' ? 'white' : '#64748b'}
                strokeWidth="2.5"
                className={activePage !== 'onboarding' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}
              />
              <path
                d="M20.5 28 Q21 30 20.5 32"
                stroke={activePage === 'onboarding' ? 'white' : '#64748b'}
                strokeWidth="2"
                className={activePage !== 'onboarding' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}
              />

              {/* Little star accent */}
              <path
                d="M27 9 L27.5 10 L28.5 10.5 L27.5 11 L27 12 L26.5 11 L25.5 10.5 L26.5 10 Z"
                fill={activePage === 'onboarding' ? 'white' : '#64748b'}
                className={activePage !== 'onboarding' ? 'group-hover:fill-[#94a3b8] transition-colors' : ''}
              />
            </svg>
          </div>
        </Link>

        {/* Settings Icon */}
        <Link to="/settings" className="absolute left-[20px] top-[709px] group">{activePage === 'settings' && (
          <>
            <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] rounded-[12px] size-[60px] shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/50 to-transparent rounded-[12px] blur-sm" />
          </>
        )}
          {activePage !== 'settings' && (
            <div className="rounded-[12px] size-[60px] bg-[#1e293b]/30 border border-[#334155]/30 backdrop-blur-sm group-hover:bg-[#1e293b]/50 group-hover:border-[#3b82f6]/30 transition-all" />
          )}
          <div className={`absolute left-[16px] top-[15px] overflow-clip size-[30px] ${activePage !== 'settings' ? 'group-hover:scale-110 transition-transform' : ''}`}>
            <div className="absolute inset-[8.41%_12.68%]">
              <div className="absolute inset-[-5.01%_-5.58%]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={activePage === 'settings' ? 'white' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-full ${activePage !== 'settings' ? 'group-hover:stroke-[#94a3b8] transition-colors' : ''}`}>
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Logout Icon */}
        <button onClick={handleLogout} className="absolute left-[21px] rounded-[12px] size-[60px] top-[799px] bg-[#1e293b]/30 border border-[#334155]/30 backdrop-blur-sm group hover:bg-[#1e293b]/50 hover:border-[#ef4444]/30 transition-all cursor-pointer z-50">
          <div className="absolute flex items-center justify-center left-[15px] size-[30px] top-[15px] group-hover:scale-110 transition-transform cursor-pointer">
            <div className="-scale-y-100 flex-none rotate-180">
              <div className="size-[30px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-full group-hover:stroke-[#ef4444] transition-colors">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
            </div>
          </div>
        </button>

        {/* Bottom Help Icon */}
        <div className="absolute left-[21px] rounded-[12px] size-[60px] top-[910px] bg-[#1e293b]/30 border border-[#334155]/30 backdrop-blur-sm group hover:bg-[#1e293b]/50 hover:border-[#3b82f6]/30 transition-all cursor-pointer" />
        <div className="absolute left-[36px] top-[925px] size-[30px] group-hover:scale-110 transition-transform cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-full group-hover:stroke-[#94a3b8] transition-colors">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      </div>
    </div>
  );
}