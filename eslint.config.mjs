import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'prisma/migrations/**'],
  },
];

export default eslintConfig;
