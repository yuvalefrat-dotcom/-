import React, { useState, useEffect } from 'react';
import { BookOpen, MessageSquare, Gamepad2, LayoutDashboard, Sparkles, Languages, Trophy, Zap, MapPin, Timer, CheckCircle2, Star, Target, Image as ImageIcon, Headphones, Puzzle, Flame, Mic, ArrowRight, Volume2, Brain, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TutorChat from './components/TutorChat';
import WordMatchGame from './components/WordMatchGame';
import SentenceGame from './components/SentenceGame';
import ScenarioAdventure from './components/ScenarioAdventure';
import SpeedFlashcards from './components/SpeedFlashcards';
import MysteryImage from './components/MysteryImage';
import ListenSolve from './components/ListenSolve';
import WordScramble from './components/WordScramble';
import SpeakingPractice from './components/SpeakingPractice';
import MiniGames, { GameMode } from './components/MiniGames';
import ProfileSetup from './components/ProfileSetup';
import { generatePersonalizedPlan } from './services/geminiService';

type View = 'dashboard' | 'chat' | 'match' | 'sentence' | 'scenario' | 'speed' | 'setup' | 'mystery' | 'listen' | 'scramble' | 'speaking' | 'minigame';

interface UserProfile {
  nativeLanguage: string;
  level: string;
  goals: string[];
  interests: string[];
  reminderTime?: string;
}

interface DailyTask {
  title: string;
  description: string;
  feature: View;
  reason: string;
  completed?: boolean;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedMiniGame, setSelectedMiniGame] = useState<GameMode>('idioms');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyPlan, setDailyPlan] = useState<{ dailyMessage: string, tasks: DailyTask[] } | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('lingoai_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      fetchPlan(parsed);
      checkReminders(parsed);
    } else {
      setCurrentView('setup');
    }
  }, []);

  const checkReminders = (p: UserProfile) => {
    if (p.reminderTime && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  };

  const fetchPlan = async (p: UserProfile) => {
    setIsLoadingPlan(true);
    try {
      const plan = await generatePersonalizedPlan(p);
      
      // Check if we already have progress for today
      const today = new Date().toDateString();
      const savedProgress = localStorage.getItem(`lingoai_progress_${today}`);
      
      if (savedProgress) {
        const completedIndices = JSON.parse(savedProgress);
        plan.tasks = plan.tasks.map((t: DailyTask, i: number) => ({
          ...t,
          completed: completedIndices.includes(i)
        }));
      }

      setDailyPlan(plan);
      
      // Check if all tasks are completed
      const allDone = plan.tasks.every((t: DailyTask) => t.completed);
      if (!allDone) {
        setIsLocked(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const completeTask = (index: number) => {
    if (!dailyPlan) return;
    
    const newTasks = [...dailyPlan.tasks];
    newTasks[index].completed = true;
    
    const newPlan = { ...dailyPlan, tasks: newTasks };
    setDailyPlan(newPlan);
    
    const today = new Date().toDateString();
    const completedIndices = newTasks
      .map((t, i) => t.completed ? i : -1)
      .filter(i => i !== -1);
    
    localStorage.setItem(`lingoai_progress_${today}`, JSON.stringify(completedIndices));
    
    // Check if all done
    if (newTasks.every(t => t.completed)) {
      setIsLocked(false);
    }
  };

  const handleProfileComplete = (p: UserProfile) => {
    setProfile(p);
    localStorage.setItem('lingoai_profile', JSON.stringify(p));
    setCurrentView('dashboard');
    fetchPlan(p);
  };

  const renderView = () => {
    if (currentView === 'setup') {
      return <ProfileSetup onComplete={handleProfileComplete} />;
    }

    switch (currentView) {
      case 'chat':
        return <TutorChat onComplete={() => {
          const taskIndex = dailyPlan?.tasks.findIndex(t => t.feature === 'chat');
          if (taskIndex !== undefined && taskIndex !== -1) completeTask(taskIndex);
        }} />;
      case 'match':
        return <WordMatchGame onComplete={() => {
          const taskIndex = dailyPlan?.tasks.findIndex(t => t.feature === 'match');
          if (taskIndex !== undefined && taskIndex !== -1) completeTask(taskIndex);
        }} />;
      case 'sentence':
        return <SentenceGame onComplete={() => {
          const taskIndex = dailyPlan?.tasks.findIndex(t => t.feature === 'sentence');
          if (taskIndex !== undefined && taskIndex !== -1) completeTask(taskIndex);
        }} />;
      case 'scenario':
        return <ScenarioAdventure onComplete={() => {
          const taskIndex = dailyPlan?.tasks.findIndex(t => t.feature === 'scenario');
          if (taskIndex !== undefined && taskIndex !== -1) completeTask(taskIndex);
        }} />;
      case 'speed':
        return <SpeedFlashcards onComplete={() => {
          const taskIndex = dailyPlan?.tasks.findIndex(t => t.feature === 'speed');
          if (taskIndex !== undefined && taskIndex !== -1) completeTask(taskIndex);
        }} />;
      case 'mystery':
        return <MysteryImage onComplete={() => {
          const taskIndex = dailyPlan?.tasks.findIndex(t => t.feature === 'mystery');
          if (taskIndex !== undefined && taskIndex !== -1) completeTask(taskIndex);
        }} />;
      case 'listen':
        return <ListenSolve onComplete={() => {
          const taskIndex = dailyPlan?.tasks.findIndex(t => t.feature === 'listen');
          if (taskIndex !== undefined && taskIndex !== -1) completeTask(taskIndex);
        }} />;
      case 'scramble':
        return <WordScramble onComplete={() => {
          const taskIndex = dailyPlan?.tasks.findIndex(t => t.feature === 'scramble');
          if (taskIndex !== undefined && taskIndex !== -1) completeTask(taskIndex);
        }} />;
      case 'speaking':
        return <SpeakingPractice onComplete={() => {
          const taskIndex = dailyPlan?.tasks.findIndex(t => t.feature === 'speaking');
          if (taskIndex !== undefined && taskIndex !== -1) completeTask(taskIndex);
        }} />;
      case 'minigame':
        return <MiniGames mode={selectedMiniGame} onComplete={() => {
          // Mini games are extra, but we could track them too if needed
        }} />;
      default:
        return (
          <div className="space-y-12">
            {/* Personalized Plan Section */}
            {dailyPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Star size={120} fill="currentColor" className="text-primary" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <Target size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-slate-800">התוכנית היומית שלך</h2>
                      <p className="text-slate-500 text-sm">מותאם אישית לפי המטרות והתחומי עניין שלך</p>
                    </div>
                  </div>

                  <p className="text-slate-700 font-medium mb-8 leading-relaxed" dir="rtl">
                    {dailyPlan.dailyMessage}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {dailyPlan.tasks.map((task, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        onClick={() => setCurrentView(task.feature)}
                        className={`p-6 rounded-3xl border transition-all cursor-pointer group relative ${
                          task.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-primary/30'
                        }`}
                      >
                        {task.completed && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-all ${
                            task.completed ? 'bg-emerald-500 text-white' : 'bg-white text-primary group-hover:bg-primary group-hover:text-white'
                          }`}>
                            {task.feature === 'chat' && <MessageSquare size={20} />}
                            {task.feature === 'match' && <Gamepad2 size={20} />}
                            {task.feature === 'sentence' && <Languages size={20} />}
                            {task.feature === 'scenario' && <MapPin size={20} />}
                            {task.feature === 'speed' && <Timer size={20} />}
                            {task.feature === 'mystery' && <ImageIcon size={20} />}
                            {task.feature === 'listen' && <Headphones size={20} />}
                            {task.feature === 'scramble' && <Puzzle size={20} />}
                            {task.feature === 'speaking' && <Mic size={20} />}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">משימה {i+1}</span>
                        </div>
                        <h4 className={`font-bold mb-2 ${task.completed ? 'text-emerald-800' : 'text-slate-800'}`}>{task.title}</h4>
                        <p className={`text-xs mb-4 leading-relaxed ${task.completed ? 'text-emerald-600' : 'text-slate-500'}`}>{task.description}</p>
                        <div className={`text-[10px] font-medium px-2 py-1 rounded-md inline-block ${
                          task.completed ? 'text-emerald-700 bg-emerald-100' : 'text-primary bg-primary/5'
                        }`}>
                          {task.completed ? 'הושלם' : 'בתהליך'}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {isLoadingPlan && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">בונה לך תוכנית לימוד אישית...</p>
              </div>
            )}

            {/* All Activities Section */}
            <div>
              <div className="flex items-center justify-between mb-8 px-4">
                <h2 className="text-3xl font-display font-bold text-slate-800">כל המשחקים והפעילויות</h2>
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-sm font-bold">
                  <Flame size={18} fill="currentColor" />
                  <span>21 משחקים זמינים</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* 12 New Mini Games */}
                {[
                  { id: 'idioms', title: 'ביטויים באנגלית', desc: 'למדו ביטויים נפוצים שדוברי אנגלית משתמשים בהם ביומיום.', icon: <Brain />, color: 'from-indigo-500 to-indigo-700' },
                  { id: 'grammar', title: 'שומר הדקדוק', desc: 'תקנו טעויות דקדוק במשפטים והפכו למומחים.', icon: <CheckCircle2 />, color: 'from-violet-500 to-violet-700' },
                  { id: 'synonyms', title: 'ספארי מילים נרדפות', desc: 'מצאו מילים עם משמעות זהה והרחיבו את אוצר המילים.', icon: <Sparkles />, color: 'from-blue-500 to-blue-700' },
                  { id: 'rhymes', title: 'זמן חריזה', desc: 'מצאו מילים שמתחרזות ושפרו את השמיעה שלכם.', icon: <Headphones />, color: 'from-cyan-500 to-cyan-700' },
                  { id: 'emoji', title: 'תרגום אימוג׳י', desc: 'נחשו ביטויים באנגלית לפי רצף של אימוג׳ים.', icon: <Star />, color: 'from-amber-500 to-amber-700' },
                  { id: 'verbs', title: 'מסע הפעלים', desc: 'שלטו בהטיות פעלים ובזמנים בצורה חווייתית.', icon: <Zap />, color: 'from-orange-500 to-orange-700' },
                  { id: 'prepositions', title: 'נתיב מילות היחס', desc: 'למדו מתי להשתמש ב-in, on, at ועוד.', icon: <MapPin />, color: 'from-emerald-500 to-emerald-700' },
                  { id: 'spelling', title: 'תחרות איות', desc: 'בחרו את האיות הנכון של מילים מאתגרות.', icon: <Puzzle />, color: 'from-teal-500 to-teal-700' },
                  { id: 'definitions', title: 'בלש ההגדרות', desc: 'התאימו בין מילים להגדרות המדויקות שלהן.', icon: <Target />, color: 'from-fuchsia-500 to-fuchsia-700' },
                  { id: 'antonyms', title: 'יום ההפכים', desc: 'מצאו את המילה ההפוכה וחדדו את המחשבה.', icon: <RefreshCw />, color: 'from-pink-500 to-pink-700' },
                  { id: 'categories', title: 'מלך הקטגוריות', desc: 'זהו איזו מילה שייכת לכל קבוצה.', icon: <LayoutDashboard />, color: 'from-sky-500 to-sky-700' },
                  { id: 'phonetics', title: 'כיף פונטי', desc: 'למדו איך להגות מילים נכון לפי צלילים.', icon: <Volume2 />, color: 'from-rose-500 to-rose-700' },
                ].map((game) => (
                  <motion.div
                    key={game.id}
                    whileHover={{ y: -5 }}
                    onClick={() => {
                      setSelectedMiniGame(game.id as GameMode);
                      setCurrentView('minigame');
                    }}
                    className={`game-card bg-gradient-to-br ${game.color} text-white cursor-pointer`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white/20 rounded-2xl">
                        {game.icon}
                      </div>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">מיני משחק</span>
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-2">{game.title}</h3>
                    <p className="text-white/80 text-sm mb-6">{game.desc}</p>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <span>שחקו עכשיו</span>
                      <ArrowRight size={16} />
                    </div>
                  </motion.div>
                ))}

                {/* Speaking Practice */}
                <motion.div
                  whileHover={{ y: -5 }}
                  onClick={() => setCurrentView('speaking')}
                  className="game-card bg-gradient-to-br from-rose-600 to-rose-800 text-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <Mic size={32} />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">דיבור</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">אימון דיבור</h3>
                  <p className="text-white/80 text-sm mb-6">דברו אל ה-AI וקבלו משוב מיידי על המבטא והדיוק שלכם. הדרך הכי טובה ללמוד לדבר!</p>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>התחילו לדבר</span>
                    <Mic size={16} />
                  </div>
                </motion.div>

                {/* AI Tutor */}
                <motion.div
                  whileHover={{ y: -5 }}
                  onClick={() => setCurrentView('chat')}
                  className="game-card bg-gradient-to-br from-indigo-600 to-indigo-800 text-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <MessageSquare size={32} />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">מורה</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">צ'אט עם מורה AI</h3>
                  <p className="text-white/80 text-sm mb-6">שיחה טבעית עם מורה פרטי. קבלו תיקונים וטיפים בזמן אמת.</p>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>בואו נתחיל לדבר</span>
                    <Zap size={16} className="fill-current" />
                  </div>
                </motion.div>

                {/* Mystery Image */}
                <motion.div
                  whileHover={{ y: -5 }}
                  onClick={() => setCurrentView('mystery')}
                  className="game-card bg-gradient-to-br from-purple-600 to-purple-800 text-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <ImageIcon size={32} />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">ויזואלי</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">תמונת המסתורין</h3>
                  <p className="text-white/80 text-sm mb-6">נחשו את המילה באנגלית לפי התמונה שה-AI צייר במיוחד בשבילכם.</p>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>גלו את התמונה</span>
                    <Sparkles size={16} />
                  </div>
                </motion.div>

                {/* Listen & Solve */}
                <motion.div
                  whileHover={{ y: -5 }}
                  onClick={() => setCurrentView('listen')}
                  className="game-card bg-gradient-to-br from-emerald-600 to-emerald-800 text-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <Headphones size={32} />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">אודיו</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">הקשיבו ופתרו</h3>
                  <p className="text-white/80 text-sm mb-6">הקשיבו למורה ה-AI וכתבו בדיוק מה ששמעתם. אימון מעולה להבנת הנשמע.</p>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>התחילו להקשיב</span>
                    <Headphones size={16} />
                  </div>
                </motion.div>

                {/* Word Scramble */}
                <motion.div
                  whileHover={{ y: -5 }}
                  onClick={() => setCurrentView('scramble')}
                  className="game-card bg-gradient-to-br from-amber-500 to-amber-700 text-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <Puzzle size={32} />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">פאזל</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">סלט אותיות</h3>
                  <p className="text-white/80 text-sm mb-6">האותיות התבלבלו! האם תצליחו לסדר אותן ולמצוא את המילה המסתתרת?</p>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>סדרו את האותיות</span>
                    <Zap size={16} fill="currentColor" />
                  </div>
                </motion.div>

                {/* Scenario Adventure */}
                <motion.div
                  whileHover={{ y: -5 }}
                  onClick={() => setCurrentView('scenario')}
                  className="game-card bg-gradient-to-br from-slate-800 to-slate-900 text-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <MapPin size={32} />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">משימות</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">הרפתקאות בעולם</h3>
                  <p className="text-white/80 text-sm mb-6">צאו למשימות בעולם האמיתי - הזמנת קפה בלונדון או ראיון עבודה בניו יורק.</p>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>צאו למשימה</span>
                    <Sparkles size={16} />
                  </div>
                </motion.div>

                {/* Speed Flashcards */}
                <motion.div
                  whileHover={{ y: -5 }}
                  onClick={() => setCurrentView('speed')}
                  className="game-card bg-gradient-to-br from-rose-500 to-rose-700 text-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <Timer size={32} />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">בליץ</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">בליץ מילים</h3>
                  <p className="text-white/80 text-sm mb-6">כמה מילים תצליחו לתרגם ב-30 שניות? משחק מהיר וממכר לשיפור הזיכרון.</p>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>שחקו עכשיו</span>
                    <Zap size={16} fill="currentColor" />
                  </div>
                </motion.div>

                {/* Word Match */}
                <motion.div
                  whileHover={{ y: -5 }}
                  onClick={() => setCurrentView('match')}
                  className="game-card bg-gradient-to-br from-emerald-500 to-emerald-700 text-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <Gamepad2 size={32} />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">Classic</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">התאמת מילים</h3>
                  <p className="text-white/80 text-sm mb-6">הרחיבו את אוצר המילים שלכם על ידי התאמת מילים באנגלית לתרגום שלהן.</p>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>שחקו עכשיו</span>
                    <Trophy size={16} />
                  </div>
                </motion.div>

                {/* Sentence Builder */}
                <motion.div
                  whileHover={{ y: -5 }}
                  onClick={() => setCurrentView('sentence')}
                  className="game-card bg-gradient-to-br from-blue-500 to-blue-700 text-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <Languages size={32} />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">Grammar</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">בונה המשפטים</h3>
                  <p className="text-white/80 text-sm mb-6">תרגמו משפטים מורכבים וקבלו משוב מיידי מה-AI על הדקדוק שלכם.</p>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>נסו את האתגר</span>
                    <Sparkles size={16} />
                  </div>
                </motion.div>

                <div className="game-card bg-white border-2 border-slate-100 flex flex-col justify-center items-center text-center p-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <BookOpen size={32} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-800 mb-2">עוד בקרוב</h3>
                  <p className="text-slate-500 text-sm">אנחנו בונים עוד משחקי AI שיעזרו לכם לשלוט באנגלית מהר יותר.</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (currentView === 'setup') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <ProfileSetup onComplete={(p) => {
          setProfile(p);
          localStorage.setItem('lingoai_profile', JSON.stringify(p));
          setCurrentView('dashboard');
          fetchPlan(p);
        }} />
      </div>
    );
  }

  if (isLocked && dailyPlan && currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-[3rem] p-10 text-center space-y-8 shadow-2xl relative"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-600 via-primary to-indigo-600" />
          
          <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-100">
            <Target size={48} />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-bold text-slate-900">הטלפון נעול לחלוטין! 🔒</h2>
            <p className="text-slate-500 text-lg leading-relaxed" dir="rtl">
              מצב משמעת מקסימלית הופעל. וואטסאפ, אינטרנט וכל שאר האפליקציות חסומות לשימוש עד שתסיימו את 5 המשימות היומיות שלכם באנגלית. אין דרך חזרה!
            </p>
          </div>

          <div className="grid gap-3">
            {dailyPlan.tasks.map((task, i) => (
              <div 
                key={i}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  task.completed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-700'
                }`}
                dir="rtl"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${task.completed ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                    {task.completed ? <CheckCircle2 size={16} /> : <span>{i+1}</span>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{task.title}</p>
                    <p className="text-[10px] opacity-70 leading-tight">{task.description}</p>
                  </div>
                </div>
                {!task.completed && (
                  <button
                    onClick={() => {
                      setCurrentView(task.feature);
                      setIsLocked(false);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all whitespace-nowrap"
                  >
                    בצע משימה
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-rose-600 font-bold text-sm">
              <Zap size={16} fill="currentColor" />
              <span>נשארו עוד {dailyPlan.tasks.filter(t => !t.completed).length} משימות לשחרור</span>
            </div>
            <p className="text-slate-400 text-xs italic">"קודם לומדים, אחר כך נהנים. סיימו את כל 5 המשימות כדי לשחרר את הגישה לטלפון."</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setCurrentView('dashboard')}
          >
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Sparkles size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900 leading-none">LingoAI</h1>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">English Mastery</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 text-sm font-bold transition-all ${currentView === 'dashboard' ? 'text-primary scale-105' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <LayoutDashboard size={20} />
              לוח בקרה
            </button>
            <button 
              onClick={() => setCurrentView('chat')}
              className={`flex items-center gap-2 text-sm font-bold transition-all ${currentView === 'chat' ? 'text-primary scale-105' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <MessageSquare size={20} />
              מורה AI
            </button>
            <button 
              onClick={() => setCurrentView('scenario')}
              className={`flex items-center gap-2 text-sm font-bold transition-all ${currentView === 'scenario' ? 'text-primary scale-105' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <MapPin size={20} />
              משימות
            </button>
            <button 
              onClick={() => setCurrentView('mystery')}
              className={`flex items-center gap-2 text-sm font-bold transition-all ${currentView === 'mystery' ? 'text-primary scale-105' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ImageIcon size={20} />
              משחקים
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {profile && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">רמה</span>
                <span className="text-sm font-bold text-slate-900 capitalize">{profile.level === 'beginner' ? 'מתחיל' : profile.level === 'intermediate' ? 'בינוני' : 'מתקדם'}</span>
              </div>
            )}
            <div 
              className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-600 font-bold cursor-pointer hover:bg-slate-200 transition-all hover:scale-105"
              onClick={() => setCurrentView('setup')}
            >
              {profile?.nativeLanguage?.substring(0, 2).toUpperCase() || 'YE'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {currentView !== 'dashboard' && (
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    // Re-lock if not all tasks done
                    const allDone = dailyPlan?.tasks.every(t => t.completed);
                    if (!allDone) setIsLocked(true);
                  }}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors group"
                >
                  <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-slate-100 transition-colors">
                    <LayoutDashboard size={18} />
                  </div>
                  <span>חזרה ללוח הבקרה</span>
                </button>
                
                {dailyPlan?.tasks.find(t => t.feature === currentView) && (
                  <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center gap-2">
                    <Target size={14} />
                    <span>משימה יומית פעילה</span>
                  </div>
                )}
              </div>
            )}
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-6 mb-8">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <Sparkles size={20} />
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <Zap size={20} />
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <Trophy size={20} />
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium">© 2026 LingoAI. לימוד אנגלית מבוסס AI בחינם לכולם. ללא פרסומות, רק למידה.</p>
        </div>
      </footer>
    </div>
  );
}
