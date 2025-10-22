#!/bin/bash
# Quiet dev server - redirects verbose output
next dev --turbopack -p 3001 2>&1 | grep -v "webpack\|Compiled\|compiled" | grep -E "ready|error|warn|Ready|Error|Warn|http"
