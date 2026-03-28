#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Set updated time
cat sns/meta-sns.json | jq "._meta.dateLastModified = $(date +'%s')" > sns/meta-sns.json

# Generate merged homebrew JSON
bb .github/generate-merged-json.bb

# Prepare SNS data
cat homebrew/sns.json | jq -c '{spell}' > data/spells/spells-sns.json
cat homebrew/sns.json | jq -c '{monster}' > data/bestiary/bestiary-sns.json
cat homebrew/sns.json | jq -c '{optionalfeature}' > data/optionalfeatures.json
cat homebrew/sns.json | jq -c '{class,subclass,classFeature,subclassFeature}' > data/class/class-sns.json

# Prepare search indexes
mkdir -p search
npm install
npm run gen

npm run build:sw:prod
