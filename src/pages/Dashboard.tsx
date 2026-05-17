import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Stethoscope, Droplets, FileText, Mail, Sparkles, Heart, User, Briefcase } from 'lucide-react';
import WellnessRing from '../components/shared/WellnessRing';
import QuoteCard from '../components/shared/QuoteCard';
import UpcomingReminders from '../components/shared/UpcomingReminders';
import { track } from '../utils/track';
import { getHydration, getMood, getSleep, getSetting } from '../utils/db';
import { getAllShifts } from '../utils/db';
import { getAllNotes } from '../utils/db';
import { haptics } from '../utils/haptics';
import type { Shift } from '../types';

const Dashboard = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [wellnessScore, setWellnessScore] = useState(0);
  const [nextShift, setNextShift] = useState<string>('');
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [totalNotes, setTotalNotes] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState('');

  useEffect(() => {
    track('Dashboard', 'opened');

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadWellnessData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [hydration, mood, sleep] = await Promise.all([
          getHydration(today),
          getMood(today),
          getSleep(today),
        ]);

        let score = 0;
        
        if (hydration) {
          score += (hydration.glasses / 8) * 33;
        }
        
        if (mood) {
          score += 33;
        }
        
        if (sleep) {
          score += 34;
        }

        setWellnessScore(Math.round(score));
      } catch (error) {
        console.error('Failed to load wellness data:', error);
      }
    };

    const loadDashboardData = async () => {
      try {
        const shifts = await getAllShifts();
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Find active shift
        const active = shifts.find((s) => {
          if (s.date !== todayStr) return false;
          const [sh, sm] = s.startTime.split(':').map(Number);
          const [eh, em] = s.endTime.split(':').map(Number);
          const nowM = today.getHours() * 60 + today.getMinutes();
          const startM = sh * 60 + sm;
          const endM = eh * 60 + em;
          return nowM >= startM && nowM <= endM;
        });
        setActiveShift(active || null);

        const upcomingShifts = shifts.filter(
          (shift) => new Date(shift.date) >= today
        );

        if (upcomingShifts.length > 0) {
          const next = upcomingShifts[0];
          const shiftDate = new Date(next.date);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          if (shiftDate.toDateString() === tomorrow.toDateString()) {
            setNextShift('Tomorrow');
          } else {
            setNextShift(shiftDate.toLocaleDateString('en-US', { weekday: 'long' }));
          }
        } else {
          setNextShift('No upcoming shifts');
        }

        const notes = await getAllNotes();
        setTotalNotes(notes.length);

        const photoSetting = await getSetting('profile.photo');
        if (photoSetting?.value) setProfilePhoto(String(photoSetting.value));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadWellnessData();
    loadDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 24) return 'Good Evening';
    return 'You should be resting';
  };

  const formatDate = () => {
    return time.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = () => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleQuickCardClick = (cardName: string, path: string) => {
    haptics.light();
    track('Dashboard', cardName);
    navigate(path);
  };

  const quickCards = [
    {
      icon: <Calendar size={22} />,
      label: 'My Shifts',
      stat: nextShift || 'No upcoming shifts',
      path: '/planner',
      name: 'shifts',
    },
    {
      icon: <Stethoscope size={22} />,
      label: 'Nurse Tools',
      stat: '6 tools available',
      path: '/tools',
      name: 'tools',
    },
    {
      icon: <Droplets size={22} />,
      label: 'Wellness',
      stat: `${Math.round((wellnessScore / 100) * 8)}/8 glasses`,
      path: '/wellness',
      name: 'wellness',
    },
    {
      icon: <FileText size={22} />,
      label: 'Notes',
      stat: `${totalNotes} notes`,
      path: '/notes',
      name: 'notes',
    },
    {
      icon: <Mail size={22} />,
      label: 'Messages',
      stat: '1 new message 💜',
      path: '/messages',
      name: 'messages',
    },
    {
      icon: <Sparkles size={22} />,
      label: 'Moments',
      stat: 'Your story awaits',
      path: '/moments',
      name: 'moments',
    },
  ];

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.07,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 font-dm-sans text-sm tracking-widest uppercase mb-1">
              {getGreeting()}
            </p>
            <h1 className="text-5xl font-playfair font-bold text-white mb-1 flex items-center gap-2">
              Violet <Heart size={32} className="animate-heartbeat" fill="currentColor" />
            </h1>
            <p className="text-white/60 font-dm-sans text-sm mt-1">{formatDate()}</p>
            <p className="text-white/80 font-light text-lg">
              {formatTime()}
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-violet-400/50 flex items-center justify-center bg-violet-500/20 shrink-0"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={22} className="text-violet-200" />
            )}
          </button>
        </div>
      </motion.div>

      {activeShift && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <button
            onClick={() => navigate('/planner')}
            className="w-full text-left rounded-2xl p-4 bg-gradient-to-r from-violet-500/30 to-rose-400/20 border border-violet-300/40 backdrop-blur-xl flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
              <Briefcase size={18} className="text-violet-300" />
            </div>
            <div>
              <p className="text-white/70 text-xs uppercase tracking-widest">On shift now</p>
              <p className="text-white font-medium text-sm">
                {activeShift.startTime} — {activeShift.endTime}
                {activeShift.ward ? ` · ${activeShift.ward}` : ''}
              </p>
            </div>
          </button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-4"
      >
        <div className="glass-card p-6 mx-0 mt-6">
          <WellnessRing score={wellnessScore} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-4"
      >
        <QuoteCard />
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="mb-6"
      >
        <h3 className="text-white/70 font-dm-sans text-xs tracking-widest uppercase mt-6 mb-3">
          Quick Access
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {quickCards.map((card) => (
            <motion.button
              key={card.label}
              variants={itemVariants}
              whileHover={{ scale: 0.97 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleQuickCardClick(card.name, card.path)}
              className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 p-4 text-left hover:border-violet-400/50 active:bg-white/20 transition-all"
            >
              <div className="text-violet-400">{card.icon}</div>
              <p className="text-white text-sm font-medium mt-2">
                {card.label}
              </p>
              <p className="text-white/50 text-xs mt-1">
                {card.stat}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <UpcomingReminders />
    </div>
  );
};

export default Dashboard;
