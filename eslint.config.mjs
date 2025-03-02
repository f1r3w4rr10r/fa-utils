import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.js"], languageOptions: { sourceType: "script" } },
  {
    languageOptions: {
      globals: { ...globals.browser, descriptions: "readonly" },
    },
  },
  pluginJs.configs.recommended,
  eslintConfigPrettier,
];
