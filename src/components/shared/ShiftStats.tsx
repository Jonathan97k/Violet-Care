import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Shift } from '../../types';

interface Props {
  shifts: Shift[];
}

function shiftDurationHours(shift: Shift): number {
  const [sh, sm] = shift.startTime.split(':').map(Number);
  const [eh, em] = shift.endTime.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

const StatCard = ({ label, value, icon, delay }: { label: string; value: number; icon: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.3 }}
    className="glass-card p-4 text-center"
  >
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-2xl font-playfair font-semibold text-white mb-1">
      {value}
    </div>
    <div className="text-violet-300 font-dm-sans text-sm">{label}</div>
  </motion.div>
);

const ShiftStats = ({ shifts }: Props) => {
  const displayStats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekShifts = shifts.filter((s) => new Date(s.date) >= weekStart);
    const monthShifts = shifts.filter((s) => new Date(s.date) >= monthStart);

    const weekHours = weekShifts.reduce((t, s) => t + shiftDurationHours(s), 0);
    const monthHours = monthShifts.reduce((t, s) => t + shiftDurationHours(s), 0);
    const weekNights = weekShifts.filter((s) => s.type === 'night').length;
    const avg = monthShifts.length > 0 ? monthHours / monthShifts.length : 0;

    return {
      weekShifts: weekShifts.length,
      weekHours: Math.round(weekHours),
      weekNights,
      monthShifts: monthShifts.length,
      monthHours: Math.round(monthHours),
      avgShiftLength: Math.round(avg * 10) / 10,
    };
  }, [shifts]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-playfair font-semibold text-white">Statistics</h3>

      <div>
        <p className="text-violet-300 font-dm-sans text-sm mb-3">This Week</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Shifts"
            value={displayStats.weekShifts}
            icon="📅"
            delay={0}
          />
          <StatCard
            label="Hours"
            value={displayStats.weekHours}
            icon="⏱️"
            delay={0.1}
          />
          <StatCard
            label="Nights"
            value={displayStats.weekNights}
            icon="🌙"
            delay={0.2}
          />
        </div>
      </div>

      <div>
        <p className="text-violet-300 font-dm-sans text-sm mb-3">This Month</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Shifts"
            value={displayStats.monthShifts}
            icon="📅"
            delay={0.3}
          />
          <StatCard
            label="Hours"
            value={displayStats.monthHours}
            icon="⏱️"
            delay={0.4}
          />
          <StatCard
            label="Avg (h)"
            value={displayStats.avgShiftLength}
            icon="📊"
            delay={0.5}
          />
        </div>
      </div>
    </div>
  );
};

export default ShiftStats;
