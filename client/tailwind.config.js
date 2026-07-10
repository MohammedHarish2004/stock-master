/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', // Blue
        success: '#22c55e', // Green
        warning: '#f97316', // Orange
        danger: '#ef4444', // Red
      }
    },
  },
  plugins: [],
}
