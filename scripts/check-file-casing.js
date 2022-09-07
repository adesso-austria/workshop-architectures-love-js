import * as Path from "path";

const cwd = process.cwd();

const files = process.argv.slice(2).map((file) => Path.relative(cwd, file));
const regex = /^[a-z-\/]+(\.(spec|e2e|demoize))?\.tsx?$/;

const invalidFiles = files.filter((file) => !regex.test(file));

// eslint-disable-next-line no-console
console.log(invalidFiles.map((file) => `${file} must match kebap-case`));

process.exit(invalidFiles.length > 0 ? 1 : 0);

