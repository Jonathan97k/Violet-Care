export const haptics = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 10, 15]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 30]);
    }
  },
};
