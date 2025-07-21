from pathlib import Path
import zipfile

# Define README content
readme_content = """# 🛡️ Safe Wallet

🌐 [Web App](/apps/web/README.md) ・ 📱 [Mobile App](/apps/mobile/README.md)

---

## 🧭 Overview

Welcome to the **Safe Wallet** monorepo – a secure, multichain, automated wallet interface powered by [Gnosis Safe](https://safe.global/) and extended with GitHub, Slack, and Discord integrations.

This monorepo manages multiple full-stack apps under a unified development environment using **Yarn Workspaces**. It simplifies dependency management and ensures consistent tooling across web, mobile, and package workspaces.

---

## 📁 Project Structure

```
Safe-wallet/
├── apps/
│   ├── web/           # Next.js Safe Dashboard (UI)
│   └── mobile/        # Expo-based React Native wallet
├── packages/          # Shared SDKs, utilities, logic
├── config/            # Shared TS, ESLint, Prettier configs
├── .github/           # GitHub Actions, workflows, webhooks
└── README.md          # You are here!
```

---

## ⚙️ Prerequisites

Before starting, install:

- **Node.js**: v18.x or later → [nodejs.org](https://nodejs.org/)
- **Yarn** (v4.5.3+) via Corepack:

```bash
corepack enable
```

---

## 🚀 Getting Started

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/thegoodeth12/Safe-wallet.git
cd Safe-wallet
```

### 2️⃣ Install Dependencies

```bash
yarn install
```

This installs all workspaces and prepares your environment.

### 3️⃣ Configure Environment Variables

Create `.env` files for each app:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

Add required keys like:

```env
NEXT_PUBLIC_SAFE_NETWORK=mainnet
NEXT_PUBLIC_INFURA_API_KEY=your-key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## 🧪 Monorepo Commands

### 🔁 Workspace Scripts

Run scripts within a workspace:

```bash
yarn workspace <workspace-name> <script>
```

#### Examples:

```bash
yarn workspace web dev         # Run the web app
yarn workspace mobile start    # Start the mobile app
yarn workspace web lint        # Lint the web code
```

---

## 💬 Slack & Discord Notifications

This repo includes GitHub Actions to notify **Slack and Discord** when:

- A Safe proposal is created
- A transaction is signed or executed
- A GitHub PR triggers a proposal

> You must add these as GitHub secrets:

- `SLACK_WEBHOOK_URL`
- `DISCORD_WEBHOOK_URL`

See `.github/workflows/proposal-notify.yml` for implementation.

---

## 🛠 Developer Tools

| Tool         | Purpose                        |
|--------------|--------------------------------|
| **Yarn**     | Workspace dependency manager   |
| **Husky**    | Git hooks for lint/test        |
| **ESLint**   | Code linting                   |
| **Prettier** | Code formatting                |
| **Jest**     | Unit testing                   |
| **Next.js**  | Web dashboard framework        |
| **Expo**     | Mobile runtime engine          |
| **Safe SDK** | Gnosis Safe interactions       |
"""

# Create a temp directory and write README.md
temp_dir = Path("/mnt/data/safe_wallet_readme")
temp_dir.mkdir(parents=True, exist_ok=True)
readme_path = temp_dir / "README.md"
readme_path.write_text(readme_content, encoding="utf-8")

# Create a zip file
zip_path = Path("/mnt/data/SafeWallet_Readme.zip")
with zipfile.ZipFile(zip_path, 'w') as zipf:
    zipf.write(readme_path, arcname="README.md")

zip_path
