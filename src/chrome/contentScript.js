if(!chrome) chrome = browser;

// get result from extension
chrome.runtime.onMessage.addListener(function(request, sender) {
 
  console.log(request, sender);
  
  // chrome dev = elkdefnldphjoeafcphbiknjfdhjnngm
  // chrome webstore = cgdhcnihnfegipidedmkijjkbphakcjo  
  // firefox = firefox@open-eid.eu.org
  
  if(sender.id != 'elkdefnldphjoeafcphbiknjfdhjnngm'
  && sender.id != 'cgdhcnihnfegipidedmkijjkbphakcjo'
  && sender.id != 'firefox@open-eid.eu.org') return;

  window.postMessage(request, '*');
});

// get request from web page
window.addEventListener('message', function(event) {

  console.log(event);

  if(event.source != window) return;

  // send request to extension
  if('url' in event.data) {
    event.data.url = event.data.url + new String(event.source.location);
    if(window.browser) {
        browser.runtime.sendMessage(event.data);
    } else {
        chrome.extension.sendMessage(event.data);
    }
  } else {
    var data = event.data;
    for(var i in data) data[i] = decodeURIComponent(data[i]);
    console.log(data);
    window.localStorage.setItem('open-eid', JSON.stringify(data));
  }
  
}, false);

