import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, XCircle, RefreshCw, ArrowRight, Brain, Zap, Star, Trophy, Lightbulb } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export type GameMode = 
  | 'idioms' | 'grammar' | 'synonyms' | 'rhymes' 
  | 'emoji' | 'verbs' | 'prepositions' | 'spelling' 
  | 'definitions' | 'antonyms' | 'categories' | 'phonetics';

interface MiniGameProps {
  mode: GameMode;
  onClose?: () => void;
  onComplete?: () => void;
}

interface GameData {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  hint?: string;
  translatedTitle?: string;
  translatedDescription?: string;
  uiLabels?: {
    streak: string;
    score: string;
    questionLabel: string;
    hintButton: string;
    excellent: string;
    correctFeedback: string;
    incorrect: string;
    incorrectFeedback: string;
    nextButton: string;
    loading: string;
  };
}

export default function MiniGames({ mode, onClose, onComplete }: MiniGameProps) {
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'feedback'>('loading');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [nativeLanguage, setNativeLanguage] = useState('Hebrew');

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setNativeLanguage(profile.nativeLanguage || 'Hebrew');
    }
  }, []);

  const getModeTitle = () => {
    if (gameData?.translatedTitle) return gameData.translatedTitle;
    switch (mode) {
      case 'idioms': return 'Idiom Master';
      case 'grammar': return 'Grammar Guardian';
      case 'synonyms': return 'Synonym Safari';
      case 'rhymes': return 'Rhyme Time';
      case 'emoji': return 'Emoji Translate';
      case 'verbs': return 'Verb Voyager';
      case 'prepositions': return 'Preposition Path';
      case 'spelling': return 'Spelling Bee';
      case 'definitions': return 'Definition Detective';
      case 'antonyms': return 'Opposite Day';
      case 'categories': return 'Category King';
      case 'phonetics': return 'Phonetic Fun';
      default: return 'Mini Game';
    }
  };

  const getModeDescription = () => {
    if (gameData?.translatedDescription) return gameData.translatedDescription;
    switch (mode) {
      case 'idioms': return 'Learn common English idioms and their meanings.';
      case 'grammar': return 'Fix the grammar mistakes in sentences.';
      case 'synonyms': return 'Find the word that means the same.';
      case 'rhymes': return 'Find the word that sounds the same.';
      case 'emoji': return 'Guess the English phrase from emojis.';
      case 'verbs': return 'Master verb conjugations and tenses.';
      case 'prepositions': return 'Choose the correct preposition.';
      case 'spelling': return 'Pick the correctly spelled word.';
      case 'definitions': return 'Match the word to its definition.';
      case 'antonyms': return 'Find the word with the opposite meaning.';
      case 'categories': return 'Identify which word belongs to a category.';
      case 'phonetics': return 'Learn how words are pronounced.';
      default: return 'Practice your English skills!';
    }
  };

  const fetchNewQuestion = async () => {
    setGameState('loading');
    setSelectedOption(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Generate a single multiple-choice question for an English learner game mode: "${mode}".
      The user's native language is ${nativeLanguage}.
      Return as JSON: { 
        "question": "...", 
        "options": ["...", "...", "...", "..."], 
        "answer": "...", 
        "explanation": "...", 
        "hint": "...",
        "translatedTitle": "A fun title for this mode in ${nativeLanguage}",
        "translatedDescription": "A short description of this mode in ${nativeLanguage}",
        "uiLabels": {
          "streak": "Streak label in ${nativeLanguage}",
          "score": "Score label in ${nativeLanguage}",
          "questionLabel": "Question label in ${nativeLanguage}",
          "hintButton": "Hint button text in ${nativeLanguage}",
          "excellent": "Excellent! in ${nativeLanguage}",
          "correctFeedback": "You got it right! in ${nativeLanguage}",
          "incorrect": "Not quite! in ${nativeLanguage}",
          "incorrectFeedback": "The correct answer was: in ${nativeLanguage}",
          "nextButton": "Next Challenge in ${nativeLanguage}",
          "loading": "Generating Challenge... in ${nativeLanguage}"
        }
      }
      The answer MUST be one of the options. Keep it fun and educational.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text || "{}");
      setGameData(data);
      setGameState('playing');
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (nativeLanguage) {
      fetchNewQuestion();
    }
  }, [mode, nativeLanguage]);

  const handleOptionClick = (option: string) => {
    if (gameState !== 'playing') return;
    setSelectedOption(option);
    setGameState('feedback');
    
    if (option === gameData?.answer) {
      setScore(prev => prev + 10);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-8 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Brain size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">{getModeTitle()}</h2>
              <p className="text-white/70 text-sm">{getModeDescription()}</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-widest opacity-60">{gameData?.uiLabels?.streak || 'Streak'}</div>
              <div className="text-2xl font-display font-bold flex items-center gap-1">
                <Zap size={20} className="text-amber-400 fill-amber-400" />
                {streak}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-widest opacity-60">{gameData?.uiLabels?.score || 'Score'}</div>
              <div className="text-3xl font-display font-bold">{score}</div>
            </div>
          </div>
        </div>

        <div className="p-8 min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {gameState === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <div className="relative w-20 h-20 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{gameData?.uiLabels?.loading || 'Generating Challenge...'}</h3>
              </motion.div>
            )}

            {gameState === 'playing' && gameData && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Lightbulb size={14} />
                    {gameData.uiLabels?.questionLabel || 'Question'}
                  </div>
                  <h3 className="text-3xl font-display font-bold text-slate-800 leading-tight">
                    {gameData.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameData.options.map((option, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOptionClick(option)}
                      className="p-6 text-left bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-lg font-medium text-slate-700">{option}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {gameData.hint && (
                  <div className="text-center">
                    <button className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1 mx-auto">
                      <Sparkles size={14} />
                      {gameData.uiLabels?.hintButton || 'Need a hint?'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {gameState === 'feedback' && gameData && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="flex flex-col items-center gap-4">
                  {selectedOption === gameData.answer ? (
                    <>
                      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={64} />
                      </div>
                      <h3 className="text-4xl font-display font-bold text-emerald-600">{gameData.uiLabels?.excellent || 'Excellent!'}</h3>
                      <p className="text-slate-600 text-lg">{gameData.uiLabels?.correctFeedback || 'You got it right!'}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                        <XCircle size={64} />
                      </div>
                      <h3 className="text-4xl font-display font-bold text-rose-600">{gameData.uiLabels?.incorrect || 'Not quite!'}</h3>
                      <p className="text-slate-600 text-lg">
                        {gameData.uiLabels?.incorrectFeedback || 'The correct answer was:'} <span className="font-bold text-slate-800">{gameData.answer}</span>
                      </p>
                    </>
                  )}
                </div>

                {gameData.explanation && (
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 max-w-lg mx-auto">
                    <p className="text-slate-700 italic">"{gameData.explanation}"</p>
                  </div>
                )}

                <button
                  onClick={fetchNewQuestion}
                  className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2 mx-auto"
                >
                  {gameData.uiLabels?.nextButton || 'Next Challenge'}
                  <ArrowRight size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
