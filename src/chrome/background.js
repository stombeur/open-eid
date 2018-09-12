// get request from content script
chrome.runtime.onMessage.addListener(function(request, sender) {
  console.log(request, sender);
  
  // send request to native host
  chrome.runtime.sendNativeMessage('io.github.michael79bxl.open_eid', request,
    function(response) {
      
      console.log(response);
      // send result to content script
      chrome.tabs.sendMessage(sender.tab.id, response);
    }
  );   
});

