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
