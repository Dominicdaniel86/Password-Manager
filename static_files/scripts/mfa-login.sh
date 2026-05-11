#!/bin/bash

# usage: source bash mfa-login.sh <mfa_token>
serial_number="arn:aws:iam::977145922557:mfa/Dominic"
mfa_token="$1"

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Error: run with 'source', not 'bash':"
    echo "  source ./scripts/mfa-login.sh <mfa_token>"
    exit 1
fi

# Print error and exit if MFA token is not provided or is not 6 digits
if [[ -z "$mfa_token" ]]; then
    echo "Error: MFA token is required."
    echo "Usage: source ./scripts/mfa-login.sh <mfa_token>"
    return 1
elif ! [[ "$mfa_token" =~ ^[0-9]{6}$ ]]; then
    echo "Error: MFA token must be a 6-digit number."
    echo "Usage: source ./scripts/mfa-login.sh <mfa_token>"
    return 1
fi

credentials=$(aws sts get-session-token --serial-number $serial_number --token-code $mfa_token)

export AWS_ACCESS_KEY_ID=$(echo $credentials | python3 -c "import sys, json; print(json.load(sys.stdin)['Credentials']['AccessKeyId'])")
export AWS_SECRET_ACCESS_KEY=$(echo $credentials | python3 -c "import sys, json; print(json.load(sys.stdin)['Credentials']['SecretAccessKey'])")
export AWS_SESSION_TOKEN=$(echo $credentials | python3 -c "import sys, json; print(json.load(sys.stdin)['Credentials']['SessionToken'])")

expiration=$(echo $credentials | python3 -c "import sys, json; print(json.load(sys.stdin)['Credentials']['Expiration'])")
now=$(date -u +%s)
exp_epoch=$(date -u -d "$expiration" +%s 2>/dev/null || date -u -j -f "%Y-%m-%dT%H:%M:%S+00:00" "$expiration" +%s)
minutes=$(( ($exp_epoch - $now) / 60 ))

echo "✓ Credentials exported. Valid for ~$minutes minutes (until $expiration)"
