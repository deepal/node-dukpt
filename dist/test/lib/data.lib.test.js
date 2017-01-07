'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var should = require('should');
var RandExp = require('randexp');
var DataOperations = require('../../lib/data.lib');

function getRandomString() {
    return new RandExp(/[a-zA-Z0-9]{10,50}/).gen();
}

function getRandomNumericArray() {
    var res = [];
    for (var i = 0; i < 10; i++) {
        res.push(Math.round(Math.random() * 100));
    }
    return res;
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
        var hexEncoded = DataOperations.numericArrayToHexstring(randomArray);
        (typeof hexEncoded === 'undefined' ? 'undefined' : _typeof(hexEncoded)).should.equal('string');
        /[a-fA-F0-9]/.test(hexEncoded).should.be.true();
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
});
//# sourceMappingURL=data.lib.test.js.map