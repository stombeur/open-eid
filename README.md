# ![&lt;eID)](https://e-id.eu.org/src/chrome/icon48.png "Logo") open-eid

open-eid is a native plugin for the web to make e-ID card reading and signing easier.

[Read more](https://e-id.eu.org/)

## Status

This is a pre-release version 0.1 with the following features

- Read eID card content using URL or Web extension

The app has been tested on Windows and Mac OS with belgian e-ID cards.

*Windows and Mac versions are not synchronized about features or output format.*

## Using

You can use Open-eID with a simple URL starting with `open-eid:` followed by your redirection URL.

The card data is "sent" to your redirection URL using the "hash" part (right after `#`).

The data is URI component encoded JSON object with every value escaped/URI component encoded.

Open-eID detects the browser automatically but the result will open in a new window/tab.

The easiest thing to do to capture the data from the origin tab/window is to save the result in LocalStorage and read it from your origin page.

The Web Extension allows you to read the card data without opening a new tab/window but requires users to install both the app and the extension.

The easiest way to use Open-eID is to use the helper function. Just add the following code to `head` section of your HTML page.

`<script type="text/javascript" src="https://e-id.eu.org/release/Open-eID.js"></script>`

The `openEID.read` function can then be called with a callback function.

The callback function has a single parameter as an object containing decoded card data.

`openEID.read(function(result) { console.log(result); })`

You can test the helper function on the 
[following page](https://e-id.eu.org/src/helper_test.html)

## Building

To build open-eid you need the following tools:

### Windows

* FreeBasic compiler
* Swelio library (Swelio32.dll)

### Mac

* NodeJS
* pkg
* pkcs11js

## References

* https://www.freebasic.net/
* https://github.com/perevoznyk/swelio-sdk/
* https://nodejs.org/
* https://www.npmjs.com/package/pkg/
* https://github.com/PeculiarVentures/pkcs11js/
