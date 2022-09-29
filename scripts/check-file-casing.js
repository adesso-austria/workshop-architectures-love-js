import * as Path from "path";
import { ESLint } from "eslint";

const linter = new ESLint();

const cwd = process.cwd();

const filePaths = process.argv.slice(2).map((file) => Path.relative(cwd, file));
const files = await Promise.all(
  filePaths.map((path) =>
    linter
      .isPathIgnored(path)
      .then((isIt) =>
        isIt ? Promise.resolve(undefined) : Promise.resolve(path),
      ),
  ),
).then((files) => files.filter((file) => file != null));

const regex = /^[a-z-\/]+(\.(spec|e2e|demoize))?\.tsx?$/;

const invalidFiles = files.filter((file) => !regex.test(file));

// eslint-disable-next-line no-console
console.log(invalidFiles.map((file) => `${file} must match kebap-case`));

process.exit(invalidFiles.length > 0 ? 1 : 0);
