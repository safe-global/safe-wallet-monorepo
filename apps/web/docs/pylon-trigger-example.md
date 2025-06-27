# Pylon Trigger Configuration for Contact Updates

This document shows how to set up a Pylon trigger to update contacts when emails are detected by the Safe{Wallet} integration.

## Prerequisites

1. Create the following custom fields in Pylon (Settings > Pylon > Issue Fields):

| Field Name        | Field Slug          | Type     | Description                      |
| ----------------- | ------------------- | -------- | -------------------------------- |
| Contact Email     | `contact_email`     | Text     | Email detected from chat         |
| Contact Name      | `contact_name`      | Text     | Display name for contact         |
| Update Contact    | `update_contact`    | Boolean  | Flag to trigger contact update   |
| Account Type      | `account_type`      | Select   | Options: 'safe', 'eoa'           |
| Primary Address   | `primary_address`   | Text     | Blockchain address               |
| Chain ID          | `chain_id`          | Number   | Network ID                       |
| Chain Name        | `chain_name`        | Text     | Network name                     |
| Safe Address      | `safe_address`      | Text     | Safe contract address (optional) |
| Safe Version      | `safe_version`      | Text     | Safe version (optional)          |
| Safe Threshold    | `safe_threshold`    | Text     | e.g., "2/3" (optional)           |
| Safe Owners Count | `safe_owners_count` | Number   | Number of owners (optional)      |
| Is Safe Owner     | `is_safe_owner`     | Boolean  | If wallet is owner (optional)    |
| App Theme         | `app_theme`         | Select   | Options: 'light', 'dark'         |
| App Currency      | `app_currency`      | Text     | e.g., 'usd', 'eur'               |
| Has Real Email    | `has_real_email`    | Boolean  | Email validation flag            |
| Email Detected At | `email_detected_at` | Datetime | When email was found             |

## Trigger Configuration

### Trigger 1: Update Contact on Email Detection

**Name:** Update Contact from Custom Fields

**Trigger When:**

- Event: Issue is created OR Issue is updated
- Conditions:
  - Custom Field `update_contact` equals `true`
  - Custom Field `contact_email` is not empty

**Actions:**

1. **Find or Create Contact**

   - Search by email: `{{issue.custom_fields.contact_email}}`
   - If not found, create new contact with:
     - Email: `{{issue.custom_fields.contact_email}}`
     - Name: `{{issue.custom_fields.contact_name}}`

2. **Update Contact Fields**

   - Name: `{{issue.custom_fields.contact_name}}`
   - Custom Fields:
     - `blockchain_address`: `{{issue.custom_fields.primary_address}}`
     - `account_type`: `{{issue.custom_fields.account_type}}`
     - `chain_id`: `{{issue.custom_fields.chain_id}}`
     - `last_seen`: Current timestamp

3. **Link Contact to Issue**

   - Set issue contact to the found/created contact

4. **Clear Update Flag**

   - Set custom field `update_contact` to `false`

5. **Add Internal Note** (optional)
   - Content: "Contact updated via email detection: {{issue.custom_fields.contact_email}}"

### Trigger 2: Create Account for Safe Addresses

**Name:** Create Account for Safe

**Trigger When:**

- Event: Issue is created
- Conditions:
  - Custom Field `account_type` equals `safe`
  - Custom Field `safe_address` is not empty

**Actions:**

1. **Find or Create Account**

   - Search by name: `Safe {{issue.custom_fields.safe_address}}`
   - If not found, create new account with:
     - Name: `Safe {{issue.custom_fields.safe_address}}`
     - Type: `Customer`

2. **Update Account Fields**

   - Custom Fields:
     - `safe_address`: `{{issue.custom_fields.safe_address}}`
     - `chain_id`: `{{issue.custom_fields.chain_id}}`
     - `safe_version`: `{{issue.custom_fields.safe_version}}`
     - `owners_count`: `{{issue.custom_fields.safe_owners_count}}`

3. **Link Contact to Account**
   - If contact exists, link to this account

## Webhook Alternative

If you prefer using webhooks instead of triggers:

### Webhook Endpoint

```javascript
// Example webhook handler (Node.js/Express)
app.post('/webhooks/pylon/issue-updated', async (req, res) => {
  const { issue } = req.body

  // Check if we should update contact
  if (issue.custom_fields.update_contact && issue.custom_fields.contact_email) {
    try {
      // Find or create contact
      let contact = await pylonAPI.contacts.findByEmail(issue.custom_fields.contact_email)

      if (!contact) {
        contact = await pylonAPI.contacts.create({
          email: issue.custom_fields.contact_email,
          name: issue.custom_fields.contact_name,
          account_id: issue.account?.id,
        })
      } else {
        // Update existing contact
        await pylonAPI.contacts.update(contact.id, {
          name: issue.custom_fields.contact_name,
          custom_fields: {
            blockchain_address: issue.custom_fields.primary_address,
            account_type: issue.custom_fields.account_type,
            chain_id: issue.custom_fields.chain_id,
          },
        })
      }

      // Clear the update flag
      await pylonAPI.issues.update(issue.id, {
        custom_fields: {
          update_contact: false,
        },
      })

      res.json({ success: true })
    } catch (error) {
      console.error('Failed to update contact:', error)
      res.status(500).json({ error: 'Failed to update contact' })
    }
  } else {
    res.json({ success: true, message: 'No contact update needed' })
  }
})
```

## Testing the Integration

1. **Test Email Detection:**

   - Open Safe{Wallet} app
   - Open Pylon chat
   - Type: "My email is test@example.com"
   - Check browser console for detection logs

2. **Verify Custom Fields:**

   - Create a new issue via chat
   - Check issue details in Pylon
   - Verify all custom fields are populated

3. **Confirm Contact Update:**

   - Check if contact was created/updated
   - Verify email and name are correct
   - Check contact is linked to issue

4. **Test Different Contexts:**
   - Test with Safe account connected
   - Test with just EOA wallet
   - Verify correct fields populate

## Troubleshooting

**Contact not updating:**

- Check trigger is active
- Verify custom field slugs match exactly
- Check trigger execution logs

**Missing custom fields:**

- Ensure all fields are created in Pylon
- Check field types match expected values
- Verify field permissions

**Email not detected:**

- Check browser console for errors
- Verify Pylon widget is loaded
- Test email regex pattern
