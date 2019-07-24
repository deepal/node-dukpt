const should = require('should');
const RandExp = require('randexp');
const DataOperations = require('../../src/lib/data.lib');

function getRandomString() {
    return new RandExp(/[a-zA-Z0-9]{10,50}/).gen();
}

function getRandomNumericArray(largestNumber) {
    const res = [];

    let upperBount = largestNumber || 100;

    for(let i=0; i< 10; i++){
        res.push(Math.round(Math.random()*upperBount));
    }
    return res;
}

function getRandomStringArray(addEmptyElements) {
    const result = [];

    const randomIndex = Math.round(Math.random() * 9);

    for(let i=0; i< 10; i++){
        if (i===randomIndex && addEmptyElements){
            result.push('');
        }
        else{
            result.push(getRandomString());
        }
    }

    return result;
}

describe('data operations test suite', () => {
    it('should return requested padding string when called getpads', (done) => {
        const padding = DataOperations.getPads('0', 10);
        padding.length.should.equal(10);
        padding.replace(/0/g,'').length.should.equal(0);
        done();
    });

    it('should return "ZHVrcHQ=" when the word "dukpt" is base64 encoded', (done) => {
        const base64Encoded = DataOperations.asciiToBase64('dukpt');
        base64Encoded.should.equal('ZHVrcHQ=');
        done();
    });

    it('should return "dukpt" when the base64 encoded text "ZHVrcHQ=" is base64 decoded', (done) => {
        const base64Encoded = DataOperations.base64ToAscii('ZHVrcHQ=');
        base64Encoded.should.equal('dukpt');
        done();
    });

    it('should return a string with null characters removed when called removeNullCharsFromAscii', (done) => {
        const sanitizedString = DataOperations.removeNullCharsFromAscii('abc\u0000\u0000');
        sanitizedString.should.equal('abc');
        done();
    });

    it('should return a proper hex encoded string when called numericArrayToHexstring() against a numeric array', (done) => {
        const randomArray = getRandomNumericArray();
        const smallNumbers = getRandomNumericArray(10);
        const hexEncoded = DataOperations.numericArrayToHexstring(randomArray);
        const smallHexEncoded = DataOperations.numericArrayToHexstring(smallNumbers);
        (typeof hexEncoded).should.equal('string');
        (typeof smallHexEncoded).should.equal('string');
        (/[a-fA-F0-9]/).test(hexEncoded).should.be.true();
        (/[a-fA-F0-9]/).test(smallHexEncoded).should.be.true();
        done();
    });

    it('should return an array when called hexstringToNumericArray against a hex string', (done) => {
        const randomArray = getRandomNumericArray();
        const hexEncoded = DataOperations.numericArrayToHexstring(randomArray);
        const resultArr = DataOperations.hexstringToNumericArray(hexEncoded);
        resultArr.forEach((number, i) => {
            number.should.equal(randomArray[i]);
        } );
        done();
    });

    it('should return a hex string when converted using hexToText', (done) => {
        const randomString = getRandomString();
        const hexEncoded = Buffer.from(randomString).toString('hex');
        const result = DataOperations.hexToText(hexEncoded);
        result.should.equal(randomString);
        done();
    });

    it('should return correct output when string "dukpt" is xored with "aes"', (done) => {
        const str1 = 'dukpt';
        const str2 = 'aes';
        let xorOutput = DataOperations.XORdata(str1, str2);
        parseInt(Buffer.from(xorOutput, 'ascii').toString('hex'), 16).should.equal(431460324615);
        xorOutput = DataOperations.XORdata(str2, str1);
        parseInt(Buffer.from(xorOutput, 'ascii').toString('hex'), 16).should.equal(431460324615);
        done();
    });

    it('should return correct output when hex string of "dukpt" is xored with hex string of "aes"', (done) => {
        const str1Hex = Buffer.from('dukpt', 'ascii').toString('hex');
        const str2Hex = Buffer.from('aes', 'ascii').toString('hex');
        let xorOutputHex = DataOperations.XORdataHex(str1Hex, str2Hex);
        parseInt(xorOutputHex, 16).should.equal(431460324615);
        xorOutputHex = DataOperations.XORdataHex(str2Hex, str1Hex);
        parseInt(xorOutputHex, 16).should.equal(431460324615);
        done();
    });

    it('should return correct output when two ascii strings evaluated with bitwise AND', (done) => {
        const str1 = 'dukpt';
        const str2 = 'aes';
        let andOutput = DataOperations.ANDdata(str1, str2);
        parseInt(Buffer.from(andOutput, 'ascii').toString('hex'), 16).should.equal(6381680);
        let andOutputReversed = DataOperations.ANDdata(str2, str1);
        parseInt(Buffer.from(andOutputReversed, 'ascii').toString('hex'), 16).should.equal(6381680);
        done();
    });

    it('should return true when any of the array elements is empty', (done) => {
        const randomArrayWithEmpty = getRandomStringArray(true);
        const randomArray = getRandomStringArray(false);
        DataOperations.fieldEmpty(randomArrayWithEmpty).should.be.true();
        DataOperations.fieldEmpty(randomArray).should.be.false();
        done();
    });
});

