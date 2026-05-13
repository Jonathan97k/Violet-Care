import { motion } from 'framer-motion';

interface Reminder {
  icon: string;
  text: string;
}

const UpcomingReminders = () => {
  const reminders: Reminder[] = [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mb-6"
    >
      <h3 className="text-white/70 font-dm-sans text-xs tracking-widest uppercase mt-6 mb-3">
        Upcoming
      </h3>
      {reminders.length === 0 ? (
        <div className="glass-card px-6 py-4 text-center">
          <p className="text-violet-200 font-dm-sans">All clear today 💜</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {reminders.map((reminder, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
              className="flex-shrink-0"
            >
              <div className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-white/80 text-sm whitespace-nowrap">
                {reminder.text}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default UpcomingReminders;
