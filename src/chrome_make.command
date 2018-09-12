#!/bin/sh

cd "`dirname $0`"
rm ../build/Open-eID-chrome-extension.zip
zip ../build/Open-eID-chrome-extension.zip chrome/*
