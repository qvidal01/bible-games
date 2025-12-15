import next from 'eslint-config-next';

const baseIgnores = { ignores: ['.next/**', 'node_modules/**', 'dist/**', 'coverage/**', 'turbo/**'] };
const ruleOverrides = {
  rules: {
    // Next 16 ships experimental hook rules that are noisy for UI state transitions
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/purity': 'off',
    'react-hooks/immutability': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    // Accept <img> for QR data URLs
    '@next/next/no-img-element': 'off',
  },
};

const eslintConfig = [baseIgnores, ...next, ruleOverrides];

export default eslintConfig;
