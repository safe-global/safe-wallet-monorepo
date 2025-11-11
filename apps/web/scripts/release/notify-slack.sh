#!/usr/bin/env bash

# Slack notification helper for releases
# Usage: ./notify-slack.sh <event_type> <version> [additional_info]

set -e

EVENT_TYPE=$1
VERSION=$2
ADDITIONAL_INFO=${3:-""}

# Check if Slack webhook is configured
if [ -z "$SLACK_WEBHOOK_URL" ]; then
  echo "⚠️  SLACK_WEBHOOK_URL not configured. Skipping Slack notification."
  exit 0
fi

# Determine message based on event type
case "$EVENT_TYPE" in
  "release_started")
    EMOJI="🚀"
    TITLE="Release Started"
    MESSAGE="Release v$VERSION has been initiated and is ready for QA testing."
    COLOR="#36a64f"
    ;;
  "qa_approved")
    EMOJI="✅"
    TITLE="QA Approved"
    MESSAGE="Release v$VERSION has been approved by QA and merged to main."
    COLOR="#36a64f"
    ;;
  "release_published")
    EMOJI="🎉"
    TITLE="Release Published"
    MESSAGE="Release v$VERSION has been published and deployed to production."
    COLOR="#7CD197"
    ;;
  "backmerge_complete")
    EMOJI="🔄"
    TITLE="Back-merge Complete"
    MESSAGE="Changes from main have been merged back to dev."
    COLOR="#5865F2"
    ;;
  "backmerge_conflict")
    EMOJI="⚠️"
    TITLE="Back-merge Conflicts"
    MESSAGE="Back-merge from main to dev has conflicts. Manual resolution required."
    COLOR="#FFA500"
    ;;
  "release_failed")
    EMOJI="❌"
    TITLE="Release Failed"
    MESSAGE="Release v$VERSION encountered an error: $ADDITIONAL_INFO"
    COLOR="#FF0000"
    ;;
  *)
    echo "Unknown event type: $EVENT_TYPE"
    exit 1
    ;;
esac

# Build JSON payload
PAYLOAD=$(cat <<EOF
{
  "text": "$EMOJI $TITLE",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "$EMOJI $TITLE"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Version:* $VERSION\n*Status:* $MESSAGE"
      }
    }
EOF
)

# Add additional info if provided
if [ -n "$ADDITIONAL_INFO" ]; then
  PAYLOAD="$PAYLOAD"$(cat <<EOF
,
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "$ADDITIONAL_INFO"
      }
    }
EOF
)
fi

# Add workflow link if available
if [ -n "$GITHUB_RUN_ID" ]; then
  WORKFLOW_URL="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
  PAYLOAD="$PAYLOAD"$(cat <<EOF
,
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "<$WORKFLOW_URL|View Workflow Run>"
      }
    }
EOF
)
fi

# Close JSON
PAYLOAD="$PAYLOAD"$(cat <<EOF
  ],
  "attachments": [
    {
      "color": "$COLOR",
      "footer": "Safe Wallet Release Bot",
      "footer_icon": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
      "ts": $(date +%s)
    }
  ]
}
EOF
)

# Send notification
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")

if [ "$RESPONSE" = "200" ]; then
  echo "✅ Slack notification sent successfully"
else
  echo "⚠️  Failed to send Slack notification (HTTP $RESPONSE)"
  exit 1
fi
