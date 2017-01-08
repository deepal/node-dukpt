const crypto = require('crypto');

class Encryption {
    static encryptAES(hexKey, hexData, encryptionAlgorithm) {

        encryptionAlgorithm = encryptionAlgorithm || 'aes-256-cbc';

        const keyBuf = Buffer.from(hexKey, 'hex');

        if (keyBuf.length != 32) {
            throw new Error('key for aes encryption must be 32 bytes in length');
        }

        const dataBuf = Buffer.from(hexData, 'hex');
        const iv = Buffer.from('00000000000000000000000000000000', 'hex');

        const cipher = crypto.createCipheriv(encryptionAlgorithm, keyBuf, iv).setAutoPadding(true);
        let encrypted = cipher.update(dataBuf);
        encrypted += cipher.final('binary');

        return Buffer.from(encrypted, 'binary').toString('hex');
    }

    static decryptAES(hexKey, encryptedHexData, encryptionAlgorithm) {

        encryptionAlgorithm = encryptionAlgorithm || 'aes-256-cbc';

        const keyBuf = Buffer.from(hexKey, 'hex');

        if (keyBuf.length != 32) {
            throw new Error('key for AES encryption must be 32 bytes in length');
        }

        const dataBuf = Buffer.from(encryptedHexData, 'hex');
        const iv = Buffer.from('00000000000000000000000000000000', 'hex');

        const cipher = crypto.createDecipheriv(encryptionAlgorithm, keyBuf, iv);
        let decrypted = cipher.update(dataBuf);
        decrypted += cipher.final();

        return Buffer.from(decrypted, 'ascii').toString('hex');

    }
}

module.exports = Encryption;