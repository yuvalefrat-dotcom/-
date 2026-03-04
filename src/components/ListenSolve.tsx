import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Play, Sparkles, Send, RefreshCw, CheckCircle2, XCircle, Headphones } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

export default function ListenSolve({ onComplete }: { onComplete?: () => void }) {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished'>('idle');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [secretSentence, setSecretSentence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean, message: string, score: number } | null>(null);
  const [score, setScore] = useState(0);
  const [nativeLanguage, setNativeLanguage] = useState('Hebrew');
  const [uiLabels, setUiLabels] = useState<any>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    setAudioBase64(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // 1. Get a simple English sentence and UI labels
      const sentenceResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Give me one simple, clear English sentence (4-7 words) for a language learner. 
        Also provide translated UI labels for the "Listen & Solve" game in ${nativeLanguage}.
        Return as JSON: { 
          "sentence": "...",
          "translatedTitle": "Listen & Solve in ${nativeLanguage}",
          "translatedDesc": "Listen to the AI and type exactly what you hear! in ${nativeLanguage}",
          "uiLabels": {
            "score": "Score label in ${nativeLanguage}",
            "readyTitle": "Train your ears! in ${nativeLanguage}",
            "readyDesc": "Listen to a native-sounding AI voice and practice your dictation skills. in ${nativeLanguage}",
            "startButton": "Start Listening in ${nativeLanguage}",
            "loadingTitle": "Preparing Audio... in ${nativeLanguage}",
            "loadingDesc": "The AI is warming up its voice. in ${nativeLanguage}",
            "inputLabel": "Type what you heard in ${nativeLanguage}",
            "inputPlaceholder": "Enter the sentence here... in ${nativeLanguage}",
            "checkButton": "Check Answer in ${nativeLanguage}",
            "excellent": "Excellent! in ${nativeLanguage}",
            "notQuite": "Not quite... in ${nativeLanguage}",
            "correctFeedback": "Perfect! You heard it correctly! 🎧 in ${nativeLanguage}",
            "incorrectFeedback": "Not quite. The sentence was: in ${nativeLanguage}"
          }
        }`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(sentenceResponse.text || "{}");
      setSecretSentence(data.sentence);
      setUiLabels(data);

      // 2. Generate audio for that sentence
      const audioResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly: ${data.sentence}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        setAudioBase64(base64);
      }
      
      setGameState('playing');
    } catch (error) {
      console.error(error);
      setGameState('idle');
    }
  };

  const playAudio = () => {
    if (audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      audio.play();
    }
  };

  const checkAnswer = () => {
    const cleanInput = userInput.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    const cleanSecret = secretSentence.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

    if (cleanInput === cleanSecret) {
      setFeedback({ correct: true, message: uiLabels.uiLabels?.correctFeedback || "Perfect! You heard it correctly! 🎧", score: 15 });
      setScore(prev => prev + 15);
      if (onComplete) onComplete();
      setTimeout(() => startNewRound(), 2500);
    } else {
      setFeedback({ correct: false, message: `${uiLabels.uiLabels?.incorrectFeedback || "Not quite. The sentence was:"} "${secretSentence}"`, score: 0 });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Headphones size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">{uiLabels.translatedTitle || "Listen & Solve"}</h2>
              <p className="text-white/70 text-sm">{uiLabels.translatedDesc || "Listen to the AI and type exactly what you hear!"}</p>
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
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Volume2 size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">{uiLabels.uiLabels?.readyTitle || "Train your ears!"}</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  {uiLabels.uiLabels?.readyDesc || "Listen to a native-sounding AI voice and practice your dictation skills."}
                </p>
                <button
                  onClick={startNewRound}
                  className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                >
                  {uiLabels.uiLabels?.startButton || "Start Listening"}
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
                  <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{uiLabels.uiLabels?.loadingTitle || "Preparing Audio..."}</h3>
                <p className="text-slate-500">{uiLabels.uiLabels?.loadingDesc || "The AI is warming up its voice."}</p>
              </motion.div>
            )}

            {gameState === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12 py-6"
              >
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={playAudio}
                    className="w-32 h-32 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200 group relative"
                  >
                    <Play size={48} fill="currentColor" className="ml-2" />
                    <div className="absolute -inset-4 border-2 border-emerald-200 rounded-full animate-ping opacity-20"></div>
                  </motion.button>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-widest">{uiLabels.uiLabels?.inputLabel || "Type what you heard"}</p>
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder={uiLabels.uiLabels?.inputPlaceholder || "Enter the sentence here..."}
                      className="w-full p-6 rounded-3xl border-2 border-slate-100 focus:border-emerald-600 focus:outline-none transition-all text-lg font-medium text-center resize-none h-32"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={checkAnswer}
                      className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={20} />
                      {uiLabels.uiLabels?.checkButton || "Check Answer"}
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
                      className={`p-6 rounded-3xl flex items-center gap-4 font-medium ${
                        feedback.correct ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${feedback.correct ? 'bg-emerald-200' : 'bg-rose-200'}`}>
                        {feedback.correct ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                      </div>
                      <div>
                        <p className="font-bold">{feedback.correct ? (uiLabels.uiLabels?.excellent || "Excellent!") : (uiLabels.uiLabels?.notQuite || "Not quite...")}</p>
                        <p className="text-sm opacity-80">{feedback.message}</p>
                      </div>
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
