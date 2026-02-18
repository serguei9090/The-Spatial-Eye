
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob, Type, FunctionDeclaration } from '@google/genai';
import { encode, decode, decodeAudioData } from './services/audioUtils';

// --- Icons ---
const StudioIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M5.07 5.07l13.86 13.86M5.07 18.93L18.93 5.07"/></svg>
);
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const ProductionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
);
const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);

// --- Types ---
type ProjectCategory = 'LIVE_AGENT' | 'CREATIVE_STORYTELLER' | 'UI_NAVIGATOR';
type AssetType = 'image' | 'video' | 'copy' | 'search';

interface CreativeAsset {
  id: string;
  type: AssetType;
  content: string;
  title: string;
  status: 'generating' | 'ready' | 'error';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

// --- Tool Declarations ---
const highlightTool: FunctionDeclaration = {
  name: 'track_and_highlight',
  parameters: {
    type: Type.OBJECT,
    description: 'REQUIRED for UI Navigation: Pinpoint and circle an object. If the object (e.g. donut) moves, re-calculate coordinates (0-1000) based on the latest video frame. Do not use memory of old coordinates.',
    properties: {
      x: { type: Type.NUMBER, description: 'Center X coord (0-1000)' },
      y: { type: Type.NUMBER, description: 'Center Y coord (0-1000)' },
      radius: { type: Type.NUMBER, description: 'Circle radius' },
      label: { type: Type.STRING, description: 'Label of the object' }
    },
    required: ['x', 'y', 'radius', 'label']
  }
};

const productionTool: FunctionDeclaration = {
  name: 'create_multimodal_asset',
  parameters: {
    type: Type.OBJECT,
    description: 'REQUIRED for Creative Storytelling: Generate high-fidelity assets. Use this to weave visuals and copy into your narration stream.',
    properties: {
      assetType: { type: Type.STRING, enum: ['image', 'video', 'copy'], description: 'Media format.' },
      prompt: { type: Type.STRING, description: 'Visual or textual prompt.' },
      title: { type: Type.STRING, description: 'Display title.' }
    },
    required: ['assetType', 'prompt', 'title']
  }
};

const searchTool: FunctionDeclaration = {
  name: 'execute_web_research',
  parameters: {
    type: Type.OBJECT,
    description: 'Research live market data or details about identified subjects.',
    properties: { query: { type: Type.STRING } },
    required: ['query']
  }
};

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [category, setCategory] = useState<ProjectCategory>('CREATIVE_STORYTELLER');
  const [highlights, setHighlights] = useState<any[]>([]);
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [transcription, setTranscription] = useState('');
  const [showChat, setShowChat] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContexts = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const liveSession = useRef<any>(null);
  const activeSources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTime = useRef<number>(0);
  const frameIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const check = async () => setHasKey(window.aistudio?.hasSelectedApiKey ? await window.aistudio.hasSelectedApiKey() : !!process.env.API_KEY);
    check();
  }, []);

  const stopLiveSession = useCallback(() => {
    if (liveSession.current) {
      liveSession.current.close();
      liveSession.current = null;
    }
    if (audioContexts.current) {
      if (audioContexts.current.input.state !== 'closed') audioContexts.current.input.close();
      if (audioContexts.current.output.state !== 'closed') audioContexts.current.output.close();
      audioContexts.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    activeSources.current.forEach(s => { try { s.stop(); } catch(e) {} });
    activeSources.current.clear();
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
    setLiveStatus('idle');
    setHighlights([]);
  }, []);

  const handleAssetProduction = async (type: string, prompt: string, title: string, callId: string, sessionPromise: Promise<any>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAssets(prev => [{ id, type: type as any, title, content: '', status: 'generating' }, ...prev]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let content = '';
      if (type === 'image') {
        const resp = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: `High-end professional creative illustration for ${title}: ${prompt}` }] },
          config: { imageConfig: { aspectRatio: '16:9' } }
        });
        const part = resp.candidates?.[0].content.parts.find(p => p.inlineData);
        content = part ? `data:image/png;base64,${part.inlineData.data}` : '';
      } else if (type === 'video') {
        let op = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: `Cinematic commercial storytelling style: ${prompt}`,
          config: { resolution: '720p', aspectRatio: '16:9' }
        });
        while (!op.done) {
          await new Promise(r => setTimeout(r, 8000));
          op = await ai.operations.getVideosOperation({ operation: op });
        }
        content = `${op.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`;
      } else {
        const resp = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: `Create immersive brand copy for: ${prompt}`,
        });
        content = resp.text || '';
      }
      setAssets(prev => prev.map(a => a.id === id ? { ...a, content, status: 'ready' } : a));
      (await sessionPromise).sendToolResponse({ functionResponses: { id: callId, name: 'create_multimodal_asset', response: { result: 'Asset Produced' } } });
    } catch (e) {
      console.error(e);
      setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'error' } : a));
      (await sessionPromise).sendToolResponse({ functionResponses: { id: callId, name: 'create_multimodal_asset', response: { error: 'Failed' } } });
    }
  };

  const startLiveSession = useCallback(async () => {
    setIsLive(true);
    setLiveStatus('connecting');
    setAssets([]);
    setChatHistory([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 640, height: 480 } });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }

      const inCtx = new AudioContext({ sampleRate: 16000 });
      const outCtx = new AudioContext({ sampleRate: 24000 });
      audioContexts.current = { input: inCtx, output: outCtx };

      const sysInstructions = {
        'LIVE_AGENT': 'Focus: Real-time Voice Interaction. Handle interruptions gracefully. If the user speaks, stop narration immediately. Be helpful, concise, and professional.',
        'CREATIVE_STORYTELLER': 'Focus: Multimodal Storytelling. Weave together text, high-res images, and video in a fluid stream. Narrate your creative choices over audio while triggering "create_multimodal_asset" calls for visual parts. Create cohesive campaigns or storybooks.',
        'UI_NAVIGATOR': 'Focus: Visual UI Understanding. Monitor the camera feed (2FPS). If asked to find an object like a donut, use "track_and_highlight". CRITICAL: Re-calculate coordinates from the CURRENT video frame every time. Do not reuse old positions if the subject has moved.'
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setLiveStatus('connected');
            const source = inCtx.createMediaStreamSource(stream);
            const processor = inCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const input = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(input.length);
              for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(processor); processor.connect(inCtx.destination);

            frameIntervalRef.current = window.setInterval(() => {
              if (videoRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                  canvasRef.current.width = 640; canvasRef.current.height = 480;
                  ctx.drawImage(videoRef.current, 0, 0, 640, 480);
                  canvasRef.current.toBlob(async (b) => {
                    if (b) {
                      const base64 = await new Promise<string>(r => {
                        const reader = new FileReader();
                        reader.onloadend = () => r((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(b);
                      });
                      sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } }));
                    }
                  }, 'image/jpeg', 0.5);
                }
              }
            }, 500);
          },
          onmessage: async (msg) => {
            if (msg.serverContent?.interrupted) {
              activeSources.current.forEach(s => { try { s.stop(); } catch(e) {} });
              activeSources.current.clear();
              nextStartTime.current = 0;
              return;
            }

            const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              nextStartTime.current = Math.max(nextStartTime.current, outCtx.currentTime);
              const buf = await decodeAudioData(decode(audio), outCtx, 24000, 1);
              const src = outCtx.createBufferSource();
              src.buffer = buf; src.connect(outCtx.destination);
              src.addEventListener('ended', () => activeSources.current.delete(src));
              src.start(nextStartTime.current);
              nextStartTime.current += buf.duration;
              activeSources.current.add(src);
            }

            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'track_and_highlight') {
                  const h = { ...fc.args, id: Date.now() } as any;
                  setHighlights(p => [...p.filter(x => x.label.toLowerCase() !== h.label.toLowerCase()), h]);
                  setTimeout(() => setHighlights(p => p.filter(x => x.id !== h.id)), 6000);
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { status: `Tracking updated for ${h.label}` } } }));
                } else if (fc.name === 'create_multimodal_asset') {
                  const args = fc.args as any;
                  handleAssetProduction(args.assetType, args.prompt, args.title, fc.id, sessionPromise);
                } else if (fc.name === 'execute_web_research') {
                  const args = fc.args as any;
                  const resId = Math.random().toString(36).substr(2, 9);
                  setAssets(p => [{ id: resId, type: 'search', title: `Market Study: ${args.query}`, content: 'Searching...', status: 'generating' }, ...p]);
                  const aiS = new GoogleGenAI({ apiKey: process.env.API_KEY });
                  const searchRes = await aiS.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: `Research: ${args.query}`,
                    config: { tools: [{ googleSearch: {} }] }
                  });
                  const info = searchRes.text || 'Grounded research data synchronized.';
                  setAssets(p => p.map(a => a.id === resId ? { ...a, content: info, status: 'ready' } : a));
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: 'execute_web_research', response: { result: "Research Grounded." } } }));
                }
              }
            }

            if (msg.serverContent?.outputTranscription) {
              setTranscription(p => p + msg.serverContent!.outputTranscription!.text);
            }
            if (msg.serverContent?.turnComplete) {
              setChatHistory(prev => [...prev, { role: 'assistant', text: transcription, timestamp: Date.now() }]);
              setTranscription('');
            }
          },
          onerror: () => stopLiveSession(),
          onclose: () => stopLiveSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: `You are OmniSight Studio Director.
Operational Mode: ${category}.
Instructions: ${sysInstructions[category]}

General Studio Guidelines:
- Branding: OmniSight Studio.
- Personality: High-speed, professional, multimodal genius.
- Navigation: Use "track_and_highlight" for visual elements. Always re-calculate from the latest frame.
- Storytelling: Weave narration with visual tool calls seamlessly.
- Log: Direct users to "Director's Log" for full chat history.`,
          tools: [{ functionDeclarations: [highlightTool, productionTool, searchTool] }],
        }
      });
      liveSession.current = await sessionPromise;
    } catch (err) { stopLiveSession(); }
  }, [stopLiveSession, transcription, category]);

  if (!hasKey) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8">
      <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-6 shadow-2xl shadow-blue-500/20">
        <StudioIcon />
      </div>
      <h1 className="text-5xl font-black mb-4 tracking-tighter">OmniSight Studio</h1>
      <p className="text-slate-500 max-w-sm text-center mb-12">The unified Creative Director, Companion, and UI Navigator engine.</p>
      <button onClick={() => window.aistudio?.openSelectKey?.().then(() => setHasKey(true))} className="bg-blue-600 px-12 py-5 rounded-full font-black text-lg hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-600/30">
        Enter Studio
      </button>
    </div>
  );

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden font-sans">
      <header className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-black/80 backdrop-blur-3xl z-50">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20"><StudioIcon /></div>
          <div>
            <h2 className="font-black text-xl tracking-tight uppercase leading-none mb-1">OmniSight <span className="text-blue-500">Studio</span></h2>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></span>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.4em] font-black">Production Mode: {category.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value as ProjectCategory)}
            disabled={isLive}
            className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            <option value="LIVE_AGENT">Live Agent</option>
            <option value="CREATIVE_STORYTELLER">Storyteller</option>
            <option value="UI_NAVIGATOR">UI Navigator</option>
          </select>
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full border transition-all ${showChat ? 'bg-blue-600 border-blue-600' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <ChatIcon />
          </button>
          <button 
            onClick={isLive ? stopLiveSession : startLiveSession}
            className={`px-10 py-3 rounded-full font-black text-xs tracking-widest transition-all uppercase shadow-2xl ${isLive ? 'bg-white text-black hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'}`}
          >
            {isLive ? 'End Production' : 'Initiate Session'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Set View */}
        <div className={`transition-all duration-500 flex flex-col gap-6 p-6 ${showChat ? 'w-1/3' : 'w-1/2'}`}>
          <div className="flex-1 relative bg-slate-900 rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl group ring-1 ring-white/5">
            <video ref={videoRef} className="w-full h-full object-cover grayscale-[0.2]" autoPlay muted playsInline />
            <div className="absolute inset-0 pointer-events-none z-20">
              {highlights.map(h => (
                <div 
                  key={h.id}
                  className="absolute border-[6px] border-blue-500/80 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    left: `${(h.x / 1000) * 100}%`,
                    top: `${(h.y / 1000) * 100}%`,
                    width: `${(h.radius / 500) * 100}%`,
                    height: `${(h.radius / 500) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="absolute -top-12 px-5 py-2 bg-blue-600 text-xs font-black rounded-xl uppercase tracking-widest shadow-2xl animate-bounce">
                    {h.label}
                  </div>
                </div>
              ))}
            </div>
            {!isLive && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center">
                <ProductionIcon />
                <p className="mt-4 text-slate-500 font-black uppercase tracking-widest text-xs">Set Calibration Required</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {/* Narration Bar */}
          <div className="h-28 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center px-12 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-blue-600/10"></div>
             {transcription ? (
               <p className="text-xl font-medium text-slate-100 italic">"{transcription}"</p>
             ) : (
               <div className="flex gap-2">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="w-1.5 h-1.5 bg-slate-700 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                 ))}
               </div>
             )}
             <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-600 uppercase tracking-widest">Live Narration Stream</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className={`p-8 border-l border-white/5 bg-slate-950/40 overflow-y-auto custom-scrollbar transition-all duration-500 ${showChat ? 'w-2/3 flex' : 'w-1/2 block'}`}>
          {showChat && (
            <div className="w-1/2 pr-8 border-r border-white/5 flex flex-col">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-8 flex items-center gap-2">
                <ChatIcon /> Director's Log
              </h3>
              <div className="flex-1 space-y-8 overflow-y-auto pr-4 custom-scrollbar">
                {chatHistory.map((chat, i) => (
                  <div key={i} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">{chat.role}</span>
                    <div className={`p-5 rounded-[2rem] max-w-[90%] text-sm leading-relaxed ${chat.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10 text-slate-300'}`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`${showChat ? 'w-1/2 pl-8' : 'w-full'}`}>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <ProductionIcon />
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">Creative Board</h3>
              </div>
              <span className="text-[10px] bg-blue-600/20 px-4 py-1.5 rounded-full text-blue-400 font-bold tracking-wider">{assets.length} Elements</span>
            </div>

            <div className="grid grid-cols-1 gap-10 pb-32">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden group hover:border-blue-500/40 transition-all hover:shadow-2xl hover:shadow-blue-500/5">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                    <div className="flex items-center gap-5">
                      <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 text-blue-500">
                        {asset.type === 'video' ? <ProductionIcon /> : asset.type === 'image' ? <ZapIcon /> : <ChatIcon />}
                      </div>
                      <div>
                        <h4 className="font-bold text-base tracking-tight">{asset.title}</h4>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">{asset.type}</p>
                      </div>
                    </div>
                    <div className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest ${asset.status === 'ready' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 animate-pulse'}`}>
                      {asset.status}
                    </div>
                  </div>

                  <div className="p-2">
                    {asset.status === 'generating' ? (
                      <div className="aspect-video bg-slate-900/50 flex flex-col items-center justify-center gap-6 rounded-[2.5rem]">
                        <div className="relative w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 w-1/2 bg-blue-600 animate-[loading_1.5s_infinite_ease-in-out]"></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">Synthesizing...</span>
                      </div>
                    ) : asset.type === 'video' ? (
                      <video src={asset.content} controls className="w-full aspect-video object-cover rounded-[2.5rem] shadow-2xl" />
                    ) : asset.type === 'image' ? (
                      <img src={asset.content} className="w-full aspect-video object-cover rounded-[2.5rem] shadow-2xl" alt={asset.title} />
                    ) : asset.type === 'search' ? (
                      <div className="p-10 bg-slate-900/60 rounded-[2.5rem] m-2 border border-white/5">
                        <p className="text-blue-400 font-mono text-sm leading-relaxed">{asset.content}</p>
                      </div>
                    ) : (
                      <div className="p-12 prose prose-invert max-w-none bg-slate-900/40 rounded-[2.5rem] m-2 border border-white/5">
                        <p className="text-slate-300 leading-relaxed font-serif text-xl italic">{asset.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="px-10 py-4 bg-black border-t border-white/5 flex justify-between items-center text-[10px] text-slate-700 uppercase tracking-[0.4em] font-black">
        <div className="flex gap-10">
          <span>Veo AI Video Engine</span>
          <span>Gemini 3 Pro Vision</span>
          <span>Live Synchronized Stream</span>
        </div>
        <div className="text-blue-600">OmniSight Production Active // {category}</div>
      </footer>

      <style>{`
        @keyframes loading { 0% { left: -100%; } 100% { left: 100%; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
};

export default App;
