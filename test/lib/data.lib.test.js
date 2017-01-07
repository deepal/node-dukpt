const should = require('should');
const RandExp = require('randexp');
const DataOperations = require('../../lib/data.lib');

function getRandomString() {
    return new RandExp(/[a-zA-Z0-9]{10,50}/).gen();
}

function getRandomNumericArray() {
    const res = [];
    for(let i=0; i< 10; i++){
        res.push(Math.round(Math.random()*100));
    }
    return res;
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
        const hexEncoded = DataOperations.numericArrayToHexstring(randomArray);
        (typeof hexEncoded).should.equal('string');
        (/[a-fA-F0-9]/).test(hexEncoded).should.be.true();
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
});

