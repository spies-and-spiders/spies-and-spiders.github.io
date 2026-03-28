#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

jq_inplace() {
	local file="$1"; shift
	local tmp
	tmp=$(mktemp)
	jq "$@" "$file" > "$tmp" && mv "$tmp" "$file"
}

# Set updated time
jq_inplace sns/meta-sns.json "._meta.dateLastModified = $(date +'%s')"

# Generate merged homebrew JSON
bb .github/generate-merged-json.bb

# Prepare SNS data
cat homebrew/sns.json | jq -c '{spell}' > data/spells/spells-sns.json
cat homebrew/sns.json | jq -c '{monster}' > data/bestiary/bestiary-sns.json
cat homebrew/sns.json | jq -c '{class,subclass,classFeature,subclassFeature}' > data/class/class-sns.json

cat homebrew/sns.json | jq -c '{optionalfeature}' > data/optionalfeatures.json
jq_inplace homebrew/sns.json -c 'del(.optionalfeature)'

# Generate all relevant indexes and pages
mkdir -p search
npm install
mkdir -p data/book
npm run gen

npm run build:sw:prod
