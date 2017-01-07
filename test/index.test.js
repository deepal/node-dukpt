describe('main module test suite', () => {
    it('should not throw any error when the module is loaded', (done) => {
        require('../index');
        done();
    });

    it('should have all the methods of the module when instantiated', (done) => {
        const Dukpt = require('../index');

        const dukpt = new Dukpt('0123456789ABCDEFFEDCBA9876543210', 'FFFFFFFFFFFFFFFFFFFF');

        dukpt.should.have.property('dukptDecrypt');
        dukpt.should.have.property('dukptEncrypt');
        done();
    });
});