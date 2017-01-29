'use strict';

var should = require('should');
var Dukpt = require('../../index');
var RandExp = require('randexp');
var sinon = require('sinon');

var dukpt = null;
var sandbox = null;
var bdk = '0123456789ABCDEFFEDCBA9876543210';
var ksn = 'FFFFFFFFFFFFFFFFFFFF';
var cc_trackdata_example = '%B4815881002861896^YATES/EUGENE JOHN              ^37829821000123456789?'; // taken from wikipedia. not an actual card
var cc_trackdata_hex_example = '2542343831353838313030323836313839365e59415445532f455547454e45204a4f484e20202020202020202020202020205e33373832393832313030303132333435363738393f';
var cc_trackdata_3des_encrypted_sample = '88B0208C24474EB41EE216D3BD0D226777FBBE15CEB7A2F840F16588FA583100848D334DD1B33CCD03728AD03E65993BB82F969EC4C5A68A83B8C5D80CC899D0E5C184D5BA48E7FF';
var cc_trackdata_aes_encrypted_sample = '6773ECC682BA7419F7035B4097BF4052D0460D90165651F7CA6760E612F422DA68D6385D2F5705B5F5A8A2DABEA93BEA157ED634E0729923FD8F720985F3624D06FAA7B133883B8FA5860294FAF36F80';

function getRandomText() {
    return new RandExp(/[A-Z0-9]{50}/).gen();
}

function getRandomHexText() {
    return Buffer.from(getRandomText(), 'ascii').toString('hex');
}

describe('dukpt encryption tests with hex output encoding and 3des encryption mode', function () {

    beforeEach(function () {
        dukpt = new Dukpt(bdk, ksn);
    });

    it('should generate correct encrypted output when input encoding type : ascii', function (done) {
        var encrypted = dukpt.dukptEncrypt(cc_trackdata_example, {
            inputEncoding: 'ascii'
        });

        encrypted.should.equal(cc_trackdata_3des_encrypted_sample);
        done();
    });

    it('should generate correct encrypted output when input encoding type : hex', function (done) {
        var encrypted = dukpt.dukptEncrypt(cc_trackdata_hex_example, {
            inputEncoding: 'hex'
        });

        encrypted.should.equal(cc_trackdata_3des_encrypted_sample);
        done();
    });

    it('should throw an error when unknown input encoding provided', function (done) {
        try {
            dukpt.dukptEncrypt(cc_trackdata_hex_example, {
                inputEncoding: 'unknown'
            });
        } catch (err) {
            should.exist(err);
            err.message.should.equal('unsupported input encoding type for dukpt encrypt : \'unknown\'');
        }
        done();
    });

    it('should throw an error when input string is not provided', function (done) {
        try {
            dukpt.dukptEncrypt(false, {
                inputEncoding: 'hex'
            });
        } catch (err) {
            should.exist(err);
            err.message.should.equal('either session key or data not provided');
        }
        done();
    });
});
describe('dukpt encryption tests with hex output encoding and aes encryption mode', function () {

    beforeEach(function () {
        dukpt = new Dukpt(bdk, ksn);
    });

    it('should generate correct encrypted output when input encoding type : ascii', function (done) {
        var encrypted = dukpt.dukptEncrypt(cc_trackdata_example, {
            inputEncoding: 'ascii',
            encryptionMode: 'AES'
        });

        encrypted.should.equal(cc_trackdata_aes_encrypted_sample);
        done();
    });

    it('should generate correct encrypted output when input encoding type : hex', function (done) {
        var encrypted = dukpt.dukptEncrypt(cc_trackdata_hex_example, {
            inputEncoding: 'hex',
            encryptionMode: 'AES'
        });

        encrypted.should.equal(cc_trackdata_aes_encrypted_sample);
        done();
    });

    it('should throw an error when unknown input encoding provided', function (done) {
        try {
            dukpt.dukptEncrypt(cc_trackdata_hex_example, {
                inputEncoding: 'unknown',
                encryptionMode: 'AES'
            });
        } catch (err) {
            should.exist(err);
            err.message.should.equal('unsupported input encoding type for dukpt encrypt : \'unknown\'');
        }
        done();
    });

    it('should throw an error when input string is not provided', function (done) {
        try {
            dukpt.dukptEncrypt(false, {
                inputEncoding: 'hex',
                encryptionMode: 'AES'
            });
        } catch (err) {
            should.exist(err);
            err.message.should.equal('either session key or data not provided');
        }
        done();
    });
});

describe('dukpt decryption tests with hex input encoding and 3des encryption mode', function () {

    beforeEach(function () {
        dukpt = new Dukpt(bdk, ksn);
    });

    it('should generate correct decrypted output when output encoding type : ascii', function (done) {
        var encrypted = dukpt.dukptDecrypt(cc_trackdata_3des_encrypted_sample, {
            outputEncoding: 'ascii'
        });

        encrypted.should.equal(cc_trackdata_example);
        done();
    });

    it('should generate correct decrypted output when output encoding type : hex', function (done) {
        var encrypted = dukpt.dukptDecrypt(cc_trackdata_3des_encrypted_sample, {
            outputEncoding: 'hex'
        });

        encrypted.toLowerCase().should.equal(cc_trackdata_hex_example);
        done();
    });

    it('should throw an error when unknown output encoding provided', function (done) {
        try {
            dukpt.dukptDecrypt(cc_trackdata_3des_encrypted_sample, {
                outputEncoding: 'unknown'
            });
        } catch (err) {
            should.exist(err);
            err.message.should.equal('unsupported output encoding for dukpt decrypt');
        }
        done();
    });

    it('should throw an error when input encrypted string is not provided', function (done) {
        try {
            dukpt.dukptDecrypt(false, {
                outputEncoding: 'ascii'
            });
        } catch (err) {
            should.exist(err);
            err.message.should.equal('either session key or data not provided');
        }
        done();
    });
});
describe('dukpt decryption tests with hex input encoding and aes encryption mode', function () {

    beforeEach(function () {
        dukpt = new Dukpt(bdk, ksn);
    });

    it('should generate correct decrypted output when output encoding type : ascii', function (done) {
        var encrypted = dukpt.dukptDecrypt(cc_trackdata_aes_encrypted_sample, {
            outputEncoding: 'ascii',
            decryptionMode: 'AES',
            trimOutput: true
        });

        encrypted.should.equal(cc_trackdata_example);
        done();
    });

    it('should generate correct decrypted output when output encoding type : hex', function (done) {
        var encrypted = dukpt.dukptDecrypt(cc_trackdata_aes_encrypted_sample, {
            outputEncoding: 'hex',
            decryptionMode: 'AES',
            trimOutput: true
        });

        encrypted.toLowerCase().should.equal(cc_trackdata_hex_example);
        done();
    });

    it('should throw an error when unknown output encoding provided', function (done) {
        try {
            dukpt.dukptDecrypt(cc_trackdata_aes_encrypted_sample, {
                outputEncoding: 'unknown',
                decryptionMode: 'AES'
            });
        } catch (err) {
            should.exist(err);
            err.message.should.equal('unsupported output encoding for dukpt decrypt');
        }
        done();
    });

    it('should throw an error when input encrypted string is not provided', function (done) {
        try {
            dukpt.dukptDecrypt(false, {
                outputEncoding: 'ascii',
                decryptionMode: 'AES'
            });
        } catch (err) {
            should.exist(err);
            err.message.should.equal('either session key or data not provided');
        }
        done();
    });
});

describe('internal methods test suite', function () {

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        dukpt = new Dukpt(bdk, ksn);
    });

    afterEach(function () {
        sandbox.restore();
        dukpt = null;
    });

    it('should return same value when ksn "0000FFFFFFFFFFE00000" is masked with _getMaskedKSN', function (done) {
        var ksn = '0000FFFFFFFFFFE00000';
        var maskedKSN = dukpt._getMaskedKSN(ksn);
        Buffer.from(maskedKSN, 'ascii').toString('hex').toUpperCase().should.equal(ksn);
        done();
    });

    it('should generate dukpt session key provided ipek and ksn', function (done) {
        var stub = sinon.stub(dukpt, '_createDataKeyHex', function () {
            return '123';
        });

        var dukptSessKey = dukpt.generateDukptSessionKey(getRandomHexText(), getRandomHexText());

        dukptSessKey.should.equal('123');
        stub.restore();
        done();
    });

    it('should throw an error when either ipek or ksn is not provided for generateDukptSessionKey', function (done) {
        var stub = sinon.stub(dukpt, '_createDataKeyHex', function () {
            return '123';
        });
        try {
            dukpt.generateDukptSessionKey('', getRandomHexText());
        } catch (err) {
            should.exist(err);
            err.message.should.equal('either IPEK or data params not provided');
        }

        try {
            dukpt.generateDukptSessionKey(getRandomHexText(), '');
        } catch (err) {
            should.exist(err);
            err.message.should.equal('either IPEK or data params not provided');
        }
        stub.restore();
        done();
    });
});
//# sourceMappingURL=dukpt.lib.test.js.map