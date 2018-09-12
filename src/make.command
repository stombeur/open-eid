#!/bin/sh

cd "`dirname $0`"
cd mac
rm -f -R  ../../build/mac/Open-eID.app
osacompile -o ../../build/mac/Open-eID.app open-eid.applescript
sleep 2
cp Info.plist ../../build/mac/Open-eID.app/Contents/
cp applet.icns ../../build/mac/Open-eID.app/Contents/Resources/
pkg --targets node8-macos-x64 open-eid.js
chmod +x open-eid
mv open-eid ../../build/mac/Open-eID.app/Contents/MacOS/
chmod +x ../../build/mac/Open-eID.app/Contents/MacOS/open-eid
cp node_modules/pkcs11js/build/Release/pkcs11.node ../../build/mac/Open-eID.app/Contents/MacOS/
rm -f -R /Applications/Open-eID.app
cp -f -R ../../build/mac/Open-eID.app /Applications/
SIZE=`du -sh "../../build/mac/" | sed 's/\([0-9]*\)M\(.*\)/\1/'`
SIZE=`echo "${SIZE} + 1.0" | bc | awk '{print int($1+0.5)}'`
rm ../../release/Open-eID.dmg
rm ../../build/Open-eID.dmg
hdiutil create -srcfolder ../../build/mac/ -volname "Open-eID" -fs HFS+ -fsargs "-c c=64,a=16,e=16" -format UDRW -size ${SIZE}M "../../build/Open-eID.dmg"
DEVICE=$(hdiutil attach -readwrite -noverify "../../build/Open-eID.dmg" | egrep '^/dev/' | sed 1q | awk '{print $1}')
sleep 2
pushd /Volumes/Open-eID
ln -s /Applications
popd
sleep 2
sync
hdiutil detach "${DEVICE}"
hdiutil convert "../../build/Open-eID.dmg" -format UDZO -imagekey zlib-level=9 -o "../../release/Open-eID.dmg"
