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

    },
  },
  darkMode: "class",
  plugins: [nextui(), 

  ]
};
export default config;
