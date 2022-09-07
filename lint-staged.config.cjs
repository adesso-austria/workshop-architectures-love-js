module.exports = {
  "*.{ts,tsx}": [
    "prettier --write",
    "eslint --fix",
    "npm run lint:file-casing --",
  ],
};
