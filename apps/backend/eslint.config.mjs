import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/**"]),
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_"
        }
      ]
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier
]);
