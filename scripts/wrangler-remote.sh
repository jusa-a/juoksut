#!/usr/bin/env bash
set -euo pipefail

# Keeps a Cloudflare API token out of the repository and shell history. Add it
# once with:
# security add-generic-password -U -a "$(id -un)" -s juoksut-cloudflare-api-token -w
cloudflare_token="$(security find-generic-password -a "$(id -un)" -s juoksut-cloudflare-api-token -w 2>/dev/null || true)"

if [[ -z "$cloudflare_token" ]]; then
  echo "Cloudflare token not found in macOS Keychain (service: juoksut-cloudflare-api-token)." >&2
  exit 1
fi

export CLOUDFLARE_API_TOKEN="$cloudflare_token"
export CLOUDFLARE_ACCOUNT_ID="a1706fe2265b785c44d410b6b2ac33c2"

exec npx wrangler "$@"
