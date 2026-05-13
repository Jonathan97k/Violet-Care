import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Calendar, Stethoscope, Heart, Mail, Sparkles, User } from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: <Home size={22} />, label: 'Home' },
  { path: '/planner', icon: <Calendar size={22} />, label: 'Planner' },
  { path: '/tools', icon: <Stethoscope size={22} />, label: 'Tools' },
  { path: '/wellness', icon: <Heart size={22} />, label: 'Wellness' },
  { path: '/messages', icon: <Mail size={22} />, label: 'Messages' },
  { path: '/moments', icon: <Sparkles size={22} />, label: 'Moments' },
  { path: '/profile', icon: <User size={22} />, label: 'Profile' },
];

const BottomNav = () => {
  return (
    <motion.nav
      initial={{ y: 100, x: '-50%' }}
      animate={{ y: 0, x: '-50%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bottom-nav fixed bottom-0 left-1/2 w-full z-50 backdrop-blur-xl bg-white/10 border-t border-white/20 h-[72px] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                isActive 
                  ? 'text-violet-400' 
                  : 'text-white/50'
              }`
            }
            style={typeof window !== 'undefined' ? {
              filter: 'var(--active-filter, none)'
            } : {}}
          >
            {({ isActive }) => (
              <>
                <motion.div
                  className="relative"
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.1 }}
                >
                  {isActive && (
                    <style>{`
                      :root { --active-filter: drop-shadow(0 0 8px rgba(167,139,250,0.8)); }
                    `}</style>
                  )}
                  {item.icon}
                </motion.div>
                
                <motion.span
                  className="text-[10px] font-medium font-dm-sans"
                  animate={isActive ? { opacity: 1 } : { opacity: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
