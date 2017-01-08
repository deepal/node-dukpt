const should = require('should');
const Dukpt = require('../../index');
const RandExp = require('randexp');
const sinon = require('sinon');

let dukpt = null;
let bdk = '0123456789ABCDEFFEDCBA9876543210';
let ksn = 'FFFFFFFFFFFFFFFFFFFF';
let cc_trackdata_example = '%B4815881002861896^YATES/EUGENE JOHN              ^37829821000123456789?'; // taken from wikipedia. not an actual card
let cc_trackdata_hex_example = '2542343831353838313030323836313839365e59415445532f455547454e45204a4f484e20202020202020202020202020205e33373832393832313030303132333435363738393f';
let cc_trackdata_encrypted_sample = '88B0208C24474EB41EE216D3BD0D226777FBBE15CEB7A2F840F16588FA583100848D334DD1B33CCD03728AD03E65993BB82F969EC4C5A68A83B8C5D80CC899D0E5C184D5BA48E7FF';

function getRandomText() {
    return new RandExp(/[A-Z0-9]{50}/).gen();
}

function getRandomHexText() {
    return Buffer.from(getRandomText(), 'ascii').toString('hex');
}

describe('dukpt encryption tests with hex output encoding', () => {

    beforeEach(()=> {
        dukpt = new Dukpt(bdk, ksn);
    });

    it('should generate correct encrypted output when input encoding type : ascii', (done) => {
        let encrypted = dukpt.dukptEncrypt(cc_trackdata_example, {
            inputEncoding: 'ascii'
        });

        encrypted.should.equal(cc_trackdata_encrypted_sample);
        done();
    });

    it('should generate correct encrypted output when input encoding type : hex', (done) => {
        let encrypted = dukpt.dukptEncrypt(cc_trackdata_hex_example, {
            inputEncoding: 'hex'
        });

        encrypted.should.equal(cc_trackdata_encrypted_sample);
        done();
    });

    it('should throw an error when unknown input encoding provided', (done) => {
        try {
            dukpt.dukptEncrypt(cc_trackdata_hex_example, {
                inputEncoding: 'unknown'
            });
        }
        catch(err){
            should.exist(err);
            err.message.should.equal('unsupported input encoding type for dukpt encrypt : \'unknown\'');
        }
        done();
    });

    it('should throw an error when input string is not provided', (done) => {
        try{
            dukpt.dukptEncrypt(false, {
                inputEncoding: 'hex'
            });
        }
        catch(err){
            should.exist(err);
            err.message.should.equal('either session key or data not provided');
        }
        done();
    });
});

describe('dukpt decryption tests with hex input encoding', () => {

    beforeEach(()=> {
        dukpt = new Dukpt(bdk, ksn);
    });

    it('should generate correct decrypted output when output encoding type : ascii', (done) => {
        let encrypted = dukpt.dukptDecrypt(cc_trackdata_encrypted_sample, {
            outputEncoding: 'ascii'
        });

        encrypted.should.equal(cc_trackdata_example);
        done();
    });

    it('should generate correct decrypted output when output encoding type : hex', (done) => {
        let encrypted = dukpt.dukptDecrypt(cc_trackdata_encrypted_sample, {
            outputEncoding: 'hex'
        });

        encrypted.toLowerCase().should.equal(cc_trackdata_hex_example);
        done();
    });

    it('should throw an error when unknown output encoding provided', (done) => {
        try {
            dukpt.dukptDecrypt(cc_trackdata_encrypted_sample, {
                outputEncoding: 'unknown'
            });
        }
        catch(err){
            should.exist(err);
            err.message.should.equal('unsupported output encoding for dukpt decrypt');
        }
        done();
    });

    it('should throw an error when input encrypted string is not provided', (done) => {
        try{
            dukpt.dukptDecrypt(false, {
                outputEncoding: 'ascii'
            });
        }
        catch(err){
            should.exist(err);
            err.message.should.equal('either session key or data not provided');
        }
        done();
    });
});

describe('private methods test suite', () => {
    it('should return same value when ksn "0000FFFFFFFFFFE00000" is masked with _getMaskedKSN', (done) => {
        const ksn = '0000FFFFFFFFFFE00000';
        const maskedKSN = dukpt._getMaskedKSN(ksn);
        (Buffer.from(maskedKSN, 'ascii').toString('hex').toUpperCase()).should.equal(ksn);
        done();
    });

    it('should generate dukpt session key provided ipek and ksn', (done) => {
        const stub = sinon.stub(dukpt, '_createDataKeyHex', () => '123');

        const dukptSessKey = dukpt.generateDukptSessionKey(getRandomHexText(), getRandomHexText());

        dukptSessKey.should.equal('123');
        stub.restore();
        done();
    });

    it('should throw an error when either ipek or ksn is not provided for generateDukptSessionKey', (done) => {
        const stub = sinon.stub(dukpt, '_createDataKeyHex', () => '123' );
        try{
            dukpt.generateDukptSessionKey('', getRandomHexText());
        }
        catch (err){
            should.exist(err);
            err.message.should.equal('either IPEK or data params not provided');
        }

        try{
            dukpt.generateDukptSessionKey(getRandomHexText(), '');
        }
        catch (err){
            should.exist(err);
            err.message.should.equal('either IPEK or data params not provided');
        }
        stub.restore();
        done();
    });
});


