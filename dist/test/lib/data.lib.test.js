'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var should = require('should');
var RandExp = require('randexp');
var DataOperations = require('../../lib/data.lib');

function getRandomString() {
    return new RandExp(/[a-zA-Z0-9]{10,50}/).gen();
}

function getRandomNumericArray(largestNumber) {
    var res = [];

    var upperBount = largestNumber || 100;

    for (var i = 0; i < 10; i++) {
        res.push(Math.round(Math.random() * upperBount));
    }
    return res;
}

function getRandomStringArray(addEmptyElements) {
    var result = [];

    var randomIndex = Math.round(Math.random() * 9);

    for (var i = 0; i < 10; i++) {
        if (i === randomIndex && addEmptyElements) {
            result.push('');
        } else {
            result.push(getRandomString());
        }
    }

    return result;
}

describe('data operations test suite', function () {
    it('should return requested padding string when called getpads', function (done) {
        var padding = DataOperations.getPads('0', 10);
        padding.length.should.equal(10);
        padding.replace(/0/g, '').length.should.equal(0);
        done();
    });

    it('should return "ZHVrcHQ=" when the word "dukpt" is base64 encoded', function (done) {
        var base64Encoded = DataOperations.asciiToBase64('dukpt');
        base64Encoded.should.equal('ZHVrcHQ=');
        done();
    });

    it('should return "dukpt" when the base64 encoded text "ZHVrcHQ=" is base64 decoded', function (done) {
        var base64Encoded = DataOperations.base64ToAscii('ZHVrcHQ=');
        base64Encoded.should.equal('dukpt');
        done();
    });

    it('should return a string with null characters removed when called removeNullCharsFromAscii', function (done) {
        var sanitizedString = DataOperations.removeNullCharsFromAscii('abc\0\0');
        sanitizedString.should.equal('abc');
        done();
    });

    it('should return a proper hex encoded string when called numericArrayToHexstring() against a numeric array', function (done) {
        var randomArray = getRandomNumericArray();
        var smallNumbers = getRandomNumericArray(10);
        var hexEncoded = DataOperations.numericArrayToHexstring(randomArray);
        var smallHexEncoded = DataOperations.numericArrayToHexstring(smallNumbers);
        (typeof hexEncoded === 'undefined' ? 'undefined' : _typeof(hexEncoded)).should.equal('string');
        (typeof smallHexEncoded === 'undefined' ? 'undefined' : _typeof(smallHexEncoded)).should.equal('string');
        /[a-fA-F0-9]/.test(hexEncoded).should.be.true();
        /[a-fA-F0-9]/.test(smallHexEncoded).should.be.true();
        done();
    });

    it('should return an array when called hexstringToNumericArray against a hex string', function (done) {
        var randomArray = getRandomNumericArray();
        var hexEncoded = DataOperations.numericArrayToHexstring(randomArray);
        var resultArr = DataOperations.hexstringToNumericArray(hexEncoded);
        resultArr.forEach(function (number, i) {
            number.should.equal(randomArray[i]);
        });
        done();
    });

    it('should return a hex string when converted using hexToText', function (done) {
        var randomString = getRandomString();
        var hexEncoded = Buffer.from(randomString).toString('hex');
        var result = DataOperations.hexToText(hexEncoded);
        result.should.equal(randomString);
        done();
    });

    it('should return correct output when string "dukpt" is xored with "aes"', function (done) {
        var str1 = 'dukpt';
        var str2 = 'aes';
        var xorOutput = DataOperations.XORdata(str1, str2);
        parseInt(Buffer.from(xorOutput, 'ascii').toString('hex'), 16).should.equal(431460324615);
        xorOutput = DataOperations.XORdata(str2, str1);
        parseInt(Buffer.from(xorOutput, 'ascii').toString('hex'), 16).should.equal(431460324615);
        done();
    });

    it('should return correct output when hex string of "dukpt" is xored with hex string of "aes"', function (done) {
        var str1Hex = Buffer.from('dukpt', 'ascii').toString('hex');
        var str2Hex = Buffer.from('aes', 'ascii').toString('hex');
        var xorOutputHex = DataOperations.XORdataHex(str1Hex, str2Hex);
        parseInt(xorOutputHex, 16).should.equal(431460324615);
        xorOutputHex = DataOperations.XORdataHex(str2Hex, str1Hex);
        parseInt(xorOutputHex, 16).should.equal(431460324615);
        done();
    });

    it('should return correct output when two ascii strings evaluated with bitwise AND', function (done) {
        var str1 = 'dukpt';
        var str2 = 'aes';
        var andOutput = DataOperations.ANDdata(str1, str2);
        parseInt(Buffer.from(andOutput, 'ascii').toString('hex'), 16).should.equal(6381680);
        var andOutputReversed = DataOperations.ANDdata(str2, str1);
        parseInt(Buffer.from(andOutputReversed, 'ascii').toString('hex'), 16).should.equal(6381680);
        done();
    });

    it('should return true when any of the array elements is empty', function (done) {
        var randomArrayWithEmpty = getRandomStringArray(true);
        var randomArray = getRandomStringArray(false);
        DataOperations.fieldEmpty(randomArrayWithEmpty).should.be.true();
        DataOperations.fieldEmpty(randomArray).should.be.false();
        done();
    });
});
//# sourceMappingURL=data.lib.test.js.map