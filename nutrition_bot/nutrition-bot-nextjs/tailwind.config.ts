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
        cyan: {
          400: '#00d4ff',
          500: '#00c7e0',
        },
        purple: {
          400: '#9d4edd',
          500: '#7209b7',
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
}
export default config
