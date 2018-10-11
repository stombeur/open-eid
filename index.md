# ![&lt;eID)](https://e-id.eu.org/src/chrome/icon48.png "Logo") open-eid

open-eid is a native plugin for the web to make e-ID card reading and signing easier.

## Download

You can download a Mac and Windows Pre-release
[here](https://github.com/michael79bxl/open-eid/releases/)

Source is available [here](https://github.com/michael79bxl/open-eid/tree/master/)

## Requirements

- Windows or Mac OS
- Middleware (for Belgium, download [here](https://eid.belgium.be/)) and/or smartcard driver
- Browser compatible with native URL or Web Native Messaging extension (Chrome, Firefox, Opera)

## Native URL

The native app can be called using a special `open-eid:` URL scheme followed by the URL used to redirect e-ID data.

Sample: `open-eid:https://e-id.eu.org/src/url_test.html`

Test this sample on [Google Chrome](open-eid:https://e-id.eu.org/src/url_test.html#Google Chrome) ,
[Safari](open-eid:https://e-id.eu.org/src/url_test.html#Safari),
[Opera](open-eid:https://e-id.eu.org/src/url_test.html#Opera) or
[Your default Browser](open-eid:https://e-id.eu.org/src/url_test.html)


The data is sent to the redirection URL fragment as an URL encoded JSON object after `#`.

Each value in the JSON array is also URL encoded.

*Future releases will only support HTTPS redirection URL.*

## Web extension

In order for the web extension to work, the native app must be launched once.

On Mac OS, the native app must be installed in /Applications

The web extension is available
[here](https://chrome.google.com/webstore/detail/open-eid/cgdhcnihnfegipidedmkijjkbphakcjo)
on the Chrome Web Store and
[here](https://addons.mozilla.org/en/firefox/addon/open-eid/)
on the Add-ons for Firefox Website

You can test the extension on the 
[following page](https://e-id.eu.org/src/extension_test.html)

The extension must be enabled for each site by clicking its icon.

Clicking the extension button again removes the permission.

## Browser matrix

|Browser |Native URL|Extension| Helper |
|--------|:--------:|:-------:|:------:|
|Chrome  |&#x2714;  |&#x2714; |&#x2714;|
|Safari  |&#x2714;  |         |&#x2714;|
|Firefox*|&#x2714;  |&#x2714; |&#x2714;|
|IE      |&#x2714;  |         |&#x2714;|
|Edge    |&#x2714;  |         |&#x2714;|
|Opera   |&#x2714;  |&#x2714; |&#x2714;|

\**native URL using Web Extension*

## Status

This is a pre-release version 0.1 with the following features

- Read eID card content using URL or Web extension

The app has been tested on Windows and Mac OS with belgian e-ID cards.

*Windows and Mac versions are not synchronized about features or output format.*

## Project goals

- Provide opensource alternative for e-ID card reading and signing for modern browsers
- Read e-ID card content
- Sign content and documents using e-ID card
- KISS (Keep It Simple and Secure)
- Linux version
- Mobile version "à-la" itsme for Android & iOS

*Authentication is not a project goal. This can be achieved using mutual SSL.*

## Developement tools

- The windows version is developed using the freebasic compiler and the Swelio library
- The mac version is developed using nodejs