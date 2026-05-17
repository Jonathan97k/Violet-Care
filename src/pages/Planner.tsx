import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarView from '../components/shared/CalendarView';
import ShiftCard from '../components/shared/ShiftCard';
import AddShiftModal from '../components/shared/AddShiftModal';
import ShiftStats from '../components/shared/ShiftStats';
import { getAllShifts, addShift, updateShift, deleteShift, getShiftsByDateRange } from '../utils/db';
import { track } from '../utils/track';
import type { Shift } from '../types';
import { getShiftTypeByValue } from '../data/shiftTypes';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const Planner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);

  const loadShifts = async () => {
    try {
      const allShifts = await getAllShifts();
      setShifts(allShifts);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    }
  };

  const loadUpcomingShifts = async () => {
    try {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 30);

      const upcoming = await getShiftsByDateRange(
        today.toISOString().split('T')[0],
        futureDate.toISOString().split('T')[0]
      );

      const sorted = upcoming
        .filter((shift) => new Date(shift.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

      setUpcomingShifts(sorted);
    } catch (error) {
      console.error('Failed to load upcoming shifts:', error);
    }
  };

  useEffect(() => {
    track('Shift Planner', 'opened');
    loadShifts();
  }, []);

  useEffect(() => {
    loadUpcomingShifts();
  }, [shifts]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddShift = () => {
    setEditingShift(null);
    setIsModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setIsModalOpen(true);
  };

  const handleDeleteShift = async (id: string) => {
    try {
      await deleteShift(id);
      track('Shift Planner', 'shift_deleted');
      await loadShifts();
    } catch (error) {
      console.error('Failed to delete shift:', error);
    }
  };

  const handleSaveShift = async (shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingShift) {
        const updatedShift: Shift = {
          ...editingShift,
          ...shiftData,
          updatedAt: new Date().toISOString(),
        };
        await updateShift(updatedShift);
        track('Shift Planner', 'shift_edited');
      } else {
        const newShift: Shift = {
          ...shiftData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addShift(newShift);
        track('Shift Planner', 'shift_added');
      }
      await loadShifts();
      setIsModalOpen(false);
      setEditingShift(null);
    } catch (error) {
      console.error('Failed to save shift:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingShift(null);
  };

  const getShiftsForSelectedDate = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return shifts.filter((shift) => shift.date === dateStr);
  };

  const formatDateHeader = () => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const selectedDayShifts = getShiftsForSelectedDate();

  return (
    <div className="min-h-screen pb-24 px-6 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-playfair font-semibold text-white mb-2">
          Shift Planner
        </h1>
        <p className="text-violet-300 font-dm-sans">
          Manage your schedule
        </p>
      </motion.div>

      <CalendarView
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        shifts={shifts}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-xl font-playfair font-semibold text-white mb-3">
          Shifts for {formatDateHeader()}
        </h2>
        {selectedDayShifts.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-xl font-playfair text-white mb-2">
              Your schedule is clear — enjoy the rest, Violet 💜
            </p>
            <p className="text-violet-300 font-dm-sans text-sm">
              Tap + to add a shift
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {selectedDayShifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onEdit={handleEditShift}
                  onDelete={handleDeleteShift}
                  onUpdate={async (updated) => {
                    await updateShift(updated);
                    await loadShifts();
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {upcomingShifts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-lg font-playfair font-semibold text-white mb-3">
            Upcoming Shifts
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {upcomingShifts.map((shift, index) => {
              const shiftDate = new Date(shift.date);
              const dayName = shiftDate.toLocaleDateString('en-US', { weekday: 'short' });
              const formattedDate = shiftDate.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
              });
              const shiftType = getShiftTypeByValue(shift.type);

              return (
                <motion.div
                  key={shift.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex-shrink-0"
                >
                  <div className="glass-card px-4 py-3 min-w-[140px]">
                    <p className="text-white font-dm-sans font-medium mb-1">
                      {dayName}
                    </p>
                    <p className="text-violet-300 font-dm-sans text-sm mb-2">
                      {formattedDate}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-dm-sans font-medium border ${shiftType?.tailwindClasses}`}
                    >
                      {shiftType?.icon} {shiftType?.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ShiftStats shifts={shifts} />
      </motion.div>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleAddShift}
        className="fab-shell w-14 h-14 bg-violet-600 hover:bg-violet-500 rounded-full shadow-glow flex items-center justify-center text-white text-3xl"
        aria-label="Add shift"
      >
        +
      </motion.button>

      <AddShiftModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveShift}
        editingShift={editingShift}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Planner;
