export interface ShiftType {
  value: 'day' | 'night' | 'on-call' | 'training' | 'off';
  label: string;
  color: string;
  icon: string;
  tailwindClasses: string;
  borderColor: string;
}

export const shiftTypes: ShiftType[] = [
  {
    value: 'day',
    label: 'Day',
    color: '#8b5cf6',
    icon: '☀️',
    tailwindClasses: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    borderColor: 'border-l-violet-500',
  },
  {
    value: 'night',
    label: 'Night',
    color: '#4c1d95',
    icon: '🌙',
    tailwindClasses: 'bg-indigo-900/20 text-indigo-300 border-indigo-500/30',
    borderColor: 'border-l-indigo-700',
  },
  {
    value: 'on-call',
    label: 'On-Call',
    color: '#fb7185',
    icon: '📞',
    tailwindClasses: 'bg-rose-400/20 text-rose-300 border-rose-400/30',
    borderColor: 'border-l-rose-400',
  },
  {
    value: 'training',
    label: 'Training',
    color: '#f59e0b',
    icon: '📚',
    tailwindClasses: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    borderColor: 'border-l-amber-500',
  },
  {
    value: 'off',
    label: 'Off',
    color: '#64748b',
    icon: '😴',
    tailwindClasses: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    borderColor: 'border-l-slate-500',
  },
];

export function getShiftTypeByValue(value: string): ShiftType | undefined {
  return shiftTypes.find((type) => type.value === value);
}
