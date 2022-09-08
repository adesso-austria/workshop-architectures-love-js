import console from "console";
import process from "process";
import yargs from "yargs";
import dotenv from "dotenv";
dotenv.config();

const options = yargs(process.env.JEST_OPTIONS?.split(" ") ?? [])
  .option("filter", {
    type: "array",
  })
  .parse();

const projectFilter =
  options.filter == null
    ? () => true
    : (() => {
        const regex = new RegExp(`^(${options.filter.join("|")})$`);
        return (name) => regex.test(name);
      })();

/**
 * node modules are never transformed by default.
 * This is a problem when it comes to loading an esm module
 * in a jest environment, so transpile the following modules
 * nonetheless
 */
const transformNodeModules = [
  "utils",
  "node-fetch",
  "openapi-typescript-fetch",
  "data-uri-to-buffer",
  "fetch-blob",
  "formdata-polyfill",
  "demoize",
];

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const commonOptions = {
  transformIgnorePatterns: [
    `node_modules/(?!(${transformNodeModules.join("|")})/)`,
  ],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "\\.(j|t)sx?$": `${process.cwd()}/scripts/jest-esbuild-typescript.js`,
  },
};

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest['projects']} */
const projects = [
  {
    ...commonOptions,
    displayName: "frontend",
    rootDir: "frontend/src",
    testEnvironment: "jsdom",
    testMatch: ["**/?(*.)+(spec).[jt]s?(x)"],
    coverageDirectory: "frontend/coverage",
  },
  {
    ...commonOptions,
    displayName: "backend",
    rootDir: "backend/src",
    testEnvironment: "node",
    testMatch: ["**/?(*.)+(spec).[jt]s?(x)"],
    coverageDirectory: "backend/coverage",
  },
  {
    ...commonOptions,
    displayName: "backend e2e",
    rootDir: "backend/src",
    testEnvironment: "node",
    testMatch: ["**/?(*.)+(e2e).[jt]s?(x)"],
    coverageDirectory: "backend/coverage",
  },
].filter(({ displayName }) => projectFilter(displayName));

if (projects.length === 0) {
  // eslint-disable-next-line no-console
  console.warn("no projects to test, exiting...");
  process.exit(1);
}

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/*.{demoize,e2e,spec}.{ts,tsx}",
    "!**/test-utils/**/*.{ts,tsx}",
    "!**/test-data/**/*.{ts,tsx}",
  ],
  coverageProvider: "v8",
  projects,
};
