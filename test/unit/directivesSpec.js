'use strict';

/* jasmine specs for directives go here */

describe('directives', function () {
    var $scope;
    beforeEach(module('KMC.directives'));
    beforeEach(inject(
        function ($rootScope, $compile) {
            $scope = $rootScope;
        }));
    var directives2Test = [
        '<div model-edit/>'
        , '<div model-tags/>'
        //, '<div select2-data/>'
        , '<div model-select/>'
        , '<div model-checkbox/>'
        , '<div model-color/>'
        , '<div model-text/>'
        , '<div model-number/>'
        , '<div read-only/>'
        // , '<div feature-menu/>'
        , '<div model-radio/>'
        , '<div model-button/>'
        // , '<div info-action/>'
        //, '<div sort-order/>'
    ];


    describe('testModelConnection', function () {
        var directive;
        inject(function ($compile, $scope) {
            angular.forEach(directives2Test, function (directive) {
                console.log('testing + directive');
                var html = angular.element(directive);
                html.attr('model', 'tet');
                var element = $compile(html)($scope);
                console.log('testing + directive');
                $scope.test = 'data';

                it('should have the data provided int the model', function () {
                    expect(element.text()).toEqual('data');
                });
                it('should change the data provided int the model', function () {
                    input('test', 'otherData');
                    expect($scope.test).toEqual('otherData');
                })
            });
        });
    });


})
;
