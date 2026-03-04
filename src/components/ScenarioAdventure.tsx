import React, { useState, useEffect, useRef } from 'react';
import { MapPin, MessageCircle, ArrowRight, Loader2, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

interface Scenario {
  title: string;
  description: string;
  initialMessage: string;
  goal: string;
}

const SCENARIOS: Scenario[] = [
  {
    title: "The London Cafe",
    description: "You're in a cozy cafe in London. You need to order a breakfast and ask for the Wi-Fi password.",
    initialMessage: "Welcome to The Daily Grind! What can I get for you today?",
    goal: "Order food and get the Wi-Fi password."
  },
  {
    title: "Lost in New York",
    description: "You're lost in Manhattan. You need to find the nearest subway station and ask how much a ticket costs.",
    initialMessage: "Excuse me, you look a bit lost. Do you need help finding something?",
    goal: "Find the subway and ticket price."
  },
  {
    title: "Job Interview",
    description: "You're interviewing for a dream job at a tech company. You need to introduce yourself and ask about the team.",
    initialMessage: "Thanks for coming in today. To start, could you tell me a bit about yourself and why you're interested in this role?",
    goal: "Introduce yourself and ask about the team."
  }
];

export default function ScenarioAdventure({ onComplete }: { onComplete?: () => void }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startScenario = (s: Scenario) => {
    setScenario(s);
    setMessages([{ role: 'model', text: s.initialMessage }]);
    setIsCompleted(false);
    setFeedback('');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !scenario) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const savedProfile = localStorage.getItem('lingoai_profile');
      const lang = savedProfile ? JSON.parse(savedProfile).nativeLanguage : 'Hebrew';
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: `You are an NPC in a roleplay game for English learners. 
          Scenario: ${scenario.title}. Goal: ${scenario.goal}.
          - Stay in character.
          - If the user makes a mistake, respond naturally but maybe ask for clarification.
          - Keep responses relatively short.
          - After each response, check if the user has achieved the goal. 
          - If they achieved the goal, end the response with [GOAL_REACHED] and provide a short encouraging feedback in ${lang}.`,
        },
        history: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      });

      const result = await chat.sendMessage({ message: userMsg });
      let text = result.text || "";
      
      if (text.includes("[GOAL_REACHED]")) {
        setIsCompleted(true);
        if (onComplete) onComplete();
        const parts = text.split("[GOAL_REACHED]");
        text = parts[0];
        setFeedback(parts[1] || "כל הכבוד! הצלחת במשימה.");
      }

      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!scenario) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">הרפתקאות בעולם</h2>
          <p className="text-slate-500">בחרו משימה ותרגלו אנגלית בסיטואציות מהחיים האמיתיים!</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SCENARIOS.map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              onClick={() => startScenario(s)}
              className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 cursor-pointer hover:border-primary/50 transition-all text-right"
              dir="rtl"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 mr-0 ml-auto">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{s.title}</h3>
              <p className="text-slate-500 text-sm mb-4">{s.description}</p>
              <div className="flex items-center gap-2 text-primary font-bold text-sm justify-end">
                <span>התחילו משימה</span>
                <ArrowRight size={16} className="rotate-180" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col h-[650px]">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-row-reverse">
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <MessageCircle size={20} />
          </div>
          <div className="text-right">
            <h3 className="font-bold">{scenario.title}</h3>
            <p className="text-xs text-slate-400">מטרה: {scenario.goal}</p>
          </div>
        </div>
        <button 
          onClick={() => setScenario(null)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-2 text-slate-400">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-xs">הדמות מקלידה...</span>
            </div>
          </div>
        )}
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-secondary/10 border border-secondary/20 p-6 rounded-2xl text-center"
          >
            <div className="w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy size={24} />
            </div>
            <h4 className="text-secondary font-bold text-lg mb-1">המשימה הושלמה!</h4>
            <p className="text-slate-700 text-sm mb-4">{feedback}</p>
            <button
              onClick={() => setScenario(null)}
              className="px-6 py-2 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-all"
            >
              בחרו משימה נוספת
            </button>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      {!isCompleted && (
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="כתבו את התגובה שלכם באנגלית..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-primary outline-none transition-all text-right"
            dir="rtl"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
          >
            <Sparkles size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
