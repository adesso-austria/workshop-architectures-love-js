import * as Crypto from "crypto";
import * as Esbuild from "esbuild";

/**
 * @callback getOptions
 * @param {string} path
 * @param {"jsdom" | "node"} testEnvironment
 * @returns {import("esbuild").BuildOptions}
 *
 * @type {getOptions}
 */
const getOptions = (path) => ({
  format: "cjs",
  loader: path.endsWith("tsx")
    ? "tsx"
    : path.endsWith("jsx")
    ? "jsx"
    : path.endsWith("ts")
    ? "ts"
    : "js",
  sourcemap: "external",
  sourcesContent: true,
  target: "es2020",
});

/**
 * @type {import('@jest/transform').AsyncTransformer
 */
const transformer = {
  getCacheKey: (source, path) => {
    return Crypto.createHash("sha1")
      .update(source + getOptions(path))
      .digest("base64");
  },
  process: (source, path) => {
    const result = Esbuild.transformSync(source, getOptions(path));
    result.map = JSON.parse(result.map);
    result.map.sources = [path];
    result.map.file = path;
    const base64Map = Buffer.from(JSON.stringify(result.map), "utf-8").toString(
      "base64",
    );
    const code = `${result.code}//# sourceMappingURL=data:application/json;base64,${base64Map}`;
    return { code };
  },
};

export default transformer;
