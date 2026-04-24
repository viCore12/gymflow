import type { Config } from "tailwindcss";
import preset from "@gymflow/config/tailwind/preset";

const config: Config = {
  presets: [preset as Config],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
};

export default config;
