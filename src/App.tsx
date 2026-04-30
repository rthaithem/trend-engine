/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { analyzeTrend, getTrendingTopics, IntelligenceReport, TrendingTopic } from './services/intelligenceService';
import ReactMarkdown from 'react-markdown';
import { Terminal, Shield, Download, Search, Loader2, AlertTriangle, Globe, Clock, Database, Radio, Activity, Share2, Info, TrendingUp, Settings, X, Key, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import NetworkGraph from './components/NetworkGraph';
import TrendingFeed from './components/TrendingFeed';
import LiveFeed from './components/LiveFeed';
import CollaborativeRoom from './components/CollaborativeRoom';
import DisclaimerModal from './components/DisclaimerModal';

type MessageType = 'input' | 'system' | 'report' | 'error' | 'status';

interface LogEntry {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
}

interface Investigation extends IntelligenceReport {
  id: string;
  timestamp: Date;
}

const Widget = ({ title, children, span = 1, rowSpan = 1, className, badge, icon: Icon }: any) => {
  return (
    <div className={cn(
      "bg-[#111111] border border-[#27272a] rounded overflow-hidden flex flex-col shadow-lg relative",
      span === 2 ? 'md:col-span-2 lg:col-span-2 xl:col-span-2' : '',
      span === 3 ? 'md:col-span-2 lg:col-span-3 xl:col-span-3' : '',
      span === 4 ? 'col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-4' : '',
      rowSpan === 2 ? 'row-span-2' : '',
      rowSpan === 3 ? 'row-span-3' : '',
      className
    )}>
      <div className="px-3 py-2 border-b border-[#27272a] flex items-center justify-between bg-[#161618]">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-[#a1a1aa]" />}
          <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge && <span className="bg-accent-green/10 text-accent-green px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest border border-accent-green/20">LIVE</span>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar relative p-3">
        {children}
      </div>
    </div>
  );
};

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<Investigation[]>([]);
  const [currentInvestigation, setCurrentInvestigation] = useState<Investigation | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // User Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>(() => (localStorage.getItem('osint_lang') as 'ar' | 'en') || 'ar');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('osint_gemini') || '');
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('osint_openrouter') || '');

  // Collaboration State
  const [userName, setUserName] = useState(() => localStorage.getItem('osint_username') || `Agent_${Math.floor(Math.random() * 1000)}`);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const isAr = language === 'ar';

  useEffect(() => {
    localStorage.setItem('osint_lang', language);
    localStorage.setItem('osint_gemini', geminiKey);
    localStorage.setItem('osint_openrouter', openRouterKey);
    localStorage.setItem('osint_username', userName);
  }, [language, geminiKey, openRouterKey, userName]);

  useEffect(() => {
    // Check for room in URL
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setActiveRoomId(room);
    }
  }, []);

  const addLog = (type: MessageType, content: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      type,
      content,
      timestamp: new Date()
    }]);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    // Initial fetch of trends
    setLogs([]); // Clear logs when language changes might happen? 
    addLog('system', isAr ? 'تم تحميل TREND ENGINE // إصدار V 0.01' : 'TREND ENGINE Loaded // V 0.01');
    addLog('system', isAr ? 'طبقة التشفير: نشطة' : 'Encryption Layer: Active');
    addLog('system', isAr ? 'البحث عبر محرك Google: مفعل' : 'Google Search Engine: Enabled');

    const fetchTrends = async () => {
      setIsLoadingTrends(true);
      try {
        const trends = await getTrendingTopics(language, geminiKey, openRouterKey);
        setTrendingTopics(trends);
      } catch (err) {
        console.error("Failed to fetch trends", err);
      } finally {
        setIsLoadingTrends(false);
      }
    };
    fetchTrends();
  }, [language, geminiKey, openRouterKey]); // Refetch if language or keys change

  const performAnalysis = async (query: string) => {
    if (!query.trim() || isAnalyzing) return;

    addLog('input', isAr ? `بدء تتبع: ${query}` : `Starting trace: ${query}`);
    setIsAnalyzing(true);

    try {
      addLog('status', isAr ? `جاري جلب البيانات وتحليل الشبكة...` : `Fetching data and analyzing network...`);
      const report = await analyzeTrend(query, language, geminiKey, openRouterKey);
      
      const newInvestigation: Investigation = {
        ...report,
        id: Math.random().toString(36).substring(7).toUpperCase(),
        timestamp: new Date(),
      };

      setHistory(prev => [newInvestigation, ...prev]);
      setCurrentInvestigation(newInvestigation);
      addLog('report', isAr ? 'اكتمل التحليل. تم إنشاء تقرير الاستخبارات والتمثيل البياني.' : 'Analysis complete. Intelligence report and graph generated.');
    } catch (err: any) {
      addLog('error', isAr ? `فشل التتبع: ${err.message || 'خطأ غير معروف'}` : `Trace failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    setInputValue('');
    await performAnalysis(query);
  };

  const exportReport = () => {
    if (!currentInvestigation) return;
    
    const content = `
# TREND ENGINE INTELLIGENCE REPORT
Topic: ${currentInvestigation.topic}
Date: ${currentInvestigation.timestamp.toLocaleString()}

## Executive Summary
${currentInvestigation.summary}

## Actionable Insights (Anti-Corruption)
${currentInvestigation.actionableInsights || 'None'}

## Evidence Links
${currentInvestigation.evidenceLinks?.join('\n') || 'None'}

## Graph Relationships
${currentInvestigation.graphData.edges.map((e) => `- ${e.data.source} [${e.data.label}] -> ${e.data.target}`).join('\n')}
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrendEngine_${currentInvestigation.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hostRoom = async () => {
    if (!currentInvestigation) return;
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: currentInvestigation.topic,
          host_name: userName
        })
      });
      const data = await res.json();
      if (data.roomId) {
        
        // Save initial report to room
        const reportContent = `# TREND ENGINE INTELLIGENCE REPORT\nTopic: ${currentInvestigation.topic}\n\n## Executive Summary\n${currentInvestigation.summary}\n\n## Actionable Insights\n${currentInvestigation.actionableInsights || 'None'}\n\n## Evidence Links\n${currentInvestigation.evidenceLinks?.join('\n') || 'None'}`;
        
        await fetch(`/api/rooms/${data.roomId}/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report_content: reportContent })
        });
        
        setActiveRoomId(data.roomId);
        window.history.pushState({}, '', `?room=${data.roomId}`);
      }
    } catch (e) {
      console.error("Failed to host room", e);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-bg-deep text-[#d4d4d8] font-sans selection:bg-accent-green selection:text-black overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
      <DisclaimerModal isAr={isAr} />
      
      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0b] border border-border-dim shadow-2xl rounded-lg w-full max-w-md overflow-hidden relative"
              dir={isAr ? "rtl" : "ltr"}
            >
              <div className="p-4 border-b border-border-dim flex justify-between items-center bg-[#141415]">
                <h2 className="text-white font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                  <Settings className="w-4 h-4 text-accent-green" />
                  {isAr ? "لوحة التحكم و الإعدادات" : "Control Panel & Settings"}
                </h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-[#71717a] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-5 text-sm">
                
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-[#a1a1aa] uppercase tracking-wider text-[11px] flex gap-2 items-center">
                    <Globe className="w-3.5 h-3.5" />
                    {isAr ? "لغة الواجهة / Language" : "Language / لغة الواجهة"}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLanguage('ar')}
                      className={cn("flex-1 py-2 font-bold rounded border transition-all", isAr ? "border-accent-green text-accent-green bg-accent-green/10" : "border-border-dim text-[#71717a] hover:border-[#52525b]")}
                    >
                      العربية
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={cn("flex-1 py-2 font-bold rounded border transition-all", !isAr ? "border-accent-green text-accent-green bg-accent-green/10" : "border-border-dim text-[#71717a] hover:border-[#52525b]")}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-bold text-[#a1a1aa] uppercase tracking-wider text-[11px] flex gap-2 items-center">
                    <Users className="w-3.5 h-3.5" />
                    {isAr ? "اسم العميل (العمل المشترك) / Agent Name" : "Agent Name / اسم العميل"}
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Agent_XYZ"
                    className="w-full bg-[#141415] border border-border-dim rounded p-2 text-white placeholder:text-[#52525b] outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all"
                    dir="ltr"
                  />
                </div>

                <div className="h-[1px] bg-border-dim" />

                <div className="flex flex-col gap-2">
                  <label className="font-bold text-[#a1a1aa] uppercase tracking-wider text-[11px] flex gap-2 items-center">
                    <Key className="w-3.5 h-3.5" />
                    {isAr ? "مفتاح Gemini API (أساسي)" : "Gemini API Key (Primary)"}
                  </label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#141415] border border-border-dim rounded p-2 text-white placeholder:text-[#52525b] outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all"
                    dir="ltr"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-bold text-[#a1a1aa] uppercase tracking-wider text-[11px] flex gap-2 items-center">
                    <Key className="w-3.5 h-3.5 text-accent-blue" />
                    {isAr ? "مفتاح OpenRouter API (بديل)" : "OpenRouter API Key (Alternative)"}
                  </label>
                  <input
                    type="password"
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-[#141415] border border-border-dim rounded p-2 text-white placeholder:text-[#52525b] outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                    dir="ltr"
                  />
                  <div className="mt-1 p-3 bg-accent-blue/10 border border-accent-blue/20 rounded text-[10px] text-[#a1a1aa] leading-relaxed">
                    <Info className="w-3.5 h-3.5 text-accent-blue inline-block mb-0.5 mr-1 ml-1" />
                    {isAr 
                      ? "أوبن راوتر يتيح إمكانية البحث الميداني (Live Web Search) ضمنياً في حالة اختيار نماذج تدعم ذلك (مثل Perplexity). واجهة Gemini تدعم البحث عبر محرك Google بشكل مباشر وافتراضي وأسرع للأنظمة هنا."
                      : "OpenRouter supports web search implicitly via select models (like Perplexity online models). The Gemini interface supports Google Search directly and optimally for this system."}
                  </div>
                </div>

                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="mt-4 w-full bg-[#f4f4f5] text-black py-2.5 font-black uppercase tracking-widest rounded hover:bg-white active:scale-[0.98] transition-all"
                >
                  {isAr ? "حفظ وإغلاق" : "Save & Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header / Status Bar */}
      <header className="h-14 border-b border-border-dim bg-[#141415] flex items-center justify-between px-6 shrink-0 z-20 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="status-dot status-dot-green animate-pulse"></div>
          <h1 className="text-lg font-bold tracking-tight text-[#f4f4f5] flex items-center gap-3">
            <Shield className="w-5 h-5 text-accent-green" />
            {isAr ? "محرك TREND ENGINE" : "TREND ENGINE"} <span className="text-[10px] text-accent-blue font-mono mt-1 border border-accent-blue/30 px-1.5 rounded">V 0.01</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-8 text-[11px] text-[#71717a] font-bold uppercase">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-accent-green" />
              {isAr ? "البوابة:" : "Gateway:"} <span className="text-accent-green">{isAr ? "نشطة" : "ACTIVE"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-accent-blue" />
              {isAr ? "البحث الميداني:" : "Field Search:"} <span className="text-accent-blue">{isAr ? "مفعل" : "ENABLED"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              {new Date().toISOString().slice(0, 10)}
            </div>
          </div>
          <div className="h-6 w-[1px] bg-border-dim hidden lg:block" />
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="text-[#71717a] hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <LiveFeed isAr={isAr} />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 bg-black relative w-full h-full">
        {activeRoomId ? (
          <CollaborativeRoom 
            roomId={activeRoomId} 
            userName={userName} 
            isAr={isAr}
            geminiKey={geminiKey}
            openRouterKey={openRouterKey}
            closeRoom={() => {
              setActiveRoomId(null);
              window.history.pushState({}, '', '/');
            }} 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-[2000px] mx-auto h-full auto-rows-[minmax(180px,auto)] pb-20">
          
          {/* Global Trends - Moved to TOP on all views */}
          <Widget 
            title={isAr ? "توجهات عالمية" : "GLOBAL TRENDS"} 
            icon={Globe} 
            badge={true}
            span={1}
            rowSpan={2}
          >
             <TrendingFeed 
              topics={trendingTopics} 
              isLoading={isLoadingTrends} 
              onSelect={performAnalysis} 
              isAr={isAr}
            />
          </Widget>

          {/* Top Command Input */}
          <Widget 
            title={isAr ? "نظام الأوامر" : "COMMAND INTERFACE"} 
            span={2} 
            icon={Terminal} 
            className="min-h-[140px]"
          >
            <div className="h-full flex flex-col justify-center px-4">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 py-1">
                <div className="flex items-center gap-2 text-accent-green font-mono shrink-0 w-full sm:w-auto" dir="ltr">
                  <span className="text-xs">TREND_ENGINE@ROOT:~$</span>
                </div>
                <div className="relative w-full flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isAnalyzing}
                    placeholder={isAr ? "أدخل موضوعاً، وسماً، أو استفساراً..." : "Enter a topic, hashtag, or query..."}
                    className="w-full bg-[#161618] border border-[#27272a] rounded px-4 py-3 text-[#f4f4f5] placeholder:text-[#52525b] text-sm font-bold outline-none focus:border-accent-green transition-all"
                    autoFocus
                  />
                  {isAnalyzing && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-4">
                       <Loader2 className="w-4 h-4 text-accent-green animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={isAnalyzing || !inputValue.trim()}
                  className="w-full sm:w-auto text-xs bg-accent-green text-black px-6 py-3 font-black uppercase tracking-tighter hover:bg-[#2eaa10] active:scale-95 disabled:opacity-30 transition-all rounded flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {isAr ? "تحليل" : "ANALYZE"}
                </button>
              </form>
            </div>
          </Widget>

          {/* System Logs */}
          <Widget 
            title={isAr ? "سجل النظام / LIVE LOGS" : "LIVE LOGS"} 
            icon={Activity} 
            badge={true}
            span={1}
            rowSpan={2}
          >
            <div 
              ref={terminalRef}
              className={cn("h-full font-mono text-[10px] space-y-2.5", !isAr && "text-left")}
            >
              {logs.map((log) => (
                <div key={log.id} className={cn(
                  "flex gap-3 text-left",
                  log.type === 'error' ? "text-accent-red" : 
                  log.type === 'status' ? "text-accent-blue" : 
                  log.type === 'input' ? "text-accent-green" : "text-[#71717a]",
                  isAr ? "flex-row-reverse" : ""
                )} dir="ltr">
                  <span className="shrink-0 opacity-40 font-bold">[{log.timestamp.toLocaleTimeString([], { hour12: false })}]</span>
                  <span className="leading-relaxed flex-1 w-full text-right" style={{ textAlign: isAr ? 'right' : 'left' }}>{log.content}</span>
                </div>
              ))}
              {isAnalyzing && (
                <div className={cn("flex gap-2 text-accent-green animate-pulse font-bold mt-4", isAr ? "flex-row-reverse" : "")} dir="ltr">
                  <span>{">"}</span>
                  <span style={{ textAlign: isAr ? 'right' : 'left' }}>{isAr ? "جاري اختراق تدفقات البيانات..." : "Breaching data streams..."}</span>
                </div>
              )}
            </div>
          </Widget>

          {/* Historical Investigations */}
          <Widget 
            title={isAr ? "سجل التحقيقات" : "HISTORY"} 
            icon={Database} 
            span={1}
            rowSpan={2}
          >
            <div className="flex flex-col gap-2 h-full">
              <AnimatePresence>
                {history.length === 0 ? (
                  <div className="p-8 text-[11px] text-[#484f58] italic text-center border-dashed border-border-dim rounded flex-1 flex items-center justify-center">
                    {isAr ? "لا توجد جلسات نشطة" : "No active sessions"}
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentInvestigation(item)}
                      className={cn(
                        "w-full text-right p-3 transition-all hover:bg-[#18181b] group rounded border border-transparent flex flex-col gap-1 shadow-sm",
                        currentInvestigation?.id === item.id 
                          ? (isAr ? "bg-[#18181b] border-r-2 border-r-accent-green border-[#27272a]" : "bg-[#18181b] border-l-2 border-l-accent-green border-[#27272a]")
                          : "text-[#71717a]",
                        !isAr && "text-left"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] bg-accent-green/10 text-accent-green px-1.5 rounded font-mono">#{item.id.slice(0, 4)}</span>
                        <span className="text-[10px] font-mono opacity-50">{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={cn(
                        "text-xs truncate font-bold mt-1",
                        currentInvestigation?.id === item.id ? "text-white" : "group-hover:text-[#a1a1aa]"
                      )}>
                        {item.topic}
                      </div>
                    </button>
                  ))
                )}
              </AnimatePresence>
            </div>
          </Widget>

          {/* Investigation Specific Widgets */}
          {currentInvestigation ? (
            <>
              {/* Executive Summary */}
              <Widget 
                title={isAr ? "الملف التعريفي" : "EXECUTIVE SUMMARY"} 
                icon={Info}
                span={1}
                rowSpan={1}
              >
                <div className="h-full flex flex-col justify-between min-h-[140px]">
                  <div className={cn("prose-osint leading-relaxed text-xs flex-1 overflow-y-auto mb-2 custom-scrollbar", !isAr && 'text-left')} dir={isAr ? 'rtl' : 'ltr'}>
                     <ReactMarkdown>{currentInvestigation.summary}</ReactMarkdown>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 shrink-0">
                    <button 
                      onClick={exportReport}
                      className="flex-1 text-[10px] bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-accent-blue text-accent-blue py-2.5 font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isAr ? "تصدير التقرير (MD)" : "EXPORT REPORT"}
                    </button>
                    <button 
                      onClick={hostRoom}
                      className="flex-1 text-[10px] bg-accent-blue hover:bg-[#0096b4] text-black py-2.5 font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
                    >
                      <Users className="w-3.5 h-3.5" />
                      {isAr ? "استضف غرفة تحقيق" : "HOST ROOM"}
                    </button>
                  </div>
                </div>
              </Widget>

              {/* Network Graph */}
              <Widget 
                title={isAr ? "رسم بياني معرفي" : "KNOWLEDGE GRAPH"} 
                icon={Activity}
                span={2}
                rowSpan={2}
                className="min-h-[400px]"
              >
                 <NetworkGraph 
                  key={currentInvestigation.id}
                  nodes={currentInvestigation.graphData.nodes} 
                  edges={currentInvestigation.graphData.edges} 
                />
                
                {/* Graph Legend Overlay */}
                <div className={cn("absolute bottom-3 left-3 bg-black/60 border border-[#27272a] p-2 rounded flex flex-wrap gap-3", !isAr && "right-3 left-auto")} dir={isAr ? "rtl" : "ltr"}>
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-white uppercase tracking-wider">
                      <div className="w-2 h-2 rounded-full bg-[#00b4d8]" /> {isAr ? "القضية" : "Core Issue"}
                   </div>
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-white uppercase tracking-wider">
                      <div className="w-2 h-2 rounded-full bg-[#fbbf24]" /> {isAr ? "لاعب" : "Player"}
                   </div>
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-white uppercase tracking-wider">
                      <div className="w-2 h-2 rounded-full bg-[#39ff14]" /> {isAr ? "مستفيد" : "Beneficiary"}
                   </div>
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-white uppercase tracking-wider">
                      <div className="w-2 h-2 rounded-full bg-[#ef4444]" /> {isAr ? "متضرر" : "Victim"}
                   </div>
                </div>
              </Widget>

              {/* Actionable Insights */}
              <Widget 
                title={isAr ? "التوصيات والإجراءات" : "ACTIONABLE INSIGHTS"} 
                icon={AlertTriangle}
                span={1}
                rowSpan={2}
              >
                <div className={cn("flex flex-col gap-4", !isAr && 'text-left')} dir={isAr ? 'rtl' : 'ltr'}>
                  {currentInvestigation.actionableInsights ? (
                    <div className="prose-osint leading-relaxed text-xs text-accent-red">
                      <ReactMarkdown>{currentInvestigation.actionableInsights}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-xs text-[#71717a] italic">{isAr ? "لا توجد إجراءات." : "No actions recommended."}</div>
                  )}

                  {currentInvestigation.evidenceLinks && currentInvestigation.evidenceLinks.length > 0 && (
                    <div className="mt-4 border-t border-[#27272a] pt-4">
                      <h4 className="text-accent-blue font-bold tracking-widest text-[10px] uppercase mb-2">
                        {isAr ? "الأدلة والروابط" : "EVIDENCE LINKS"}
                      </h4>
                      <ul className="flex flex-col gap-2">
                        {currentInvestigation.evidenceLinks.map((link, idx) => (
                          <li key={idx} className="bg-[#161618] p-2 rounded border border-[#27272a] overflow-hidden text-ellipsis whitespace-nowrap">
                            {link.startsWith('http') ? (
                              <a href={link} target="_blank" rel="noreferrer" className="text-accent-blue hover:underline text-[10px] font-mono">
                                {link}
                              </a>
                            ) : (
                              <span className="text-[#a1a1aa] text-[10px] font-mono">{link}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Widget>
              
              {/* Optional filler widget to balance row if needed */}
            </>
          ) : (
             <div className="md:col-span-2 lg:col-span-3 xl:col-span-2 row-span-2 flex flex-col items-center justify-center text-center opacity-30 border border-dashed border-[#27272a] rounded p-8">
                <Shield className="w-16 h-16 text-[#71717a] mb-4" />
                <h3 className="text-lg font-bold uppercase tracking-widest">{isAr ? "بانتظار المدخلات الاستخباراتية" : "AWAITING INTEL INPUTS"}</h3>
                <p className="text-xs text-[#a1a1aa] mt-2 max-w-sm">
                  {isAr 
                    ? "أدخل موضوعاً للتحليل وسيقوم المحرك بتمشيط الشبكة لاستخراج الأدلة، الأسماء، ورسم الروابط المعرفية."
                    : "Enter a query. The engine will parse intelligence streams to map out actors and relationships."}
                </p>
             </div>
          )}
        </div>
        )}
      </div>

      <footer className="h-8 shrink-0 bg-[#0a0a0b] border-t border-[#27272a] flex items-center justify-center text-[10px] text-[#71717a] font-mono tracking-widest z-10">
        <div className="flex items-center gap-2">
          <span>Open Source License for all Earth | Developed by <a href="https://github.com" target="_blank" rel="noreferrer" className="text-accent-green hover:underline">rt.haithem</a></span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #39ff14;
        }
        .prose-osint h1, .prose-osint h2, .prose-osint h3 {
          color: #39ff14 !important;
          font-weight: 900 !important;
          font-size: 1.1rem !important;
        }
        .rtl { direction: rtl; }
        .ltr { direction: ltr; text-align: left; }
      `}</style>
    </div>
  );
}
