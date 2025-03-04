# Safe{Wallet} mobile app 📱

This project is now part of the **@safe-global/safe-wallet** monorepo! The monorepo setup allows centralized management
of multiple
applications and shared libraries. This workspace (`apps/mobile`) contains the Safe Mobile App.

You can run commands for this workspace in two ways:

1. **From the root of the monorepo using `yarn workspace` commands**
2. **From within the `apps/mobile` directory**

## Prerequisites

In the addition to the monorepo prerequisites, the mobile app requires the following:

- Expo CLI
- iOS/Android Development Tools
- [Maestro](https://maestro.mobile.dev/) if you want to run E2E tests

You can follow the [expo documentation](https://docs.expo.dev/get-started/set-up-your-environment/) to install the CLI
and set up your development environment.

Follow the [Maestro](https://maestro.mobile.dev/) documentation to install the tool for E2E testing.

## Setup the project

1. Install all dependencies from the **root of the monorepo**:

```bash
yarn install
```

## Running the app

There is a .env.development file in the root of the mobile app that contains the following environment variables:

```bash
APP_VARIANT=production
GOOGLE_SERVICES_PLIST_DEV=./GoogleService-Info.plist
GOOGLE_SERVICES_JSON=./google-services.json
GOOGLE_SERVICES_PLIST=./GoogleService-Info.plist
```

When any expo command runs it will automatically load the `.env.development` file. If you want to make modifications
to the environment variables, you can create a `.env.local` file in the root of the mobile app.

For local development you need to place the `google-services.json` and `GoogleService-Info.plist` files in the root of
the mobile app.

### Running on iOS

From the root of the monorepo:

```bash
yarn workspace @safe-global/mobile start:ios
```

Or directly from the `apps/mobile` directory:

```bash
yarn start:ios
```

> [!NOTE]
>
> From now on for brevity we will only show the command to run from the root of the monorepo. You can always run the
> command from the `apps/mobile` directory you just need to omit the `workspace @safe-global/mobile`.

### Running on Android

From the root of the monorepo:

```bash
yarn workspace @safe-global/mobile start:android
```

### How to open the custom devtools menu

The app supports **Redux**, **RTK Query**, and **React DevTools**. To access these tools:

1. Run the app.
2. In the terminal where the Expo server is running, press `Shift + M`.
3. Select the desired DevTools option for debugging. Happy debugging! 👨‍💻👩‍💻

## Running the Storybook

### Running in the browser

Run the storybook command from the root:

```bash
yarn workspace @safe-global/mobile storybook:web
```

### Running on a mobile device

To run the storybook on a mobile device:

```bash
yarn workspace @safe-global/mobile storybook:[ios|android]
```

To View stories press `i` on iOS or `a` on Android.

## How to run the E2E Tests

We use [Maestro](https://maestro.mobile.dev/) for E2E testing. Before running tests, install Maestro following the
documentation for your OS.

### Run a dev build and E2E tests

To build the app for tests:

#### For iOS:

```bash
yarn workspace @safe-global/mobile e2e:metro-ios
```

#### For Android:

```bash
yarn workspace @safe-global/mobile e2e:metro-android
```

These commands include `.e2e.ts|.e2e.tsx` files for mocking services or adding test-specific code.

### Run the tests

In a second terminal run:

```bash
yarn workspace @safe-global/mobile e2e:run
```

### Use Maestro Studio to write tests

To write tests with Maestro Studio, run:

```bash
maestro studio
```

Export the generated YAML file to the `e2e` folder and include it in the test suite.

### Running E2E tests in CI

To run tests in CI, add the `eas-build-ios:build-and-maestro-test` label to a PR. This triggers the Expo CI pipeline to
execute the tests.

## Unit tests

We use **Jest** and the [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) for
unit, component, and hook tests.

Run tests:

```bash
yarn workspace @safe-global/mobile test
```

Run in watch mode:

```bash
yarn workspace @safe-global/mobile test:watch
```

Check coverage:

```bash
yarn workspace @safe-global/mobile test
```

Navigate to the `coverage` folder and open `index.html` in your browser.

## Running ESLint & Prettier

This project uses ESLint, Prettier, and TypeScript for linting and formatting.

Run linting from the root:

```bash
yarn workspace @safe-global/mobile lint
```

This command validates files with TypeScript, ESLint, and Prettier configurations.
