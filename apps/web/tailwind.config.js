/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Semantic color system — terminal aesthetic, high contrast
        bg: {
          DEFAULT: '#0a0a0b',
          soft: '#111113',
          panel: '#17171a',
          elev: '#1f1f23',
        },
        edge: {
          DEFAULT: '#27272d',
          strong: '#3a3a42',
        },
        fg: {
          DEFAULT: '#e8e8ea',
          muted: '#9a9aa0',
          faint: '#5a5a60',
        },
        // Mine = orange (fire / hash), Buy = blue (stability / DCA)
        mine: '#f97316',
        buy: '#3b82f6',
        // Outcome states
        win: '#22c55e',
        loss: '#ef4444',
        warn: '#eab308',
        // Bitcoin
        btc: '#f7931a',
      },
      fontSize: {
        // Tight scale for dense information
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
};
