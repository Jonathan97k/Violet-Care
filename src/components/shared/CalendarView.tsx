import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Shift } from '../../types';
import { getShiftTypeByValue } from '../../data/shiftTypes';

interface Props {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  shifts: Shift[];
}

const CalendarView = ({ selectedDate, onDateSelect, shifts }: Props) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [direction, setDirection] = useState(0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();
    return { startPadding, totalDays };
  };

  const getShiftsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter((shift) => shift.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handlePreviousMonth = () => {
    setDirection(-1);
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setDirection(1);
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateSelect(newDate);
  };

  const { startPadding, totalDays } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePreviousMonth}
          className="text-white text-2xl p-2"
        >
          ←
        </motion.button>
        <h2 className="text-xl font-playfair font-semibold text-white">{monthName}</h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleNextMonth}
          className="text-white text-2xl p-2"
        >
          →
        </motion.button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-dm-sans text-violet-300 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={monthName}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="grid grid-cols-7 gap-1"
        >
          {Array.from({ length: startPadding }).map((_, index) => (
            <div key={`padding-${index}`} className="p-2" />
          ))}
          {Array.from({ length: totalDays }).map((_, index) => {
            const day = index + 1;
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dayShifts = getShiftsForDay(date);
            const today = isToday(date);
            const selected = isSelected(date);

            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDayClick(day)}
                className={`
                  relative p-2 rounded-xl flex flex-col items-center justify-center
                  transition-all duration-200
                  ${today ? 'ring-2 ring-violet-500' : ''}
                  ${selected ? 'bg-violet-600/30' : 'hover:bg-white/10'}
                `}
              >
                <span
                  className={`text-sm font-dm-sans ${
                    selected ? 'text-white font-semibold' : 'text-violet-200'
                  }`}
                >
                  {day}
                </span>
                {dayShifts.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dayShifts.slice(0, 3).map((shift, idx) => {
                      const shiftType = getShiftTypeByValue(shift.type);
                      return (
                        <div
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: shiftType?.color || '#8b5cf6' }}
                        />
                      );
                    })}
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;
