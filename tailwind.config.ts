import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";
const flowbite = require("flowbite-react/tailwind");


const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    './node_modules/flowbite-react/**/*.js', 
    
    flowbite.content(),
  ],
  theme: {
    extend: {
      animation: {
        'infinite-scroll': 'infinite-scroll 60s linear infinite',
        'infinite-scroll-reverse': 'infinite-scroll-reverse 60s linear infinite',
        'fadeIn': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        'infinite-scroll': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' },
        },
        'infinite-scroll-reverse': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  darkMode: "class",
  plugins: [nextui(), 

  ]
};
export default config;
