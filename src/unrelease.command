#!/bin/sh

cd "`dirname $0`"
cd ..
cd release
git tag -d v0.1.2
git push origin :refs/tags/v0.1.2
