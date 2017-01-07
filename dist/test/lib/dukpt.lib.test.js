'use strict';

var should = require('should');
var Dukpt = require('../../index');
var RandExp = require('randexp');

var dukpt = null;
var bdk = '0123456789ABCDEFFEDCBA9876543210';
var ksn = 'FFFFFFFFFFFFFFFFFFFF';
var cc_trackdata_example = '%B4815881002861896^YATES/EUGENE JOHN              ^37829821000123456789?'; // taken from wikipedia. not an actual card
var cc_trackdata_hex_example = '2542343831353838313030323836313839365e59415445532f455547454e45204a4f484e20202020202020202020202020205e33373832393832313030303132333435363738393f';
var cc_trackdata_encrypted_sample = '88B0208C24474EB41EE216D3BD0D226777FBBE15CEB7A2F840F16588FA583100848D334DD1B33CCD03728AD03E65993BB82F969EC4C5A68A83B8C5D80CC899D0E5C184D5BA48E7FF';

function getRandomText() {
    return new RandExp(/[A-Z0-9]{50}/);
}

describe('dukpt encryption tests with hex output encoding', function () {

    beforeEach(function () {
        dukpt = new Dukpt(bdk, ksn);
    });

    it('should generate correct encrypted output when input encoding type : ascii', function (done) {
        var encrypted = dukpt.dukptEncrypt(cc_trackdata_example, {
            inputEncoding: 'ascii'
        });

        encrypted.should.equal(cc_trackdata_encrypted_sample);
        done();
    });

    it('should generate correct encrypted output when input encoding type : hex', function (done) {
        var encrypted = dukpt.dukptEncrypt(cc_trackdata_hex_example, {
            inputEncoding: 'hex'
        });

        encrypted.should.equal(cc_trackdata_encrypted_sample);
        done();
    });
});
//# sourceMappingURL=dukpt.lib.test.js.map