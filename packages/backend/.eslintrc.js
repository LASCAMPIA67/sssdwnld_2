module.exports = {
  root: true,
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:jest/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
  },
  plugins: ["jest"],
  rules: {
    "linebreak-style": ["error", "unix"],
  },
  overrides: [
    {
      files: ["test/**/*.js"],
      env: {
        jest: true,
      },
    },
  ],
};
