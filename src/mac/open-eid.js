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
       if(args[1] != '') args[1] = '-a "' + args[1] + '"';
       exec('open ' + args[1] + ' "' + args[0].substring(args[0].indexOf(':') + 1) + '#' + encodeURIComponent(json) + '"');
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
          //console.log('usage: node-eid node-eid-read:callback-url OR node-eid node-eid-sign:callback-url');
          //return;
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
      
      if(args[0].indexOf('#') != -1) {
        process.env.BROWSER = args[0].substring(args[0].indexOf('#') + 1);
        args[0] = args[0].substring(0, args[0].indexOf('#') - 1);
      }
      process.env.ARG = args[0];
      if(args.length > 1 && process.env.BROWSER == '') process.env.BROWSER = args[1];
      //execSync("osascript -e 'display dialog \"" + process.env.BROWSER + "\"'");    

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
                  //console.log(`Object #${attrs[2].value.toString()}: ${attrs[3].value.toString()}`);                
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
       fs.writeFileSync(homedir + '/data', 'Hello');       
       pkcs11.C_DigestInit(session, { mechanism: pkcs11js.CKM_SHA256 });
       pkcs11.C_DigestUpdate(session, new Buffer("Hello"));
       var digest = pkcs11.C_DigestFinal(session, Buffer(256 / 8));
       console.log(digest.toString('base64'));
       var header = 'Manifest-Version: 1.0\r\nCreated-By: 11 (Oracle Corporation)\r\n\r\n';
       var main = 'Name: data\r\nSHA-256-Digest: ' + digest.toString("base64") + '\r\n\r\n';
       fs.writeFileSync(homedir + '/META-INF/MANIFEST.MF', header + main);       
       pkcs11.C_DigestInit(session, { mechanism: pkcs11js.CKM_SHA256 });
       pkcs11.C_DigestUpdate(session, new Buffer(header + main));
       var digest = pkcs11.C_DigestFinal(session, Buffer(256 / 8));
       var manifest = digest.toString("base64")       
       pkcs11.C_DigestInit(session, { mechanism: pkcs11js.CKM_SHA256 });
       pkcs11.C_DigestUpdate(session, new Buffer(header));
       var digest = pkcs11.C_DigestFinal(session, Buffer(256 / 8));
       var header = digest.toString("base64")       
       pkcs11.C_DigestInit(session, { mechanism: pkcs11js.CKM_SHA256 });
       pkcs11.C_DigestUpdate(session, new Buffer(main));
       var digest = pkcs11.C_DigestFinal(session, Buffer(256 / 8));
       var main = digest.toString("base64")
       var secpad = 'Signature-Version: 1.0\r\nCreated-By: 11 (Oracle Corporation)\r\nSHA-256-Digest-Manifest: ' + manifest + '\r\nSHA-256-Digest-Manifest-Main-Attributes: ' + header + '\r\n\r\nName: data\r\nSHA-256-Digest: ' + main + '\r\n\r\n';        
       fs.writeFileSync(homedir + '/META-INF/SEC_PAD.SF', secpad);       
       pkcs11.C_FindObjectsInit(session, [{ type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PRIVATE_KEY }]);
        var hObject = pkcs11.C_FindObjects(session);
        while (hObject) {
            var attrs = pkcs11.C_GetAttributeValue(session, hObject, [
                { type: pkcs11js.CKA_CLASS },
                { type: pkcs11js.CKA_TOKEN },
                { type: pkcs11js.CKA_LABEL }
            ]);
            if (attrs[1].value[0]){
                console.log(`Object #${hObject}: ${attrs[2].value.toString()}`);
                if(attrs[2].value.toString() == 'Signature') { // CKM_SHA256_RSA_PKCS
                  pkcs11.C_SignInit(session, { mechanism: pkcs11js.CKM_RSA_PKCS }, hObject); // hObject = privateKey
                  //pkcs11.C_SignUpdate(session, new Buffer(secpad));
                  //var signature = pkcs11.C_SignFinal(session, Buffer(256));
                  var hashWithPadding = [0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20];
                  var signWithPadding = [0x30, 0x82, 0x01, 0xa6, 0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02, 0xA0, 0x82, 0x01, 0x97, 0x30, 0x82, 0x01, 0x93, 0x02, 0x01, 0x01, 0x31, 0x0F, 0x30, 0x0D, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x30, 0x0B, 0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x01, 0x31, 0x82, 0x01, 0x6E, 0x30, 0x82, 0x01, 0x6A, 0x02, 0x01, 0x01, 0x30, 0x43, 0x30, 0x36, 0x31, 0x34, 0x30, 0x32, 0x06, 0x03, 0x55, 0x04, 0x03, 0x0C, 0x2B, 0x41, 0x6E, 0x6F, 0x74, 0x68, 0x65, 0x72, 0x20, 0x63, 0x65, 0x72, 0x74, 0x69, 0x66, 0x69, 0x63, 0x61, 0x74, 0x65, 0x20, 0x77, 0x69, 0x74, 0x68, 0x20, 0x61, 0x20, 0x6D, 0x75, 0x63, 0x68, 0x20, 0x6C, 0x6F, 0x6E, 0x67, 0x65, 0x72, 0x20, 0x6E, 0x61, 0x6D, 0x65, 0x02, 0x09, 0x00, 0xFC, 0x40, 0x46, 0x11, 0x5A, 0x53, 0x2A, 0x1E, 0x30, 0x0D, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x30, 0x0D, 0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01, 0x05, 0x00, 0x04, 0x82, 0x01, 0x00];                  
                  var hashBinary = Buffer.concat([new Buffer(hashWithPadding), digest]);
                  console.log(hashBinary.toString('base64')); 
                  console.log('--');
                  var signature = pkcs11.C_Sign(session, hashBinary, new Buffer(256));
                  console.log(signature.length);
                  console.log(Buffer.concat([new Buffer(signWithPadding), signature]).toString('base64'));
                  fs.writeFileSync(homedir + '/SEC_PAD.PEM', Buffer.concat([new Buffer(signWithPadding), signature]).toString('base64')); 
                }
            }
            hObject = pkcs11.C_FindObjects(session);
        }
        pkcs11.C_FindObjectsFinal(session);       
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


