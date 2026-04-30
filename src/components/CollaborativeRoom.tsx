import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Shield, Send, Users, Activity, FileText, Database, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { invokeRoomAI } from '../services/intelligenceService';

interface Message {
  id: number;
  sender_name: string;
  content: string;
  created_at: string;
}

interface Evidence {
  id: number;
  provider_name: string;
  evidence_type: string;
  content: string;
  description: string;
  created_at: string;
}

interface RoomData {
  id: string;
  topic: string;
  host_name: string;
  report_content: string | null;
}

export default function CollaborativeRoom({ 
  roomId, 
  userName, 
  isAr,
  geminiKey,
  openRouterKey,
  closeRoom
}: { 
  roomId: string; 
  userName: string; 
  isAr: boolean;
  geminiKey: string;
  openRouterKey: string;
  closeRoom: () => void;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const evidenceEndRef = useRef<HTMLDivElement>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Evidence Form State
  const [evType, setEvType] = useState('Text/Log');
  const [evContent, setEvContent] = useState('');
  const [evDesc, setEvDesc] = useState('');

  useEffect(() => {
    // Fetch initial room data
    fetch(`/api/rooms/${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setRoom(data.room);
          setMessages(data.messages);
          if (data.evidence) setEvidenceList(data.evidence.reverse()); // latest at bottom or top, let's keep array order
        }
      });

    // Initialize socket
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_room', { roomId, name: userName });
    });

    newSocket.on('new_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });
    
    newSocket.on('new_evidence', (ev: Evidence) => {
      setEvidenceList(prev => [...prev, ev]);
    });

    newSocket.on('user_joined', ({ msg }) => {
      setMessages(prev => [...prev, { id: Math.random(), sender_name: 'SYSTEM', content: msg, created_at: new Date().toISOString() }]);
    });

    newSocket.on('user_left', ({ msg }) => {
      setMessages(prev => [...prev, { id: Math.random(), sender_name: 'SYSTEM', content: msg, created_at: new Date().toISOString() }]);
    });

    newSocket.on('report_updated', ({ report_content }) => {
      setRoom(prev => prev ? { ...prev, report_content } : null);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    evidenceEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [evidenceList]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const txt = inputMsg.trim();
    if (!txt || !socket) return;
    
    socket.emit('send_message', {
      roomId,
      sender_name: userName,
      content: txt
    });
    setInputMsg("");

    // @ai trigger
    if (txt.toLowerCase().startsWith('@ai ') || txt.toLowerCase().startsWith('ai ')) {
      setIsAiTyping(true);
      try {
        const langStr = isAr ? 'ar' : 'en';
        // Add the current message to history optimistically for context
        const currentMsgs = [...messages, { id: Date.now(), sender_name: userName, content: txt, created_at: new Date().toISOString() }];
        const aiResponse = await invokeRoomAI(currentMsgs, evidenceList, langStr, geminiKey, openRouterKey);
        socket.emit('send_message', {
          roomId,
          sender_name: 'AI Agent',
          content: aiResponse
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsAiTyping(false);
      }
    }
  };

  const addEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evContent.trim() || !socket) return;
    socket.emit('add_evidence', {
      roomId,
      provider_name: userName,
      evidence_type: evType,
      content: evContent,
      description: evDesc
    });
    setEvContent("");
    setEvDesc("");
  };

  const inviteLink = `${window.location.origin}?room=${roomId}`;

  if (!room) return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto lg:overflow-hidden bg-[#111111] border border-[#27272a] rounded shadow-lg relative" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#27272a] flex items-center justify-between bg-[#161618]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-accent-blue" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {isAr ? "غرفة تحقيق مشتركة" : "COLLABORATIVE INVESTIGATION"}
          </span>
          <span className="text-[10px] bg-accent-green/10 text-accent-green px-1.5 py-0.5 rounded ml-2">
            #{room.id}
          </span>
        </div>
        <button onClick={closeRoom} className="text-[#a1a1aa] hover:text-white text-xs underline">
          {isAr ? "إغلاق والتراجع" : "Close & Leave"}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[500px]">
        
        {/* Evidence Panel (Left) */}
        <div className="w-full lg:w-1/4 flex flex-col border-r border-[#27272a] border-b lg:border-b-0 bg-[#0a0a0b] min-h-[300px]">
          <div className="p-3 border-b border-[#27272a] flex items-center gap-2 bg-[#161618]">
            <Database className="w-4 h-4 text-[#eab308]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">{isAr ? "الأدلة (Evidence)" : "EVIDENCE DB"}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {evidenceList.length === 0 && (
              <div className="text-[#52525b] text-[10px] italic text-center p-4">
                {isAr ? "لا توجد أدلة. أضف روابط، صور، أو نصوص." : "No evidence added yet."}
              </div>
            )}
            {evidenceList.map(ev => (
              <div key={ev.id} className="bg-[#161618] border border-[#27272a] rounded p-2 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-[#eab308] uppercase">{ev.evidence_type}</span>
                  <span className="text-[9px] text-[#71717a]">{ev.provider_name}</span>
                </div>
                <div className="text-[#d4d4d8] text-[10px] mb-1 font-mono break-words">{ev.content}</div>
                {ev.description && <div className="text-[#a1a1aa] text-[10px] italic">{ev.description}</div>}
              </div>
            ))}
            <div ref={evidenceEndRef} />
          </div>

          <div className="p-3 bg-[#111111] border-t border-[#27272a]">
            <form onSubmit={addEvidence} className="flex flex-col gap-2">
              <select value={evType} onChange={e => setEvType(e.target.value)} className="bg-black border border-[#27272a] rounded px-2 py-1 text-[10px] text-white outline-none">
                <option value="Text/Log">Text/Log</option>
                <option value="Crypto Hash">Crypto Hash</option>
                <option value="Image URL">Image URL</option>
                <option value="Video URL">Video URL</option>
                <option value="Document URL">Document URL</option>
              </select>
              <input type="text" value={evContent} onChange={e => setEvContent(e.target.value)} placeholder={isAr ? "المحتوى (رابط أو نص)..." : "Content (URL or text)..."} className="bg-black border border-[#27272a] rounded px-2 py-1 text-[10px] text-white placeholder:text-[#52525b] outline-none" required />
              <input type="text" value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder={isAr ? "وصف (اختياري)..." : "Description (optional)..."} className="bg-black border border-[#27272a] rounded px-2 py-1 text-[10px] text-white placeholder:text-[#52525b] outline-none" />
              <button type="submit" className="bg-[#eab308] text-black px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-[#ca8a04]">
                {isAr ? "حفظ كدليل" : "Save Evidence"}
              </button>
            </form>
          </div>
        </div>

        {/* Chat / Feed Section (Center) */}
        <div className="flex-1 flex flex-col border-r border-[#27272a] border-b lg:border-b-0 min-h-[400px]">
          <div className="p-3 bg-[#111111] border-b border-[#27272a] text-xs flex flex-wrap gap-2 justify-between items-center">
             <div>
               <span className="text-[#a1a1aa]">{isAr ? "الموضوع:" : "Topic:"}</span>{" "}
               <span className="font-bold text-accent-green">{room.topic}</span>
             </div>
             <div>
               <span className="text-[#a1a1aa]">{isAr ? "رابط الدعوة:" : "Invite Link:"}</span>{" "}
               <input 
                 type="text" 
                 readOnly 
                 value={inviteLink} 
                 onClick={e => (e.target as HTMLInputElement).select()}
                 className="bg-black border border-[#27272a] rounded px-2 py-1 text-[10px] w-[180px] text-accent-blue cursor-pointer"
                 dir="ltr"
               />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.map(msg => (
              <div key={msg.id} className={cn("flex flex-col text-xs", msg.sender_name === 'SYSTEM' ? "items-center text-accent-blue italic opacity-80" : msg.sender_name === userName ? (isAr ? "items-start" : "items-end") : (isAr ? "items-end" : "items-start"))}>
                {msg.sender_name !== 'SYSTEM' && (
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-0.5", msg.sender_name === 'AI Agent' ? 'text-accent-blue flex items-center gap-1' : 'text-[#71717a]')}>
                    {msg.sender_name === 'AI Agent' && <Bot className="w-3 h-3" />}
                    {msg.sender_name}
                  </span>
                )}
                <div className={cn(
                  "px-3 py-2 rounded-lg max-w-[85%]", 
                  msg.sender_name === 'SYSTEM' ? "bg-transparent text-[10px]" : 
                  msg.sender_name === userName ? "bg-[#27272a]/50 text-white border border-[#3f3f46]" : 
                  msg.sender_name === 'AI Agent' ? "bg-accent-blue/10 text-white border border-accent-blue/30 prose-osint text-[11px]" :
                  "bg-[#18181b] text-[#d4d4d8] border border-[#27272a]"
                )}>
                  {msg.sender_name === 'AI Agent' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className={cn("flex flex-col text-xs items-start")}>
                <span className="text-[10px] text-accent-blue font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> AI Agent
                </span>
                <div className="px-3 py-2 rounded-lg bg-accent-blue/5 border border-accent-blue/20 text-[#a1a1aa]">
                   <span className="animate-pulse">Typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-[#161618] border-t border-[#27272a]">
            <form onSubmit={sendMessage} className="flex gap-2 relative">
              <input 
                type="text"
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                placeholder={isAr ? "أرسل للأعضاء أو @ai لسؤال الذكاء الاصطناعي..." : "Type msg or @ai to ask agent..."}
                className="flex-1 bg-black border border-[#27272a] rounded px-3 py-2 text-xs text-white placeholder:text-[#52525b] outline-none focus:border-accent-green"
              />
              <button type="submit" disabled={!inputMsg.trim()} className="bg-accent-green text-black px-4 py-2 rounded font-bold disabled:opacity-50 hover:bg-[#2eaa10] transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Report / Shared Canvas Section (Right) */}
        <div className="w-full lg:w-1/3 flex flex-col bg-[#0a0a0b] min-h-[300px]">
          <div className="p-3 border-b border-[#27272a] flex items-center justify-between">
             <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent-green" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">{isAr ? "التقرير المشترك" : "SHARED REPORT"}</span>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             {room.report_content ? (
                <div className="prose-osint text-xs leading-relaxed text-white">
                  <ReactMarkdown>{room.report_content}</ReactMarkdown>
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#52525b] text-xs italic text-center p-4 py-12">
                   <Activity className="w-8 h-8 mb-2 opacity-50" />
                   {isAr ? "لم يتم اعتماد تقرير حتى الآن." : "No report finalized yet."}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
