import type { Config } from "tailwindcss";
import preset from "@gymflow/config/tailwind/preset";

const config: Config = {
  presets: [preset as Config],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
};

export default config;
