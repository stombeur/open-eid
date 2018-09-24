var openEID = {
  readInterval: null,
  readCallback: null,
  readTicks: 0,
  timeout: 30,
  
  read: function(callback) {
    if('openEIDInstalled' in window) {
      if(window.openEIDInstalled) { // extension
      } else {
        openEID.readWithURL(callback);
      }
    } else {
      openEID.readWithURL(callback);
    }
  },
  
  readWithURL: function(callback) {
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
      var result = window.localStorage.getItem('openEID');
      if(typeof result != 'undefined' && result != null) {
        var json = eval('(' + result + ')');
        if(typeof json == 'object') {
          for(var i in json) {
            try { json[i] = decodeURIComponent(json[i]); } catch(e) { json[i] = unescape(json[i]); }
          }
          clearInterval(openEID.readInterval);
          openEID.readInterval = null;
          openEID.readCallback(json);          
        }
      }
    }, 1000);
    location = 'open-eid:' + new String(location);
  }
}

window.openEID = openEID;
window.addEventListener('load', function() {
  var h = new String(location.hash).substring(1);
  try { h = decodeURIComponent(h); } catch(e) { h = unescape(h); }
  if(h != '') {
    var json = eval('(' + h + ')');
    if(typeof json == 'object') {
      window.localStorage.setItem('openEID', h);
    }  
  }
});