# <img src="https://github.com/user-attachments/assets/b8249113-d515-4c91-a12a-f134813614e8" height="60" valign="middle" alt="Safe{Wallet}" style="background: #fff; padding: 20px; margin: 0 -20px" />

# Safe{Wallet} monorepo

🌐 [Safe{Wallet} web app](/apps/web/README.md) ・ 📱 [Safe{Wallet} mobile app](/apps/mobile/README.md)

## Overview

Welcome to the Safe{Wallet} monorepo! This repository houses multiple applications and packages managed under a unified
structure using Yarn Workspaces. The monorepo setup simplifies dependency management and ensures consistent development
practices across projects.

### Key components

- **apps/**: Contains application projects (e.g., `mobile` for the Safe{Wallet} mobile app).
- **packages/**: Shared libraries and utilities.
- **config/**: Configuration files for the monorepo.

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

## Monorepo commands

Here are some essential commands to help you navigate the monorepo:

### Workspace management

- **Run a script in a specific workspace:**

```bash
yarn workspace <workspace-name> <script>
```

Example:

```bash
yarn workspace @safe-global/web start
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

### Linting and formatting

- **Run ESLint across all workspaces:**

```bash
yarn lint
```

### Testing

- **Run unit tests across all workspaces:**

```bash
yarn test
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
- Ensure tests and linting pass before pushing changes.
- Follow the commit message guidelines.

### Tools & configurations

- **Husky**: Pre-commit hooks for linting and tests.
- **ESLint & Prettier**: Enforce coding standards and formatting.
- **Jest**: Unit testing framework.
- **Expo**: Mobile app framework for the `mobile` workspace.
- **Next.js**: React framework for the `web` workspace.

## Useful links

- [Yarn Workspaces Documentation](https://classic.yarnpkg.com/en/docs/workspaces/)
- [Expo Documentation](https://docs.expo.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)

---

If you have any questions or run into issues, feel free to open a discussion or contact the maintainers. Happy coding!
🚀
