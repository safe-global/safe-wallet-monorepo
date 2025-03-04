# E2E Testing Guidelines for React Native

This document outlines best practices for writing and maintaining end-to-end tests.

---

## 1. TestID Naming Convention

- **Format:** Use kebab-case.
- **Suffixes:** Append a suffix that indicates the element type:
  - **Button:** `continue-button`
  - **Tab:** `home-tab`
  - **Input:** `address-input`
  - **Screen:** `settings-screen`
- **Uniqueness:** It's virtually impossible to have unique testIDs across the app. We should make sure that every screen
  has unique testIDs.

---

## 2. File Structure & Naming

- **Directory:** Keep all e2e tests under the `/e2e` directory.
- **File Names:** Name test files to clearly reflect the tested feature.

---

## 3. Selector Best Practices

- **Primary Selector:** Rely on testIDs for selecting elements.
- **Fallbacks:** Use accessibility labels only when testIDs are not available.
- **Avoid:** Do not use dynamic selectors or indexes as they can lead to flaky tests.

---

## 4. Running & Debugging Tests

The easiest way to write tests is to use Maestro Studio:

- build the app and start the the e2e metro server:

```
yarn workspace @safe-global/mobile e2e:metro-ios
```

to run Maestro Studio:

```
maestro studio
```

- **Cross-Platform:**
  Ideally, tests should run on both iOS and Android devices. In practice though Android tests are more flaky than iOS
  tests.
  Strive to run tests on both platforms, but prioritize iOS if necessary.

---

## 5. General Considerations

- **Maintenance:** Regularly update tests to reflect UI changes.
- **Readability:** Keep test code clean and well-documented.
- **Consistency:** Adhere to project-wide code style and linting rules.

_Happy testing!_
