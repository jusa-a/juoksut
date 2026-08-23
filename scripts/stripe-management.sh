#!/usr/bin/env bash
set -euo pipefail

# Defaults to the read-only Stripe test key. Set STRIPE_KEYCHAIN_SERVICE to
# juoksut-stripe-management-live only for an explicitly approved live read.
stripe_keychain_service="${STRIPE_KEYCHAIN_SERVICE:-juoksut-stripe-management-test}"
stripe_management_key="$(security find-generic-password -a "$(id -un)" -s "$stripe_keychain_service" -w 2>/dev/null || true)"

if [[ -z "$stripe_management_key" ]]; then
  echo "Stripe key not found in macOS Keychain (service: $stripe_keychain_service)." >&2
  exit 1
fi

if [[ "$#" -eq 0 ]]; then
  echo "Usage: bash scripts/stripe-management.sh <command> [args...]" >&2
  exit 1
fi

export STRIPE_MANAGEMENT_KEY="$stripe_management_key"
exec "$@"
