import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        payrail: {
          draft: "#94a3b8",
          submitted: "#3b82f6",
          waiting: "#f59e0b",
          approved: "#22c55e",
          finance: "#14b8a6",
          partial: "#a855f7",
          paid: "#10b981",
          rejected: "#ef4444",
          governance: "#f97316",
        },
      },
    },
  },
  plugins: [],
};
export default config;
