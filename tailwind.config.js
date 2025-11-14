export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        primary: '#22c55e',
        'primary-hover': '#16a34a',
        background: '#ffffff',
        'secondary-bg': '#f9fafb',
        border: '#e5e7eb',
        'text-primary': '#111827',
        'text-secondary': '#6b7280',
      }
    },
  },
  plugins: [],
}
