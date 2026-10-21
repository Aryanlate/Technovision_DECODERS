/** @type {import('tailwindcss').Config} */
module.exports = {
  // Theme is driven by a `.dark` class on <html> (see globals.css).
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F1EEE6',
        ink: '#111111',
        match: '#2F7D5B',
        mismatch: '#C0453A',
        missing: '#D98A1F',
        status: {
          match: '#2F7D5B',
          mismatch: '#C0453A',
          missing: '#D98A1F',
        }
      },
      fontFamily: {
        headline: ['"Archivo Black"', 'Impact', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderWidth: {
        DEFAULT: '1px',
      }
    },
  },
  plugins: [],
};
