# ![&lt;eID)](https://github.com/michael79bxl/open-eid/raw/master/src/chrome/icon48.png "Logo") open-eid

open-eid is a native plugin for the web to make e-ID card reading and signing easier.

[Read more](https://michael79bxl.github.io/open-eid/)

## Status

This is a pre-release version 0.1 with the following features

- Read eID card content using URL or Web extension

The app has been tested on Windows and Mac OS with belgian e-ID cards.

*Windows and Mac versions are not synchronized about features or output format.*

## Using

You can use the library with a simple URL `open-eid:` followed by your redirection URL.

The card data is "sent" to your redirection URL using the "hash" part (right after `#`).

The data is URI component encoded JSON object with every value escaped/URI component encoded.

Open-eID detects the browser automatically but the result will open in a new window/tab.

The easiest thing to do to capture the data from the origin tab/window is to save the result in LocalStorage and read it from your origin page.

The Web Extension allows you to read the card data without opening a new tab/window but requires users to install both the app and the extension.

*A JavaScript helper script will be available soon*

## Building

To build open-eid you need the following tools:

### Windows

* FreeBasic compiler
* Swelio library (Swelio32.dll)
* 7zip command line

### Mac

* NodeJS

## References

* https://www.freebasic.net/
* https://github.com/perevoznyk/swelio-sdk/
* https://www.7-zip.org/
* https://nodejs.org/
* https://github.com/PeculiarVentures/pkcs11js/
