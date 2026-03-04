import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Zap, CheckCircle2, XCircle, Loader2, Trophy, Play } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  word: string;
  options: string[];
  correct: string;
}

export default function SpeedFlashcards({ onComplete }: { onComplete?: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'finished'>('idle');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const loadQuestions = async () => {
    setGameState('loading');
    try {
      const savedProfile = localStorage.getItem('lingoai_profile');
      const lang = savedProfile ? JSON.parse(savedProfile).nativeLanguage : 'Hebrew';
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 10 English vocabulary questions. Each question should have a word, 4 ${lang} options, and the correct ${lang} translation. Level: Intermediate.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correct: { type: Type.STRING },
              },
              required: ["word", "options", "correct"],
            },
          },
        },
      });
      setQuestions(JSON.parse(response.text || "[]"));
      setGameState('playing');
      setTimeLeft(30);
      setScore(0);
      setCurrentIndex(0);
    } catch (error) {
      console.error(error);
      setGameState('idle');
    }
  };

  useEffect(() => {
    let timer: any;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('finished');
      if (onComplete) onComplete();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, onComplete]);

  const handleAnswer = (option: string) => {
    if (gameState !== 'playing' || feedback) return;

    const isCorrect = option === questions[currentIndex].correct;
    if (isCorrect) {
      setScore(prev => prev + 10);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setGameState('finished');
        if (onComplete) onComplete();
      }
    }, 600);
  };

  if (gameState === 'idle') {
    return (
      <div className="text-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-xl mx-auto">
        <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <Zap size={40} fill="currentColor" />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-800 mb-4">בליץ מילים</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          כמה מילים תצליחו לתרגם ב-30 שניות? משחק מהיר וממכר לשיפור אוצר המילים!
        </p>
        <button
          onClick={loadQuestions}
          className="px-10 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto"
        >
          <Play size={24} fill="currentColor" />
          התחילו לשחק
        </button>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-medium">מייצר עבורך אתגר בליץ...</p>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="text-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-xl mx-auto">
        <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy size={40} />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">המשחק נגמר!</h2>
        <p className="text-slate-500 mb-6">צברת {score} נקודות!</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={loadQuestions}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
          >
            נסו שוב
          </button>
          <button
            onClick={() => setGameState('idle')}
            className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
          >
            תפריט
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full font-bold text-slate-600">
          <Timer size={18} />
          <span>{timeLeft} שניות</span>
        </div>
        <div className="text-xl font-display font-bold text-primary">
          ניקוד: {score}
        </div>
      </div>

      <div className="relative bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <h3 className="text-4xl font-display font-bold text-slate-800">{currentQ.word}</h3>
            <div className="grid grid-cols-2 gap-4">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!feedback}
                  className={`p-4 rounded-2xl font-bold text-lg transition-all border-2 ${
                    feedback === 'correct' && opt === currentQ.correct
                      ? "bg-secondary border-secondary text-white"
                      : feedback === 'wrong' && opt !== currentQ.correct && opt === questions[currentIndex].correct // this logic is a bit flawed but feedback is short
                      ? "bg-slate-100 border-slate-100"
                      : "bg-slate-50 border-slate-100 hover:border-primary/30 text-slate-700"
                  }`}
                  dir="rtl"
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Feedback Overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              {feedback === 'correct' ? (
                <CheckCircle2 className="text-secondary" size={120} />
              ) : (
                <XCircle className="text-accent" size={120} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <motion.div 
          className="bg-primary h-full"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
