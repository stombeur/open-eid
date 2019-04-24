var fs = require('fs');
const homedir = require('os').homedir();
const { exec } = require('child_process');
const execSync = require('child_process').execSync;

// todo get current app path
var nativehost = {
  "name": "io.github.michael79bxl.open_eid",
  "description": "Open-eID",
  "path": '/Applications/Open-eID.app/Contents/MacOS/open-eid',
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://elkdefnldphjoeafcphbiknjfdhjnngm/",
    "chrome-extension://ceojkhlgadejfjbmikopnodckmhcbnke/",
    "chrome-extension://cgdhcnihnfegipidedmkijjkbphakcjo/"
  ],
};
fs.writeFileSync(homedir + '/Library/Application Support/Google/Chrome/NativeMessagingHosts/io.github.michael79bxl.open_eid.json', JSON.stringify(nativehost));
delete nativehost["allowed_origins"];
nativehost["allowed_extensions"] = [
  "firefox@open-eid.eu.org"
];
fs.writeFileSync(homedir + '/Library/Application Support/Mozilla/NativeMessagingHosts/io.github.michael79bxl.open_eid.json', JSON.stringify(nativehost));

process.stdin.setEncoding('utf8');

var stdin = '';
var stdlen = 0;
var isnative = false;

process.env.BROWSER = '';

var timeout = setTimeout(function() {
  if(stdin == '') {
    eid();
    process.exit();
  }
}, 2000);

process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    if(stdin == '') {
       var data = new Array(4);
      data[0] = chunk.charCodeAt(0) & 0xff;
      data[1] = chunk.charCodeAt(1) & 0xff;
      data[2] = chunk.charCodeAt(2) & 0xff;
      data[3] = chunk.charCodeAt(3) & 0xff;        
      stdlen = data[0];
      stdlen += (data[1] * 256);
      stdlen += (data[2] * 256 * 256);
      stdlen += (data[3] * 256 * 256 * 256);
      stdin += chunk.substring(4);
    } else {
      stdin += chunk;
    }
    if(stdin.length >= stdlen) { eid(); }
  }
});

process.stdin.on('end', () => {
  if(stdin == '') eid();
});

function native(obj) {
     var json = JSON.stringify(obj);
     var l = json.length;
     var data = new Array(4);
     data[0] = l & 0xff;
     data[1] = (l >>> 8) & 0xff;
     data[2] = (l >>> 16) & 0xff;
     data[3] = (l >>> 24) & 0xff;
     if(isnative) {
       process.stdout.write(String.fromCharCode(data[0]) + String.fromCharCode(data[1]) + String.fromCharCode(data[2]) + String.fromCharCode(data[3]));
       process.stdout.setEncoding('utf8');       
       process.stdout.write(json);  
     } else {
       var args = [process.env.ARG, process.env.BROWSER];
       if(process.env.BROWSER == 'Google Chrome App') {
         args[1] = '-n "/Applications/Google Chrome.app" --args --app='; 
       } else {
         if(args[1] != '') args[1] = '-a "' + args[1] + '" ';
       }
       exec('open ' + args[1] + '"' + args[0].substring(args[0].indexOf(':') + 1) + '#' + encodeURIComponent(json) + '"');
     }
}

function eid(confirm) {

  clearTimeout(timeout);
 
  var pkcs11js = require("pkcs11js");
       
  var pkcs11 = new pkcs11js.PKCS11(); 
  
  try {
    
      var args = [''];      
      args[0] = stdin;
      
      if(args[0] == '') {
        var args = process.argv.slice(2);
        if(args.length == 0) {
          args[0] = '{}';
        } else {
          args[0] = '{"url":"' + args[0] + '"}';
          isnative = false;
        }
      } else {
        isnative = true;
      }
      var json = JSON.parse(args[0]);
      if(typeof json == 'object') {
        if('url' in json) args[0] = json.url;
      }
      
      var url = decodeURIComponent(args[0]);
      if(url.indexOf('#') != -1) {
        process.env.BROWSER = url.substring(url.indexOf('#') + 1);
        args[0] = args[0].substring(0, decodeURIComponent(args[0]).indexOf('#'));
      } else {
        if(args.length > 1 && process.env.BROWSER == '') process.env.BROWSER = args[1];
      }
      process.env.ARG = args[0];

      if(args[0].indexOf('open-eid:') == -1 &&  args[0].indexOf('open-eid-read:') == -1 && args[0].indexOf('open-eid-sign:') == -1) {
        try { var result = execSync("osascript -e 'display dialog \"Open-eID is properly installed and can be used in apps and websites.\" buttons{\"OK\"} with title \"Open-eID\"'").toString(); } catch(e) { var result = ''; }        
      } 

      pkcs11.load("/usr/local/lib/libbeidpkcs11.dylib");
       
      pkcs11.C_Initialize();

      // Getting info about PKCS11 Module
      var module_info = pkcs11.C_GetInfo();
   
      // Getting list of slots
      var slots = pkcs11.C_GetSlotList(true);
      if(slots.length == 0) {
        native({"err":"No card reader found or no card inserted"});
        console.error('{"err":"No card reader found or no card inserted"}');
        return;
      }
      var slot = slots[0];
   
      // Getting info about slot
      var slot_info = pkcs11.C_GetSlotInfo(slot);
      // Getting info about token
      var token_info = pkcs11.C_GetTokenInfo(slot);
   
      // Getting info about Mechanism
      var mechs = pkcs11.C_GetMechanismList(slot);
      var mech_info = pkcs11.C_GetMechanismInfo(slot, mechs[0]);
      for(var i = 0; i < mechs.length; i++) {
         var mech_info = pkcs11.C_GetMechanismInfo(slot, mechs[0]);
      }
            
      var session = pkcs11.C_OpenSession(slot, pkcs11js.CKF_RW_SESSION | pkcs11js.CKF_SERIAL_SESSION);
   
      // Getting info about Session
      var info = pkcs11.C_GetSessionInfo(session);
   
      if(args[0].indexOf('open-eid:') == 0 || args[0].indexOf('open-eid-read:') == 0) {  
        var result = '';
        try { var result = execSync("osascript -e 'display dialog \"" + args[0].substring(args[0].indexOf(':') + 1) + " wants to access your eID card content.\" with title \"Open-eID\" with icon caution'").toString(); } catch(e) { result = ''; }
        if(result.indexOf(':OK') != -1) {
          var obj = {};
          pkcs11.C_FindObjectsInit(session, [{ type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_DATA }]);
          var hObject = pkcs11.C_FindObjects(session);
          while (hObject) {
              var attrs = pkcs11.C_GetAttributeValue(session, hObject, [
                  { type: pkcs11js.CKA_CLASS },
                  { type: pkcs11js.CKA_TOKEN },
                  { type: pkcs11js.CKA_LABEL },
                  { type: pkcs11js.CKA_VALUE }            
              ]);
              // Output info for objects from token only
              if (attrs[1].value[0]) {
                  field = attrs[2].value.toString();
                  val = attrs[3].value.toString();
                  if(field.indexOf('address_') == 0) field = field.replace('address_', '');
                  if(field.indexOf('carddata_') == 0) field = field.replace('carddata_', '');
                  if(field.indexOf('_FILE') != -1 || field.indexOf('_DATA') != -1) {
                    val = Buffer.from(val, 'binary').toString('base64');
                  } else {
                    field = field.split('_').join('').toLowerCase();
                    if(field == 'serialnumber' || field == 'chipnumber' || field == 'photohash' || field == 'compcode') {
                      val = Buffer.from(val, 'binary').toString('hex').toUpperCase();
                    } else {
                      val = encodeURIComponent(val);
                    }
                  }
                  field = field.split('_').join('').toLowerCase();
                  if(field == 'atr') field = '';
                  if(field != '') obj[field] = val;
              }
              hObject = pkcs11.C_FindObjects(session);
         }
         pkcs11.C_FindObjectsFinal(session);
         native(obj);
       }
     }
          
     if(args[0].indexOf('open-eid-sign:') == 0) {       
     
        var privateKey = null;
        var certs = {};
 
        pkcs11.C_FindObjectsInit(session, [{ type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_CERTIFICATE }]);
        var hObject = pkcs11.C_FindObjects(session);
        while (hObject) {
            var attrs = pkcs11.C_GetAttributeValue(session, hObject, [
                { type: pkcs11js.CKA_CLASS },
                { type: pkcs11js.CKA_TOKEN },
                { type: pkcs11js.CKA_LABEL },
                { type: pkcs11js.CKA_VALUE }
            ]);
            if (attrs[1].value[0]){
                certs[attrs[2]] = attrs[3].value.toString('base64');
            }
            hObject = pkcs11.C_FindObjects(session);
        }
       pkcs11.C_FindObjectsFinal(session);  
                   
       pkcs11.C_FindObjectsInit(session, [{ type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PRIVATE_KEY }]);
        var hObject = pkcs11.C_FindObjects(session);
        while (hObject) {
            var attrs = pkcs11.C_GetAttributeValue(session, hObject, [
                { type: pkcs11js.CKA_CLASS },
                { type: pkcs11js.CKA_TOKEN },
                { type: pkcs11js.CKA_LABEL }
            ]);
            if (attrs[1].value[0]){
                if(attrs[2].value.toString() == 'Signature') {
                  privateKey = hObject;                       
                }
            }
            hObject = pkcs11.C_FindObjects(session);
        }
        pkcs11.C_FindObjectsFinal(session);  
     
         var message = decodeURIComponent(args[0].substring(args[0].indexOf('&message=') + 9));            
         pkcs11.C_SignInit(session, { mechanism: pkcs11js.CKM_SHA1_RSA_PKCS }, privateKey);
         pkcs11.C_SignUpdate(session, new Buffer(message));
         var signature = pkcs11.C_SignFinal(session, new Buffer(256));
         
         var obj = {'certs': certs, 'message': message, 'signature': signature.toString('base64')};
         native(obj);                  
      }
      pkcs11.C_CloseSession(session);
  }
  catch(e){
      obj = {err: e.message};
      native(obj);
      console.error(e);
  }
  finally {
      pkcs11.C_Finalize();
  }

}


