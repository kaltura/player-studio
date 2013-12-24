'use strict';

/* jasmine specs for controllers go here */

describe('ModalInstanceCtrl', function() {
    var $scope, settings, $modalInstance, mi, testVal;
    beforeEach(module('KMC.controllers'));
    beforeEach(inject(function(_$rootScope_, $controller) {
        $scope = _$rootScope_;
        settings = {};
        $modalInstance = {
            close: function(value) {
                testVal = value;
            }};
        mi = $controller('ModalInstanceCtrl', { $scope: $scope, $modalInstance: $modalInstance, settings: settings});
    }));
    it('should have a ModalInstanceCtrl controller', function() {
        expect('ModalInstanceCtrl').toBeDefined();
    });
    it('should test modalInstance controller has close function', function() {
        expect(typeof $scope.close).toBe("function");
    });
    it('should test modalInstance controller close function calls the close of the modalInstance with the same value', function() {
        $scope.close('value');
        expect(testVal).toBe('value');
    });

});

