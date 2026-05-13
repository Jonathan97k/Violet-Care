import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Shift } from '../../types';
import { shiftTypes, getShiftTypeByValue } from '../../data/shiftTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingShift?: Shift | null;
  selectedDate: Date;
}

const AddShiftModal = ({ isOpen, onClose, onSave, editingShift, selectedDate }: Props) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [ward, setWard] = useState('');
  const [type, setType] = useState<'day' | 'night' | 'on-call' | 'training' | 'off'>('day');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingShift) {
        setDate(editingShift.date);
        setStartTime(editingShift.startTime);
        setEndTime(editingShift.endTime);
        setWard(editingShift.ward || '');
        setType(editingShift.type);
        setNotes(editingShift.notes || '');
      } else {
        setDate(selectedDate.toISOString().split('T')[0]);
        setStartTime('09:00');
        setEndTime('17:00');
        setWard('');
        setType('day');
        setNotes('');
      }
      setError(null);
    }
  }, [isOpen, editingShift, selectedDate]);

  const calculateDuration = () => {
    if (!startTime || !endTime) return '0h 0m';

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;

    let duration = endMinutesTotal - startMinutesTotal;
    if (duration < 0) {
      duration += 24 * 60;
    }

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return `${hours}h ${minutes}m`;
  };

  const handleSave = () => {
    if (!date || !startTime || !endTime) {
      setError('Please fill in all required fields');
      return;
    }

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;

    let duration = endMinutesTotal - startMinutesTotal;
    if (duration < 0) {
      duration += 24 * 60;
    }

    if (duration === 0) {
      setError('End time must be different from start time');
      return;
    }

    const shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'> = {
      date,
      startTime,
      endTime,
      ward: ward || undefined,
      type,
      notes: notes || undefined,
    };

    onSave(shift);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="glass-card rounded-t-3xl p-6 pb-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-playfair font-semibold text-white">
                  {editingShift ? 'Edit Shift' : 'Add Shift'}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="text-violet-300 hover:text-white text-2xl"
                >
                  ×
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-violet-200 font-dm-sans mb-2 text-sm">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-dm-sans focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-violet-200 font-dm-sans mb-2 text-sm">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-dm-sans focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-violet-200 font-dm-sans mb-2 text-sm">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-dm-sans focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="glass-card px-4 py-3">
                  <p className="text-violet-200 font-dm-sans text-sm">
                    Duration: <span className="text-white font-semibold">{calculateDuration()}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-violet-200 font-dm-sans mb-2 text-sm">
                    Ward / Unit (optional)
                  </label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="e.g., ICU, Emergency, Ward 3"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-dm-sans focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-violet-200 font-dm-sans mb-2 text-sm">
                    Shift Type *
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {shiftTypes.map((shiftType) => (
                      <motion.button
                        key={shiftType.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setType(shiftType.value)}
                        className={`
                          p-3 rounded-xl border transition-all
                          ${type === shiftType.value 
                            ? shiftType.tailwindClasses + ' ring-2 ring-violet-500' 
                            : 'bg-white/5 border-white/10 text-violet-300 hover:bg-white/10'
                          }
                        `}
                      >
                        <div className="text-2xl mb-1">{shiftType.icon}</div>
                        <div className="text-xs font-dm-sans">{shiftType.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-violet-200 font-dm-sans mb-2 text-sm">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-dm-sans focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none resize-none"
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-rose-400 font-dm-sans text-sm"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="w-full px-6 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-dm-sans font-medium shadow-glow transition-all"
                >
                  {editingShift ? 'Update Shift' : 'Add Shift'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddShiftModal;
