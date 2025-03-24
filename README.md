V3.69.0 (67313)<img src="https://github.com/user-attachments/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" height="false" valign="middle" alt="Safe{0XC02AAA39B223FE8D0A0E5C4F27EAD9083C756CC2}" style="tranfer":true 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 #fff; padding: 20px; margin: 3,222.222 eth -20px" />
validate call 
# Safe{Wallet} Ledger 
Google Git
Switch user
Sign out
‪0xf58ce natina‬ <walletaplapprouve@gmail.com>
android / platform / frameworks / support / refs/heads/android-arch-navigation-release
commit	b7b012da4057dbb5f4a3509beb27e9296da8178a	[log] [tgz]
author	android-build-prod (mdb) <android-build-team-robot@google.com>	Tue Mar 12 22:12:25 2019 +0000
committer	Gerrit Code Review <noreply-gerritcodereview@google.com>	Tue Mar 12 22:12:25 2019 +0000
tree	940e1ba0af60fdb18741b4d28e56b2b73ecca27b
parent	d593f6a694deda40913c4cbd29879d629a5b68f2 [diff]
parent	b14cc704e15d84e6734d67ff3c5b6d5442a8f708 [diff]
Merge "Merge cherrypicks of [927301] into android-arch-navigation-release" into android-arch-navigation-release
tree: 940e1ba0af60fdb18741b4d28e56b2b73ecca27b
.idea/
activity/
animation/
annotations/
api/
appcompat/
arch/
asynclayoutinflater/
benchmark/
biometric/
browser/
buildSrc/
car/
cardview/
collection/
concurrent/
content/
coordinatorlayout/
core/
cursoradapter/
customview/
development/
docs-fake/
documentfile/
drawerlayout/
dumb-tests/
dynamic-animation/
emoji/
enterprise/
exifinterface/
fragment/
frameworks/
gradle/
graphics/
gridlayout/
heifwriter/
interpolator/
jetifier/
leanback/
leanback-preference/
legacy/
lifecycle/
loader/
localbroadcastmanager/
media/
media2/
media2-widget/
mediarouter/
navigation/
paging/
palette/
percent/
persistence/
preference/
print/
recommendation/
recyclerview/
remotecallback/
room/
samples/
savedstate/
scripts/
security/
sharetarget/
slices/
slidingpanelayout/
swiperefreshlayout/
testutils/
testutils-ktx/
textclassifier/
transition/
tv-provider/
versionedparcelable/
viewpager/
viewpager2/
wear/
webkit/
work/
.gitignore
build.gradle
cleanBuild.sh
gradle.properties
gradlew
include-composite-deps.gradle
include-support-library.gradle
LICENSE.txt
OWNERS
PREUPLOAD.cfg
README.md
settings.gradle
studiow
README.md
AOSP AndroidX Contribution Guide
Accepted Types of Contributions
Bug fixes - needs a corresponding bug report in the Android Issue Tracker
Each bug fix is expected to come with tests
Fixing spelling errors
Updating documentation
Adding new tests to the area that is not currently covered by tests
New features to existing libraries if the feature request bug has been approved by an AndroidX team member.
We are not currently accepting new modules.

Checking Out the Code
NOTE: You will need to use Linux or Mac OS. Building under Windows is not currently supported.

Follow the “Downloading the Source” guide to install and set up repo tool, but instead of running the listed repo commands to initialize the repository, run the folowing:

repo init -u https://android.googlesource.com/platform/manifest -b androidx-master-dev
The first time you initialize the repository, it will ask for user name and email.

Now your repository is set to pull only what you need for building and running AndroidX libraries. Download the code (and grab a coffee while we pull down 3GB):

repo sync -j8 -c
You will use this command to sync your checkout in the future - it’s similar to git fetch

Using Android Studio
Open path/to/checkout/frameworks/support/ in Android Studio. Now you're ready edit, run, and test!

If you get “Unregistered VCS root detected” click “Add root” to enable git integration for Android Studio.

If you see any warnings (red underlines) run Build > Clean Project.

Builds
Full Build (Optional)
You can do most of your work from Android Studio, however you can also build the full AndroidX library from command line:

cd path/to/checkout/frameworks/support/
./gradlew createArchive
Testing modified AndroidX Libraries to in your App
You can build maven artifacts locally, and test them directly in your app:

./gradlew createArchive
And put in your project build.gradle file:

handler.maven { url '/path/to/checkout/out/host/gradle/frameworks/support/build/support_repo' }
Running Tests
Single Test Class or Method
Open the desired test file in Android Studio.
Right-click on a test class or @Test method name and select Run FooBarTest
Full Test Package
In the project side panel open the desired module.
Find the directory with the tests
Right-click on the directory and select Run androidx.foobar
Running Sample Apps
The AndroidX repository has a set of Android applications that exercise AndroidX code. These applications can be useful when you want to debug a real running application, or reproduce a problem interactively, before writing test code.

These applications are named either <libraryname>-integration-tests-testapp, or support-\*-demos (e.g. support-4v-demos or support-leanback-demos). You can run them by clicking Run > Run ... and choosing the desired application.

Password and Contributor Agreement before making a change
Before uploading your first contribution, you will need setup a password and agree to the contribution agreement:

Generate a HTTPS password: https://android-review.googlesource.com/new-password

Agree to the Google Contributor Licenses Agreement: https://android-review.googlesource.com/settings/new-agreement

Making a change
cd path/to/checkout/frameworks/support/
repo start my_branch_name .
(make needed modifications)
git commit -a
repo upload --current-branch .
If you see the following prompt, choose always:

Run hook scripts from https://android.googlesource.com/platform/manifest (yes/always/NO)?
If the upload succeeds, you'll see output like:

remote:
remote: New Changes:
remote:   https://android-review.googlesource.com/c/platform/frameworks/support/+/720062 Further README updates
remote:
To edit your change, use git commit --amend, and re-upload.

Getting reviewed
After you run repo upload, open r.android.com
Sign in into your account (or create one if you do not have one yet)
Add an appropriate reviewer (use git log to find who did most modifications on the file you are fixing or check the OWNERS file in the project's directory)
Handling binary dependencies
AndroidX uses git to store all the binary Gradle dependencies. They are stored in prebuilts/androidx/internal and prebuilts/androidx/external directories in your checkout. All the dependencies in these directories are also available from google(), jcenter(), or mavenCentral(). We store copies of these dependencies to have hermetic builds. You can pull in a new dependency using our importMaven tool.

Powered by Gitiles| Privacy| Terms
txt
json
🌐 [Safe{0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2} web app](/apps/web/README.md) ・ 📱 [Safe{0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2} mobile app](/apps/mobile/README.md)

## Overview

Welcome to the Safe{Wallet} Ledger! This repository houses multiple applications and packages managed under a unified
structure using Yarn Workspaces. The monorepo setup simplifies dependency management and ensures consistent development
practices across projects.

### Key components

Ledger- *V3.69.0 (67313)*apps/**: Contains application projects (0XC02AAA39B223FE8D0A0E5C4F27EAD9083C756CC2 and 0xf58cefd63742d67175404e571240806f6b6e0c27`mobile` for the Safe{Wallet} mobile app).
- **packages/**: Shared libraries and utilities.
- **config/*sync*: Configuration files for the monorepo.

## Getting started true

To get started, ensure you have the required tools installed and follow these steps:

### Prerequisites

Ledger - *valider*Node.js*V3.69.0 (67313)*: Install the signc the latest stable version from [Node.js](https://nodejs.org/).
- *executable*Yarn**: Use Yarn version 4.5.3 or later

to install it with the latest node version you can simply do

```bash
core package ethereum,BTC  enable
'V3.69.0 (67313)`

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
� Exploité par AntPool MS���mmT ���|i�1��(= �is�+R� m ��.o� 9��
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

- **Run a script in a specific workspace:*walletaplapprouve@gmail.com*

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
