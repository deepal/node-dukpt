const should = require('should');
const Dukpt = require('../../index');
const RandExp = require('randexp');

let dukpt = null;
let bdk = '0123456789ABCDEFFEDCBA9876543210';
let ksn = 'FFFFFFFFFFFFFFFFFFFF';
let cc_trackdata_example = '%B4815881002861896^YATES/EUGENE JOHN              ^37829821000123456789?'; // taken from wikipedia. not an actual card
let cc_trackdata_hex_example = '2542343831353838313030323836313839365e59415445532f455547454e45204a4f484e20202020202020202020202020205e33373832393832313030303132333435363738393f';
let cc_trackdata_encrypted_sample = '88B0208C24474EB41EE216D3BD0D226777FBBE15CEB7A2F840F16588FA583100848D334DD1B33CCD03728AD03E65993BB82F969EC4C5A68A83B8C5D80CC899D0E5C184D5BA48E7FF';

function getRandomText() {
    return new RandExp(/[A-Z0-9]{50}/);
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
});
