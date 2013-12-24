'use strict';

/* jasmine specs for directives go here */

describe('test directives:', function () {
    var scope, compile , element, $timeout;
    beforeEach(function () {
            module('KMC.directives');
            module('ui.bootstrap');
            module('templates');
            module(function ($provide) {
                $provide.provider('menuSvc', function () {
                    this.$get = function () {
                        return {
                            data: {}
                        };
                    }
                });
                $provide.provider('sortSvc', function () {
                    this.$get = function () {
                        return {
                            data: {}
                        };
                    }

                });
            })
            inject(function ($rootScope, _$compile_, _$timeout_) {
                scope = $rootScope.$new();
                compile = _$compile_;
                $timeout = _$timeout_;
            });
        }
    );
    var directives2Test = [ // thought they could all be checked together.. hehe only 3 work without speciall attention (services etc)

        '<div model-edit/>'
//        , '<div model-tags/>'
//        , '<div select2-data/>'
//        , '<div model-select/>'
//        , '<div model-checkbox/>'
        , '<div model-color/>'
        , '<div model-text/>'
        // , '<div model-number/>'
        //  , '<div read-only/>'
        // , '<div feature-menu/>'
        //  , '<div model-radio/>'
        //   , '<div model-button/>'
        // , '<div info-action/>'
        //, '<div sort-order/>'
    ];
    angular.forEach(directives2Test, function (directive) {
        // var directive = '<div model-text/>';
        describe('testModelConnection', function () {
            beforeEach(function () {
                scope.test = {'data': 'data'};
                console.log('testing ' + directive);
                var html = angular.element(directive);
                html.attr('helpnote', 'toolti');
                html.attr('model', 'test.data');
                element = compile(html[0])(scope);
                scope = element.scope();
                scope.$digest();
            });

            it('should have the data provided int the model', inject(function () {
                expect(element.find('input').val()).toEqual('data');
            }));
            describe('should bind the data provided in the model to the input', function () {
                beforeEach(function () {
                    scope.test.data = 'otherData'
                    scope.$apply();
                })
                it('follow changed input', function () {
                    expect(element.find('input').val()).toEqual('otherData');
                })
            });
            describe('should bind the data provided in the input to the model', function () {
                beforeEach(function () {
                    element.find('input').val('otherData');

                    scope.$apply();
                })
                it('follow changed input', function () {
                    $timeout(function () {
                        expect(scope.test.data).toEqual('otherData');
                    })
                });

            })

        });
    });
})

;
