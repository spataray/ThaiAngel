import js from "@eslint/js";
import globals from "globals";
import html from "eslint-plugin-html";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.html"],
    plugins: {
      html,
    },
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: "script",
      globals: {
        ...globals.browser,
        firebase: "readonly",
        TAScreensaver: "readonly",
        ZXing: "readonly",
        YT: "readonly",
        google: "readonly",
      },
    },
    rules: {
      "no-var": "off",
      "prefer-const": "off",
      "prefer-arrow-callback": "off",
      "no-unused-vars": "off",
      "no-console": "off",
      "no-empty": "warn",
      "no-prototype-builtins": "off",
      "semi": ["error", "always"],
    },
  },
];
