import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Shift } from '../../types';
import { getShiftTypeByValue } from '../../data/shiftTypes';
import { updateShift } from '../../utils/db';
import { haptics } from '../../utils/haptics';

interface Props {
  shift: Shift;
  onEdit: (shift: Shift) => void;
  onDelete: (id: string) => void;
  onUpdate?: (shift: Shift) => void;
}

const ShiftCard = ({ shift, onEdit, onDelete, onUpdate }: Props) => {
  const navigate = useNavigate();
  const shiftType = getShiftTypeByValue(shift.type);
  const shiftDate = new Date(shift.date);
  const dayName = shiftDate.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = shiftDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });

  const now = new Date();
  const isToday = shift.date === now.toISOString().split('T')[0];
  const [endH, endM] = shift.endTime.split(':').map(Number);
  const endMinutes = endH * 60 + endM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showComplete = isToday && nowMinutes >= endMinutes && !shift.completed;

  const calculateDuration = () => {
    const [startHours, startMinutes] = shift.startTime.split(':').map(Number);
    const [endHours, endMinutes] = shift.endTime.split(':').map(Number);
    
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;
    
    let duration = endMinutesTotal - startMinutesTotal;
    if (duration < 0) {
      duration += 24 * 60;
    }
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const handleComplete = async () => {
    const updated = { ...shift, completed: true, completedAt: new Date().toISOString() };
    await updateShift(updated);
    haptics.success();
    onUpdate?.(updated);
    navigate('/decompression', { state: { shift: updated } });
  };

  const toggleReminders = async () => {
    const updated = { ...shift, remindersEnabled: !shift.remindersEnabled };
    await updateShift(updated);
    haptics.light();
    onUpdate?.(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)' }}
      className={`glass-card p-4 border-l-4 ${shiftType?.borderColor || 'border-l-violet-500'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-playfair font-semibold text-white">
            {dayName}, {formattedDate}
          </h3>
          <p className="text-violet-300 font-dm-sans text-sm">
            {shift.startTime} → {shift.endTime} ({calculateDuration()})
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-dm-sans font-medium border ${shiftType?.tailwindClasses}`}
        >
          {shiftType?.icon} {shiftType?.label}
        </span>
      </div>

      {shift.ward && (
        <p className="text-violet-200 font-dm-sans text-sm mb-2">
          🏥 {shift.ward}
        </p>
      )}

      {shift.notes && (
        <p className="text-violet-300 font-dm-sans text-sm italic mb-3">
          {shift.notes}
        </p>
      )}

      {shift.completed && (
        <p className="text-rose-300 text-xs font-medium mb-3">💜 Shift completed</p>
      )}

      {isToday && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id={`reminders-${shift.id}`}
            checked={shift.remindersEnabled !== false}
            onChange={toggleReminders}
            className="w-4 h-4 accent-violet-500"
          />
          <label htmlFor={`reminders-${shift.id}`} className="text-white/70 text-xs font-dm-sans">
            Meal & break reminders
          </label>
        </div>
      )}

      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(shift)}
          className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-dm-sans text-sm transition-all"
        >
          Edit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (confirm('Delete this shift?')) {
              onDelete(shift.id);
            }
          }}
          className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-xl font-dm-sans text-sm transition-all"
        >
          Delete
        </motion.button>
      </div>

      {showComplete && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleComplete}
          className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-violet-500/30 to-rose-400/30 border border-violet-300/40 text-white font-medium"
        >
          Complete Shift 💜
        </motion.button>
      )}
    </motion.div>
  );
};

export default ShiftCard;
