import * as Esbuild from "esbuild";
import { lessLoader } from "esbuild-plugin-less";

Esbuild.serve(
  {
    servedir: ".",
    port: 8000,
  },
  {
    entryPoints: ["src/index.ts"],
    bundle: true,
    outdir: "bundle",
    sourcemap: "inline",
    plugins: [lessLoader()],
    loader: {
      ".png": "file",
      ".woff": "file",
      ".eot": "file",
      ".ttf": "file",
    },
  },
).then((result) => {
  console.log(`server up and running at ${result.host}:${result.port}`);
});
