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

# Generate merged JSON
bb scripts/generate-merged-json.bb

# Prepare SNS data
cat data/generated/sns.json | jq -c '{spell}' > data/spells/spells-sns.json
mkdir -p data/maneuvers && cat data/generated/sns.json | jq -c '{maneuver}' > data/maneuvers/maneuvers-sns.json
jq -c -s '(.[0] | {monster}) * {monster: ([.[0].monster, .[1].monster] | add)}' data/generated/sns.json data/feats.json > data/bestiary/bestiary-sns.json
cat data/generated/sns.json | jq -c '{class,subclass,classFeature,subclassFeature}' > data/class/class-sns.json

mkdir -p data/book && jq -c -s --argjson now "$(date +'%s')" '(.[0] | {book,data}) + {_meta: (.[1]._meta + {dateLastModified: $now})}' data/books.json data/generated/sns.json > data/book/book-sns.json

cat data/generated/sns.json | jq -c '{optionalfeature}' > data/optionalfeatures.json
rm data/generated/sns.json

# Generate all relevant indexes and pages
mkdir -p search
npm install
npm run gen

npm run build:sw:prod
