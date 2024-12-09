import { depCheckerTypescriptConfig } from '@dep-checker/eslint-config'
import path from 'path'
import { fileURLToPath } from 'url'

export default [
  {
    ...depCheckerTypescriptConfig,
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
        project: './tsconfig.json',
      },
    },
  },
]
