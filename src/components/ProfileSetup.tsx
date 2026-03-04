import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Target, Heart, GraduationCap, ArrowRight, Languages, Timer } from 'lucide-react';

interface ProfileSetupProps {
  onComplete: (profile: any) => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    nativeLanguage: '',
    level: 'beginner',
    goals: [] as string[],
    interests: [] as string[],
    reminderTime: '08:00'
  });

  const levels = [
    { id: 'beginner', label: 'מתחיל (Beginner)', desc: 'אני יודע כמה מילים בסיסיות' },
    { id: 'intermediate', label: 'בינוני (Intermediate)', desc: 'אני יכול לנהל שיחה פשוטה' },
    { id: 'advanced', label: 'מתקדם (Advanced)', desc: 'אני מדבר שוטף אבל רוצה להשתפר' }
  ];

  const goals = [
    'שיפור הביטחון העצמי',
    'הכנה לראיון עבודה',
    'טיולים בחו"ל',
    'קריאת ספרים ומאמרים',
    'צפייה בסרטים ללא תרגום'
  ];

  const interests = [
    'טכנולוגיה',
    'ספורט',
    'בישול',
    'מוזיקה',
    'עסקים',
    'אמנות'
  ];

  const toggleGoal = (goal: string) => {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal) 
        : [...prev.goals, goal]
    }));
  };

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) 
        ? prev.interests.filter(i => i !== interest) 
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-slate-100">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles size={32} />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">בואו נבנה לכם תוכנית!</h2>
        <p className="text-slate-500">כדי שה-AI יתאים לכם את התוכן הכי טוב, אנחנו צריכים להכיר אתכם קצת.</p>
      </div>

      <div className="flex justify-center gap-2 mb-10">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300 ${step >= i ? 'w-12 bg-primary' : 'w-4 bg-slate-100'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
              <Languages className="text-primary" />
              <h3>מהי שפת האם שלך?</h3>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={profile.nativeLanguage}
                onChange={(e) => setProfile({ ...profile, nativeLanguage: e.target.value })}
                placeholder="למשל: עברית, ערבית, רוסית..."
                className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-primary focus:outline-none transition-all text-right text-lg font-medium"
                dir="rtl"
              />
              <p className="text-sm text-slate-400 text-right">
                ה-AI ישתמש בשפה הזו כדי להסביר לך מושגים קשים ולתת לך משוב.
              </p>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
              <GraduationCap className="text-primary" />
              <h3>מה רמת האנגלית שלכם?</h3>
            </div>
            <div className="grid gap-4">
              {levels.map(l => (
                <button
                  key={l.id}
                  onClick={() => setProfile({ ...profile, level: l.id })}
                  className={`p-5 rounded-2xl text-right border-2 transition-all ${
                    profile.level === l.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/30'
                  }`}
                  dir="rtl"
                >
                  <div className="font-bold text-slate-800">{l.label}</div>
                  <div className="text-sm text-slate-500">{l.desc}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
              <Target className="text-primary" />
              <h3>מה המטרות שלכם?</h3>
            </div>
            <div className="flex flex-wrap gap-3" dir="rtl">
              {goals.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGoal(g)}
                  className={`px-6 py-3 rounded-full border-2 transition-all font-medium ${
                    profile.goals.includes(g) ? 'bg-primary border-primary text-white' : 'border-slate-100 text-slate-600 hover:border-primary/30'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
              <Heart className="text-primary" />
              <h3>מה מעניין אתכם?</h3>
            </div>
            <div className="flex flex-wrap gap-3" dir="rtl">
              {interests.map(i => (
                <button
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={`px-6 py-3 rounded-full border-2 transition-all font-medium ${
                    profile.interests.includes(i) ? 'bg-primary border-primary text-white' : 'border-slate-100 text-slate-600 hover:border-primary/30'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
              <Timer className="text-primary" />
              <h3>מתי תרצו שנתזכר אתכם?</h3>
            </div>
            <div className="space-y-4">
              <input
                type="time"
                value={profile.reminderTime}
                onChange={(e) => setProfile({ ...profile, reminderTime: e.target.value })}
                className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-primary focus:outline-none transition-all text-center text-2xl font-bold"
              />
              <p className="text-sm text-slate-400 text-right" dir="rtl">
                נשלח לך תזכורת בכל יום בשעה הזו כדי שלא תפספס את המשימות שלך.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 flex justify-between items-center">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="text-slate-400 font-bold hover:text-slate-600 transition-colors">
            חזרה
          </button>
        ) : <div />}
        
        <button
          onClick={() => step < 4 ? setStep(step + 1) : onComplete(profile)}
          disabled={step === 0 && !profile.nativeLanguage.trim()}
          className={`px-10 py-4 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 ${
            step === 0 && !profile.nativeLanguage.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
          }`}
        >
          {step === 4 ? 'סיימנו! בואו נתחיל' : 'המשך'}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
