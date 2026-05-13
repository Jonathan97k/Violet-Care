export const quotes = [
  "Nursing is not just a profession, it's a calling of the heart.",
  "You carry so much, yet you never let it break you. That quiet strength — I see it every single day.",
  "Every patient who leaves feeling a little better — that's you. That's your hands, your voice, your care.",
  "On the days it feels like too much, remember: you were made for this. And I'm so proud of you.",
  "The work you do matters more than you know. You make the world softer, one person at a time.",
  "Your compassion is a gift. Don't forget to give some of it to yourself too.",
  "Even on the hardest shifts, you find a way to be kind. That's rare and beautiful.",
  "You're not just a nurse. You're a healer, a listener, a comforter. You're everything.",
  "Take a deep breath. You've handled harder things than this. You've got this.",
  "Your dedication inspires me. The way you show up, day after day — it's extraordinary.",
  "Remember why you started. That spark is still there, even on the exhausting days.",
  "You give so much of yourself. Today, let yourself receive a little care too.",
  "The world is better because you're in it. Never doubt that.",
  "Your kindness is a superpower. Use it on yourself today.",
  "Every life you touch is changed forever. That's the magic of nursing.",
  "You're stronger than you think. Braver than you believe. And more loved than you know.",
  "The badge you wear represents the heart you have. Wear it with pride.",
  "Rest is not a luxury, it's a necessity. You can't pour from an empty cup.",
  "Your smile can be the best medicine someone receives today.",
  "The long hours, the heavy days — they all lead to moments that matter. You're building something beautiful.",
  "You see people at their most vulnerable and meet them with grace. That's true strength.",
  "Today, I want you to know: you are enough. Just as you are.",
  "The care you give is a reflection of the love in your heart.",
  "Even when no one is watching, you do the right thing. That speaks volumes about who you are.",
  "Your hands heal, but your heart — that's where the real magic happens.",
  "Take pride in how far you've come. Have faith in how far you can go.",
  "You're not just doing a job. You're living your purpose.",
  "The world needs more people like you. Don't ever change.",
  "Every shift is a new chance to make a difference. And you always do.",
  "I believe in you. I believe in your dreams. I believe in your beautiful heart.",
];

export function getTodayQuote(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % quotes.length;
  return quotes[index];
}
