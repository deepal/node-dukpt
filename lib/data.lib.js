'use strict';

class DataOperations {
    static fieldEmpty(fieldArray) {

        for (let i = 0; i < fieldArray.length; i++)
            if (fieldArray[i] == "") // empty
                return true;
        return false;
    }

    static getPads(padChar, howMany) {
        return (new Array(howMany + 1)).join(padChar);
    }

    static asciiToBase64(asciiString){
        return Buffer.from(asciiString, 'utf-8').toString('base64');
    }

    static base64ToAscii(base64String){
        return Buffer.from(base64String, 'base64').toString('utf-8');
    }

    static removeNullCharsFromAscii(asciiString){
        return asciiString.replace(/\u0000/g, '');
    }

    static numericArrayToHexstring(ba) {

        let st = "";
        for (let i = 0; i < ba.length; i++) {
            let item = ba[i];
            let hex = item.toString(16);
            if (hex.length < 2) hex = "0" + hex;
            st += hex;
        }
        return st;
    }

    static hexstringToData(hex) {

        hex = hex.replace(/\s/g, ""); // eliminate spaces

        let keyar = hex.match(/../g); // break into array of doublets

        let s = "";  // holder for our return value

        for (let i = 0; i < keyar.length; i++)
            s += String.fromCharCode(Number("0x" + keyar[i]));

        return s;
    }

    static hexstringToNumericArray(hex) {

        hex = hex.replace(/\s/g, ""); // eliminate spaces

        let keyar = hex.match(/../g); // break into array of doublets

        let s = [];  // holder for our return value

        for (let i = 0; i < keyar.length; i++)
            s.push(Number("0x" + keyar[i]));

        return s;
    }

    static dataToHexstring(d) {
        let hex = "";
        for (let i = 0; i < d.length; i++) {
            let h = (d.charCodeAt(i)).toString(16);
            if (h.length < 2) h = "0" + h;
            hex += h;
        }
        return hex.toUpperCase();
    }

    static XORdata(data1, data2) {

        if (data1.length < data2.length) {

            while (data1.length < data2.length)
                data1 = "\0" + data1; // prepend with nulls
        }

        if (data1.length > data2.length) {

            while (data1.length > data2.length)
                data2 = "\0" + data2; // prepend with nulls
        }

        let output = "";

        for (let i = 0; i < data1.length; i++) {
            let result = data1.charCodeAt(i) ^ data2.charCodeAt(i);
            output += String.fromCharCode(result);
        }

        return output;
    }

    static XORdataHex(d1, d2) {

        let data1 = DataOperations.hexstringToData(d1);
        let data2 = DataOperations.hexstringToData(d2);

        if (data1.length < data2.length) {

            while (data1.length < data2.length)
                data1 = "\0" + data1; // prepend with nulls
        }

        if (data1.length > data2.length) {

            while (data1.length > data2.length)
                data2 = "\0" + data2; // prepend with nulls
        }

        let output = "";

        for (let i = 0; i < data1.length; i++) {
            let result = data1.charCodeAt(i) ^ data2.charCodeAt(i);
            output += String.fromCharCode(result);
        }

        return DataOperations.dataToHexstring(output);
    }

    static ANDdata(data1, data2) {

        if (data1.length < data2.length) {

            while (data1.length < data2.length)
                data1 = "\0" + data1; // prepend with nulls
        }

        if (data1.length > data2.length) {

            while (data1.length > data2.length)
                data2 = "\0" + data2; // prepend with nulls
        }

        let output = "";

        for (let i = 0; i < data1.length; i++) {
            let result = data1.charCodeAt(i) & data2.charCodeAt(i);
            output += String.fromCharCode(result);
        }

        return output;
    }

    static hexToText(h) {

        function isASCII(s) {
            return s >= 32 && s < 127;
        }

        h = h.replace(/\s/g, ""); // eliminate spaces

        let SPECIAL = "."; //String.fromCharCode(9744);
        let symbols = h.match(/../g);
        let output = [];
        for (let i = 0; i < symbols.length; i++) {
            let s = symbols[i];
            let s_decimal = Number("0x" + s);
            output.push(isASCII(s_decimal) ?
                String.fromCharCode(s_decimal) : SPECIAL);

        }
        return output.join("");
    }
}

module.exports = DataOperations;
