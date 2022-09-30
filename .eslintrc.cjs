/**
 * defines which layer can import which frontend
 */
const frontendRestrictedPaths = [
  {
    target: "frontend/src/components/**/*",
    from: "node_modules/contracts",
    message: "application must not use contracts directly",
  },
  {
    target: "frontend/src/components/**/*",
    from: "frontend/src/api/**/*",
    message: "application should be store driven",
  },
  {
    target: "frontend/src/store/**/*",
    from: "frontend/src/components/**/*",
    message: "store is driving application, not the other way around",
  },
  {
    target: "frontend/src/store/**/*",
    from: "node_modules/contracts",
    message: "store must not use contracts directly",
  },
  {
    target: "frontend/src/api/**/*",
    from: "frontend/src/store/**/*",
    message: "store depends on api, not the other way around",
  },
  {
    target: "frontend/src/api/**/*",
    from: "frontend/src/components/**/*",
    message: "api should never get in direct contact with application layer",
  },
  {
    target: "frontend/src/domain/**/*",
    from: "node_modules/contracts",
    message: "domain layer must be pure",
  },
  {
    target: "frontend/src/domain/**/*",
    from: "frontend/src/components/**/*",
    message: "domain layer must be pure",
  },
  {
    target: "frontend/src/domain/**/*",
    from: "frontend/src/api/**/*",
    message: "domain layer must be pure",
  },
  {
    target: "frontend/src/domain/**/*",
    from: "frontend/src/store/**/*",
    message: "domain layer must be pure",
  },
];

/**
 * defines which layer can import which backend
 */
const backendRestrictedPaths = [
  {
    target: "backend/src/application/**/*",
    from: "node_modules/contracts",
    message:
      "application must not use contracts directly, use boundary instead",
  },
  {
    target: "backend/src/application/**/*",
    from: "backend/src/boundary/**/*",
    message:
      "boundary is edge of system, application is orchestrating internals",
  },
  {
    target: "backend/src/application/**/*",
    from: "backend/src/adapters/**/*",
    message: "application should exclusively use repositories for persistence",
  },
  {
    target: "backend/src/repository/**/*",
    from: "backend/src/application/**/*",
    message: "application is driving repository, not other way around",
  },
  {
    target: "backend/src/repository/**/*",
    from: "backend/src/boundary/**/*",
    message: "repository must not get in contact with outside world",
  },
  {
    target: "backend/src/repository/**/*",
    from: "node_modules/contracts",
    message: "repository should never use contracts, only domain",
  },
  {
    target: "backend/src/boundary/**/*",
    from: "backend/src/repository/**/*",
    message: "boundary should never get in contact with persistence layer",
  },
  {
    target: "backend/src/boundary/**/*",
    from: "backend/src/adapters/**/*",
    message: "boundary should never get in contact with persistence layer",
  },
  {
    target: "backend/src/adapters/**/*",
    from: "backend/src/repository/**/*",
    message: "repositories use adapters, not the other way around",
  },
  {
    target: "backend/src/adapters/**/*",
    from: "backend/src/application/**/*",
    message:
      "low level technical implementations must not rely on orchestration logic",
  },
  {
    target: "backend/src/adapters/**/*",
    from: "backend/src/domain/**/*",
    message: "adapters should be generic enough to not know about domain",
  },
  {
    target: "backend/src/adapters/**/*",
    from: "backend/src/boundary/**/*",
    message:
      "adapters are not supposed to interact with outside world on their own",
  },
  {
    target: "backend/src/adapters/**/*",
    from: "node_modules/contracts",
    message: "adapters should not even know about contracts",
  },
  {
    target: "backend/src/domain/**/*",
    from: "node_modules/contracts",
    message: "domain layer must be pure",
  },
  {
    target: "backend/src/domain/**/*",
    from: "backend/src/application/**/*",
    message: "domain layer must be pure",
  },
  {
    target: "backend/src/domain/**/*",
    from: "backend/src/boundary/**/*",
    message: "domain layer must be pure",
  },
  {
    target: "backend/src/domain/**/*",
    from: "backend/src/repository/**/*",
    message: "domain layer must be pure",
  },
  {
    target: "backend/src/domain/**/*",
    from: "backend/src/adapters/**/*",
    message: "domain layer must be pure",
  },
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
