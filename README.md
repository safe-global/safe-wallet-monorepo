# <img src="https://github.com/user-attachments/assets/b8249113-d515-4c91-a12a-f134813614e8" height="60" valign="middle" alt="Safe{Wallet}" style="background: #fff; padding: 20px; margin: 0 -20px" />

# Safe{Wallet} monorepo

🌐 [Safe{Wallet} web app](/apps/web/README.md) ・ 📱 [Safe{Wallet} mobile app](/apps/mobile/README.md)

## Overview

Welcome to the Safe{Wallet} monorepo! Safe (formerly Gnosis Safe) is a multi-signature smart contract wallet for Ethereum and other EVM chains, requiring multiple signatures to execute transactions.

This repository houses both web and mobile applications along with shared packages, managed under a unified structure using Yarn Workspaces. The monorepo setup simplifies dependency management and ensures consistent development practices across projects.

### Key components

- **apps/web** - Next.js web application ([detailed documentation](/apps/web/README.md))
- **apps/mobile** - Expo/React Native mobile application ([detailed documentation](/apps/mobile/README.md))
- **packages/store** - Shared Redux store used by both platforms
- **packages/utils** - Shared utilities and TypeScript types
- **config/** - Shared configuration files

> [!IMPORTANT]
>
> For detailed setup instructions and platform-specific development guides, please refer to the dedicated README files:
>
> - **[Web App Documentation](/apps/web/README.md)** - Complete guide for the Next.js web application
> - **[Mobile App Documentation](/apps/mobile/README.md)** - Complete guide for the mobile application, including iOS/Android setup

## Getting started

To get started, ensure you have the required tools installed and follow these steps:

### Prerequisites

- **Node.js**: Install the latest stable version from [Node.js](https://nodejs.org/).
- **Yarn**: Use Yarn version 4.5.3 or later

to install it with the latest node version you can simply do

```bash
corepack enable
```

and then just run

```bash
yarn
```

This will install the required version of yarn and resolve all dependencies.

> [!NOTE]
>
> Corepack is a tool to help with managing versions of your package managers. It exposes binary proxies for each supported package manager that, when called, will identify whatever package manager is
> configured for the current project, download it if needed, and finally run it.

### Initial setup

1. Clone the repository:

```bash
git clone <repo-url>
cd monorepo
```

2. Install dependencies:

```bash
yarn install
```

### Quick start commands

```bash
# Run web app in development mode
yarn workspace @safe-global/web dev

# Run mobile app in development mode
yarn workspace @safe-global/mobile start

# Run tests for web
yarn workspace @safe-global/web test

# Run Storybook for web
yarn workspace @safe-global/web storybook
```

> [!TIP]
>
> For comprehensive setup instructions, environment variables, testing, and platform-specific workflows, see:
>
> - **[Web App README](/apps/web/README.md)** - Environment setup, Cypress E2E tests, Storybook, and more
> - **[Mobile App README](/apps/mobile/README.md)** - iOS/Android setup, Maestro E2E tests, Expo configuration, and more

## Monorepo commands

Here are some essential commands to help you navigate the monorepo:

### Workspace management

- **Run a script in a specific workspace:**

```bash
yarn workspace <workspace-name> <script>
```

Example:

```bash
yarn workspace @safe-global/web dev
```

- **Add a dependency to a specific workspace:**

```bash
yarn workspace <workspace-name> add <package-name>
```

- **Remove a dependency from a specific workspace:**

```bash
yarn workspace <workspace-name> remove <package-name>
```

> [!Note]
>
> Yarn treats commands that contain a colon as global commands. For example if you have a
> command in a workspace that has a colon and there isn't another workspace that has the same command,
> you can run the command without specifying the workspace name. For example:
>
> ```bash
> yarn cypress:open
> ```
>
> is equivalent to:
>
> ```bash
> yarn workspace @safe-global/web cypress:open
> ```

### Linting, formatting, and type-checking

- **Run ESLint across all workspaces:**

```bash
yarn lint
```

- **Run Prettier to check formatting:**

```bash
yarn prettier
```

- **Run type-check for a workspace:**

```bash
yarn workspace @safe-global/web type-check
yarn workspace @safe-global/mobile type-check
```

### Testing

- **Run unit tests across all workspaces:**

```bash
yarn test
```

- **Run E2E tests (web only):**

```bash
yarn workspace @safe-global/web cypress:open  # Interactive mode
yarn workspace @safe-global/web cypress:run   # Headless mode
```

## Contributing

### Adding a new workspace

1. Create a new directory under `apps/` or `packages/`.
2. Add a `package.json` file with the appropriate configuration.
3. Run:

```bash
yarn install
```

### Best practices

- Use Yarn Workspaces commands for managing dependencies.
- Ensure type-check, lint, prettier, and tests pass before pushing changes.
- Follow the [semantic commit message guidelines](https://www.conventionalcommits.org/).
- For AI contributors, see [AGENTS.md](AGENTS.md) for detailed guidelines.

### Tools & configurations

- **Husky**: Pre-commit hooks for linting, formatting, and type-checking.
- **ESLint & Prettier**: Enforce coding standards and formatting.
- **Jest**: Unit testing framework.
- **Cypress**: E2E testing for the web app.
- **Storybook**: Component documentation and development for the web app.
- **Expo**: Mobile app framework for the `mobile` workspace.
- **Next.js**: React framework for the `web` workspace.
- **Tamagui**: UI component library for the mobile app.

## Release process

For information on releasing the web app, see the [Automated Release Procedure](apps/web/docs/release-procedure-automated.md).

## Useful links

- [Yarn Workspaces Documentation](https://yarnpkg.com/features/workspaces)
- [Expo Documentation](https://docs.expo.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Storybook Documentation](https://storybook.js.org/docs)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [Safe Developer Docs](https://docs.safe.global/)

---

If you have any questions or run into issues, feel free to open a discussion or contact the maintainers. Happy coding!
🚀
