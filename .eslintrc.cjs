module.exports = {
  env: {
    browser: true,
    es2022: true,
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  overrides: [
    {
      env: {
        commonjs: true,
      },
      files: ["./**/*.cjs"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
};
