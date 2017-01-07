'use strict';

describe('main module test suite', function () {
    it('should not throw any error when the module is loaded', function (done) {
        require('../index');
        done();
    });

    it('should have all the methods of the module when instantiated', function (done) {
        var Dukpt = require('../index');

        var dukpt = new Dukpt('0123456789ABCDEFFEDCBA9876543210', 'FFFFFFFFFFFFFFFFFFFF');

        dukpt.should.have.property('dukptDecrypt');
        dukpt.should.have.property('dukptEncrypt');
        done();
    });
});
//# sourceMappingURL=index.test.js.map