import React from 'react';
import { EntropyResult } from '../types';

interface Props {
  entropy: EntropyResult;
}

const StrengthMeter: React.FC<Props> = ({ entropy }) => {
  return (
    <div className="w-full mt-6 space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">安全等级</span>
        <div className="text-right">
          <span className={`text-sm font-bold tracking-wide ${entropy.color.replace('bg-', 'text-')}`}>
            {entropy.label}
          </span>
          <span className="text-xs text-slate-500 ml-2">({entropy.bits} bits)</span>
        </div>
      </div>
      
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
        <div
          className={`h-full transition-all duration-700 ease-out ${entropy.color} shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
          style={{ width: `${entropy.score}%` }}
        />
        {/* Grid Overlay for "Tech" look */}
        <div className="absolute top-0 left-0 w-full h-full grid grid-cols-12 gap-0.5 pointer-events-none opacity-20">
             {Array.from({length: 12}).map((_, i) => (
                 <div key={i} className="bg-slate-900/50 h-full w-px ml-auto"></div>
             ))}
        </div>
      </div>
      
      <p className="text-xs text-slate-500 mt-1">
        {entropy.bits < 45 ? "这种强度的密码很容易被现代硬件瞬间破解。" : 
         entropy.bits < 60 ? "容易受到字典攻击或暴力破解。" :
         "从数学上讲，该密码能够有效抵御暴力破解攻击。"}
      </p>
    </div>
  );
};

export default StrengthMeter;