const aesjs = require('aes-js');
const DataOperations = require('./data.lib');

class Dukpt {
    constructor(bdk, ksn) {
        this.bdk = bdk;
        this.ksn = ksn;
        this._sessionKey = this._deriveDukptSessionKey();
    }

    _deriveDukptSessionKey(keyMode = 'datakey') {
        const dBDK = this.bdk;
        const dKSN = this.ksn;

        if (DataOperations.fieldEmpty([dBDK, dKSN])) {
            return new Error('a field is blank');
        }
        if (dBDK.replace(/\s/g, '').length !== 32 ||
            dKSN.replace(/\s/g, '').length !== 20) {
            return new Error('Key must be 16 bytes long and KSN must be 10 bytes');
        }

        const ipek = Dukpt._createIPEK(dBDK, dKSN); // Always start with IPEK

        if (keyMode === 'datakey') { this._sessionKey = Dukpt._createDataKeyHex(ipek, dKSN); }

        if (keyMode === 'pinkey') {
            this._sessionKey = Dukpt._createPINKeyHex(ipek, dKSN);
        }

        if (keyMode === 'mackey') {
            this._sessionKey = Dukpt._createMACKeyHex(ipek, dKSN);
        }

        return this._sessionKey;
    }

    static generateDukptSessionKey(ipek, ksn) {
        if (DataOperations.fieldEmpty([ipek, ksn])) {
            throw new Error('either IPEK or data params not provided');
        }

        return Dukpt._createDataKeyHex(ipek, ksn);
    }

    static _createDataKeyHex(ipek, ksn) {
        const derivedPEK = Dukpt._deriveKeyHex(ipek, ksn);

        const CBC = 1; // cipher block chaining enabled
        const iv = '\0\0\0\0\0\0\0\0'; // initial vector
        const variantMask = '0000000000FF00000000000000FF0000'; // data variant

        let maskedPEK = DataOperations.XORdataHex(variantMask, derivedPEK); // apply mask

        maskedPEK = DataOperations.hexstringToData(maskedPEK);

        // We need to TDES-encrypt the masked key in two parts, using
        // itself as the key. This is a so-called one-way function (OWF).
        // The leftmost 8 bytes are encrypted, then
        // the rightmost 8 bytes are encrypted separately. In each case,
        // the key is the entire original 16-byte maskedPEK from the
        // above step, expanded to 24 bytes per EDE3.

        // left half:
        const left = Dukpt._des(Dukpt._EDE3KeyExpand(maskedPEK),
            maskedPEK.substring(0, 8),
            true,
            CBC,
            iv,
            null);

        // right half:
        const right = Dukpt._des(Dukpt._EDE3KeyExpand(maskedPEK),
            maskedPEK.substring(8),
            true,
            CBC,
            iv,
            null);

        let sessionKey = left + right;

        sessionKey = DataOperations.dataToHexstring(sessionKey);
        return sessionKey; // hex
    }

    static _createPINKeyHex(ipek, ksn) {
        const derivedPEK = Dukpt._deriveKeyHex(ipek, ksn); // derive DUKPT basis key
        const variantMask = '00000000000000FF00000000000000FF'; // PIN variant
        return DataOperations.XORdataHex(variantMask, derivedPEK); // apply mask
    }

    static _createMACKeyHex(ipek, ksn) {
        const derivedPEK = Dukpt._deriveKeyHex(ipek, ksn); // derive DUKPT basis key
        const variantMask = '000000000000FF00000000000000FF00'; // MAC variant
        return DataOperations.XORdataHex(variantMask, derivedPEK); // apply mask
    }

    static encryptTDES(key, data, encryptTrueFalse) {
        const CBC = 1; // cipher block chaining enabled
        const iv = '\0\0\0\0\0\0\0\0'; // initial vector

        try {
            // convert to binary
            const binaryKey = DataOperations.hexstringToData(key);
            let binaryData = DataOperations.hexstringToData(data);

            // data should be a multiple of 8 bytes
            while (binaryData.length % 8) {
                binaryData += '\0';
            }

            return Dukpt._des(binaryKey,
                binaryData,
                encryptTrueFalse,
                CBC,
                iv,
                null);
        } catch (e) {
            throw e;
        }
    }

    dukptEncrypt(dataToEncrypt, encryptOptions) {
        let data = dataToEncrypt;
        let encryptedOutput = null;

        const _defaultOptions = {
            encryptionMode: '3DES',
            inputEncoding: 'ascii',
            outputEncoding: 'hex'
        };

        const options = Object.assign({}, _defaultOptions, encryptOptions);

        switch (options.inputEncoding.toLowerCase()) {
        case 'ascii':
            data = DataOperations.dataToHexstring(data);
            break;
        case 'hex':
                // do nothing
            break;
        default:
            throw new Error(`unsupported input encoding type for dukpt encrypt : '${options.inputEncoding}'`);
        }

        let key = this._sessionKey.replace(/\s/g, ''); // remove spaces

        if (!key || !data) {
            throw new Error('either session key or data not provided');
        }

        data = data.replace(/\s/g, '');

        if (key.length === 32 && options.encryptionMode.toUpperCase() !== 'AES') {
            key = Dukpt._EDE3KeyExpand(key);
        }

        switch (options.encryptionMode.toUpperCase()) {
        case '3DES':
            encryptedOutput = Dukpt.encryptTDES(key, data, true);
            break;
        case 'AES':
            encryptedOutput = Dukpt.encryptAES(key, data);
            break;
        default:
            throw new Error('unsupported dukpt encryption method');
        }

        switch (options.outputEncoding.toLowerCase()) {
        case 'hex':
            encryptedOutput = DataOperations.dataToHexstring(encryptedOutput);
            break;
        case 'ascii':
                // do nothing
            break;
        default:
            throw new Error(`unsupported output encoding type for dukpt decrypt : '${options.outputEncoding}'`);
        }

        return encryptedOutput;
    }

    dukptDecrypt(dataToDecrypt, decryptOptions) {
        let encryptedData = dataToDecrypt;
        let decryptedOutput = null;

        const _defaultOptions = {
            decryptionMode: '3DES',
            trimOutput: false,
            inputEncoding: 'hex',
            outputEncoding: 'ascii'
        };

        const options = Object.assign({}, _defaultOptions, decryptOptions);

        let key = this._sessionKey.replace(/\s/g, ''); // remove spaces

        if (!key || !encryptedData) {
            throw new Error('either session key or data not provided');
        }

        encryptedData = encryptedData.replace(/\s/g, '');

        if (key.length === 32 && options.decryptionMode.toUpperCase() !== 'AES') {
            key = Dukpt._EDE3KeyExpand(key);
        }

        switch (options.decryptionMode.toUpperCase()) {
        case '3DES':
            decryptedOutput = Dukpt.encryptTDES(key, encryptedData, false);
            break;
        case 'AES':
            decryptedOutput = Dukpt.decryptAES(key, encryptedData);
            break;
        default:
            throw new Error('unsupported dukpt decryption method');
        }

        if (options.trimOutput) {
            decryptedOutput = DataOperations.removeNullCharsFromAscii(decryptedOutput);
        }

        switch (options.outputEncoding.toLowerCase()) {
        case 'ascii':
                // do nothing
            break;
        case 'hex':
            decryptedOutput = DataOperations.dataToHexstring(decryptedOutput);
            break;
        default:
            throw new Error('unsupported output encoding for dukpt decrypt');
        }

        return decryptedOutput;
    }

    static _EDE3KeyExpand(key) {
        return key + key.substring(0, key.length / 2);
    }

    static _createIPEK(bdk, ksn) {
        const CBC = 1; // cipher block chaining enabled
        const iv = '\0\0\0\0\0\0\0\0'; // initial vector

        let key = Dukpt._EDE3KeyExpand(bdk); // make 24-byte key
        key = DataOperations.hexstringToData(key); // make it binary

        let maskedKSN = DataOperations.ANDdata(
            DataOperations.hexstringToData('FFFFFFFFFFFFFFE00000'),
            DataOperations.hexstringToData(ksn)
        ); // this is now binary

        maskedKSN = maskedKSN.substring(0, 8); // take 1st 8 bytes only

        // get LEFT half of IPEK
        let cipher = Dukpt._des(key,
            maskedKSN,
            true, /* encrypt */
            CBC,
            iv,
            null);

        let IPEK = DataOperations.dataToHexstring(cipher);

        // get RIGHT half of IPEK
        const mask = 'C0C0C0C000000000C0C0C0C000000000';
        key = DataOperations.XORdata(DataOperations.hexstringToData(mask), DataOperations.hexstringToData(bdk));
        key = Dukpt._EDE3KeyExpand(key);
        cipher = Dukpt._des(key,
            maskedKSN,
            true, /* encrypt */
            CBC,
            iv,
            null);

        // join the new cipher to the end of the IPEK:
        IPEK += DataOperations.dataToHexstring(cipher);

        return IPEK;
    }

    static _getCounter(ksn) {
        const tailbytes = ksn.substring(ksn.length - 3);
        const integerValue = (tailbytes.charCodeAt(0) << 16) +
            (tailbytes.charCodeAt(1) << 8) +
            tailbytes.charCodeAt(2);
        return integerValue & 0x1FFFFF;
    }

    static _deriveKey(ipek, ksnString) {
        let ksn = ksnString;
        if (ksn.length === 10) {
            ksn = ksn.substring(2);
        } // we want the bottom 8 bytes

        let baseKSN = DataOperations.ANDdata(DataOperations.hexstringToData('FFFFFFFFFFE00000'), ksn);
        let curKey = ipek;
        const counter = Dukpt._getCounter(ksn);

        for (let shiftReg = 0x100000; shiftReg > 0; shiftReg >>= 1) {
            if ((shiftReg & counter) > 0) {
                // Need to do baseKSN |= shiftReg

                let tmpKSN = baseKSN.substring(0, 5);
                const byte5 = baseKSN.charCodeAt(5);
                const byte6 = baseKSN.charCodeAt(6);
                const byte7 = baseKSN.charCodeAt(7);
                let tmpLong = (byte5 << 16) + (byte6 << 8) + byte7;
                tmpLong |= shiftReg;
                tmpKSN += String.fromCharCode(tmpLong >> 16);
                tmpKSN += String.fromCharCode(255 & (tmpLong >> 8));
                tmpKSN += String.fromCharCode(255 & tmpLong);

                baseKSN = tmpKSN; // remember the updated value

                curKey = Dukpt._generateKey(curKey, tmpKSN);
            }
        }

        return curKey; // binary
    }

    static _generateKey(key, ksn) {
        const mask = 'C0C0C0C000000000C0C0C0C000000000';
        const maskedKey = DataOperations.XORdata(DataOperations.hexstringToData(mask), key);

        const left = Dukpt._encryptRegister(maskedKey, ksn);
        const right = Dukpt._encryptRegister(key, ksn);

        return left + right; // binary
    }

    static _encryptRegister(key, reg) {
        const CBC = 1; // cipher block chaining enabled
        const iv = '\0\0\0\0\0\0\0\0'; // initial vector

        const bottom8 = key.substring(key.length - 8); // bottom 8 bytes

        const top8 = key.substring(0, 8); // top 8 bytes

        const bottom8xorKSN = DataOperations.XORdata(bottom8, reg);

        // This will be single-DES because of the 8-byte key:
        const desEncrypted = Dukpt._des(top8,
            bottom8xorKSN,
            true, /* encrypt */
            CBC,
            iv,
            null);

        return DataOperations.XORdata(bottom8, desEncrypted);
    }

    static _deriveKeyHex(ipek, ksn) {
        const binipek = DataOperations.hexstringToData(ipek);
        const binksn = DataOperations.hexstringToData(ksn);

        const dk = Dukpt._deriveKey(binipek, binksn);
        return DataOperations.dataToHexstring(dk);
    }

    static _des(key, message, encrypt, mode, iv, padding) {
        let msg = message;
        // declaring this locally speeds things up a bit
        const spfunction1 = [
            0x1010400, 0, 0x10000, 0x1010404, 0x1010004,
            0x10404, 0x4, 0x10000, 0x400, 0x1010400,
            0x1010404, 0x400, 0x1000404, 0x1010004, 0x1000000,
            0x4, 0x404, 0x1000400, 0x1000400, 0x10400,
            0x10400, 0x1010000, 0x1010000, 0x1000404,
            0x10004, 0x1000004, 0x1000004, 0x10004,
            0, 0x404, 0x10404, 0x1000000, 0x10000,
            0x1010404, 0x4, 0x1010000, 0x1010400,
            0x1000000, 0x1000000, 0x400, 0x1010004,
            0x10000, 0x10400, 0x1000004, 0x400, 0x4,
            0x1000404, 0x10404, 0x1010404, 0x10004,
            0x1010000, 0x1000404, 0x1000004, 0x404,
            0x10404, 0x1010400, 0x404, 0x1000400,
            0x1000400, 0, 0x10004, 0x10400, 0, 0x1010004
        ];
        const spfunction2 = [
            -0x7fef7fe0, -0x7fff8000, 0x8000, 0x108020, 0x100000,
            0x20, -0x7fefffe0, -0x7fff7fe0, -0x7fffffe0, -0x7fef7fe0,
            -0x7fef8000, -0x80000000, -0x7fff8000, 0x100000, 0x20,
            -0x7fefffe0, 0x108000, 0x100020, -0x7fff7fe0, 0,
            -0x80000000, 0x8000, 0x108020, -0x7ff00000, 0x100020,
            -0x7fffffe0, 0, 0x108000, 0x8020, -0x7fef8000, -0x7ff00000,
            0x8020, 0, 0x108020, -0x7fefffe0, 0x100000, -0x7fff7fe0,
            -0x7ff00000, -0x7fef8000, 0x8000, -0x7ff00000, -0x7fff8000,
            0x20, -0x7fef7fe0, 0x108020, 0x20, 0x8000, -0x80000000,
            0x8020, -0x7fef8000, 0x100000, -0x7fffffe0, 0x100020,
            -0x7fff7fe0, -0x7fffffe0, 0x100020, 0x108000, 0, -0x7fff8000,
            0x8020, -0x80000000, -0x7fefffe0, -0x7fef7fe0, 0x108000
        ];
        const spfunction3 = [
            0x208, 0x8020200, 0, 0x8020008, 0x8000200, 0,
            0x20208, 0x8000200, 0x20008, 0x8000008, 0x8000008,
            0x20000, 0x8020208, 0x20008, 0x8020000, 0x208,
            0x8000000, 0x8, 0x8020200, 0x200, 0x20200, 0x8020000,
            0x8020008, 0x20208, 0x8000208, 0x20200, 0x20000, 0x8000208,
            0x8, 0x8020208, 0x200, 0x8000000, 0x8020200, 0x8000000,
            0x20008, 0x208, 0x20000, 0x8020200, 0x8000200, 0, 0x200,
            0x20008, 0x8020208, 0x8000200, 0x8000008, 0x200, 0,
            0x8020008, 0x8000208, 0x20000, 0x8000000, 0x8020208,
            0x8, 0x20208, 0x20200, 0x8000008, 0x8020000, 0x8000208,
            0x208, 0x8020000, 0x20208, 0x8, 0x8020008, 0x20200
        ];
        const spfunction4 = [
            0x802001, 0x2081, 0x2081, 0x80, 0x802080, 0x800081,
            0x800001, 0x2001, 0, 0x802000, 0x802000, 0x802081, 0x81,
            0, 0x800080, 0x800001, 0x1, 0x2000, 0x800000, 0x802001,
            0x80, 0x800000, 0x2001, 0x2080, 0x800081, 0x1, 0x2080,
            0x800080, 0x2000, 0x802080, 0x802081, 0x81, 0x800080, 0x800001,
            0x802000, 0x802081, 0x81, 0, 0, 0x802000, 0x2080, 0x800080,
            0x800081, 0x1, 0x802001, 0x2081, 0x2081, 0x80, 0x802081, 0x81,
            0x1, 0x2000, 0x800001, 0x2001, 0x802080, 0x800081, 0x2001,
            0x2080, 0x800000, 0x802001, 0x80, 0x800000, 0x2000, 0x802080
        ];
        const spfunction5 = [
            0x100, 0x2080100, 0x2080000, 0x42000100, 0x80000, 0x100,
            0x40000000, 0x2080000, 0x40080100, 0x80000, 0x2000100, 0x40080100,
            0x42000100, 0x42080000, 0x80100, 0x40000000, 0x2000000, 0x40080000,
            0x40080000, 0, 0x40000100, 0x42080100, 0x42080100, 0x2000100, 0x42080000,
            0x40000100, 0, 0x42000000, 0x2080100, 0x2000000, 0x42000000, 0x80100,
            0x80000, 0x42000100, 0x100, 0x2000000, 0x40000000, 0x2080000, 0x42000100,
            0x40080100, 0x2000100, 0x40000000, 0x42080000, 0x2080100, 0x40080100, 0x100,
            0x2000000, 0x42080000, 0x42080100, 0x80100, 0x42000000, 0x42080100, 0x2080000, 0,
            0x40080000, 0x42000000, 0x80100, 0x2000100, 0x40000100, 0x80000, 0, 0x40080000,
            0x2080100, 0x40000100
        ];
        const spfunction6 = [
            0x20000010, 0x20400000, 0x4000, 0x20404010, 0x20400000, 0x10, 0x20404010,
            0x400000, 0x20004000, 0x404010, 0x400000, 0x20000010, 0x400010, 0x20004000,
            0x20000000, 0x4010, 0, 0x400010, 0x20004010, 0x4000, 0x404000, 0x20004010,
            0x10, 0x20400010, 0x20400010, 0, 0x404010, 0x20404000, 0x4010, 0x404000,
            0x20404000, 0x20000000, 0x20004000, 0x10, 0x20400010, 0x404000, 0x20404010,
            0x400000, 0x4010, 0x20000010, 0x400000, 0x20004000, 0x20000000, 0x4010,
            0x20000010, 0x20404010, 0x404000, 0x20400000, 0x404010, 0x20404000, 0,
            0x20400010, 0x10, 0x4000, 0x20400000, 0x404010, 0x4000, 0x400010, 0x20004010,
            0, 0x20404000, 0x20000000, 0x400010, 0x20004010
        ];
        const spfunction7 = [
            0x200000, 0x4200002, 0x4000802, 0, 0x800, 0x4000802, 0x200802, 0x4200800,
            0x4200802, 0x200000, 0, 0x4000002, 0x2, 0x4000000, 0x4200002, 0x802, 0x4000800,
            0x200802, 0x200002, 0x4000800, 0x4000002, 0x4200000, 0x4200800, 0x200002,
            0x4200000, 0x800, 0x802, 0x4200802, 0x200800, 0x2, 0x4000000, 0x200800,
            0x4000000, 0x200800, 0x200000, 0x4000802, 0x4000802, 0x4200002, 0x4200002,
            0x2, 0x200002, 0x4000000, 0x4000800, 0x200000, 0x4200800, 0x802, 0x200802,
            0x4200800, 0x802, 0x4000002, 0x4200802, 0x4200000, 0x200800, 0, 0x2, 0x4200802,
            0, 0x200802, 0x4200000, 0x800, 0x4000002, 0x4000800, 0x800, 0x200002
        ];
        const spfunction8 = [
            0x10001040, 0x1000, 0x40000, 0x10041040, 0x10000000, 0x10001040, 0x40, 0x10000000,
            0x40040, 0x10040000, 0x10041040, 0x41000, 0x10041000, 0x41040, 0x1000,
            0x40, 0x10040000, 0x10000040, 0x10001000, 0x1040, 0x41000, 0x40040,
            0x10040040, 0x10041000, 0x1040, 0, 0, 0x10040040, 0x10000040, 0x10001000,
            0x41040, 0x40000, 0x41040, 0x40000, 0x10041000, 0x1000, 0x40, 0x10040040,
            0x1000, 0x41040, 0x10001000, 0x40, 0x10000040, 0x10040000, 0x10040040,
            0x10000000, 0x40000, 0x10001040, 0, 0x10041040, 0x40040, 0x10000040,
            0x10040000, 0x10001000, 0x10001040, 0, 0x10041040, 0x41000, 0x41000, 0x1040,
            0x1040, 0x40040, 0x10000000, 0x10041000
        ];

        // create the subkeys we will need
        const keys = Dukpt._desCreateKeys(key);
        let m = 0;
        let i;
        let j;
        let temp;
        let right1;
        let right2;
        let left;
        let right;
        let looping;
        let cbcleft;
        let cbcleft2;
        let cbcright;
        let cbcright2;
        let endloop;
        let loopinc;
        let len = msg.length;
        let chunk = 0;
        // set up the loops for single and triple _des
        const iterations = keys.length === 32 ? 3 : 9; // single or triple _des
        if (iterations === 3) {
            looping = encrypt ? [0, 32, 2] : [30, -2, -2];
        } else {
            looping = encrypt ? [0, 32, 2, 62, 30, -2, 64, 96, 2] : [94, 62, -2, 32, 64, 2, 30, -2, -2];
        }

        // pad the msg depending on the padding parameter
        if (padding === 2) msg += '        '; // pad the msg with spaces
        else if (padding === 1) {
            temp = 8 - (len % 8);
            msg += String.fromCharCode(temp, temp, temp, temp, temp, temp, temp, temp);
            if (temp === 8) len += 8;
        } else if (!padding) msg += '\0\0\0\0\0\0\0\0'; // pad the msg out with null bytes

        // store the result here
        let result = '';
        let tempresult = '';

        if (mode === 1) { // CBC mode
            cbcleft = (iv.charCodeAt(m++) << 24) | (iv.charCodeAt(m++) << 16) | (iv.charCodeAt(m++) << 8) | iv.charCodeAt(m++);
            cbcright = (iv.charCodeAt(m++) << 24) | (iv.charCodeAt(m++) << 16) | (iv.charCodeAt(m++) << 8) | iv.charCodeAt(m++);
            m = 0;
        }

        // loop through each 64 bit chunk of the msg
        while (m < len) {
            left = (msg.charCodeAt(m++) << 24) | (msg.charCodeAt(m++) << 16) | (msg.charCodeAt(m++) << 8) | msg.charCodeAt(m++);
            right = (msg.charCodeAt(m++) << 24) | (msg.charCodeAt(m++) << 16) | (msg.charCodeAt(m++) << 8) | msg.charCodeAt(m++);

            // for Cipher Block Chaining mode, xor the msg with the previous result
            if (mode === 1) {
                if (encrypt) {
                    left ^= cbcleft;
                    right ^= cbcright;
                } else {
                    cbcleft2 = cbcleft;
                    cbcright2 = cbcright;
                    cbcleft = left;
                    cbcright = right;
                }
            }

            // first each 64 but chunk of the msg must be permuted according to IP
            temp = ((left >>> 4) ^ right) & 0x0f0f0f0f;
            right ^= temp;
            left ^= (temp << 4);
            temp = ((left >>> 16) ^ right) & 0x0000ffff;
            right ^= temp;
            left ^= (temp << 16);
            temp = ((right >>> 2) ^ left) & 0x33333333;
            left ^= temp;
            right ^= (temp << 2);
            temp = ((right >>> 8) ^ left) & 0x00ff00ff;
            left ^= temp;
            right ^= (temp << 8);
            temp = ((left >>> 1) ^ right) & 0x55555555;
            right ^= temp;
            left ^= (temp << 1);

            left = ((left << 1) | (left >>> 31));
            right = ((right << 1) | (right >>> 31));

            // do this either 1 or 3 times for each chunk of the msg
            for (j = 0; j < iterations; j += 3) {
                endloop = looping[j + 1];
                loopinc = looping[j + 2];
                // now go through and perform the encryption or decryption
                for (i = looping[j]; i !== endloop; i += loopinc) { // for efficiency
                    right1 = right ^ keys[i];
                    right2 = ((right >>> 4) | (right << 28)) ^ keys[i + 1];
                    // the result is attained by passing these bytes through the S selection functions
                    temp = left;
                    left = right;
                    right = temp ^ (spfunction2[(right1 >>> 24) & 0x3f] | spfunction4[(right1 >>> 16) & 0x3f]
                        | spfunction6[(right1 >>> 8) & 0x3f] | spfunction8[right1 & 0x3f]
                        | spfunction1[(right2 >>> 24) & 0x3f] | spfunction3[(right2 >>> 16) & 0x3f]
                        | spfunction5[(right2 >>> 8) & 0x3f] | spfunction7[right2 & 0x3f]);
                }
                temp = left;
                left = right;
                right = temp; // unreverse left and right
            } // for either 1 or 3 iterations

            // move then each one bit to the right
            left = ((left >>> 1) | (left << 31));
            right = ((right >>> 1) | (right << 31));

            // now perform IP-1, which is IP in the opposite direction
            temp = ((left >>> 1) ^ right) & 0x55555555;
            right ^= temp;
            left ^= (temp << 1);
            temp = ((right >>> 8) ^ left) & 0x00ff00ff;
            left ^= temp;
            right ^= (temp << 8);
            temp = ((right >>> 2) ^ left) & 0x33333333;
            left ^= temp;
            right ^= (temp << 2);
            temp = ((left >>> 16) ^ right) & 0x0000ffff;
            right ^= temp;
            left ^= (temp << 16);
            temp = ((left >>> 4) ^ right) & 0x0f0f0f0f;
            right ^= temp;
            left ^= (temp << 4);

            // for Cipher Block Chaining mode, xor the msg with the previous result
            if (mode === 1) {
                if (encrypt) {
                    cbcleft = left;
                    cbcright = right;
                } else {
                    left ^= cbcleft2;
                    right ^= cbcright2;
                }
            }
            tempresult += String.fromCharCode(
                (left >>> 24),
                ((left >>> 16) & 0xff),
                ((left >>> 8) & 0xff),
                (left & 0xff),
                (right >>> 24),
                ((right >>> 16) & 0xff),
                ((right >>> 8) & 0xff),
                (right & 0xff)
            );

            chunk += 8;
            if (chunk === 512) {
                result += tempresult;
                tempresult = '';
                chunk = 0;
            }
        } // for every 8 characters, or 64 bits in the msg

        result += tempresult;
        /* result = result.replace(/\0*$/g, ""); */

        return result;
    }

    static _desCreateKeys(key) {
        const pc2bytes0 = [0, 0x4, 0x20000000, 0x20000004, 0x10000, 0x10004, 0x20010000, 0x20010004, 0x200, 0x204, 0x20000200, 0x20000204, 0x10200, 0x10204, 0x20010200, 0x20010204];
        const pc2bytes1 = [0, 0x1, 0x100000, 0x100001, 0x4000000, 0x4000001, 0x4100000, 0x4100001, 0x100, 0x101, 0x100100, 0x100101, 0x4000100, 0x4000101, 0x4100100, 0x4100101];
        const pc2bytes2 = [0, 0x8, 0x800, 0x808, 0x1000000, 0x1000008, 0x1000800, 0x1000808, 0, 0x8, 0x800, 0x808, 0x1000000, 0x1000008, 0x1000800, 0x1000808];
        const pc2bytes3 = [0, 0x200000, 0x8000000, 0x8200000, 0x2000, 0x202000, 0x8002000, 0x8202000, 0x20000, 0x220000, 0x8020000, 0x8220000, 0x22000, 0x222000, 0x8022000, 0x8222000];
        const pc2bytes4 = [0, 0x40000, 0x10, 0x40010, 0, 0x40000, 0x10, 0x40010, 0x1000, 0x41000, 0x1010, 0x41010, 0x1000, 0x41000, 0x1010, 0x41010];
        const pc2bytes5 = [0, 0x400, 0x20, 0x420, 0, 0x400, 0x20, 0x420, 0x2000000, 0x2000400, 0x2000020, 0x2000420, 0x2000000, 0x2000400, 0x2000020, 0x2000420];
        const pc2bytes6 = [0, 0x10000000, 0x80000, 0x10080000, 0x2, 0x10000002, 0x80002, 0x10080002, 0, 0x10000000, 0x80000, 0x10080000, 0x2, 0x10000002, 0x80002, 0x10080002];
        const pc2bytes7 = [0, 0x10000, 0x800, 0x10800, 0x20000000, 0x20010000, 0x20000800, 0x20010800, 0x20000, 0x30000, 0x20800, 0x30800, 0x20020000, 0x20030000, 0x20020800, 0x20030800];
        const pc2bytes8 = [0, 0x40000, 0, 0x40000, 0x2, 0x40002, 0x2, 0x40002, 0x2000000, 0x2040000, 0x2000000, 0x2040000, 0x2000002, 0x2040002, 0x2000002, 0x2040002];
        const pc2bytes9 = [0, 0x10000000, 0x8, 0x10000008, 0, 0x10000000, 0x8, 0x10000008, 0x400, 0x10000400, 0x408, 0x10000408, 0x400, 0x10000400, 0x408, 0x10000408];
        const pc2bytes10 = [0, 0x20, 0, 0x20, 0x100000, 0x100020, 0x100000, 0x100020, 0x2000, 0x2020, 0x2000, 0x2020, 0x102000, 0x102020, 0x102000, 0x102020];
        const pc2bytes11 = [0, 0x1000000, 0x200, 0x1000200, 0x200000, 0x1200000, 0x200200, 0x1200200, 0x4000000, 0x5000000, 0x4000200, 0x5000200, 0x4200000, 0x5200000, 0x4200200, 0x5200200];
        const pc2bytes12 = [0, 0x1000, 0x8000000, 0x8001000, 0x80000, 0x81000, 0x8080000, 0x8081000, 0x10, 0x1010, 0x8000010, 0x8001010, 0x80010, 0x81010, 0x8080010, 0x8081010];
        const pc2bytes13 = [0, 0x4, 0x100, 0x104, 0, 0x4, 0x100, 0x104, 0x1, 0x5, 0x101, 0x105, 0x1, 0x5, 0x101, 0x105];

        // how many iterations (1 for _des, 3 for triple _des)
        const iterations = key.length > 8 ? 3 : 1; // use Triple DES for 9+ byte keys
        // stores the return keys
        const keys = new Array(32 * iterations);
        // now define the left shifts which need to be done
        const shifts = [0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0];
        // other variables
        let lefttemp;
        let righttemp;
        let m = 0;
        let n = 0;
        let temp;

        for (let j = 0; j < iterations; j++) { // either 1 or 3 iterations
            let left = (key.charCodeAt(m++) << 24) | (key.charCodeAt(m++) << 16) | (key.charCodeAt(m++) << 8) | key.charCodeAt(m++);
            let right = (key.charCodeAt(m++) << 24) | (key.charCodeAt(m++) << 16) | (key.charCodeAt(m++) << 8) | key.charCodeAt(m++);

            temp = ((left >>> 4) ^ right) & 0x0f0f0f0f;
            right ^= temp;
            left ^= (temp << 4);
            temp = ((right >>> -16) ^ left) & 0x0000ffff;
            left ^= temp;
            right ^= (temp << -16);
            temp = ((left >>> 2) ^ right) & 0x33333333;
            right ^= temp;
            left ^= (temp << 2);
            temp = ((right >>> -16) ^ left) & 0x0000ffff;
            left ^= temp;
            right ^= (temp << -16);
            temp = ((left >>> 1) ^ right) & 0x55555555;
            right ^= temp;
            left ^= (temp << 1);
            temp = ((right >>> 8) ^ left) & 0x00ff00ff;
            left ^= temp;
            right ^= (temp << 8);
            temp = ((left >>> 1) ^ right) & 0x55555555;
            right ^= temp;
            left ^= (temp << 1);

            // the right side needs to be shifted and to get the last four bits of the left side
            temp = (left << 8) | ((right >>> 20) & 0x000000f0);
            // left needs to be put upside down
            left = (right << 24) | ((right << 8) & 0xff0000) | ((right >>> 8) & 0xff00) | ((right >>> 24) & 0xf0);
            right = temp;

            // now go through and perform these shifts on the left and right keys
            for (let i = 0; i < shifts.length; i++) {
                // shift the keys either one or two bits to the left
                if (shifts[i]) {
                    left = (left << 2) | (left >>> 26);
                    right = (right << 2) | (right >>> 26);
                } else {
                    left = (left << 1) | (left >>> 27);
                    right = (right << 1) | (right >>> 27);
                }
                left &= -0xf;
                right &= -0xf;

                // Now apply PC-2, in such a way that E is easier when encrypting or decrypting.
                // This conversion will look like PC-2 except only the last 6 bits of each byte are used
                // rather than 48 consecutive bits and the order of lines will be according to
                // how the S selection functions will be applied: S2, S4, S6, S8, S1, S3, S5, S7
                lefttemp = pc2bytes0[left >>> 28] | pc2bytes1[(left >>> 24) & 0xf]
                    | pc2bytes2[(left >>> 20) & 0xf] | pc2bytes3[(left >>> 16) & 0xf]
                    | pc2bytes4[(left >>> 12) & 0xf] | pc2bytes5[(left >>> 8) & 0xf]
                    | pc2bytes6[(left >>> 4) & 0xf];
                righttemp = pc2bytes7[right >>> 28] | pc2bytes8[(right >>> 24) & 0xf]
                    | pc2bytes9[(right >>> 20) & 0xf] | pc2bytes10[(right >>> 16) & 0xf]
                    | pc2bytes11[(right >>> 12) & 0xf] | pc2bytes12[(right >>> 8) & 0xf]
                    | pc2bytes13[(right >>> 4) & 0xf];
                temp = ((righttemp >>> 16) ^ lefttemp) & 0x0000ffff;
                keys[n++] = lefttemp ^ temp;
                keys[n++] = righttemp ^ (temp << 16);
            }
        } // for each iterations
        // return the keys we've created
        return keys;
    }

    static encryptAES(key, data) {
        // convert to integer arrays for AES
        const keyArray = DataOperations.hexstringToNumericArray(key);
        const dataArray = DataOperations.hexstringToNumericArray(data);

        if (keyArray.length !== 16) {
            throw new Error('Key must be 16 bytes for AES.');
        }

        while (dataArray.length % 16) { dataArray.push(0); }  // pad with zeroes

        // The initialization vector, which can be null
        const iv = null;

        // We will use CBC mode:
        const CBC = aesjs.ModeOfOperation.cbc;
        const aesCbc = new CBC(keyArray, iv);

        function accumulate(a, b) {
            for (let i = 0; i < b.length; i++) {
                a.push(b[i]);
            }
        }

        const bytes = [];

        for (let i = 0; i < dataArray.length; i += 16) {
            const result = aesCbc.encrypt(Buffer.from(dataArray.slice(i, i + 16)));
            accumulate(bytes, result);
        }

        return DataOperations.hexstringToData(DataOperations.numericArrayToHexstring(bytes));
    }

    static decryptAES(key, data) {
        // convert to integer arrays for AES
        const keyArray = DataOperations.hexstringToNumericArray(key);
        const dataArray = DataOperations.hexstringToNumericArray(data);

        if (keyArray.length !== 16) {
            throw new Error('Key must be 16 bytes for AES.');
        }

        while (dataArray.length % 16) {
            dataArray.push(0);
        }  // pad with zeroes

        // The initialization vector, which can be null
        const iv = null;

        // We will use CBC mode:
        const CBC = aesjs.ModeOfOperation.cbc;
        const aesCbc = new CBC(keyArray, iv);

        function accumulate(a, b) {
            for (let i = 0; i < b.length; i++) {
                a.push(b[i]);
            }
        }

        const bytes = [];

        for (let i = 0; i < dataArray.length; i += 16) {
            const result = aesCbc.decrypt(Buffer.from(dataArray.slice(i, i + 16)));
            accumulate(bytes, result);
        }

        return DataOperations.hexstringToData(DataOperations.numericArrayToHexstring(bytes));
    }
}

module.exports = Dukpt;
