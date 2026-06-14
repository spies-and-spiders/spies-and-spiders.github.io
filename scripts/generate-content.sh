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

# Generate merged homebrew JSON
bb scripts/generate-merged-json.bb

# Set updated time
jq_inplace homebrew/sns.json "._meta.dateLastModified = $(date +'%s')"

# Prepare SNS data
cat homebrew/sns.json | jq -c '{spell}' > data/spells/spells-sns.json
jq -c -s '(.[0] | {monster}) * {monster: ([.[0].monster, .[1].monster] | add)}' homebrew/sns.json data/feats.json > data/bestiary/bestiary-sns.json
cat homebrew/sns.json | jq -c '{class,subclass,classFeature,subclassFeature}' > data/class/class-sns.json

mkdir -p data/book && cat data/books.json | jq -c '{book,data}' > data/book/book-sns.json

cat homebrew/sns.json | jq -c '{optionalfeature}' > data/optionalfeatures.json
jq_inplace homebrew/sns.json -c 'del(.optionalfeature)'

# Generate all relevant indexes and pages
mkdir -p search
npm install
npm run gen

npm run build:sw:prod
