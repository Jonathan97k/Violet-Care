import { motion } from 'framer-motion';
import type { Shift } from '../../types';
import { getShiftTypeByValue } from '../../data/shiftTypes';

interface Props {
  shift: Shift;
  onEdit: (shift: Shift) => void;
  onDelete: (id: string) => void;
}

const ShiftCard = ({ shift, onEdit, onDelete }: Props) => {
  const shiftType = getShiftTypeByValue(shift.type);
  const shiftDate = new Date(shift.date);
  const dayName = shiftDate.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = shiftDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });

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
    </motion.div>
  );
};

export default ShiftCard;
