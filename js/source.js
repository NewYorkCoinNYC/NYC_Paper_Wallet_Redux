var CoinKey = require('coinkey')
var secureRandom = require('secure-random')
var qrcode = require('qrcode-generator')
var bip38 = require('bip38')
var cs = require('coinstring')
var util = require('../node_modules/coinkey/lib/util')
var base58 = require('bs58')

var wif = require('wif')

function generate() {
  var numToGenerate = document.getElementById('number-option').value
  var colorOption = document.getElementById('color-option').value

  var password = document.getElementById("password").value;

  if (password == "") {
    var encrypt = confirm('Are you sure you want proceed with unencrypted wallets?')
    if (!encrypt) {
      document.getElementById("password").value = "";
      return;
    }
  }

  if (password !== "") {
    var encrypt = confirm('Are you sure you want to BIP38 encrypt the wallets?\r\n \r\n Make sure you save your password!')
    if (!encrypt) {
      document.getElementById("password").value = "";
      return;
    } else {
      document.getElementById("overlay").style.display = 'block';
      document.getElementById("overlay-text").innerHTML = 'Encrypting Keys ...';
    }
  }

  for (var i=0; i < 4; i++) resetOne(i);

  setTimeout(function(){
    for (var i=0; i < 4; i++) generateOne(i, colorOption, numToGenerate)
    document.getElementById('print').style.display = 'inline-block';
    document.getElementById('reset').style.display = 'inline-block';
  } ,100)
}

function generateOne(index, colorOption, numToGenerate) {

  if (index >= numToGenerate) {
    resetOne(index);
    return
  }
  var version = {
    private: 0xBC,
    public: 0x3C
  }
  var bytes = secureRandom.randomBuffer(32)
  var key = new CoinKey(bytes, version)

  var password = document.getElementById("password").value;

  var privateKey = key.privateWif;

  if (password !== "") {
    var decoded = wif.decode(key.privateWif);
    bip38.version = version;
    var encryptedKey = bip38.encrypt(decoded.privateKey, decoded.compressed, password, function (status) {
      console.log('encrypting', Math.round(status.percent), '%')
    })

    document.getElementById('encrypted-key-' + index).innerHTML = encryptedKey
    document.getElementById('pt-encrypted-' + index).style.display = 'table-row'
    document.getElementById('password-' + index).innerHTML = password
    document.getElementById('pt-password-' + index).style.display = 'table-row'
    document.getElementById('decrypt-tab-' + index).style.display = 'block'
    privateKey = encryptedKey;
  }

  console.log('setting attribute');
  document.getElementById('plain-text-' + index).style.display = 'block'
  document.getElementById('public-key-' + index).innerHTML = key.publicAddress
  document.getElementById('private-key-' + index).innerHTML = key.privateWif

  document.getElementById('pubkey-string-' + index).innerHTML = key.publicAddress
  document.getElementById('pubkey-string-' + index + '-invert').innerHTML = key.publicAddress
  document.getElementById('privkey-string-' + index).innerHTML = privateKey
  document.getElementById('privkey-string-' + index + '-invert').innerHTML = privateKey

  var typeNumber = 4;
  var errorCorrectionLevel = 'L';
  var qrPub = qrcode(typeNumber, errorCorrectionLevel);
  qrPub.addData(key.publicAddress);
  qrPub.make();
  document.getElementById('pubkey-qr-' + index).innerHTML = qrPub.createImgTag(4, 8);

  var qrPriv = qrcode(typeNumber, errorCorrectionLevel);
  qrPriv.addData(privateKey);
  qrPriv.make();
  document.getElementById('privkey-qr-' + index).innerHTML = qrPriv.createImgTag(4, 8);

  document.getElementById('wallet-' + index).style.display = 'block'
  document.getElementById('wallet-background-' + index).style.display = 'block'

  if(colorOption === 'BLACK_WHITE') {
    document.getElementById('paper-wallet-' + index).style.color = '#000'
    document.getElementById('paper-background-' + index).setAttribute('src', 'images/paper-wallet-bw.svg')
    document.getElementById('paper-backside-' + index).setAttribute('src', 'images/paper-wallet-bw-back.svg')
  } else {
    document.getElementById('paper-wallet-' + index).style.color = '#FFF'
    document.getElementById('paper-background-' + index).setAttribute('src', 'images/paper-wallet-color.svg')
    document.getElementById('paper-backside-' + index).setAttribute('src', 'images/paper-wallet-color-back.svg')
  }
  document.getElementById("overlay").style.display = 'none';
}

function reset() {
  var reset = confirm('Are you sure you want to reset the wallets? This can not be undone.')
  if (!reset) return
  document.getElementById('print').style.display = 'none';
  document.getElementById('reset').style.display = 'none';
  for (var i=0; i < 4; i++) resetOne(i);
}

function resetOne(index) {
  document.getElementById('pubkey-string-' + index).innerHTML = ''
  document.getElementById('pubkey-string-' + index + '-invert').innerHTML = ''
  document.getElementById('privkey-string-' + index).innerHTML = ''
  document.getElementById('privkey-string-' + index + '-invert').innerHTML = ''
  document.getElementById('pubkey-qr-' + index).innerHTML = ''
  document.getElementById('privkey-qr-' + index).innerHTML = ''
  document.getElementById('wallet-' + index).style.display = 'none'
  document.getElementById('decrypt-tab-' + index).style.display = 'none'
  document.getElementById('wallet-backside-' + index).style.display = 'none'
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function pageBreakAfterId(id) {
    document.getElementById(id).insertAdjacentHTML('afterend', '<div class="page-break transient"></div>');
}

function pageBreakBeforeId(id) {
    document.getElementById(id).insertAdjacentHTML('beforebegin', '<div class="page-break transient"></div>');
}

window.onbeforeprint = function() {
    // invisible character to hide the page title Firefox likes to cover the topmost wallet image with
    document.getElementById('page-title').innerHTML = '&zwnj;';
    insertAfter(document.getElementById('frontsides'), document.getElementById('frontsides-placeholder'));

    var numberOfWallets = parseInt(document.getElementById('number-option').value)

    switch (numberOfWallets) {
        case 1:
            pageBreakAfterId('wallet-0');
            break;
        case 2:
            pageBreakBeforeId('wallet-backside-0');
            break;
        case 3:
            pageBreakAfterId('wallet-3');
            pageBreakAfterId('wallet-backside-1');
            break;
        case 4:
            pageBreakBeforeId('wallet-backside-0');
            pageBreakAfterId('wallet-backside-1');
            pageBreakBeforeId('wallet-backside-2');
            break;
    }
}

window.onafterprint = function() {
    document.getElementById('page-title').innerHTML = 'NewYorkCoin Paper Wallet';

    insertAfter(document.getElementById('frontsides'), document.getElementById('frontsides-container-marker'));

    var transient = document.getElementsByClassName('transient');

    while(transient[0]) {
        transient[0].parentNode.removeChild(transient[0]);
    }
}

function print() {
    // workaround for window print events not triggering properly in Electron
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf(' electron/') > -1) {
        window.onbeforeprint();
        setTimeout(function () { window.print(); }, 500);
        window.onfocus = function () { setTimeout(function () { window.onafterprint(); }, 500); }
    } else {
        window.print();
    }
}

function decrypt() {
  var version = {
    private: 0xd4,
    public: 0x55
  }
  var password = document.getElementById("decrypt_password").value;
  var encryptedKey = document.getElementById("encrypted").value;

  document.getElementById("overlay").style.display = 'block';
  document.getElementById("overlay-text").innerHTML = 'Decrypting Keys ...';
  setTimeout(function(){

    try {
      var decryptedKey = bip38.decrypt(encryptedKey, password, function(status) {
        console.log('decrypting', Math.round(status.percent), '%');
      });

      var decodedDecrypted = wif.encode(212, decryptedKey.privateKey, decryptedKey.compressed);

      var key = CoinKey.fromWif(decodedDecrypted, version);

      document.getElementById("public-key-d").innerHTML = key.publicAddress;
      document.getElementById("encrypted-key-d").innerHTML = encryptedKey;
      document.getElementById("private-key-d").innerHTML = decodedDecrypted;
      document.getElementById("password-d").innerHTML = password;
      document.getElementById('reset_decrypt').style.display = 'inline-block';
      document.getElementById("plain-text-d").style.display = 'block';
      document.getElementById("overlay").style.display = 'none';
    } catch(e) {
      document.getElementById("overlay").style.display = 'none';
      console.log('error', e);
    }

  }, 100);

}

function showDecrypt(){
  document.getElementById('decrypt-tab').style.display = 'block';
  document.getElementById('generate-tab').style.display = 'none';
}

function showGenerate(){
  document.getElementById('decrypt-tab').style.display = 'none';
  document.getElementById('generate-tab').style.display = 'block';
}

function decryptReset() {
  document.getElementById("public-key-d").innerHTML = '';
  document.getElementById("encrypted-key-d").innerHTML = '';
  document.getElementById("private-key-d").innerHTML = '';
  document.getElementById("password-d").innerHTML = '';
  document.getElementById("plain-text-decrypt").style.display = 'none';
  document.getElementById('reset_decrypt').style.display = 'none';
}

window.onload = function(){
  if (document.getElementById('generate')) document.getElementById('generate').onclick = generate;
  if (document.getElementById('print')) document.getElementById('print').onclick = print;
  if (document.getElementById('reset')) document.getElementById('reset').onclick = reset;
  if (document.getElementById('decrypt')) document.getElementById('decrypt').onclick = decrypt;
  if (document.getElementById('reset_decrypt')) document.getElementById('reset_decrypt').onclick = decryptReset;
  if (document.getElementById('decrypt-tab-btn')) document.getElementById('decrypt-tab-btn').onclick = showDecrypt;
  if (document.getElementById('generate-tab-btn')) document.getElementById('generate-tab-btn').onclick = showGenerate;

  if (document.getElementById('decrypt-tab-0')) document.getElementById('decrypt-tab-0').onclick = showDecrypt;
  if (document.getElementById('decrypt-tab-1')) document.getElementById('decrypt-tab-1').onclick = showDecrypt;
  if (document.getElementById('decrypt-tab-2')) document.getElementById('decrypt-tab-2').onclick = showDecrypt;
  if (document.getElementById('decrypt-tab-3')) document.getElementById('decrypt-tab-3').onclick = showDecrypt;
}
