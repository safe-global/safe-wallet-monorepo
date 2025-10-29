# Testing Analysis & Recommendations
## Safe Wallet Web Application

**Date:** 2025-10-29
**Codebase:** Safe Wallet Monorepo (apps/web)
**Analysis Scope:** Unit, Integration, E2E Testing Infrastructure

---

## Executive Summary

The Safe Wallet web application has a **mature and well-structured testing infrastructure** with strong foundations:

- **280+ unit/integration test files** covering ~52,187 lines of test code
- **148 Cypress E2E test files** organized by test type (smoke, happy path, regression)
- **Jest + React Testing Library** for unit/integration testing
- **MSW (Mock Service Worker)** for API mocking
- **Builder pattern** for test data generation
- **CI/CD integration** with parallelization and coverage reporting

**Overall Grade: B+ (85/100)**

### Quick Wins (High Impact, Low Effort)
1. Enforce coverage thresholds in CI
2. Add missing unit tests for untested logic
3. Implement snapshot testing for complex UI components
4. Create testing best practices documentation

### Strategic Improvements (High Impact, Medium Effort)
1. Increase page-level integration test coverage
2. Add component tests for untested UI components
3. Implement contract testing for API logic
4. Improve test organization and discoverability

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Strengths](#strengths)
3. [Gaps & Opportunities](#gaps--opportunities)
4. [Detailed Recommendations](#detailed-recommendations)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Best Practices Guide](#best-practices-guide)
7. [Appendix: Configuration Examples](#appendix-configuration-examples)

---

## Current State Analysis

### Testing Frameworks & Tools

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Unit Testing | Jest | 29.7.0 | Primary test runner |
| Component Testing | React Testing Library | 16.1.0 | Component interaction |
| E2E Testing | Cypress | 13.15.2 | End-to-end workflows |
| API Mocking | MSW | 2.7.0 | Network request mocking |
| Test Data | @faker-js/faker | 9.0.3 | Data generation |
| Visual Regression | cypress-visual-regression | 5.2.2 | Screenshot comparison |

### Test Distribution

```
Unit/Integration Tests:    280 files (~52,187 lines)
├── Features: Recovery, Multichain, Swap, etc.
├── Components: 100+ component tests
├── Hooks: 30+ hook tests
└── Services: 20+ service tests

E2E Tests:                 148 files
├── Smoke tests:           15+ files (critical paths)
├── Happy path tests:      10+ files (complete workflows)
├── Regression tests:      90+ files (bug prevention)
└── Safe Apps tests:       20+ files (external integrations)

Packages:                  22 files (utils, store)
```

### Test Coverage Configuration

**Current Setup:**
- Jest coverage configured but not enforced by default
- CI runs coverage on PRs with annotations
- No coverage thresholds defined
- Coverage ignores: `/node_modules/`, `/src/tests/`, `/src/types/contracts/`

**File:** `apps/web/jest.config.cjs:30`

---

## Strengths

### 1. Excellent Test Infrastructure

**Builder Pattern for Test Data** (`src/tests/builders/`)
```typescript
// Clean, reusable test data generation
const testSafe = safeInfoBuilder()
  .with({ threshold: 2, nonce: 5 })
  .build()

const testOwner = addressExBuilder()
  .with({ name: 'Alice' })
  .build()
```

**Benefits:**
- Reduces test boilerplate
- Easy to customize test data
- Type-safe test data generation
- Consistent across test suite

**Location:** `src/tests/builders/safe.ts:24`, `src/tests/builders/wallet.ts`, etc.

### 2. Comprehensive Test Utilities

**Custom Render Functions** (`src/tests/test-utils.tsx`)
```typescript
// Automatic provider wrapping
render(<MyComponent />, {
  initialReduxState: { /* ... */ },
  routerProps: { query: { safe: '0x...' } }
})

// User event integration
const { user } = renderWithUserEvent(<MyForm />)
await user.type(input, 'test@example.com')
```

**Location:** `src/tests/test-utils.tsx:78-116`

### 3. MSW for Reliable API Mocking

- Server setup in test environment
- Shared handlers across tests
- Prevents actual network requests
- Easy to override for specific tests

**Location:** `src/tests/server.ts`, `jest.setup.js:11-13`

### 4. Well-Organized E2E Tests

```
cypress/e2e/
├── smoke/          # Quick validation (CI on every PR)
├── happypath/      # Complete user workflows
├── regression/     # Specific bug prevention
└── safe-apps/      # External integrations
```

### 5. Strong CI/CD Integration

- Parallel test execution (5 containers for E2E)
- Automatic coverage reporting
- Failed test annotations on PRs
- On-demand full test suite execution
- Concurrency groups to cancel outdated runs

**Files:** `.github/workflows/web-unit-tests.yml`, `.github/workflows/web-e2e-smoke.yml`

### 6. Test Environment Consistency

```javascript
// Timezone and locale control
"test": "cross-env TZ=CET LC_ALL=C NODE_ENV=test jest"
"cypress:run": "cross-env TZ=UTC NODE_ENV=cypress cypress run"
```

Prevents flaky date/time-related tests across different development environments.

**Location:** `apps/web/package.json:17`

---

## Gaps & Opportunities

### Critical Gaps (Address Soon)

#### 1. No Coverage Thresholds Enforced
**Impact:** High
**Effort:** Low
**Risk:** Coverage can regress without detection, untested code ships to production

**Current State:** Coverage tracked but not enforced - no minimum thresholds

**Recommendation:** Add coverage thresholds to Jest config and fail CI if not met

**Example Impact:**
```typescript
// Current: Can merge PRs with ANY coverage level
// With thresholds: Must maintain minimum coverage standards

// Benefits:
- Prevents regression in test coverage
- Forces testing of new features
- Identifies untested code paths
- Improves code quality over time
```

#### 2. Limited Page-Level Test Coverage
**Impact:** Medium
**Effort:** Medium
**Risk:** Integration issues between components may not be caught

**Current State:** Only 3 page tests in `src/tests/pages/`

**Recommendation:** Add page-level integration tests for critical user journeys

**Gap Example:**
```typescript
// Exists: Individual component tests
✓ RecoveryModal.test.tsx
✓ RecoveryHeader.test.tsx
✓ RecoveryCards.test.tsx

// Missing: Full page integration
✗ RecoveryPage.test.tsx (all components together)
✗ SettingsPage.test.tsx
✗ TransactionFlowPage.test.tsx
```

#### 3. Untested Business Logic Areas
**Impact:** High
**Effort:** Medium
**Risk:** Critical business logic may have bugs that aren't caught by tests

**Current State:** Some service and utility functions lack comprehensive test coverage

**Recommendation:** Audit and add unit tests for all business-critical logic

**Areas to Focus:**
- Transaction building and validation logic
- Recovery module calculations
- Balance and asset calculations
- Chain/network selection logic
- Permission and guard validation

#### 4. No API Contract Testing
**Impact:** Medium
**Effort:** Medium
**Risk:** API changes may break frontend without warning

**Current State:** MSW mocks APIs but doesn't validate contracts

**Recommendation:** Implement contract testing with Pact or similar

### Minor Gaps (Nice to Have)

#### 5. Missing Component Tests
**Impact:** Medium
**Effort:** Medium

**Current State:** Some components lack test coverage, especially:
- Form components with complex validation
- Components with multiple conditional rendering paths
- Components with side effects

**Recommendation:** Systematically add component tests for untested components

#### 6. Limited Snapshot Testing
**Impact:** Low
**Effort:** Low

**Current State:** Visual regression via Cypress screenshots, but no component snapshots

**Recommendation:** Strategic use of Jest snapshots for complex component structures

#### 7. No Test Quality Metrics
**Impact:** Low
**Effort:** Low

**Current State:** Coverage tracked but no test quality metrics

**Recommendation:** Track test execution time, flakiness, and assertion count

#### 8. Insufficient Hook Testing
**Impact:** Medium
**Effort:** Low

**Current State:** Some custom hooks lack comprehensive test coverage

**Recommendation:** Add tests for all custom hooks, especially those with complex logic

---

## Detailed Recommendations

### Priority 1: Enforce Coverage Thresholds (Immediate)

#### Why It Matters
- **Prevents coverage regression** - ensures new code is tested
- **Quality gate** - blocks untested code from reaching production
- **Visibility** - team sees coverage impact of every PR
- **Easy to implement** - configuration change only

#### Implementation

**Step 1: Add Coverage Thresholds to Jest Config**

**Update:** `apps/web/jest.config.cjs`

Add this configuration to the `customJestConfig` object:

```javascript
const customJestConfig = {
  // ... existing config ...

  coverageThreshold: {
    global: {
      lines: 70,        // Start conservative, increase over time
      branches: 65,
      functions: 70,
      statements: 70,
    },
    // Higher thresholds for critical features
    './src/features/recovery/**/*.{ts,tsx}': {
      lines: 85,
      branches: 80,
      functions: 85,
      statements: 85,
    },
    './src/services/**/*.ts': {
      lines: 80,
      branches: 75,
      functions: 80,
      statements: 80,
    },
  },

  // Collect coverage from all source files
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/types/**',
    '!src/__generated__/**',
  ],
}
```

**Step 2: Update CI to Fail on Low Coverage**

The existing `test:ci` script already runs with `--coverage`, so thresholds will be enforced automatically.

**Step 3: Generate Coverage Report Locally**

```bash
# Run tests with coverage
yarn test:coverage

# Open HTML report in browser
open coverage/lcov-report/index.html
```

**Step 4: Identify Low Coverage Areas**

```bash
# Show files with coverage below threshold
yarn test:coverage 2>&1 | grep -A 5 "Coverage for"
```

**Expected Impact:**
- Immediate visibility into coverage
- Prevents coverage regression
- Identifies untested code paths
- CI fails if new code isn't tested

**Effort:** 1-2 hours
**Files to Modify:** `jest.config.cjs`
**Ongoing:** Gradually increase thresholds as coverage improves

---

### Priority 2: Add Missing Business Logic Tests (Immediate)

#### Why It Matters
- **Critical code paths** may have bugs without test coverage
- **Refactoring safety** - tests enable safe refactoring
- **Documentation** - tests document expected behavior
- **Regression prevention** - bugs stay fixed

#### Implementation

**Step 1: Identify Untested Logic**

Run coverage report and identify low-coverage areas:

```bash
yarn test:coverage

# Look for files with <70% coverage in:
# - src/services/
# - src/utils/
# - src/hooks/
# - src/features/*/services/
# - src/features/*/utils/
```

**Step 2: Prioritize Critical Logic**

Focus on these high-value areas first:

1. **Transaction Logic**
   - Transaction building
   - Fee calculation
   - Signature validation
   - Nonce management

2. **Recovery Logic**
   - Guardian validation
   - Recovery proposal validation
   - Execution eligibility checks

3. **Balance/Asset Calculations**
   - Token balance aggregation
   - USD value calculations
   - Portfolio totals

4. **Network/Chain Logic**
   - Chain compatibility checks
   - Network switching logic
   - Multi-chain aggregation

**Step 3: Write Comprehensive Unit Tests**

**Example:** Testing transaction validation logic

**Create:** `src/services/__tests__/tx-validation.test.ts`

```typescript
import { validateTransaction } from '../tx-validation'
import { safeInfoBuilder } from '@/tests/builders/safe'

describe('validateTransaction', () => {
  describe('nonce validation', () => {
    it('should reject transaction with nonce < safe nonce', () => {
      const safe = safeInfoBuilder().with({ nonce: 10 }).build()
      const tx = { nonce: 9, /* ... */ }

      const result = validateTransaction(tx, safe)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('nonce')
    })

    it('should accept transaction with nonce === safe nonce', () => {
      const safe = safeInfoBuilder().with({ nonce: 10 }).build()
      const tx = { nonce: 10, /* ... */ }

      const result = validateTransaction(tx, safe)

      expect(result.valid).toBe(true)
    })
  })

  describe('signature validation', () => {
    it('should require threshold number of signatures', () => {
      const safe = safeInfoBuilder().with({ threshold: 2 }).build()
      const tx = {
        signatures: [{ signer: '0x123...', data: '0xabc...' }] // Only 1 sig
      }

      const result = validateTransaction(tx, safe)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('signatures')
    })

    it('should reject signatures from non-owners', () => {
      const safe = safeInfoBuilder()
        .with({ owners: [{ value: '0x111...' }, { value: '0x222...' }] })
        .build()

      const tx = {
        signatures: [{ signer: '0x999...', data: '0xabc...' }] // Not an owner
      }

      const result = validateTransaction(tx, safe)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('owner')
    })
  })

  describe('value validation', () => {
    it('should reject transaction value > safe balance', async () => {
      const safe = safeInfoBuilder().build()
      const balance = BigInt('1000000000000000000') // 1 ETH
      const tx = {
        value: BigInt('2000000000000000000'), // 2 ETH
        to: '0x123...'
      }

      const result = await validateTransaction(tx, safe, balance)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('balance')
    })
  })

  describe('edge cases', () => {
    it('should handle zero-value transactions', () => {
      const safe = safeInfoBuilder().build()
      const tx = { value: BigInt(0), to: '0x123...' }

      const result = validateTransaction(tx, safe)

      expect(result.valid).toBe(true)
    })

    it('should validate contract interaction', () => {
      const safe = safeInfoBuilder().build()
      const tx = {
        value: BigInt(0),
        to: '0x123...',
        data: '0xabcdef...' // Contract call data
      }

      const result = validateTransaction(tx, safe)

      expect(result.valid).toBe(true)
    })
  })
})
```

**Step 4: Test Utility Functions**

**Example:** Testing address utilities

**Create:** `src/utils/__tests__/addresses.test.ts`

```typescript
import {
  isValidAddress,
  shortenAddress,
  compareAddresses,
  isChecksumValid
} from '../addresses'

describe('address utilities', () => {
  describe('isValidAddress', () => {
    it('should accept valid Ethereum address', () => {
      expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true)
    })

    it('should reject invalid length', () => {
      expect(isValidAddress('0x123')).toBe(false)
    })

    it('should reject non-hex characters', () => {
      expect(isValidAddress('0xGGGG567890123456789012345678901234567890')).toBe(false)
    })

    it('should reject missing 0x prefix', () => {
      expect(isValidAddress('1234567890123456789012345678901234567890')).toBe(false)
    })
  })

  describe('shortenAddress', () => {
    it('should shorten address to format 0x1234...5678', () => {
      const result = shortenAddress('0x1234567890123456789012345678901234567890')
      expect(result).toBe('0x1234...7890')
    })

    it('should handle custom length', () => {
      const result = shortenAddress('0x1234567890123456789012345678901234567890', 6)
      expect(result).toBe('0x123456...567890')
    })
  })

  describe('compareAddresses', () => {
    it('should return true for same address (different case)', () => {
      expect(
        compareAddresses(
          '0xabcdef1234567890123456789012345678901234',
          '0xABCDEF1234567890123456789012345678901234'
        )
      ).toBe(true)
    })

    it('should return false for different addresses', () => {
      expect(
        compareAddresses(
          '0x1111111111111111111111111111111111111111',
          '0x2222222222222222222222222222222222222222'
        )
      ).toBe(false)
    })
  })
})
```

**Expected Impact:**
- Catch bugs in critical business logic
- Enable safe refactoring
- Document expected behavior
- Increase code coverage by 10-15%

**Effort:** 12-20 hours (2-3 hours per critical module)
**Files to Create:** 5-10 new test files for untested logic
**Files to Modify:** None

---

### Priority 3: Page-Level Integration Tests (Short Term)

#### Why It Matters
- **Catch integration issues** between components
- **Validate full user flows** at page level
- **Complement component tests** with higher-level coverage
- **Increase confidence** in deployments

#### Implementation

**Create:** `src/tests/pages/RecoveryPage.test.tsx`
```typescript
import { render, waitFor } from '@/tests/test-utils'
import { fireEvent } from '@testing-library/react'
import RecoveryPage from '@/app/[safe]/settings/recovery/page'
import { safeInfoBuilder } from '@/tests/builders/safe'

// Mock heavy dependencies
jest.mock('@/hooks/wallets/web3')
jest.mock('@/features/recovery/hooks/useRecoveryState')

describe('RecoveryPage', () => {
  const mockSafe = safeInfoBuilder()
    .with({ threshold: 2, owners: [/* ... */] })
    .build()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Full Recovery Flow', () => {
    it('should display recovery setup when no recovery configured', async () => {
      mockUseRecoveryState.mockReturnValue({
        isRecoverySetup: false,
        // ...
      })

      const { getByText, queryByText } = render(<RecoveryPage />, {
        initialReduxState: {
          safeInfo: { data: mockSafe }
        }
      })

      // Header visible
      expect(getByText('Account recovery')).toBeInTheDocument()

      // Setup CTA visible
      expect(getByText('Set up recovery')).toBeInTheDocument()

      // No active recovery state
      expect(queryByText('Active recovery')).not.toBeInTheDocument()
    })

    it('should show active recovery when recovery is configured', async () => {
      mockUseRecoveryState.mockReturnValue({
        isRecoverySetup: true,
        recovery: mockRecovery,
      })

      const { getByText } = render(<RecoveryPage />, {
        initialReduxState: {
          safeInfo: { data: mockSafe }
        }
      })

      expect(getByText('Active recovery')).toBeInTheDocument()
      expect(getByText('Guardians: 2')).toBeInTheDocument()
    })

    it('should allow initiating recovery proposal', async () => {
      mockUseRecoveryState.mockReturnValue({
        isRecoverySetup: true,
        recovery: mockRecovery,
      })

      const { getByText, getByRole } = render(<RecoveryPage />)

      // Click "Propose recovery"
      fireEvent.click(getByText('Propose recovery'))

      // Modal opens
      await waitFor(() => {
        expect(getByRole('dialog')).toBeInTheDocument()
      })

      // Form fields present
      expect(getByText('New owner address')).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('should display error when recovery fetch fails', async () => {
      mockUseRecoveryState.mockReturnValue({
        error: new Error('Failed to fetch recovery'),
      })

      const { getByText } = render(<RecoveryPage />)

      expect(getByText(/Failed to fetch recovery/i)).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should display loading skeleton while fetching', async () => {
      mockUseRecoveryState.mockReturnValue({
        loading: true,
      })

      const { container } = render(<RecoveryPage />)

      expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument()
    })
  })
})
```

**Create:** `src/tests/pages/SettingsPage.test.tsx`
**Create:** `src/tests/pages/TransactionFlowPage.test.tsx`

**Expected Impact:**
- Increase integration test coverage by 30%
- Catch cross-component issues earlier
- Improve deployment confidence

**Effort:** 8-12 hours for 3-5 key pages
**Files to Create:** 3-5 page test files
**Files to Modify:** None

---

### Priority 4: Add Missing Component Tests (Short Term)

#### Why It Matters
- **UI logic bugs** can slip through without component tests
- **User interactions** need to be validated
- **Conditional rendering** logic requires test coverage
- **Form validation** must be thoroughly tested

#### Implementation

**Step 1: Identify Untested Components**

Look for components without `.test.tsx` files:

```bash
# Find components without tests
find src/components src/features -name "*.tsx" -not -name "*.test.tsx" -not -name "*.stories.tsx" | while read file; do
  test_file="${file%.tsx}.test.tsx"
  if [ ! -f "$test_file" ]; then
    echo "Missing test: $file"
  fi
done
```

**Step 2: Prioritize by Complexity**

Focus on these component types first:

1. **Form Components** - validation, submission, error handling
2. **Modal/Dialog Components** - open/close, submission flows
3. **Conditional Components** - multiple render paths
4. **Components with Side Effects** - API calls, state updates
5. **Interactive Components** - buttons, inputs, selectors

**Step 3: Write Comprehensive Component Tests**

**Example:** Testing a complex form component

**Create:** `src/components/tx/SendTokenForm/index.test.tsx`

```typescript
import { renderWithUserEvent } from '@/tests/test-utils'
import { waitFor } from '@testing-library/react'
import SendTokenForm from './index'
import { safeInfoBuilder } from '@/tests/builders/safe'

describe('SendTokenForm', () => {
  const mockOnSubmit = jest.fn()
  const mockSafe = safeInfoBuilder().build()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validation', () => {
    it('should show error for invalid recipient address', async () => {
      const { user, getByLabelText, getByText } = renderWithUserEvent(
        <SendTokenForm safe={mockSafe} onSubmit={mockOnSubmit} />
      )

      const recipientInput = getByLabelText('Recipient')
      await user.type(recipientInput, 'invalid-address')

      // Trigger validation (blur event)
      await user.click(document.body)

      await waitFor(() => {
        expect(getByText(/Invalid address/i)).toBeInTheDocument()
      })

      // Submit button should be disabled
      const submitButton = getByText('Send')
      expect(submitButton).toBeDisabled()
    })

    it('should show error for amount exceeding balance', async () => {
      const { user, getByLabelText, getByText } = renderWithUserEvent(
        <SendTokenForm
          safe={mockSafe}
          onSubmit={mockOnSubmit}
          balance="1.5"
        />
      )

      const amountInput = getByLabelText('Amount')
      await user.type(amountInput, '2.0')

      await user.click(document.body)

      await waitFor(() => {
        expect(getByText(/Exceeds balance/i)).toBeInTheDocument()
      })
    })

    it('should require amount greater than 0', async () => {
      const { user, getByLabelText, getByText } = renderWithUserEvent(
        <SendTokenForm safe={mockSafe} onSubmit={mockOnSubmit} />
      )

      const amountInput = getByLabelText('Amount')
      await user.type(amountInput, '0')

      await user.click(document.body)

      await waitFor(() => {
        expect(getByText(/Amount must be greater than 0/i)).toBeInTheDocument()
      })
    })
  })

  describe('user interactions', () => {
    it('should enable submit button when form is valid', async () => {
      const { user, getByLabelText, getByText } = renderWithUserEvent(
        <SendTokenForm safe={mockSafe} onSubmit={mockOnSubmit} />
      )

      // Fill valid data
      await user.type(
        getByLabelText('Recipient'),
        '0x1234567890123456789012345678901234567890'
      )
      await user.type(getByLabelText('Amount'), '1.0')

      await waitFor(() => {
        const submitButton = getByText('Send')
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('should call onSubmit with form data', async () => {
      const { user, getByLabelText, getByText } = renderWithUserEvent(
        <SendTokenForm safe={mockSafe} onSubmit={mockOnSubmit} />
      )

      const recipient = '0x1234567890123456789012345678901234567890'
      const amount = '1.5'

      await user.type(getByLabelText('Recipient'), recipient)
      await user.type(getByLabelText('Amount'), amount)

      const submitButton = getByText('Send')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          recipient,
          amount,
          token: expect.any(Object),
        })
      })
    })

    it('should show loading state during submission', async () => {
      mockOnSubmit.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      const { user, getByLabelText, getByText, queryByText } = renderWithUserEvent(
        <SendTokenForm safe={mockSafe} onSubmit={mockOnSubmit} />
      )

      await user.type(
        getByLabelText('Recipient'),
        '0x1234567890123456789012345678901234567890'
      )
      await user.type(getByLabelText('Amount'), '1.0')

      const submitButton = getByText('Send')
      await user.click(submitButton)

      // Loading indicator should appear
      expect(queryByText(/Submitting.../i)).toBeInTheDocument()

      // Submit button should be disabled
      expect(submitButton).toBeDisabled()

      await waitFor(() => {
        expect(queryByText(/Submitting.../i)).not.toBeInTheDocument()
      })
    })
  })

  describe('conditional rendering', () => {
    it('should show token selector when multiple tokens available', () => {
      const { getByLabelText } = renderWithUserEvent(
        <SendTokenForm
          safe={mockSafe}
          onSubmit={mockOnSubmit}
          tokens={[
            { symbol: 'ETH', balance: '1.5' },
            { symbol: 'DAI', balance: '100' }
          ]}
        />
      )

      expect(getByLabelText('Token')).toBeInTheDocument()
    })

    it('should hide token selector with single token', () => {
      const { queryByLabelText } = renderWithUserEvent(
        <SendTokenForm
          safe={mockSafe}
          onSubmit={mockOnSubmit}
          tokens={[{ symbol: 'ETH', balance: '1.5' }]}
        />
      )

      expect(queryByLabelText('Token')).not.toBeInTheDocument()
    })

    it('should show max button for token with balance', () => {
      const { getByText } = renderWithUserEvent(
        <SendTokenForm
          safe={mockSafe}
          onSubmit={mockOnSubmit}
          balance="1.5"
        />
      )

      expect(getByText('Max')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should display API error message', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Insufficient gas'))

      const { user, getByLabelText, getByText } = renderWithUserEvent(
        <SendTokenForm safe={mockSafe} onSubmit={mockOnSubmit} />
      )

      await user.type(
        getByLabelText('Recipient'),
        '0x1234567890123456789012345678901234567890'
      )
      await user.type(getByLabelText('Amount'), '1.0')

      await user.click(getByText('Send'))

      await waitFor(() => {
        expect(getByText(/Insufficient gas/i)).toBeInTheDocument()
      })
    })
  })
})
```

**Step 4: Test Hooks**

**Example:** Testing a custom hook with logic

**Create:** `src/hooks/__tests__/useTokenBalance.test.ts`

```typescript
import { renderHook, waitFor } from '@/tests/test-utils'
import { useTokenBalance } from '../useTokenBalance'
import { server } from '@/tests/server'
import { http, HttpResponse } from 'msw'

describe('useTokenBalance', () => {
  it('should fetch and return token balance', async () => {
    server.use(
      http.get('/api/v1/safes/:address/balances', () => {
        return HttpResponse.json({
          items: [
            { tokenAddress: '0xToken1', balance: '1000000000000000000' }
          ]
        })
      })
    )

    const { result } = renderHook(() =>
      useTokenBalance('0xSafe...', '0xToken1')
    )

    // Initially undefined
    expect(result.current.balance).toBeUndefined()
    expect(result.current.loading).toBe(true)

    // After fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.balance).toBe('1.0')
    })
  })

  it('should handle API errors', async () => {
    server.use(
      http.get('/api/v1/safes/:address/balances', () => {
        return HttpResponse.json(
          { message: 'Not found' },
          { status: 404 }
        )
      })
    )

    const { result } = renderHook(() =>
      useTokenBalance('0xSafe...', '0xToken1')
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeTruthy()
      expect(result.current.balance).toBeUndefined()
    })
  })

  it('should refetch when safe address changes', async () => {
    const { result, rerender } = renderHook(
      ({ safe, token }) => useTokenBalance(safe, token),
      {
        initialProps: {
          safe: '0xSafe1...',
          token: '0xToken1'
        }
      }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const firstBalance = result.current.balance

    // Change safe address
    rerender({ safe: '0xSafe2...', token: '0xToken1' })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      // Balance should be different (or refetched)
      expect(result.current.balance).toBeDefined()
    })
  })
})
```

**Expected Impact:**
- Catch UI bugs before production
- Ensure user interactions work correctly
- Validate form logic thoroughly
- Increase component coverage by 15-20%

**Effort:** 15-25 hours (1-2 hours per complex component)
**Files to Create:** 10-15 new component test files
**Files to Modify:** None

---

### Priority 5: Testing Best Practices Documentation (Medium Term)

#### Why It Matters
- **Consistency** across test codebase
- **Onboarding** - new developers write better tests
- **Knowledge sharing** - capture tribal knowledge
- **Quality** - codify testing standards

#### Implementation

**Create:** `apps/web/docs/TESTING_GUIDE.md`

```markdown
# Testing Guide

## Table of Contents
1. [When to Write Tests](#when-to-write-tests)
2. [Test Types](#test-types)
3. [Writing Unit Tests](#writing-unit-tests)
4. [Writing Component Tests](#writing-component-tests)
5. [Writing E2E Tests](#writing-e2e-tests)
6. [Test Data Builders](#test-data-builders)
7. [Mocking Strategies](#mocking-strategies)
8. [Common Patterns](#common-patterns)
9. [Debugging Tests](#debugging-tests)
10. [CI/CD](#cicd)

## When to Write Tests

**Always write tests for:**
- ✅ New features
- ✅ Bug fixes (regression tests)
- ✅ Critical business logic
- ✅ Utility functions
- ✅ Complex components

**Optional tests for:**
- ⚠️ Simple presentational components
- ⚠️ Type definitions
- ⚠️ Third-party integrations (covered by E2E)

## Test Types

### Unit Tests (Fast, Isolated)
- **Purpose:** Test single function/class in isolation
- **Location:** `src/**/*.test.ts`
- **Run:** `yarn test`
- **When:** Business logic, utilities, pure functions

### Component Tests (Fast, Shallow Integration)
- **Purpose:** Test React components with user interactions
- **Location:** `src/**/*.test.tsx`
- **Run:** `yarn test`
- **When:** UI components, hooks, forms

### E2E Tests (Slow, Full Integration)
- **Purpose:** Test complete user workflows
- **Location:** `cypress/e2e/**/*.cy.js`
- **Run:** `yarn cypress:open`
- **When:** Critical paths, cross-page flows

## Writing Unit Tests

### Good Test Structure (AAA Pattern)

```typescript
describe('formatAmount', () => {
  it('should format number with 2 decimals', () => {
    // Arrange
    const amount = 1234.5678
    const decimals = 2

    // Act
    const result = formatAmount(amount, decimals)

    // Assert
    expect(result).toBe('1,234.57')
  })
})
```

### Test Naming Convention

```typescript
// ✅ Good - describes behavior
it('should return error when amount exceeds balance')
it('should disable submit button when form is invalid')
it('should call onSuccess callback after transaction confirms')

// ❌ Bad - implementation details
it('should set isLoading to true')
it('should call useState')
it('renders a button')
```

## Writing Component Tests

### Use Custom Render

```typescript
import { render } from '@/tests/test-utils'  // ✅ Includes providers
// Not: import { render } from '@testing-library/react'  // ❌ Missing providers

const { getByText } = render(<MyComponent />, {
  initialReduxState: { /* ... */ },
  routerProps: { query: { safe: '0x...' } }
})
```

### Testing User Interactions

```typescript
import { renderWithUserEvent } from '@/tests/test-utils'

it('should submit form when all fields are valid', async () => {
  const mockOnSubmit = jest.fn()
  const { user, getByLabelText, getByRole } = renderWithUserEvent(
    <MyForm onSubmit={mockOnSubmit} />
  )

  // Type into input
  await user.type(getByLabelText('Email'), 'test@example.com')

  // Click button
  await user.click(getByRole('button', { name: 'Submit' }))

  // Assert callback
  expect(mockOnSubmit).toHaveBeenCalledWith({ email: 'test@example.com' })
})
```

### Testing Async Behavior

```typescript
import { waitFor } from '@testing-library/react'

it('should display data after loading', async () => {
  const { getByText, queryByText } = render(<AsyncComponent />)

  // Initially loading
  expect(getByText('Loading...')).toBeInTheDocument()

  // Wait for data
  await waitFor(() => {
    expect(queryByText('Loading...')).not.toBeInTheDocument()
    expect(getByText('Data loaded!')).toBeInTheDocument()
  })
})
```

## Test Data Builders

### Use Builders for Complex Data

```typescript
import { safeInfoBuilder, addressExBuilder } from '@/tests/builders'

// ✅ Good - clean and readable
const testSafe = safeInfoBuilder()
  .with({
    threshold: 2,
    owners: [
      addressExBuilder().with({ name: 'Alice' }).build(),
      addressExBuilder().with({ name: 'Bob' }).build()
    ]
  })
  .build()

// ❌ Bad - verbose and error-prone
const testSafe = {
  address: { value: '0x123...', name: '', logoUri: '' },
  chainId: '1',
  nonce: 5,
  threshold: 2,
  owners: [/* lots of boilerplate */],
  // ... 15 more required fields
}
```

## Mocking Strategies

### Mock External Dependencies

```typescript
// ✅ Mock at module level
jest.mock('@/hooks/wallets/web3')

const mockUseWeb3 = useWeb3 as jest.MockedFunction<typeof useWeb3>

beforeEach(() => {
  mockUseWeb3.mockReturnValue({ /* mock data */ })
})
```

### Use MSW for API Mocking

```typescript
import { server } from '@/tests/server'
import { http, HttpResponse } from 'msw'

it('should handle API error', async () => {
  // Override default handler for this test
  server.use(
    http.get('/api/v1/safes/:address', () => {
      return HttpResponse.json(
        { message: 'Not found' },
        { status: 404 }
      )
    })
  )

  const { getByText } = render(<MySafeComponent />)

  await waitFor(() => {
    expect(getByText('Failed to load safe')).toBeInTheDocument()
  })
})
```

### Mock Web3 Provider

```typescript
import { mockWeb3Provider } from '@/tests/test-utils'

it('should call contract method', async () => {
  const mockProvider = mockWeb3Provider([
    {
      to: '0x123...',
      data: '0xabc...',
      result: '0x1' // return value
    }
  ])

  // Test code that uses web3...
})
```

## Common Patterns

### Testing Error Boundaries

```typescript
it('should catch and display error', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation()

  const { getByText } = render(
    <ErrorBoundary>
      <ComponentThatThrows />
    </ErrorBoundary>
  )

  expect(getByText('Something went wrong')).toBeInTheDocument()

  consoleError.mockRestore()
})
```

### Testing Redux State

```typescript
it('should update Redux state on action', () => {
  const { store } = render(<MyComponent />, {
    initialReduxState: {
      transactions: { pending: [] }
    }
  })

  // Dispatch action
  store.dispatch(addPendingTx({ /* ... */ }))

  // Check state
  expect(store.getState().transactions.pending).toHaveLength(1)
})
```

### Testing Router Navigation

```typescript
it('should navigate to settings page', async () => {
  const mockPush = jest.fn()

  const { user, getByText } = renderWithUserEvent(<MyComponent />, {
    routerProps: {
      push: mockPush
    }
  })

  await user.click(getByText('Settings'))

  expect(mockPush).toHaveBeenCalledWith('/settings')
})
```

## Debugging Tests

### Running Single Test

```bash
# Run specific file
yarn test MyComponent.test.tsx

# Run specific test case
yarn test -t "should submit form"

# Watch mode
yarn test --watch
```

### Debugging in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest: Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "${fileBasename}",
    "--config=${workspaceFolder}/apps/web/jest.config.cjs",
    "--runInBand"
  ],
  "cwd": "${workspaceFolder}/apps/web",
  "console": "integratedTerminal"
}
```

### Debug Output

```typescript
import { screen, debug } from '@/tests/test-utils'

it('debugging test', () => {
  render(<MyComponent />)

  // Print entire DOM
  debug()

  // Print specific element
  debug(screen.getByTestId('my-element'))
})
```

### Cypress Debugging

```javascript
// Pause test execution
cy.pause()

// Debug element
cy.get('[data-testid="my-button"]').debug()

// Log to console
cy.log('Current URL:', cy.url())
```

## CI/CD

### Running Tests in CI

Tests run automatically on:
- **Every PR** - Unit tests + E2E smoke tests
- **Main branch push** - Full test suite
- **On-demand** - Full E2E suite via GitHub Actions

### Debugging CI Failures

1. Check GitHub Actions logs
2. Download Cypress videos/screenshots (artifacts)
3. Run same test locally: `yarn test:ci`

### Coverage Reports

- View in PR comments (automatic)
- Download from CI artifacts
- Local: `yarn test:coverage`

## Checklist for New Tests

Before submitting PR:

- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Descriptive test names (behavior, not implementation)
- [ ] No hardcoded values (use builders/constants)
- [ ] Mocks are cleaned up (beforeEach/afterEach)
- [ ] Async tests use waitFor properly
- [ ] Tests are isolated (no shared state)
- [ ] Tests pass locally (`yarn test`)
- [ ] No console errors/warnings
- [ ] Coverage thresholds met (`yarn test:coverage`)
```

**Expected Impact:**
- Reduce time spent reviewing test PRs
- Improve test quality and consistency
- Faster onboarding for new developers

**Effort:** 6-8 hours
**Files to Create:** `docs/TESTING_GUIDE.md`
**Files to Modify:** None (reference in README)

---

### Priority 6: Snapshot Testing for Complex UIs (Medium Term)

#### Why It Matters
- **Catch unintended UI changes** automatically
- **Complement visual regression** with component-level snapshots
- **Document component structure** implicitly
- **Fast feedback** without manual inspection

#### Implementation

**When to Use Snapshots:**
- ✅ Complex component structures (nested layouts)
- ✅ Components with many conditional branches
- ✅ Generated markup (markdown, HTML from API)
- ❌ Simple presentational components (over-testing)
- ❌ Frequently changing components (maintenance burden)

**Example:** `src/components/tx-flow/TxLayout.test.tsx`
```typescript
import { render } from '@/tests/test-utils'
import TxLayout from './index'

describe('TxLayout', () => {
  it('should match snapshot with default props', () => {
    const { container } = render(
      <TxLayout title="Test Transaction">
        <div>Transaction content</div>
      </TxLayout>
    )

    expect(container.firstChild).toMatchSnapshot()
  })

  it('should match snapshot with subtitle', () => {
    const { container } = render(
      <TxLayout
        title="Test Transaction"
        subtitle="Additional context"
      >
        <div>Transaction content</div>
      </TxLayout>
    )

    expect(container.firstChild).toMatchSnapshot()
  })
})
```

**Best Practices:**
- Keep snapshots small (focused components)
- Review snapshot diffs carefully in PRs
- Update snapshots intentionally (`yarn test -u`)
- Use inline snapshots for small outputs

**Expected Impact:**
- Catch unintended UI regressions
- Reduce manual testing time
- Improve code review quality

**Effort:** 2-3 hours + 1-2 hours per complex component
**Files to Create:** Update existing test files with snapshots
**Files to Modify:** ~10-15 component test files

---

## Implementation Roadmap

### Phase 1: Quick Wins (Weeks 1-2)

| Task | Priority | Effort | Impact | Owner |
|------|----------|--------|--------|-------|
| Add coverage thresholds to Jest config | P1 | 2h | High | TBD |
| Run coverage report & identify gaps | P1 | 1h | High | TBD |
| Add unit tests for 3-5 untested utility functions | P2 | 6h | High | TBD |
| Add snapshot tests for 5 complex components | P6 | 4h | Medium | TBD |
| Write testing best practices doc | P5 | 8h | Medium | TBD |

**Total Effort:** 21 hours
**Deliverables:**
- ✅ Coverage thresholds enforced in CI
- ✅ Coverage gaps identified
- ✅ Initial utility function tests added
- ✅ Testing documentation
- ✅ Snapshot tests for key components

### Phase 2: Business Logic Coverage (Weeks 3-4)

| Task | Priority | Effort | Impact | Owner |
|------|----------|--------|--------|-------|
| Add tests for transaction validation logic | P2 | 4h | High | TBD |
| Add tests for recovery module logic | P2 | 3h | High | TBD |
| Add tests for balance calculation logic | P2 | 3h | High | TBD |
| Add tests for address/formatting utilities | P2 | 2h | Medium | TBD |
| Create 3-5 page-level integration tests | P3 | 10h | High | TBD |

**Total Effort:** 22 hours
**Deliverables:**
- ✅ Critical business logic tested
- ✅ Utility functions fully covered
- ✅ Page-level integration tests
- ✅ Coverage increased by 10-15%

### Phase 3: Component Testing (Weeks 5-8)

| Task | Priority | Effort | Impact | Owner |
|------|----------|--------|--------|-------|
| Identify untested components | P4 | 2h | Medium | TBD |
| Add tests for 5-7 complex form components | P4 | 15h | High | TBD |
| Add tests for modal/dialog components | P4 | 6h | Medium | TBD |
| Add tests for 5-7 untested custom hooks | P4 | 10h | High | TBD |
| Increase coverage thresholds by 5% | P1 | 1h | Medium | TBD |

**Total Effort:** 34 hours
**Deliverables:**
- ✅ Form components fully tested
- ✅ Custom hooks tested
- ✅ Component coverage increased by 15-20%
- ✅ Higher coverage thresholds enforced

### Phase 4: Optimization & Maintenance (Ongoing)

| Task | Priority | Effort | Impact | Owner |
|------|----------|--------|--------|-------|
| Monitor test flakiness | - | 2h/week | Medium | TBD |
| Review and update snapshots | - | 1h/week | Low | TBD |
| Add tests for new features | - | Ongoing | High | All |
| Refactor slow tests | - | 4h/month | Medium | TBD |
| Update testing documentation | - | 2h/month | Low | TBD |

**Total Effort:** ~40 hours/quarter
**Deliverables:**
- ✅ Test suite health maintained
- ✅ Documentation kept current
- ✅ New features have adequate coverage

---

## Best Practices Guide

### Testing Pyramid

```
          /\
         /  \        E2E Tests
        /----\       (148 files - Critical paths)
       /      \
      /--------\     Integration Tests
     /          \    (50-60 files - Page level)
    /------------\
   /              \  Unit Tests
  /________________\ (280 files - Components, hooks, utils)
```

**Target Distribution:**
- **70%** Unit tests (fast, isolated)
- **20%** Integration tests (moderate, page-level)
- **10%** E2E tests (slow, critical paths)

### Test Coverage Goals

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| Line Coverage | Unknown | 80% | High |
| Branch Coverage | Unknown | 75% | High |
| Function Coverage | Unknown | 85% | Medium |
| Critical Paths Coverage | ~85% | 95% | High |

**Add to:** `apps/web/jest.config.cjs`
```javascript
coverageThreshold: {
  global: {
    lines: 80,
    branches: 75,
    functions: 85,
    statements: 80,
  },
  './src/features/recovery/**/*.{ts,tsx}': {
    lines: 90,
    branches: 85,
  },
}
```

### Writing Testable Code

#### ✅ Good - Easy to Test

```typescript
// Pure function
export function calculateTotalAmount(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

// Test
it('should calculate total amount', () => {
  const items = [{ amount: 10 }, { amount: 20 }]
  expect(calculateTotalAmount(items)).toBe(30)
})
```

#### ❌ Bad - Hard to Test

```typescript
// Tightly coupled, impure
function submitTransaction() {
  const web3 = new Web3(window.ethereum) // Global dependency
  const safe = getSafeFromLocalStorage() // Side effect
  const tx = buildTx(safe) // Multiple responsibilities
  web3.send(tx) // Side effect
  showNotification('Success!') // Side effect
  setTimeout(() => navigate('/success'), 1000) // Timer, navigation
}
```

#### ✅ Better - Refactored for Testability

```typescript
// Separated concerns
export function buildTransaction(safe: SafeInfo): Transaction {
  // Pure logic
  return { /* ... */ }
}

export function submitTransaction(
  web3: Web3Provider,
  tx: Transaction,
  onSuccess: () => void
): Promise<Receipt> {
  return web3.send(tx).then(receipt => {
    onSuccess()
    return receipt
  })
}

// Easy to test
it('should build transaction', () => {
  const safe = safeInfoBuilder().build()
  const tx = buildTransaction(safe)
  expect(tx.to).toBe(safe.address)
})

it('should call onSuccess after submission', async () => {
  const mockWeb3 = createMockWeb3Provider()
  const onSuccess = jest.fn()

  await submitTransaction(mockWeb3, mockTx, onSuccess)

  expect(onSuccess).toHaveBeenCalled()
})
```

### Test Maintenance

#### Avoiding Flaky Tests

```typescript
// ❌ Flaky - Race condition
it('should update after delay', () => {
  render(<AsyncComponent />)
  setTimeout(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument()
  }, 100) // Arbitrary timeout
})

// ✅ Reliable - Wait for condition
it('should update after delay', async () => {
  render(<AsyncComponent />)
  await waitFor(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })
})
```

#### Cleaning Up Mocks

```typescript
// ✅ Good - Clean up after each test
describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // Tests...
})
```

#### Avoiding Test Interdependence

```typescript
// ❌ Bad - Shared mutable state
let sharedState = { count: 0 }

it('test 1', () => {
  sharedState.count = 5
  expect(sharedState.count).toBe(5)
})

it('test 2', () => {
  // Depends on execution order!
  expect(sharedState.count).toBe(5)
})

// ✅ Good - Isolated tests
it('test 1', () => {
  const state = { count: 0 }
  state.count = 5
  expect(state.count).toBe(5)
})

it('test 2', () => {
  const state = { count: 0 }
  expect(state.count).toBe(0)
})
```

---

## Appendix: Configuration Examples

### Complete Jest Configuration with Thresholds

**File:** `apps/web/jest.config.cjs`
```javascript
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@safe-global/utils/(.*)$': '<rootDir>/../../packages/utils/src/$1',
    '^.+\\.(svg)$': '<rootDir>/mocks/svg.js',
  },

  testEnvironment: 'jest-fixed-jsdom',

  testEnvironmentOptions: {
    url: 'http://localhost/balances?safe=rin:0xb3b83bf204C458B461de9B0CD2739DB152b4fa5A',
    customExportConditions: ['node'],
  },

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/tests/',
    '/src/types/contracts/',
    '/.storybook/',
    '/cypress/',
  ],

  // NEW: Coverage thresholds
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 75,
      functions: 85,
      statements: 80,
    },
    // Higher thresholds for critical features
    './src/features/recovery/**/*.{ts,tsx}': {
      lines: 90,
      branches: 85,
      functions: 90,
    },
  },

  // NEW: Test timeout
  testTimeout: 10000,

  // NEW: Parallel execution
  maxWorkers: '50%',
}

module.exports = async () => ({
  ...(await createJestConfig(customJestConfig)()),
  transformIgnorePatterns: [
    'node_modules/(?!(uint8arrays|multiformats|@web3-onboard/common|@walletconnect/(.*)/uint8arrays)/)',
  ],
})
```

### Enhanced Cypress Configuration

**File:** `apps/web/cypress.config.js`
```javascript
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'exhdra',

  e2e: {
    setupNodeEvents(on, config) {
      // Visual regression
      const getCompareSnapshotsPlugin = require('cypress-visual-regression/dist/plugin')
      getCompareSnapshotsPlugin(on, config)

      // NEW: Code coverage
      require('@cypress/code-coverage/task')(on, config)

      return config
    },

    baseUrl: 'http://localhost:3000',

    viewportWidth: 1280,
    viewportHeight: 800,

    video: true,
    videoCompression: 15,
    videosFolder: './cypress/videos',
    videoUploadOnPasses: false,

    screenshotsFolder: './cypress/snapshots/actual',
    trashAssetsBeforeRuns: true,

    // NEW: Performance monitoring
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 10,

    // NEW: Better retry strategy
    retries: {
      runMode: 3,
      openMode: 0,
    },

    // NEW: Custom timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,

    // NEW: Test isolation
    testIsolation: true,

    reporter: 'junit',
    reporterOptions: {
      mochaFile: 'cypress/reports/junit-[hash].xml',
      toConsole: false,
      attachments: true,
    },

    env: {
      // Visual regression
      visualRegressionType: 'regression',
      visualRegressionBaseDirectory: './cypress/snapshots/base',
      visualRegressionDiffDirectory: './cypress/snapshots/diff',
      visualRegressionGenerateDiff: 'fail',
    },
  },
})
```

### GitHub Actions Workflow with All Tests

**File:** `.github/workflows/web-tests-full.yml`
```yaml
name: Web Tests - Full Suite

on:
  pull_request:
    paths:
      - 'apps/web/**'
      - 'packages/**'
  push:
    branches:
      - main
      - dev

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  unit-tests:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --immutable

      - name: Run unit tests
        run: cd apps/web && yarn test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./apps/web/coverage/lcov.info
          flags: unit-tests

      - name: Comment coverage on PR
        uses: ArtiomTr/jest-coverage-report-action@v2
        if: github.event_name == 'pull_request'
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          test-script: cd apps/web && yarn test:ci

  e2e-smoke:
    name: E2E Smoke Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        containers: [1, 2, 3, 4, 5]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --immutable

      - name: Build application
        run: cd apps/web && yarn build
        env:
          NODE_ENV: production

      - name: Run Cypress tests
        uses: cypress-io/github-action@v6
        with:
          working-directory: apps/web
          start: yarn serve
          wait-on: 'http://localhost:8080'
          wait-on-timeout: 120
          spec: cypress/e2e/smoke/*.cy.js
          browser: chrome
          record: true
          parallel: true
          group: 'Smoke Tests'
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload screenshots on failure
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: cypress-screenshots-${{ matrix.containers }}
          path: apps/web/cypress/screenshots

  contract-tests:
    name: API Contract Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --immutable

      - name: Run Pact tests
        run: cd apps/web && yarn test:pact

      - name: Publish contracts
        if: github.ref == 'refs/heads/main'
        run: cd apps/web && yarn pact:publish
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}

  test-summary:
    name: Test Summary
    runs-on: ubuntu-latest
    needs: [unit-tests, e2e-smoke, contract-tests]
    if: always()
    steps:
      - name: Summary
        run: |
          echo "## Test Results Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "✅ Unit Tests: ${{ needs.unit-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "✅ E2E Smoke Tests: ${{ needs.e2e-smoke.result }}" >> $GITHUB_STEP_SUMMARY
          echo "✅ Contract Tests: ${{ needs.contract-tests.result }}" >> $GITHUB_STEP_SUMMARY
```

---

## Summary

### Current State: Strong Foundation

Your testing infrastructure is **above industry average** with:
- Comprehensive unit and E2E test coverage
- Modern testing tools and frameworks
- Well-organized test utilities and builders
- Strong CI/CD integration

### Key Recommendations

**Immediate (Week 1-2):**
1. ✅ Enforce coverage thresholds in Jest config
2. ✅ Identify untested business logic and utilities
3. ✅ Add unit tests for critical utility functions
4. ✅ Create testing best practices documentation
5. ✅ Add strategic snapshot tests for complex components

**Short Term (Week 3-4):**
6. ✅ Add tests for transaction validation logic
7. ✅ Add tests for recovery module logic
8. ✅ Add tests for balance/asset calculations
9. ✅ Add page-level integration tests

**Medium Term (Week 5-8):**
10. ✅ Add component tests for untested form components
11. ✅ Add component tests for modal/dialog components
12. ✅ Add tests for untested custom hooks
13. ✅ Gradually increase coverage thresholds

**Long Term (Ongoing):**
14. ✅ Monitor and maintain test coverage
15. ✅ Add tests for all new features
16. ✅ Refactor and improve slow tests
17. ✅ Regular test suite maintenance

### Expected Outcomes

After implementing these recommendations:
- **80%+ overall code coverage** enforced by CI
- **90%+ coverage on critical business logic** (recovery, transactions, calculations)
- **Zero coverage regressions** - new code must be tested
- **Comprehensive component testing** for forms and interactive UIs
- **All custom hooks tested** with various scenarios
- **Page-level integration tests** catching cross-component issues
- **Faster development** with better test utilities and docs
- **Higher quality code** with comprehensive test coverage

### Questions?

For questions or clarifications about these recommendations:
1. Refer to the [Testing Guide](#best-practices-guide)
2. Check existing test examples in `src/features/recovery/__tests__/`
3. Review CI workflow configurations in `.github/workflows/`
4. Consult with team leads on prioritization

---

**Document Version:** 1.0
**Last Updated:** 2025-10-29
**Maintained By:** Engineering Team
