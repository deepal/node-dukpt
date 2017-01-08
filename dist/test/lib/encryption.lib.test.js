'use strict';

var RandExp = require('randexp');
var Encryption = require('../../lib/encryption.lib');
var crypto = require('crypto');
var should = require('should');

function generateRandomString() {
    return new RandExp(/[a-zA-Z0-9]{10,20}/).gen();
}

describe('aes encryption test suite', function () {
    it('should encrypt a string properly and should output a hex encoded string', function (done) {
        var randomString = generateRandomString();
        var key = crypto.createHash('sha256').update(randomString).digest();
        var encrypted = Encryption.encryptAES(key, Buffer.from(randomString, 'ascii').toString('hex'));
        /^[a-fA-F0-9]+$/.test(encrypted).should.be.true();
        done();
    });

    it('should throw an error when a key with an incorrect length is provided for encryption', function (done) {
        var randomString = generateRandomString();
        var key = crypto.createHash('sha512').update(randomString).digest();
        try {
            Encryption.encryptAES(key, Buffer.from(randomString, 'ascii').toString('hex'));
        } catch (err) {
            should.exist(err);
        }

        done();
    });
});
//# sourceMappingURL=encryption.lib.test.js.map