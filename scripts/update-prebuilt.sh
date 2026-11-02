#!/usr/bin/env bash
# Replace the embedded prebuilt client with a pipecat-ai-prebuilt release from
# PyPI: download its wheel, check it against the SHA-256 PyPI publishes, and
# copy its built client into prebuilt/dist unmodified.
#
#   scripts/update-prebuilt.sh 1.3.0
set -euo pipefail

version="${1:?usage: $0 VERSION}"
root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

meta="$work/meta.json"
curl -fsSL "https://pypi.org/pypi/pipecat-ai-prebuilt/${version}/json" -o "$meta"
read -r url sha < <(python3 -I -c '
import json, sys
urls = json.load(open(sys.argv[1]))["urls"]
wheel = next(u for u in urls if u["filename"].endswith(".whl"))
print(wheel["url"], wheel["digests"]["sha256"])
' "$meta")

curl -fsSL "$url" -o "$work/prebuilt.whl"
echo "$sha  $work/prebuilt.whl" | sha256sum -c -

mkdir "$work/x"
python3 -I -m zipfile -e "$work/prebuilt.whl" "$work/x"

rm -rf "$root/prebuilt/dist"
cp -r "$work/x/pipecat_ai_prebuilt/client/dist" "$root/prebuilt/dist"
cp "$work/x/pipecat_ai_prebuilt-${version}.dist-info/licenses/LICENSE" "$root/prebuilt/LICENSE"
sed -i "s/^const Version = \".*\"/const Version = \"${version}\"/" "$root/prebuilt/prebuilt.go"
echo "prebuilt/dist is pipecat-ai-prebuilt ${version} (wheel sha256 ${sha})"
