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

describe('3des encryption test suite', () => {
    it('should decrypt properly when encrypted string is provided', (done) => {
        const randomString = generateRandomString();
        const key = crypto.createHash('sha256').update(randomString).digest();
        const encrypted = Encryption.encryptAES(key,Buffer.from(randomString, 'ascii').toString('hex'));
        const decrypted = Encryption.decryptAES(key, encrypted);
        (/^[a-fA-F0-9]+$/).test(decrypted).should.be.true();
        Buffer.from(decrypted, 'hex').toString('ascii').should.equal(randomString);
        done();
    });

    it('should throw an error when a key with incorrect length is provided for decryption', (done) => {
        const randomString = generateRandomString();
        const key = crypto.createHash('sha256').update(randomString).digest();
        const decryptKey = crypto.createHash('sha512').update(randomString).digest();
        const encrypted = Encryption.encryptAES(key,Buffer.from(randomString, 'ascii').toString('hex'));
        try{
            const decrypted = Encryption.decryptAES(decryptKey, encrypted);
        }
        catch(err){
            should.exist(err);
            err.message.should.equal('key for AES encryption must be 32 bytes in length');
        }
        done();
    });
});