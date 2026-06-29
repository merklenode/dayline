import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [".open-next/**", ".wrangler/**", ".vercel/**"],
  },
  ...nextVitals,
];

export default eslintConfig;
