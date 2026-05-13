import { motion } from 'framer-motion';
import { getTodayQuote } from '../../data/quotes';

const QuoteCard = () => {
  const quote = getTodayQuote();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 p-5 mt-4 relative overflow-hidden"
    >
      <motion.div
        className="absolute top-4 left-4 text-6xl font-playfair text-violet-400 italic"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        "
      </motion.div>
      <motion.p
        className="relative z-10 text-base font-playfair italic text-white/90 leading-relaxed pl-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {quote}
      </motion.p>
    </motion.div>
  );
};

export default QuoteCard;
