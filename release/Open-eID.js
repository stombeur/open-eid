var openEID = {
  readInterval: null,
  readCallback: null,
  readTicks: 0,
  timeout: 30,
  
  read: function(callback) {
    window.blur();
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
          var json = eval('(' + result + ')');
          if(typeof json == 'object') {  
            window.focus();  
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
        location = 'open-eid:' + new String(location);
      }
    } else {
      location = 'open-eid:' + new String(location);
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
      var div = document.createElement('div');
      div.setAttribute('style', 'position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: white; background-image: url(https://e-id.eu.org/release/loading.gif); background-position: center center; background-repeat: no-repeat;');
      document.body.appendChild(div);
      setTimeout(function() {
        window.close();
      }, 2000);
    }  
  }
});