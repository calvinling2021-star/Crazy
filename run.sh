#!/usr/bin/env bash
# Convenience wrapper around the pipeline CLI.
#
# Examples:
#   ./run.sh daily                  # full refresh + export hot prospects
#   ./run.sh universe --limit 200   # quick smoke run
#   ./run.sh feeds watch -i 600     # long-running RSS listener
#   ./run.sh export --hot-only --out hot.xlsx
#
# Reads optional credentials from .env in the current dir if present.
set -euo pipefail

if [[ -f .env ]]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

exec python -m pipeline.main "$@"
