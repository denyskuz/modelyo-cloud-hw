/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  // Avoid requiring Watchman in restricted/sandboxed environments.
  watchman: false,
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(t)sx?$": ["ts-jest", { useESM: false }],
  },
  collectCoverageFrom: ["src/auth/**/*.ts", "!src/auth/**/*.d.ts"],
};
