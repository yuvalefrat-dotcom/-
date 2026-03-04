import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Loader2, Trophy } from 'lucide-react';
import { generateVocabularyGame } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface Word {
  word: string;
  translation: string;
  example: string;
}

export default function WordMatchGame({ onComplete }: { onComplete?: () => void }) {
  const [words, setWords] = useState<Word[]>([]);
  const [shuffledTranslations, setShuffledTranslations] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [nativeLanguage, setNativeLanguage] = useState('Hebrew');

  const loadGame = async () => {
    setIsLoading(true);
    setMatches([]);
    setScore(0);
    try {
      const savedProfile = localStorage.getItem('lingoai_profile');
      const lang = savedProfile ? JSON.parse(savedProfile).nativeLanguage : 'Hebrew';
      setNativeLanguage(lang);
      const data = await generateVocabularyGame('beginner', lang);
      setWords(data);
      setShuffledTranslations([...data.map((d: any) => d.translation)].sort(() => Math.random() - 0.5));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGame();
  }, []);

  const handleWordClick = (word: string) => {
    if (matches.includes(word)) return;
    setSelectedWord(word);
    checkMatch(word, selectedTranslation);
  };

  const handleTranslationClick = (translation: string) => {
    if (words.some(w => w.translation === translation && matches.includes(w.word))) return;
    setSelectedTranslation(translation);
    checkMatch(selectedWord, translation);
  };

  const checkMatch = (word: string | null, translation: string | null) => {
    if (word && translation) {
      const correctWord = words.find(w => w.word === word);
      if (correctWord?.translation === translation) {
        const newMatches = [...matches, word];
        setMatches(newMatches);
        setScore(prev => prev + 20);
        setSelectedWord(null);
        setSelectedTranslation(null);
        if (newMatches.length === words.length && onComplete) {
          onComplete();
        }
      } else {
        setTimeout(() => {
          setSelectedWord(null);
          setSelectedTranslation(null);
        }, 500);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-medium">Preparing your game...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="text-right" dir="rtl">
          <h2 className="text-2xl font-display font-bold text-slate-800">התאמת מילים</h2>
          <p className="text-slate-500">התאימו בין המילה באנגלית לתרגום שלה בעברית</p>
        </div>
        <div className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full font-bold">
          <Trophy size={20} />
          <span>{score} נקודות</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">English</p>
          {words.map((w) => (
            <motion.button
              key={w.word}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleWordClick(w.word)}
              className={`w-full p-4 rounded-xl text-left font-medium transition-all border-2 ${
                matches.includes(w.word)
                  ? "bg-secondary/10 border-secondary text-secondary"
                  : selectedWord === w.word
                  ? "bg-primary border-primary text-white"
                  : "bg-slate-50 border-slate-100 text-slate-700 hover:border-primary/30"
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{w.word}</span>
                {matches.includes(w.word) && <CheckCircle2 size={18} />}
              </div>
            </motion.button>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 text-right">{nativeLanguage}</p>
          {shuffledTranslations.map((t) => (
            <motion.button
              key={t}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTranslationClick(t)}
              className={`w-full p-4 rounded-xl text-right font-medium transition-all border-2 ${
                words.some(w => w.translation === t && matches.includes(w.word))
                  ? "bg-secondary/10 border-secondary text-secondary"
                  : selectedTranslation === t
                  ? "bg-primary border-primary text-white"
                  : "bg-slate-50 border-slate-100 text-slate-700 hover:border-primary/30"
              }`}
              dir={nativeLanguage === 'Hebrew' || nativeLanguage === 'Arabic' ? 'rtl' : 'ltr'}
            >
              <div className="flex justify-between items-center">
                {words.some(w => w.translation === t && matches.includes(w.word)) && <CheckCircle2 size={18} />}
                <span>{t}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {matches.length === words.length && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 text-center p-6 bg-secondary/5 rounded-2xl border border-secondary/20"
        >
          <h3 className="text-xl font-bold text-secondary mb-2">עבודה מצוינת! 🎉</h3>
          <p className="text-slate-600 mb-6">התאמתם את כל המילים בהצלחה.</p>
          <button
            onClick={loadGame}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
          >
            <RefreshCw size={20} />
            שחקו שוב
          </button>
        </motion.div>
      )}
    </div>
  );
}
