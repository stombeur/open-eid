// Opera 8.0+
var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

// Firefox 1.0+
var isFirefox = typeof InstallTrigger !== 'undefined';

// Safari 3.0+ "[object HTMLElementConstructor]" 
var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

// Internet Explorer 6-11
var isIE = /*@cc_on!@*/false || !!document.documentMode;

// Edge 20+
var isEdge = !isIE && !!window.StyleMedia;

// Chrome 1+
var isChrome = !!window.chrome && !!window.chrome.webstore;

isInWebAppiOS = (window.navigator.standalone == true);
isInWebAppChrome = (window.matchMedia('(display-mode: standalone)').matches);
isInWebApp = isInWebAppiOS || isInWebAppChrome;

var openEID = {
  ffAlert: 'Firefox requires the app and the extension. Click to OK to be redirected to the plugin website to install it.',
  ffURL: 'https://addons.mozilla.org/en/firefox/addon/open-eid/',
  readInterval: null,
  readCallback: null,
  readTicks: 0,
  timeout: 30,
  
  read: function(callback) {
    if(openEID.readInterval != null) {
      clearInterval(openEID.readInterval);
      openEID.readInterval = null;
      openEID.readTicks = 0;
    }
    openEID.readCallback = callback;
    openEID.readInterval = setInterval(function() {
      openEID.readTicks++;
      if(openEID.readTicks > openEID.timeout) {
        openEID.readCallback({'err': 'Timeout'});        
        clearInterval(openEID.readInterval);
        openEID.readInterval = null;
        openEID.readTicks = 0;       
        return; 
      }
      console.log('Wait for result...');
      var result = window.localStorage.getItem('open-eid');
      if(typeof result != 'undefined' && result != null) {
        if(result != '') {
          window.localStorage.setItem('open-eid', '');
          var json = null;
          try { json = eval('(' + result + ')'); } catch(e) { json = null; }
          if(typeof json == 'object' && json != null) {  
            for(var i in json) {
              try { json[i] = decodeURIComponent(json[i]); } catch(e) { json[i] = unescape(json[i]); }
            }
            clearInterval(openEID.readInterval);
            openEID.readInterval = null;
            openEID.readCallback(json);
          }
        }
      }
    }, 1000);       
    if('openEIDInstalled' in window) {
      if(window.openEIDInstalled) { // extension
        window.postMessage({url: 'open-eid:'}, '*');
      } else {
        if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
          if(confirm(openEID.ffAlert)) window.open(openEID.ffURL);
        } else {
          location = 'open-eid:' + new String(location);
        }
      }
    } else {
      if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        if(confirm(openEID.ffAlert)) window.open(openEID.ffURL);
      } else {
        var browser = '';
        if(isChrome) browser = '#Google Chrome App'; // enable app mode
        if(isSafari) browser = '#Safari';
        if(isOpera) browser = '#Opera';
        location = 'open-eid:' + new String(location) + browser;
      }
    }
  }
}

window.openEID = openEID;
window.addEventListener('load', function() {
  window.localStorage.setItem('open-eid', '');
  var h = new String(location.hash).substring(1);
  try { h = decodeURIComponent(h); } catch(e) { h = unescape(h); }
  if(h != '') {
    var json = eval('(' + h + ')');
    if(typeof json == 'object') {
      window.localStorage.setItem('open-eid', h);
      document.body.style.overflow = 'hidden';
      if(isInWebApp) {
        window.resizeTo(250, 250);
        window.moveTo((screen.width - 250) / 2, (screen.height - 250) / 2);
      }
      var div = document.createElement('div');
      div.setAttribute('style', 'position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: white; background-image: url(https://e-id.eu.org/release/loading.gif); background-position: center center; background-repeat: no-repeat;');
      document.body.appendChild(div);
      setTimeout(function() {
        window.open('', '_self', '');
        window.close();
      }, 2000);
    }  
  }
});

