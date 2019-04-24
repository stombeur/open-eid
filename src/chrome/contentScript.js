if(!chrome) chrome = browser;

// get result from extension
chrome.runtime.onMessage.addListener(function(request, sender) {
 
  console.log('Extension');
  console.log(request, sender);
  
  // chrome dev = elkdefnldphjoeafcphbiknjfdhjnngm & ceojkhlgadejfjbmikopnodckmhcbnke
  // chrome webstore = cgdhcnihnfegipidedmkijjkbphakcjo  
  // firefox = firefox@open-eid.eu.org
  
  if(sender.id != 'elkdefnldphjoeafcphbiknjfdhjnngm'
  && sender.id != 'cgdhcnihnfegipidedmkijjkbphakcjo'
  && sender.id != 'ceojkhlgadejfjbmikopnodckmhcbnke'
  && sender.id != 'firefox@open-eid.eu.org') return;

  if(request) window.postMessage(request, '*');
});

// get request from web page
window.addEventListener('message', function(event) {

  console.log(event);

  if(event.source != window) return;

  // send request to extension
  if(typeof event.data == 'object') {
    if('url' in event.data) {
      if(event.data.url.substring(event.data.url.indexOf(':') + 1) == '') event.data.url = event.data.url + new String(event.source.location);
      if(typeof browser != 'undefined' && browser != null) {
        console.log('Window: Firefox');
        browser.runtime.sendMessage(event.data);        
      } else {
        console.log('Window: Chrome');
        chrome.extension.sendMessage(event.data);
      }
    } else {
      var data = event.data;
      for(var i in data) {
        try { data[i] = decodeURIComponent(data[i]); } catch(e) { data[i] = unescape(data[i]); }
      }
      console.log(data);
      window.localStorage.setItem('open-eid', JSON.stringify(data));
    }
  }
  
}, false);

var script = document.createElement('script');
script.textContent = 'window.openEIDInstalled = true;';
(document.head||document.documentElement).appendChild(script);
script.remove();

// firefox URL handler
if(typeof browser != 'undefined' && browser != null) {
  window.addEventListener('load', function() {
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', 'https://e-id.eu.org/release/Open-eID.js');
    document.getElementsByTagName('head')[0].appendChild(script);
    var links = document.getElementsByTagName('a');
    for(var i = 0; i < links.length; i++) {
      if(links[i].href.indexOf('open-eid:') == 0) {
        links[i].setAttribute('onmouseup', 'window.openEID_link = this; window.openEID.read(function(json) { window.open(window.openEID_link.href.substring(9) + \'#\' + encodeURIComponent(JSON.stringify(json))); window.openEID_link = null; });');
        links[i].setAttribute('onclick', 'return false;');
      }
      if(links[i].href.indexOf('open-eid-sign:') == 0) {
        links[i].setAttribute('onmouseup', 'window.openEID_link = this; window.openEID.read(function(json) { window.open(window.openEID_link.href.substring(14) + \'#\' + encodeURIComponent(JSON.stringify(json))); window.openEID_link = null; });');
        links[i].setAttribute('onclick', 'return false;');
      }      
    }
  });
}
