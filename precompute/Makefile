# precompute/Makefile — orchestrator for the offline Python pipeline.
#
# DESIGN.md §Stage 2 handoff line 933:
#   "Precompute pipeline (/precompute/) producing every nor/*.json file
#    plus audition.json and features.json. CI integration: pipeline runs
#    on schedule + precompute/verify.py asserts every empirical claim."
#
# Invocation is always from the repo root (../):
#
#     make -C precompute all      # full pipeline + verify
#     make -C precompute build    # build only, skip verify
#     make -C precompute verify   # verify only, do not rebuild
#     make -C precompute clean    # remove /static/data/ outputs
#     make -C precompute deps     # install pip deps into current venv
#     make -C precompute list     # print pipeline steps
#
# The Makefile is a thin wrapper around `python -m precompute.*` so a
# reviewer can reproduce any single step without reading this file.

PYTHON ?= python3
REPO_ROOT := $(abspath $(CURDIR)/..)
STATIC_DATA := $(REPO_ROOT)/static/data

.PHONY: all build verify clean deps list help

help:
	@echo "targets:"
	@echo "  make all      — build every JSON and run verify"
	@echo "  make build    — build only, skip verify"
	@echo "  make verify   — verify only (pipeline must have run)"
	@echo "  make clean    — remove /static/data/ outputs"
	@echo "  make deps     — pip install -r requirements.txt"
	@echo "  make list     — list pipeline step names"

all: build verify

build:
	cd $(REPO_ROOT) && $(PYTHON) -m precompute.pipeline

verify:
	cd $(REPO_ROOT) && $(PYTHON) -m precompute.verify

list:
	cd $(REPO_ROOT) && $(PYTHON) -m precompute.pipeline --list

deps:
	$(PYTHON) -m pip install -r requirements.txt

# `clean` removes only the files the pipeline writes — never touches
# user-authored fixtures, test snapshots, or node_modules.
clean:
	@rm -f $(STATIC_DATA)/features.json
	@rm -f $(STATIC_DATA)/audition.json
	@rm -rf $(STATIC_DATA)/nor
	@rm -rf $(STATIC_DATA)/ury
	@echo "removed /static/data/ JSON outputs"
