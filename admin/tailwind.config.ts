import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        'primary-dark': '#3730a3',
        success: '#16a34a',
        danger: '#dc2626',
        warning: '#f59e0b',
      },
    },
  },
  plugins: [],
}
export default config