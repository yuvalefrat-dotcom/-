import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, Play, Sparkles, RefreshCw, CheckCircle2, XCircle, MessageSquareQuote } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export default function SpeakingPractice({ onComplete }: { onComplete?: () => void }) {
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished'>('idle');
  const [targetSentence, setTargetSentence] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<{ score: number, message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [nativeLanguage, setNativeLanguage] = useState('Hebrew');
  const [uiLabels, setUiLabels] = useState<any>({});
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('lingoai_profile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setNativeLanguage(profile.nativeLanguage || 'Hebrew');
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        stopListening();
        evaluateSpeech(result);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startNewRound = async () => {
    setGameState('loading');
    setFeedback(null);
    setTranscript('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Give me one short, useful English sentence (5-8 words) for a student to practice speaking. 
        Also provide translated UI labels for the "Speaking Practice" game in ${nativeLanguage}.
        Return as JSON: { 
          "sentence": "...",
          "translatedTitle": "Speaking Practice in ${nativeLanguage}",
          "translatedDesc": "Read the sentence out loud and get instant AI feedback! in ${nativeLanguage}",
          "uiLabels": {
            "score": "Score label in ${nativeLanguage}",
            "readyTitle": "Ready to speak? in ${nativeLanguage}",
            "readyDesc": "Practice your pronunciation and fluency by speaking to the AI. in ${nativeLanguage}",
            "startButton": "Start Practice in ${nativeLanguage}",
            "loadingTitle": "Preparing Sentence... in ${nativeLanguage}",
            "loadingDesc": "Finding something interesting for you to say. in ${nativeLanguage}",
            "instruction": "Say this sentence: in ${nativeLanguage}",
            "youSaid": "You said: in ${nativeLanguage}",
            "accuracy": "Accuracy Score in ${nativeLanguage}",
            "nextButton": "Next Sentence in ${nativeLanguage}"
          }
        }`,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text || "{}");
      setTargetSentence(data.sentence);
      setUiLabels(data);
      setGameState('playing');
    } catch (error) {
      console.error(error);
      setGameState('idle');
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setFeedback(null);
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert("Speech recognition is not supported in your browser. Please try Chrome or Edge.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const evaluateSpeech = async (spokenText: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The target sentence was: "${targetSentence}". The user said: "${spokenText}". 
        Compare them and provide a score from 0 to 100 based on accuracy and pronunciation. 
        Provide a very short encouraging feedback message in ${nativeLanguage}.
        Return as JSON: { "score": number, "message": "string" }`,
        config: { responseMimeType: "application/json" }
      });
      
      const result = JSON.parse(response.text || "{}");
      setFeedback(result);
      if (result.score > 70) {
        setScore(prev => prev + Math.floor(result.score / 10));
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const playTarget = () => {
    const utterance = new SpeechSynthesisUtterance(targetSentence);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-rose-600 to-pink-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Mic size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">{uiLabels.translatedTitle || "Speaking Practice"}</h2>
              <p className="text-white/70 text-sm">{uiLabels.translatedDesc || "Read the sentence out loud and get instant AI feedback!"}</p>
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
                <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mic size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">{uiLabels.uiLabels?.readyTitle || "Ready to speak?"}</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  {uiLabels.uiLabels?.readyDesc || "Practice your pronunciation and fluency by speaking to the AI."}
                </p>
                <button
                  onClick={startNewRound}
                  className="px-12 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
                >
                  {uiLabels.uiLabels?.startButton || "Start Practice"}
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
                  <div className="absolute inset-0 border-4 border-rose-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-rose-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{uiLabels.uiLabels?.loadingTitle || "Preparing Sentence..."}</h3>
                <p className="text-slate-500">{uiLabels.uiLabels?.loadingDesc || "Finding something interesting for you to say."}</p>
              </motion.div>
            )}

            {gameState === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12 py-6"
              >
                <div className="text-center space-y-6">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{uiLabels.uiLabels?.instruction || "Say this sentence:"}</p>
                  <div className="relative inline-block">
                    <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-800 px-8">
                      "{targetSentence}"
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={playTarget}
                      className="absolute -right-12 top-1/2 -translate-y-1/2 p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                    >
                      <Volume2 size={24} />
                    </motion.button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-8">
                  <motion.button
                    animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                    transition={isListening ? { repeat: Infinity, duration: 1.5 } : {}}
                    onClick={isListening ? stopListening : startListening}
                    className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all relative ${
                      isListening ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-white border-4 border-rose-100 text-rose-600 hover:border-rose-600'
                    }`}
                  >
                    {isListening ? <MicOff size={48} /> : <Mic size={48} />}
                    {isListening && (
                      <div className="absolute -inset-4 border-4 border-rose-600 rounded-full animate-ping opacity-20"></div>
                    )}
                  </motion.button>

                  <div className="w-full max-w-md text-center space-y-4">
                    {transcript && (
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{uiLabels.uiLabels?.youSaid || "You said:"}</p>
                        <p className="text-xl font-medium text-slate-700 italic">"{transcript}"</p>
                      </div>
                    )}

                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 rounded-3xl bg-white border-2 border-slate-100 shadow-sm space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{uiLabels.uiLabels?.accuracy || "Accuracy Score"}</span>
                          <span className={`text-2xl font-bold ${feedback.score > 80 ? 'text-emerald-600' : feedback.score > 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {feedback.score}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${feedback.score}%` }}
                            className={`h-full rounded-full ${feedback.score > 80 ? 'bg-emerald-500' : feedback.score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          />
                        </div>
                        <p className="text-slate-600 font-medium">{feedback.message}</p>
                      </motion.div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={startNewRound}
                        className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={20} />
                        {uiLabels.uiLabels?.nextButton || "Next Sentence"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
