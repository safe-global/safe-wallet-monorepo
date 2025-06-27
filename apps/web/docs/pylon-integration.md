# Pylon Support Chat Integration

## Overview

The Safe{Wallet} integrates Pylon for customer support, providing contextual help based on whether users are interacting with a Safe account or just using their EOA wallet.

## How It Works

### 1. **Automatic User Identification**

The integration automatically identifies users based on:

- **Safe Context**: When viewing/managing a Safe account → `Safe 0x1234...5678`
- **EOA Context**: When only wallet is connected → `Wallet 0x9876...5432`

### 2. **Progressive Email Collection**

Email handling follows this flow:

```
Initial state → Placeholder email (address@safewallet.com)
     ↓
User provides email in chat → Detected via regex
     ↓
Email passed via custom fields → Pylon trigger updates contact
     ↓
All future sessions → Uses real email
```

### 3. **Contact Update Strategy**

Since we can't call the Contacts API directly from the frontend, we use a two-step approach:

1. **Frontend Detection**: Extract emails from chat messages and pass via custom fields
2. **Backend Update**: Use Pylon triggers to update contact records when `contact_email` field is populated

#### Setting Up the Pylon Trigger

Create a trigger in Pylon with:

**Condition:**

- When: Issue created or updated
- If: Custom field `update_contact` equals `true`

**Actions:**

1. Update contact email to value in `contact_email` field
2. Update contact name to value in `contact_name` field
3. Clear the `update_contact` flag

### 4. **Context Data Provided to Support**

The integration automatically provides support agents with custom fields:

**Contact Fields:**

- `contact_email` - Detected email address
- `contact_name` - Display name (Safe/Wallet + address)
- `update_contact` - Boolean flag for triggers

**For Safe Accounts:**

- `safe_address` - Safe contract address
- `safe_version` - Safe version
- `safe_threshold` - Signing threshold
- `safe_owners_count` - Number of owners
- `is_safe_owner` - If current wallet is owner

**For EOA Wallets:**

- `primary_address` - Wallet address
- `account_type` - Always 'eoa'

**Common Context:**

- `chain_id` - Network ID
- `chain_name` - Network name
- `app_theme` - User's theme preference
- `app_currency` - Selected currency
- `has_real_email` - Whether real email was detected

## Implementation Details

### Core Hook: `usePylon`

Located at `/hooks/usePylon.ts`, this hook:

- Manages Pylon initialization
- Handles Safe vs EOA context switching
- Detects emails from chat messages
- Sets custom fields for new issues

### Custom Field Configuration

Edit the `CUSTOM_FIELD_MAPPINGS` object in the hook to match your Pylon custom field slugs:

```typescript
const CUSTOM_FIELD_MAPPINGS = {
  contact_email: 'your_email_field_slug',
  contact_name: 'your_name_field_slug',
  // ... map other fields
}
```

### Usage Example

```typescript
import { usePylon, pylonHelpers } from '@/hooks/usePylon'

function MyComponent() {
  const { hasRealEmail, isSafeContext, currentAddress } = usePylon()

  const openSupport = () => {
    pylonHelpers.open()
  }

  return (
    <button onClick={openSupport}>
      Get Support
    </button>
  )
}
```

### Helper Functions

```typescript
pylonHelpers.isReady() // Check if Pylon is loaded
pylonHelpers.open() // Open chat widget (show)
pylonHelpers.close() // Close chat widget (hide)
pylonHelpers.hideBubble() // Hide chat bubble
pylonHelpers.showBubble() // Show chat bubble
pylonHelpers.showNewMessage(message) // Pre-fill message
pylonHelpers.showTicketForm(slug) // Navigate to form
pylonHelpers.updateEmail(email) // Manually update email
pylonHelpers.onUnreadChange(callback) // Listen for unread count
pylonHelpers.debug() // Debug current state
```

## Email Collection via Chat

When users haven't provided an email, support agents can request it directly in the chat. The integration automatically detects email patterns in chat messages and:

1. Extracts emails using regex pattern matching
2. Validates and stores the email locally in localStorage
3. Sets custom fields including `contact_email` and `update_contact = true`
4. Your Pylon trigger updates the contact record
5. Uses the real email for all future sessions

### Email Detection

The integration uses pattern matching to detect emails in chat messages:

```javascript
// Email pattern regex
;/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
```

When a user types their email in any message (e.g., "my email is john.doe@example.com"), the system:

- Automatically extracts the email
- Ignores placeholder emails (\*@safewallet.com)
- Sets custom fields for the next issue
- Stores it for future sessions

### How Contact Updates Work

The integration updates contacts in a two-step process:

1. **Frontend Sets Custom Fields**: When email is detected, sets `contact_email` and `update_contact` fields
2. **Pylon Trigger Updates Contact**: Your configured trigger reads these fields and updates the contact via API
3. **Manual Updates**: Using `pylonHelpers.updateEmail(email)` refreshes the page to apply new email

This approach works because:

- Frontend can't directly call Contacts API (no auth)
- Custom fields can trigger backend workflows
- Pylon triggers have full API access
- Contact updates happen automatically

## Privacy & Security

- Emails are stored in browser localStorage (not synced)
- Only minimal necessary data is shared with Pylon
- Safe addresses and wallet addresses are always visible to provide context
- No private keys or sensitive data are ever transmitted

## Testing

In the browser console:

```javascript
// Check current state
pylonHelpers.debug()

// Get current settings
pylonHelpers.getSettings()

// Manually open chat
pylonHelpers.open()

// Simulate email update
pylonHelpers.updateEmail('user@example.com')
```

## Troubleshooting

**Pylon not loading:**

- Check browser console for errors
- Verify Content Security Policy allows Pylon domains
- Check network tab for blocked requests

**Email not persisting:**

- Ensure localStorage is enabled
- Check for browser privacy extensions blocking storage
- Verify email format is valid

**Contact not updating:**

- Verify Pylon trigger is configured correctly
- Check custom field slugs match your configuration
- Ensure trigger has permission to update contacts

**Wrong context showing:**

- Hook automatically detects Safe vs EOA context
- Refresh page if context seems incorrect
- Check `pylonHelpers.debug()` output
