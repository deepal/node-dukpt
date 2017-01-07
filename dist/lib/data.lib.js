'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataOperations = function () {
    function DataOperations() {
        _classCallCheck(this, DataOperations);
    }

    _createClass(DataOperations, null, [{
        key: 'fieldEmpty',
        value: function fieldEmpty(fieldArray) {

            for (var i = 0; i < fieldArray.length; i++) {
                if (fieldArray[i] == "") // empty
                    return true;
            }return false;
        }
    }, {
        key: 'getPads',
        value: function getPads(padChar, howMany) {
            return new Array(howMany + 1).join(padChar);
        }
    }, {
        key: 'asciiToBase64',
        value: function asciiToBase64(asciiString) {
            return Buffer.from(asciiString, 'utf-8').toString('base64');
        }
    }, {
        key: 'base64ToAscii',
        value: function base64ToAscii(base64String) {
            return Buffer.from(base64String, 'base64').toString('utf-8');
        }
    }, {
        key: 'removeNullCharsFromAscii',
        value: function removeNullCharsFromAscii(asciiString) {
            return asciiString.replace(/\u0000/g, '');
        }
    }, {
        key: 'numericArrayToHexstring',
        value: function numericArrayToHexstring(ba) {

            var st = "";
            for (var i = 0; i < ba.length; i++) {
                var item = ba[i];
                var hex = item.toString(16);
                if (hex.length < 2) hex = "0" + hex;
                st += hex;
            }
            return st;
        }
    }, {
        key: 'hexstringToData',
        value: function hexstringToData(hex) {

            hex = hex.replace(/\s/g, ""); // eliminate spaces

            var keyar = hex.match(/../g); // break into array of doublets

            var s = ""; // holder for our return value

            for (var i = 0; i < keyar.length; i++) {
                s += String.fromCharCode(Number("0x" + keyar[i]));
            }return s;
        }
    }, {
        key: 'hexstringToNumericArray',
        value: function hexstringToNumericArray(hex) {

            hex = hex.replace(/\s/g, ""); // eliminate spaces

            var keyar = hex.match(/../g); // break into array of doublets

            var s = []; // holder for our return value

            for (var i = 0; i < keyar.length; i++) {
                s.push(Number("0x" + keyar[i]));
            }return s;
        }
    }, {
        key: 'dataToHexstring',
        value: function dataToHexstring(d) {
            var hex = "";
            for (var i = 0; i < d.length; i++) {
                var h = d.charCodeAt(i).toString(16);
                if (h.length < 2) h = "0" + h;
                hex += h;
            }
            return hex.toUpperCase();
        }
    }, {
        key: 'XORdata',
        value: function XORdata(data1, data2) {

            if (data1.length < data2.length) {

                while (data1.length < data2.length) {
                    data1 = "\0" + data1;
                } // prepend with nulls
            }

            if (data1.length > data2.length) {

                while (data1.length > data2.length) {
                    data2 = "\0" + data2;
                } // prepend with nulls
            }

            var output = "";

            for (var i = 0; i < data1.length; i++) {
                var result = data1.charCodeAt(i) ^ data2.charCodeAt(i);
                output += String.fromCharCode(result);
            }

            return output;
        }
    }, {
        key: 'XORdataHex',
        value: function XORdataHex(d1, d2) {

            var data1 = DataOperations.hexstringToData(d1);
            var data2 = DataOperations.hexstringToData(d2);

            if (data1.length < data2.length) {

                while (data1.length < data2.length) {
                    data1 = "\0" + data1;
                } // prepend with nulls
            }

            if (data1.length > data2.length) {

                while (data1.length > data2.length) {
                    data2 = "\0" + data2;
                } // prepend with nulls
            }

            var output = "";

            for (var i = 0; i < data1.length; i++) {
                var result = data1.charCodeAt(i) ^ data2.charCodeAt(i);
                output += String.fromCharCode(result);
            }

            return DataOperations.dataToHexstring(output);
        }
    }, {
        key: 'ANDdata',
        value: function ANDdata(data1, data2) {

            if (data1.length < data2.length) {

                while (data1.length < data2.length) {
                    data1 = "\0" + data1;
                } // prepend with nulls
            }

            if (data1.length > data2.length) {

                while (data1.length > data2.length) {
                    data2 = "\0" + data2;
                } // prepend with nulls
            }

            var output = "";

            for (var i = 0; i < data1.length; i++) {
                var result = data1.charCodeAt(i) & data2.charCodeAt(i);
                output += String.fromCharCode(result);
            }

            return output;
        }
    }, {
        key: 'hexToText',
        value: function hexToText(h) {

            function isASCII(s) {
                return s >= 32 && s < 127;
            }

            h = h.replace(/\s/g, ""); // eliminate spaces

            var SPECIAL = "."; //String.fromCharCode(9744);
            var symbols = h.match(/../g);
            var output = [];
            for (var i = 0; i < symbols.length; i++) {
                var s = symbols[i];
                var s_decimal = Number("0x" + s);
                output.push(isASCII(s_decimal) ? String.fromCharCode(s_decimal) : SPECIAL);
            }
            return output.join("");
        }
    }]);

    return DataOperations;
}();

module.exports = DataOperations;
//# sourceMappingURL=data.lib.js.map