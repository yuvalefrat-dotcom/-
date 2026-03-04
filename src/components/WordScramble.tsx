import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shuffle, Sparkles, Send, RefreshCw, CheckCircle2, XCircle, Puzzle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export default function WordScramble({ onComplete }: { onComplete?: () => void }) {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished'>('idle');
  const [scrambledWord, setScrambledWord] = useState('');
  const [originalWord, setOriginalWord] = useState('');
  const [hint, setHint] = useState('');
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean, message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [nativeLanguage, setNativeLanguage] = useState('Hebrew');
  const [uiLabels, setUiLabels] = useState<any>({});

  useEffect(() => {
    const savedProfile = localStorage.getItem('lingoai_profile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setNativeLanguage(profile.nativeLanguage || 'Hebrew');
    }
  }, []);

  const startNewRound = async () => {
    setGameState('loading');
    setFeedback(null);
    setUserInput('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Give me one common English word (5-8 letters) and a short hint for it. 
        Also provide translated UI labels for the "Word Scramble" game in ${nativeLanguage}.
        Return as JSON: { 
          "word": "...", 
          "hint": "...",
          "translatedTitle": "Word Scramble in ${nativeLanguage}",
          "translatedDesc": "Unscramble the letters to find the hidden word! in ${nativeLanguage}",
          "uiLabels": {
            "score": "Score label in ${nativeLanguage}",
            "readyTitle": "Ready to unscramble? in ${nativeLanguage}",
            "readyDesc": "Test your vocabulary and spelling skills by putting the letters back in order. in ${nativeLanguage}",
            "playButton": "Play Now in ${nativeLanguage}",
            "loadingTitle": "Scrambling letters... in ${nativeLanguage}",
            "loadingDesc": "Thinking of a tricky word for you. in ${nativeLanguage}",
            "hintLabel": "Hint: in ${nativeLanguage}",
            "inputPlaceholder": "Type the unscrambled word in ${nativeLanguage}",
            "submitButton": "Unscramble in ${nativeLanguage}",
            "correctFeedback": "Amazing! You unscrambled it! 🧩 in ${nativeLanguage}",
            "incorrectFeedback": "Try again, you can do it! 💪 in ${nativeLanguage}"
          }
        }`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text || "{}");
      setOriginalWord(data.word.toUpperCase());
      setHint(data.hint);
      setUiLabels(data);
      
      // Scramble the word
      let scrambled = data.word.toUpperCase().split('').sort(() => Math.random() - 0.5).join('');
      while (scrambled === data.word.toUpperCase()) {
        scrambled = data.word.toUpperCase().split('').sort(() => Math.random() - 0.5).join('');
      }
      setScrambledWord(scrambled);
      
      setGameState('playing');
    } catch (error) {
      console.error(error);
      setGameState('idle');
    }
  };

  const checkAnswer = () => {
    if (userInput.toUpperCase().trim() === originalWord) {
      setFeedback({ correct: true, message: uiLabels.uiLabels?.correctFeedback || "Amazing! You unscrambled it! 🧩" });
      setScore(prev => prev + 5);
      if (onComplete) onComplete();
      setTimeout(() => startNewRound(), 2000);
    } else {
      setFeedback({ correct: false, message: uiLabels.uiLabels?.incorrectFeedback || "Try again, you can do it! 💪" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Puzzle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">{uiLabels.translatedTitle || "Word Scramble"}</h2>
              <p className="text-white/70 text-sm">{uiLabels.translatedDesc || "Unscramble the letters to find the hidden word!"}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-widest opacity-60">{uiLabels.uiLabels?.score || "Score"}</div>
            <div className="text-3xl font-display font-bold">{score}</div>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {gameState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shuffle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">{uiLabels.uiLabels?.readyTitle || "Ready to unscramble?"}</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  {uiLabels.uiLabels?.readyDesc || "Test your vocabulary and spelling skills by putting the letters back in order."}
                </p>
                <button
                  onClick={startNewRound}
                  className="px-12 py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-xl shadow-amber-200"
                >
                  {uiLabels.uiLabels?.playButton || "Play Now"}
                </button>
              </motion.div>
            )}

            {gameState === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-amber-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{uiLabels.uiLabels?.loadingTitle || "Scrambling letters..."}</h3>
                <p className="text-slate-500">{uiLabels.uiLabels?.loadingDesc || "Thinking of a tricky word for you."}</p>
              </motion.div>
            )}

            {gameState === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-12 py-6"
              >
                <div className="flex justify-center gap-3">
                  {scrambledWord.split('').map((letter, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="w-14 h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-800 shadow-sm"
                    >
                      {letter}
                    </motion.div>
                  ))}
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                      <Sparkles size={16} />
                      <span>{uiLabels.uiLabels?.hintLabel || "Hint:"} {hint}</span>
                    </div>
                    
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                      placeholder={uiLabels.uiLabels?.inputPlaceholder || "Type the unscrambled word"}
                      className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-amber-600 focus:outline-none transition-all text-xl font-bold text-center uppercase tracking-widest"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={checkAnswer}
                      className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={20} />
                      {uiLabels.uiLabels?.submitButton || "Unscramble"}
                    </button>
                    <button
                      onClick={startNewRound}
                      className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      <RefreshCw size={24} />
                    </button>
                  </div>

                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl flex items-center gap-3 font-medium ${
                        feedback.correct ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}
                    >
                      {feedback.correct ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                      {feedback.message}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
