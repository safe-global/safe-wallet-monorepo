# E2E Tests

The E2E tests are written for [Maestro](https://docs.maestro.dev)

## Recommended setup for writing tests

Use Cursor together with Meastro Studio.
In Cursor attach the maestro docs, screenshots, any source file or test file that would be of
help for the model to write the tests. Guide the AI - tell it what test you want to write,
how it should be structured, point it to a similar test, give it the screenshots, tell it
which steps follows after which, tell it if it needs to do something like scroll in the test.
With this the test should be 99% correct. You run it in Maestro and make small modifications.

## Quick Start

```bash
# Run all tests
maestro test .

# Run smoke tests (fast validation)
maestro test --include-tags smoke tests/

# Run pending transaction suite
maestro test tests/transactions/pending/__suite__.yml

# Run single test
maestro test tests/transactions/pending/send-transaction.yml
```

## Structure

```
e2e/
├── tests/                          # All runnable tests
│   ├── onboarding/
│   ├── assets/
│   ├── transactions/
│   │   ├── pending/__suite__.yml   # Suite for fast execution
│   │   └── history/__suite__.yml
│   └── settings/
└── utils/                          # Reusable utilities (not run standalone)
    ├── setup/
    ├── assertions/
    └── components/
```

## Tags

- `smoke` - Critical path tests (run on every PR)
- `onboarding`, `assets`, `transactions`, `settings` - Feature categories
- `pending`, `history` - Transaction subcategories

## Test Modes

### Development (Fast Iteration)

```bash
maestro test tests/transactions/pending/send-transaction.yml
```

### PR Validation (Smoke Tests)

```bash
maestro test --include-tags smoke tests/
```

### Feature Testing

```bash
maestro test --include-tags pending tests/
maestro test --include-tags cow-protocol tests/
```

### Full Run (Nightly)

```bash
maestro test tests/transactions/pending/__suite__.yml
maestro test tests/transactions/history/__suite__.yml
maestro test tests/onboarding/__suite__.yml
maestro test tests/assets/__suite__.yml
```
