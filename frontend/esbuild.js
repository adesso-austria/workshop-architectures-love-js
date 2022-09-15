import console from "console";
import * as Fs from "fs/promises";
import * as Path from "path";
import * as Http from "http";
import process from "process";
import {URL} from "url";
import * as Esbuild from "esbuild";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import tailwind from "tailwindcss";
import browserSync from "browser-sync";
import { demoize } from "demoize/build/plugin.js";

const hasFlag = (flag) => process.argv.includes(flag);

const shouldServe = hasFlag("--serve");
const shouldAnalyze = hasFlag("--analyze");
const shouldLogVerbose = hasFlag("--verbose");
const inProd = hasFlag("--prod");
const shouldMinify = hasFlag("--minify");

/**
 * @type Esbuild.BuildOptions
 */
const options = {
  entryPoints: {
    index: "build/application/index.js",
  },
  bundle: true,
  format: "esm",
  target: "es2020",
  sourcemap: inProd ? false : "inline",
  sourcesContent: !inProd,
  minify: shouldMinify || inProd,
  legalComments: "linked",
  plugins: [
    {
      name: "css",
      setup: (build) => {
        const cssContents = new Map();

        build.onResolve({ filter: /\.\/.*\.css$/ }, async (args) => {
          const sourcePath = Path.resolve(args.resolveDir, args.path).replace(
            "build",
            "src",
          ); // css isn't copied to build dir

          const source = await Fs.readFile(sourcePath);

          const { css: transformed } = await postcss([
            tailwind(),
            autoprefixer(),
          ]).process(source, { from: args.path });

          cssContents.set(args.path, transformed); // cache transformed css

          return {
            path: args.path,
            namespace: "css", // put it in virtual fs channel
          };
        });

        build.onLoad({ filter: /.*/, namespace: "css" }, (args) => {
          const css = cssContents.get(args.path);
          return { contents: css, loader: "css" };
        });
      },
    },
    demoize({
      globPattern: "build/**/*.demoize.js",
    }),
  ],
};

const noCache = new Set(["demoize.js", "renderer.js"]);

const run = async () => {
  if (shouldServe) {
    const fileCache = {};

    const getCachePath = (file) =>
      `/${Path.relative(Path.resolve("www"), file.path)}`;

    const setCachedFiles = (files) => {
      const updatedFiles = [];
      for (const file of files) {
        const cachePath = getCachePath(file);
        updatedFiles.push(cachePath);
        fileCache[cachePath] = file.text;
      }
      return updatedFiles;
    };

    const getCached = (path) =>
      noCache.has(path) ? undefined : fileCache[path];
    const setCached = (path) => (content) => (fileCache[path] = content);

    const readFile = (path, encoding = "utf8") => {
      const cached = getCached(path);
      const filepath = Path.resolve(process.cwd(), "www", `.${path}`);
      return cached != null
        ? Promise.resolve(cached)
        : Fs.readFile(filepath, encoding)
            .then(setCached(path))
            .catch(() => undefined);
    };

    ///////////////////
    //  BrowserSync  //
    ///////////////////
    const bs = browserSync.init({
      port: 3000,
      server: "./www",
      open: false,
      middleware: [
        (req, res, next) => {
          const src = new URL(req.url, `http://${req.headers.host}`);
          if (!src.pathname.startsWith("/_api")) {
            return next();
          }
          const target = new URL(src);
          target.pathname = src.pathname.replace("/_api", "");
          target.port = "8080";
          const proxyReq = Http.request(target, (proxyRes) => {
            proxyRes.pipe(res, { end: true });
          });
          proxyReq.on("error", (error) => {
            // eslint-disable-next-line no-console
            console.error(
              `error forwarding ${src.href} to ${target.href}:`,
              error,
            );
            res.statusCode = 500;
            res.write(
              `problem forwarding ${src.pathname} to ${target.href}: ${error.message}`,
            );
            res.end();
          });
          req.pipe(proxyReq, { end: true });
        },
        (req, res) => {
          const url = new URL(req.url, `http://${req.headers.host}`);
          readFile(url.pathname)
            .then((result) => result ?? readFile("/index.html"))
            .then((content) => {
              res.write(content);
              res.end();
            });
        },
      ],
    });

    //////////////
    //  ESBUILD //
    //////////////
    Esbuild.build({
      ...options,
      outdir: "www",
      watch: {
        onRebuild: (error, result) => {
          const updatedFiles = setCachedFiles(result.outputFiles);
          bs.reload(updatedFiles);
        },
      },
      write: false,
      incremental: true,
    }).then((result) => {
      setCachedFiles(result.outputFiles);
    });
  } else {
    const result = await Esbuild.build({
      ...options,
      outdir: "bundle",
      metafile: shouldAnalyze,
    });

    if (shouldAnalyze) {
      const output = await Esbuild.analyzeMetafile(result.metafile, {
        color: true,
        verbose: shouldLogVerbose,
      });
      // eslint-disable-next-line no-console
      console.log(output);
    }
  }
};

run();
