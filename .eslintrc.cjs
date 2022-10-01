/**
 * defines which layer can import which frontend
 */
const frontendRestrictedPaths = [
  {
    target: "these/files/can't/import/from",
    from: "these/files/can't/be/imported",
    message: "the reason why target can't import from",
  },
];

/**
 * defines which layer can import which backend
 */
const backendRestrictedPaths = [
];

/**
 * @type import("eslint").Linter.Config
 */
const config = {
  overrides: [
    {
      files: [
        "**/*.{spec,e2e,demoize}.{ts,tsx}",
        "frontend/src/test/**",
        "backend/src/test/**",
      ],
      rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
        "import/no-internal-modules": "off",
        "import/no-restricted-paths": [
          "error",
          {
            zones: [
              {
                target: "frontend/src/**/*.demoize.{ts,tsx}",
                from: "frontend/src/test/render",
                message:
                  "includes jest related imports that won't work in the browser",
              },
            ],
          },
        ],
      },
    },
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  settings: {
    "import/resolver": {
      typescript: true,
      node: true,
    },
  },
  root: true,
  rules: {
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "import/order": "error",
    "import/namespace": "off",
    "import/default": "off",
    "import/no-named-as-default": "off",
    "import/no-named-as-default-member": "off",
    "no-restricted-imports": [
      "error",
      {
        name: "react-redux",
        importNames: ["useSelector", "useDispatch"],
        message: "use store instead",
      },
      {
        name: "date-fns",
        message: "use date-fns/fp instead",
      },
    ],
    "import/no-internal-modules": [
      "error",
      {
        allow: [
          "fp-ts/lib/function",
          "date-fns/fp",
          "react-icons/*",
          "react-dom/client",
          "demoize/build/plugin.js",
          "tailwindcss/colors",
          "@material-tailwind/react/utils/withMT",
        ],
      },
    ],
    "import/no-restricted-paths": [
      "error",
      {
        zones: [...frontendRestrictedPaths, ...backendRestrictedPaths],
      },
    ],
  },
};

module.exports = config;
