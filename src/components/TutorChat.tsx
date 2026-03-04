import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function TutorChat({ onComplete }: { onComplete?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nativeLanguage, setNativeLanguage] = useState('Hebrew');

  useEffect(() => {
    const savedProfile = localStorage.getItem('lingoai_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setNativeLanguage(parsed.nativeLanguage || 'Hebrew');
      setMessages([
        { role: 'model', text: `Hello! I'm your AI English tutor. How can I help you today? I can explain things in ${parsed.nativeLanguage || 'Hebrew'} if you need! 😊` }
      ]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    setMessageCount(prev => prev + 1);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: `You are a friendly and encouraging English tutor for ${nativeLanguage} speakers. 
          Your goal is to help them practice English. 
          - If they speak ${nativeLanguage}, respond in English but provide a translation in ${nativeLanguage} for difficult words.
          - Correct their grammar gently.
          - Keep responses short and engaging.
          - Use simple English unless they show advanced skills.
          - Always encourage them to try speaking more English.`,
        },
        history: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      });

      const result = await chat.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "Sorry, I couldn't process that." }]);
      
      if (messageCount >= 2 && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "אופס! משהו השתבש. בוא ננסה שוב.\n\nOops! Something went wrong. Let's try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
      <div className="p-4 bg-primary text-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="font-display font-bold">מורה פרטי AI</h2>
          <p className="text-xs opacity-80">מחובר ומוכן לעזור</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] p-4 rounded-2xl shadow-sm",
              msg.role === 'user' 
                ? "bg-primary text-white rounded-tr-none" 
                : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
            )}>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-2 text-slate-400">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-sm">המורה חושב...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="כתבו כאן את ההודעה שלכם..."
          className="flex-1 px-4 py-3 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-primary outline-none transition-all text-right"
          dir="rtl"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
