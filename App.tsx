import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, RefreshCw, Lock, ShieldCheck, Cpu, Hash, Network, Check, ScanLine, Clock } from 'lucide-react';
import StarBackground from './components/StarBackground';
import StrengthMeter from './components/StrengthMeter';
import { GeneratorMode, PasswordConfig, GenerationResult } from './types';
import { calculateEntropy } from './utils/entropy';
import { generateCustomPassword, generatePin, generateUUID, generateMacAddress } from './utils/generators';
import { generateTOTP } from './utils/totp';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [mode, setMode] = useState<GeneratorMode>(GeneratorMode.CUSTOM);
  const [generated, setGenerated] = useState<GenerationResult>({ 
    text: '', 
    entropy: { score: 0, bits: 0, label: '无', color: 'bg-gray-700' } 
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA Specific State
  const [otpSecret, setOtpSecret] = useState('');
  const [otpTimeLeft, setOtpTimeLeft] = useState(30);
  const [otpProgress, setOtpProgress] = useState(100);

  const [config, setConfig] = useState<PasswordConfig>({
    length: 16,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    pinLength: 6,
    macSeparator: ':',
  });

  // Handle regular generation
  const generate = useCallback(async () => {
    // Skip normal generation if in 2FA mode, handled by effect
    if (mode === GeneratorMode.TWO_FA) return;

    setError(null);
    setLoading(true);
    audioService.playGenerateSound();

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      let text = '';
      if (mode === GeneratorMode.CUSTOM) {
        text = generateCustomPassword(config);
      } else if (mode === GeneratorMode.PIN) {
        text = generatePin(config.pinLength);
      } else if (mode === GeneratorMode.UUID) {
        text = generateUUID();
      } else if (mode === GeneratorMode.MAC) {
        text = generateMacAddress(config.macSeparator, config.useUppercase);
      }

      const entropy = calculateEntropy(text);
      setGenerated({ text, entropy });
    } catch (err) {
      console.error(err);
      setError("生成失败，请重试。");
    } finally {
      setLoading(false);
      setCopied(false);
    }
  }, [mode, config]);

  // Initial generation
  useEffect(() => {
    if (mode !== GeneratorMode.TWO_FA) {
      generate();
    } else {
      setGenerated({ 
        text: '等待输入密钥...', 
        entropy: { score: 0, bits: 0, label: '', color: '' } 
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]); // Re-run when mode switches

  // 2FA Timer & Update Loop
  useEffect(() => {
    if (mode !== GeneratorMode.TWO_FA) return;

    const updateTOTP = async () => {
      if (!otpSecret) {
        setGenerated(prev => ({ ...prev, text: '等待输入密钥...' }));
        setOtpProgress(0);
        return;
      }
      
      const { code, timeLeft, progress } = await generateTOTP(otpSecret);
      setGenerated({ 
        text: code, 
        entropy: { score: 0, bits: 0, label: '2FA', color: 'bg-blue-500' } 
      });
      setOtpTimeLeft(timeLeft);
      setOtpProgress(progress);
    };

    updateTOTP(); // Immediate run
    const interval = setInterval(updateTOTP, 1000);
    return () => clearInterval(interval);
  }, [mode, otpSecret]);

  const handleCopy = () => {
    if (!generated.text || generated.text === '等待输入密钥...') return;
    navigator.clipboard.writeText(generated.text);
    audioService.playCopySound();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center p-4 relative font-sans">
      <StarBackground />
      
      <main className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.6)]">
               <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-wide">星云密钥</h1>
              <p className="text-blue-200/70 text-xs tracking-wider uppercase">安全熵值 & 2FA 生成器</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl overflow-x-auto max-w-full">
            {[
              { id: GeneratorMode.CUSTOM, icon: Lock, label: '自定义' },
              { id: GeneratorMode.PIN, icon: Hash, label: 'PIN码' },
              { id: GeneratorMode.UUID, icon: Cpu, label: 'UUID' },
              { id: GeneratorMode.MAC, icon: Network, label: 'MAC' },
              { id: GeneratorMode.TWO_FA, icon: ScanLine, label: '2FA' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as GeneratorMode)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-300 border min-w-[56px] ${
                  mode === tab.id
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)] scale-105'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-bold whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Display Area */}
        <div className="p-8 pb-4 relative group">
           <div 
             className="relative cursor-pointer group/display"
             onClick={handleCopy}
             title="点击复制"
           >
             <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-2xl -z-10 transition-opacity opacity-50 group-hover/display:opacity-100"></div>
             <div className="bg-black/40 border border-white/10 rounded-2xl p-6 min-h-[140px] flex items-center justify-center text-center transition-all duration-300 group-hover/display:border-blue-500/50 group-hover/display:shadow-[0_0_30px_rgba(59,130,246,0.15)] group-active/display:scale-[0.99]">
                {loading ? (
                   <div className="flex flex-col items-center gap-3 animate-pulse">
                     <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                     <span className="text-sm text-blue-300 font-mono tracking-widest">计算中...</span>
                   </div>
                ) : (
                  <div className="relative w-full">
                    <p className={`font-mono font-semibold tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] select-none text-white ${mode === GeneratorMode.TWO_FA ? 'text-5xl md:text-6xl tracking-[0.2em]' : 'text-3xl md:text-4xl break-all'}`}>
                      {mode === GeneratorMode.TWO_FA && generated.text !== '等待输入密钥...' 
                        ? `${generated.text.slice(0,3)} ${generated.text.slice(3)}` 
                        : generated.text}
                    </p>
                    
                    {copied && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
                          <Check className="w-6 h-6" />
                          已复制
                        </div>
                      </div>
                    )}
                  </div>
                )}
             </div>
             
             {!loading && !copied && generated.text !== '等待输入密钥...' && (
               <div className="absolute top-4 right-4 text-slate-600 group-hover/display:text-blue-400 transition-colors">
                 <Copy className="w-5 h-5" />
               </div>
             )}
             
             {/* 2FA Timer Bar */}
             {mode === GeneratorMode.TWO_FA && generated.text !== '等待输入密钥...' && (
               <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800 rounded-b-2xl overflow-hidden">
                 <div 
                   className={`h-full transition-all duration-1000 linear ${otpTimeLeft < 5 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-blue-500 shadow-[0_0_10px_blue]'}`}
                   style={{ width: `${otpProgress}%` }}
                 />
               </div>
             )}
           </div>

           {/* Strength Meter (Hidden for 2FA) */}
           {mode !== GeneratorMode.TWO_FA && (
             <StrengthMeter entropy={generated.entropy} />
           )}
           
           {/* 2FA Timer Text */}
           {mode === GeneratorMode.TWO_FA && generated.text !== '等待输入密钥...' && (
              <div className="flex justify-between items-center mt-4 px-2">
                 <span className="text-xs text-slate-500 font-mono">CODE UPDATES IN</span>
                 <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4" />
                    <span className={`font-mono font-bold ${otpTimeLeft < 5 ? 'text-red-400' : 'text-blue-400'}`}>{otpTimeLeft}s</span>
                 </div>
              </div>
           )}

           {error && (
             <p className="text-red-400 text-sm text-center mt-4 bg-red-900/20 p-2 rounded border border-red-500/30">
               {error}
             </p>
           )}
        </div>

        {/* Controls */}
        <div className="p-8 pt-2">
           <div className="bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
              
              {mode === GeneratorMode.CUSTOM && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-slate-300">长度</label>
                      <span className="text-sm font-mono text-blue-400 font-bold text-lg">{config.length}</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="64"
                      value={config.length}
                      onChange={(e) => setConfig({ ...config, length: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { key: 'useUppercase', label: '大写字母 (A-Z)' },
                       { key: 'useLowercase', label: '小写字母 (a-z)' },
                       { key: 'useNumbers', label: '数字 (0-9)' },
                       { key: 'useSymbols', label: '特殊符号 (!@#)' },
                     ].map((opt) => (
                       <label key={opt.key} className="flex items-center gap-3 cursor-pointer group select-none">
                         <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${
                            // @ts-ignore
                            config[opt.key] ? 'bg-blue-600 border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]' : 'border-slate-600 group-hover:border-slate-400 bg-slate-800'
                         }`}>
                           {/* @ts-ignore */}
                           {config[opt.key] && <Check className="w-3.5 h-3.5 text-white" />}
                         </div>
                         <input
                           type="checkbox"
                           className="hidden"
                           // @ts-ignore
                           checked={config[opt.key]}
                           // @ts-ignore
                           onChange={(e) => setConfig({ ...config, [opt.key]: e.target.checked })}
                         />
                         <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{opt.label}</span>
                       </label>
                     ))}
                  </div>
                </div>
              )}

              {mode === GeneratorMode.PIN && (
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">PIN 长度</label>
                    <span className="text-sm font-mono text-blue-400 font-bold text-lg">{config.pinLength} 位</span>
                  </div>
                   <input
                      type="range"
                      min="3"
                      max="12"
                      value={config.pinLength}
                      onChange={(e) => setConfig({ ...config, pinLength: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="mt-6 flex gap-3 justify-center">
                       {[4, 6, 8].map(len => (
                         <button 
                           key={len}
                           onClick={() => setConfig({...config, pinLength: len})}
                           className={`px-6 py-2 rounded-lg border text-sm font-medium transition-all ${config.pinLength === len ? 'bg-blue-500/20 border-blue-500 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                         >
                           {len} 位
                         </button>
                       ))}
                    </div>
                </div>
              )}

              {mode === GeneratorMode.UUID && (
                <div className="text-center py-4">
                  <p className="text-slate-300 font-medium mb-2">通用唯一识别码 (UUID v4)</p>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                    使用加密安全的伪随机数生成器生成。包含128位数据，重复概率极低。
                  </p>
                </div>
              )}

              {mode === GeneratorMode.MAC && (
                 <div className="space-y-6">
                   <div>
                     <label className="text-sm font-medium text-slate-300 block mb-3">格式分隔符</label>
                     <div className="flex gap-2">
                        {[
                          { val: ':', label: '冒号 (AA:BB)' },
                          { val: '-', label: '短横线 (AA-BB)' },
                          { val: '', label: '无 (AABB)' },
                        ].map((opt) => (
                           <button
                             key={opt.label}
                             onClick={() => setConfig({...config, macSeparator: opt.val})}
                             className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${config.macSeparator === opt.val ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 'border-slate-700 text-slate-400 hover:bg-white/5'}`}
                           >
                             {opt.label}
                           </button>
                        ))}
                     </div>
                   </div>
                   
                   <label className="flex items-center gap-3 cursor-pointer group select-none">
                     <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        config.useUppercase ? 'bg-blue-600 border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]' : 'border-slate-600 bg-slate-800'
                     }`}>
                       {config.useUppercase && <Check className="w-3.5 h-3.5 text-white" />}
                     </div>
                     <input
                       type="checkbox"
                       className="hidden"
                       checked={config.useUppercase}
                       onChange={(e) => setConfig({ ...config, useUppercase: e.target.checked })}
                     />
                     <span className="text-sm text-slate-300 group-hover:text-white transition-colors">使用大写字母 (A-F)</span>
                   </label>
                 </div>
              )}

              {mode === GeneratorMode.TWO_FA && (
                <div className="space-y-4">
                   <div>
                     <label className="text-sm font-medium text-slate-300 mb-2 block">双重验证密钥 (Secret Key)</label>
                     <input 
                       type="text" 
                       value={otpSecret}
                       onChange={(e) => setOtpSecret(e.target.value)}
                       placeholder="输入 Base32 密钥 (例如: JBSWY3DPEHPK3PXP)"
                       className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                     />
                     <p className="text-xs text-slate-500 mt-2">
                       请输入服务商提供的密钥。代码将每30秒自动更新。
                     </p>
                   </div>
                </div>
              )}

              {/* Main Action Button (Hidden or Modified for 2FA) */}
              {mode !== GeneratorMode.TWO_FA ? (
                <button
                  onClick={generate}
                  disabled={loading}
                  className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                  <RefreshCw className={`w-5 h-5 relative z-10 ${loading ? 'animate-spin' : 'group-hover/btn:rotate-180 transition-transform duration-500'}`} />
                  <span className="relative z-10">{loading ? '生成中...' : '生成新密钥'}</span>
                </button>
              ) : (
                <button
                   onClick={handleCopy}
                   className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-blue-200 font-bold py-4 rounded-xl border border-blue-500/30 flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                >
                  <Copy className="w-5 h-5" />
                  <span>复制验证码</span>
                </button>
              )}

           </div>
        </div>

      </main>
    </div>
  );
};

export default App;