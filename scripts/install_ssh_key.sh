#!/usr/bin/env bash

# Usage: ssh inverseiq@146.190.233.46 'bash -s' < scripts/install_ssh_key.sh "ssh-ed25519 AAAA... your_label"
# Adds the provided public key to the current user's authorized_keys with sane permissions.

set -euo pipefail

PUBKEY=${1:-}

if [[ -z "$PUBKEY" ]]; then
  echo "Public key is required as the first argument" >&2
  exit 1
fi

mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Append key if not already present
if ! grep -Fq "$PUBKEY" ~/.ssh/authorized_keys 2>/dev/null; then
  echo "$PUBKEY" >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
  echo "✅ Key added to ~/.ssh/authorized_keys"
else
  echo "ℹ️ Key already present in ~/.ssh/authorized_keys"
fi

echo "Done"