#!/bin/sh
set -e

# ============================================================================
# Runtime environment variable injection for static Next.js export
#
# Next.js's static export (output: 'export') uses webpack's process browser
# polyfill (npm 'process' package) which initializes process.env = {}.
# Constants in the app are read via process.env.NEXT_PUBLIC_* at runtime.
#
# This script injects all NEXT_PUBLIC_* container env vars directly into
# that process.env object by patching the main webpack chunk at startup.
# ============================================================================

STATIC_DIR="/usr/share/nginx/html"

echo "==> Injecting runtime environment variables into process.env..."

# Collect all NEXT_PUBLIC_* env vars
ENV_FILE="/tmp/next_public_vars.txt"
env | grep '^NEXT_PUBLIC_' > "$ENV_FILE" 2>/dev/null || true

if [ -s "$ENV_FILE" ]; then
    # Build a JSON object string: {"NEXT_PUBLIC_FOO":"bar",...}
    ENV_JSON="{"
    FIRST=true
    while IFS='=' read -r name value; do
        echo "    ${name}"
        if [ "$FIRST" = "true" ]; then
            FIRST=false
        else
            ENV_JSON="${ENV_JSON},"
        fi
        # Escape backslashes and double quotes inside the value
        escaped_value=$(printf '%s' "$value" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
        ENV_JSON="${ENV_JSON}\"${name}\":\"${escaped_value}\""
    done < "$ENV_FILE"
    ENV_JSON="${ENV_JSON}}"

    # The webpack process polyfill (module 29143 in the main-*.js chunk) sets:
    #   o.browser=!0,o.env={},o.argv=[]
    # We replace the empty env object with our env vars so that all
    # process.env.NEXT_PUBLIC_* accesses in the bundle return the correct value.
    MAIN_CHUNK=$(find "$STATIC_DIR/_next/static/chunks" -name "main-*.js" ! -name "*.map" 2>/dev/null | head -1)

    if [ -n "$MAIN_CHUNK" ]; then
        # Escape characters that are special in sed's replacement string
        escaped_json=$(printf '%s' "$ENV_JSON" | sed 's/[&|]/\\&/g')
        # Replace .env={} → .env={"NEXT_PUBLIC_FOO":"bar",...}
        # {} in BRE sed is treated as literal braces (not a quantifier)
        sed -i "s|\.env={}|.env=${escaped_json}|g" "$MAIN_CHUNK"
        echo "==> Patched process.env in: $(basename "$MAIN_CHUNK")"
    else
        echo "==> WARNING: main webpack chunk not found — process.env not patched"
    fi

    INJECTED=$(wc -l < "$ENV_FILE")
    echo "==> Injected ${INJECTED} variable(s)"
else
    echo "    No NEXT_PUBLIC_* variables found in environment"
fi

rm -f "$ENV_FILE"

echo "==> Starting nginx on port 8080..."
exec nginx -g 'daemon off;'
