# ![')&lt;](https://github.com/michael79bxl/open-eid/raw/master/src/chrome/icon48.png "Logo") open-eid

open-eid is a native plugin for the web to make e-ID card reading and signing easier.

## Download

You can download a Mac Pre-release here

https://github.com/michael79bxl/open-eid/raw/master/release/Open-eID.dmg

You can download a Windows Pre-release soon

## Requirements

- Windows or Mac OS
- Middleware
- Browser compatible with native URL or Chrome Native Messaging extension

## Chrome extension

In order for the chrome extension to work, the native app must be launched once.

On Mac OS, the native app must be installed in /Applications.

The extension is available
[here](https://chrome.google.com/webstore/detail/open-eid/cgdhcnihnfegipidedmkijjkbphakcjo)

You can test the extension on the 
[following page](https://michael79bxl.github.io/open-eid/src/chrome_test.html)

## Status

This is a pre-release version 0.1 with the following features

- Read eID card content using URL or Chrome extension

The app has been tested on Windows and Mac OS with belgian e-ID cards.

*Windows and Mac versions are not synchronized about features or output format.*

## Project goals

- Provide opensource alternative for e-ID card reading and signing for modern browsers
- Read e-ID card content
- KISS (Keep It Simple and Secure)
- Linux version
- Mobile version "à-la" itsme for Android & iOS

## Developement tools

- The windows version is developed using the freebasic compiler and the Swelio library
- The mac version is developed using nodejs