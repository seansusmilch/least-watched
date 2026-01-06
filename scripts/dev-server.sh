#!/bin/bash
exec bun run dev 2>&1 | grep --line-buffered -v "ECONNRESET"
