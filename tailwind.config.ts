import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-navy': '#1B2B4B',
        'brand-blue': '#2E5C8A',
        'brand-green': '#276749',
        'brand-accent': '#4A90D9',
      },
    },
  },
  plugins: [],
}
export default config
