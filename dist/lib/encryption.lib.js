'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var crypto = require('crypto');

var Encryption = function () {
    function Encryption() {
        _classCallCheck(this, Encryption);
    }

    _createClass(Encryption, null, [{
        key: 'encryptAES',
        value: function encryptAES(hexKey, hexData, aesMode) {

            aesMode = aesMode || 'aes-256-cbc';

            var keyBuf = hexKey;

            if (keyBuf.length != 32) {
                throw new Error('key for aes encryption must be 32 bytes in length');
            }

            var dataBuf = Buffer.from(hexData, 'hex');
            var iv = Buffer.from('00000000000000000000000000000000', 'hex');

            var cipher = crypto.createCipheriv(aesMode, keyBuf, iv).setAutoPadding(true);
            var encrypted = cipher.update(dataBuf);
            encrypted += cipher.final('binary');

            return Buffer.from(encrypted, 'binary').toString('hex');
        }
    }, {
        key: 'decryptAES',
        value: function decryptAES(hexKey, encryptedHexData, aesMode) {

            aesMode = aesMode || 'aes-256-cbc';

            var keyBuf = hexKey;

            if (keyBuf.length != 32) {
                throw new Error('key for AES encryption must be 32 bytes in length');
            }

            var dataBuf = Buffer.from(encryptedHexData, 'hex');
            var iv = Buffer.from('00000000000000000000000000000000', 'hex');

            var cipher = crypto.createDecipheriv(aesMode, keyBuf, iv);
            var decrypted = cipher.update(dataBuf);
            decrypted += cipher.final();

            return Buffer.from(decrypted, 'ascii').toString('hex');
        }
    }]);

    return Encryption;
}();

module.exports = Encryption;
//# sourceMappingURL=encryption.lib.js.map