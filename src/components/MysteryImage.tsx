import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Sparkles, Send, HelpCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export default function MysteryImage({ onComplete }: { onComplete?: () => void }) {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished'>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [secretWord, setSecretWord] = useState('');
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
      
      // 1. Get a secret word and hint
      const wordResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Give me one common English noun (object, animal, or place) and a short hint for it. 
        Also provide translated UI labels for the "Mystery Image" game in ${nativeLanguage}.
        Return as JSON: { 
          "word": "...", 
          "hint": "...",
          "translatedTitle": "Mystery Image in ${nativeLanguage}",
          "translatedDesc": "Guess the word from the AI-generated image! in ${nativeLanguage}",
          "uiLabels": {
            "score": "Score label in ${nativeLanguage}",
            "readyTitle": "Ready for a visual challenge? in ${nativeLanguage}",
            "readyDesc": "The AI will generate a unique image based on a secret word. Can you guess what it is? in ${nativeLanguage}",
            "startButton": "Start Game in ${nativeLanguage}",
            "loadingTitle": "Generating Mystery Image... in ${nativeLanguage}",
            "loadingDesc": "The AI is painting something special for you. in ${nativeLanguage}",
            "inputPlaceholder": "What do you see? in ${nativeLanguage}",
            "submitButton": "Submit in ${nativeLanguage}",
            "correctFeedback": "Excellent! You got it right! 🎉 in ${nativeLanguage}",
            "incorrectFeedback": "Not quite, try again! 🤔 in ${nativeLanguage}"
          }
        }`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(wordResponse.text || "{}");
      setSecretWord(data.word);
      setHint(data.hint);
      setUiLabels(data);

      // 2. Generate image for that word
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A vibrant, high-quality 3D render of a ${data.word} on a clean background, artistic style.` }],
        },
      });

      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
      
      setGameState('playing');
    } catch (error) {
      console.error(error);
      setGameState('idle');
    }
  };

  const checkAnswer = () => {
    if (userInput.toLowerCase().trim() === secretWord.toLowerCase().trim()) {
      setFeedback({ correct: true, message: uiLabels.uiLabels?.correctFeedback || "Excellent! You got it right! 🎉" });
      setScore(prev => prev + 10);
      if (onComplete) onComplete();
      setTimeout(() => startNewRound(), 2000);
    } else {
      setFeedback({ correct: false, message: uiLabels.uiLabels?.incorrectFeedback || "Not quite, try again! 🤔" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <ImageIcon size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">{uiLabels.translatedTitle || "Mystery Image"}</h2>
              <p className="text-white/70 text-sm">{uiLabels.translatedDesc || "Guess the word from the AI-generated image!"}</p>
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
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">{uiLabels.uiLabels?.readyTitle || "Ready for a visual challenge?"}</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  {uiLabels.uiLabels?.readyDesc || "The AI will generate a unique image based on a secret word. Can you guess what it is?"}
                </p>
                <button
                  onClick={startNewRound}
                  className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                >
                  {uiLabels.uiLabels?.startButton || "Start Game"}
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
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{uiLabels.uiLabels?.loadingTitle || "Generating Mystery Image..."}</h3>
                <p className="text-slate-500">{uiLabels.uiLabels?.loadingDesc || "The AI is painting something special for you."}</p>
              </motion.div>
            )}

            {gameState === 'playing' && imageUrl && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-inner bg-slate-100 group">
                  <img 
                    src={imageUrl} 
                    alt="Mystery" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-medium px-6 text-center italic">"{hint}"</p>
                  </div>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                      placeholder={uiLabels.uiLabels?.inputPlaceholder || "What do you see?"}
                      className="w-full p-5 pl-14 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:outline-none transition-all text-lg font-medium text-center"
                    />
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                      <HelpCircle size={24} />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={checkAnswer}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={20} />
                      {uiLabels.uiLabels?.submitButton || "Submit"}
                    </button>
                    <button
                      onClick={startNewRound}
                      className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                      title="New Image"
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
