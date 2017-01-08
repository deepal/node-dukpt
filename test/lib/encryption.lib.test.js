const RandExp = require('randexp');
const Encryption = require('../../lib/encryption.lib');
const crypto = require('crypto');
const should = require('should');

function generateRandomString() {
    return new RandExp(/[a-zA-Z0-9]{10,20}/).gen();
}

describe('aes encryption test suite', () => {
    it('should encrypt a string properly and should output a hex encoded string', (done) => {
        const randomString = generateRandomString();
        const key = crypto.createHash('sha256').update(randomString).digest();
        const encrypted = Encryption.encryptAES(key,Buffer.from(randomString, 'ascii').toString('hex'));
        (/^[a-fA-F0-9]+$/).test(encrypted).should.be.true();
        done();
    });

    it('should throw an error when a key with an incorrect length is provided for encryption', (done) => {
        const randomString = generateRandomString();
        const key = crypto.createHash('sha512').update(randomString).digest();
        try{
            Encryption.encryptAES(key,Buffer.from(randomString, 'ascii').toString('hex'));
        }
        catch(err){
            should.exist(err);
        }

        done();
    })
});
