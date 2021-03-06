if(typeof browser != 'undefined' && browser != null) {
  console.log('Background: Firefox');
  chrome = browser;
}

// get request from content script
chrome.runtime.onMessage.addListener(function(request, sender) {
  console.log(request, sender);
  
  // send request to native host
  chrome.runtime.sendNativeMessage('io.github.michael79bxl.open_eid', request,
    function(response) {
      
      console.log(response);
      // send result to content script
      if(typeof response != 'undefined' && response != null) {
        chrome.tabs.sendMessage(sender.tab.id, response);
      } else {
        chrome.tabs.sendMessage(sender.tab.id, {'err': 'No result from extension'});
      }
    }
  );   
});

var origins = [];

function inject() {
  if(!chrome) {
    setTimeout(function() {
      inject();
    }, 1);
    return;
  }
  if(!('permissions' in chrome)) {
    setTimeout(function() {
      inject();
    }, 1);
    return;
  }  
  chrome.permissions.getAll(function(permissions) {
    console.log(permissions.origins);
    origins = permissions.origins;
    origins.push('file:');
    for(var i in origins) {
      var origin = origins[i];
      if(!('webNavigation' in chrome)) return;
      chrome.webNavigation.onCompleted.addListener(function(details) {
        console.log(details);
        try {
          chrome.tabs.executeScript(details.tabId, {
            file: "contentScript.js",
            runAt: "document_end"
          }, function(result) {
            var lastErr = chrome.runtime.lastError;
            if(lastErr) console.log(lastErr);
          });  
        } catch(e) {
          // not allowed
        }    
      }, {url: [{urlPrefix: origin.substring(0, origin.length - 2)}]});
    }
  });
}

inject();

//chrome.webNavigation.onCompleted.addListener

chrome.browserAction.onClicked.addListener(function(tab) {
  console.log(tab);
  console.log('Location: ' + tab.url);
  var parts = [];
  parts = tab.url.split(':');
  var protocol = parts[0];
  if(parts.length > 0) parts = parts[1].split('\/');
  var host = '';
  for(var i in parts) {
    if(parts[i] != '') {
      host = parts[i];
      break;
    }
  }
  console.log('Origin: ' + protocol + '://' + host + '/*');
  if(host == '') return;
  var origin = protocol + '://' + host + '/*';
  var permission = {
    permissions: ['tabs', 'webNavigation'],
    origins: [protocol + '://' + host + '/*']
  };
  console.log(origins);
  console.log(origin);
  console.log(origins.includes(origin));
  if(origins.includes(origin)) {
    console.log('Extension has access to ' + origin);
    chrome.browserAction.setBadgeBackgroundColor({color: '#79d3af'});
    chrome.browserAction.setBadgeText({text: '\u2714'});
    /*if(confirm('Open e-ID has access to ' + host + '\n\nClick Cancel to remove the authorization')) {
      // ok
    } else {*/
      console.log('Permission remove request for ' + origin);
      chrome.permissions.remove(permission, function(removed) {
        if(removed) {
          console.log('Permission removed for ' + origin);
          chrome.browserAction.setBadgeBackgroundColor({color: 'red'});
          chrome.browserAction.setBadgeText({text: '\u2715'});
          //alert('The permission was removed');
          inject();
          chrome.tabs.executeScript(tab.id, {
            code: "history.go(0)"
          }, function(result) {
            var lastErr = chrome.runtime.lastError;
            if(lastErr) console.log(lastErr);
          });           
          setTimeout(function() {
            chrome.browserAction.setBadgeText({text: ''});
          }, 2000);            
        } else {
          //alert('Open e-ID has access to ' + host);
          console.log('Extension has access to ' + host);
        }
      }); 
      setTimeout(function() {
        chrome.browserAction.setBadgeText({text: ''});
      }, 2000);               
    //}
    setTimeout(function() {
      chrome.browserAction.setBadgeText({text: ''});
    }, 2000);     
  } else {
    chrome.browserAction.setBadgeBackgroundColor({color: 'orange'});
    chrome.browserAction.setBadgeText({text: '?'});
    chrome.permissions.request(permission, function(granted) {
      if(granted) {
        console.log('Permission granted - extension has access to ' + origin);
        chrome.browserAction.setBadgeBackgroundColor({color: '#79d3af'});
        chrome.browserAction.setBadgeText({text: '\u2714'});
        inject();
        chrome.tabs.executeScript(tab.id, {
          code: "history.go(0)"
        }, function(result) {
          var lastErr = chrome.runtime.lastError;
          if(lastErr) console.log(lastErr);
        });           
      } else {
        console.log('Permission NOT granted - extension has NO access to ' + origin);
        chrome.browserAction.setBadgeBackgroundColor({color: 'red'});
        chrome.browserAction.setBadgeText({text: '\u2715'});
      }
      setTimeout(function() {
        chrome.browserAction.setBadgeText({text: ''});
      }, 2000);        
    });
  }     
});
