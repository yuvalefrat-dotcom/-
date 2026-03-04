import React, { useState, useEffect } from 'react';
import { Send, Loader2, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { checkTranslation } from '../services/geminiService';
import { motion } from 'motion/react';

const SENTENCES = [
  "אני אוהב ללמוד אנגלית עם בינה מלאכותית.",
  "החתול יושב על השטיח הירוק.",
  "מזג האוויר היום פשוט נפלא.",
  "האם אתה רוצה לשתות כוס קפה?",
  "הספר הזה מאוד מעניין ומומלץ."
];

export default function SentenceGame({ onComplete }: { onComplete?: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState('Hebrew');

  useEffect(() => {
    const savedProfile = localStorage.getItem('lingoai_profile');
    if (savedProfile) {
      setNativeLanguage(JSON.parse(savedProfile).nativeLanguage || 'Hebrew');
    }
  }, []);

  const currentSentence = SENTENCES[currentIndex];

  const handleSubmit = async () => {
    if (!userInput.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const evaluation = await checkTranslation(currentSentence, userInput, nativeLanguage);
      setResult(evaluation);
      if (evaluation.score >= 80 && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSentence = () => {
    setCurrentIndex((prev) => (prev + 1) % SENTENCES.length);
    setUserInput('');
    setResult(null);
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto">
      <div className="mb-8 text-right" dir="rtl">
        <h2 className="text-2xl font-display font-bold text-slate-800">בונה המשפטים</h2>
        <p className="text-slate-500">תרגמו את המשפט בעברית לאנגלית</p>
      </div>

      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6 text-center">
        <p className="text-xl font-medium text-slate-800" dir="rtl">{currentSentence}</p>
      </div>

      <div className="space-y-4">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="כתבו כאן את התרגום שלכם לאנגלית..."
          className="w-full p-4 rounded-xl bg-white border-2 border-slate-100 focus:border-primary focus:ring-0 outline-none transition-all min-h-[100px] text-lg"
        />
        
        {!result ? (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !userInput.trim()}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
            בדקו תרגום
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-2xl border ${
              result.score >= 80 ? "bg-secondary/5 border-secondary/20" : "bg-accent/5 border-accent/20"
            }`}
          >
            <div className="flex items-center gap-3 mb-4 flex-row-reverse">
              {result.score >= 80 ? (
                <CheckCircle className="text-secondary" size={24} />
              ) : (
                <XCircle className="text-accent" size={24} />
              )}
              <span className={`text-2xl font-bold ${result.score >= 80 ? "text-secondary" : "text-accent"}`}>
                {result.score}%
              </span>
            </div>
            
            <div className="space-y-3 text-right" dir="rtl">
              <p className="text-slate-700 font-medium">{result.feedback}</p>
              <div className="p-3 bg-white rounded-lg border border-slate-100 text-left" dir="ltr">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">גרסה נכונה / Correct Version</p>
                <p className="text-slate-800 font-bold">{result.correctVersion}</p>
              </div>
            </div>

            <button
              onClick={nextSentence}
              className="mt-6 w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
            >
              למשפט הבא
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
