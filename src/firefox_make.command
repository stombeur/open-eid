#!/bin/sh

cd "`dirname $0`"
rm ../build/Open-eID-firefox-extension.zip
cd chrome
zip ../../build/Open-eID-firefox-extension.zip *.*
cd ..
cd firefox
zip ../../build/Open-eID-firefox-extension.zip *.*
