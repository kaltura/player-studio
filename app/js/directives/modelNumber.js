'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('modelNumber', [ 'menuSvc', function(menuSvc) {
        return {
            templateUrl: 'template/formcontrols/modelNumber.html',
            replace: true,
            restrict: 'EA',
            scope: {
                model: '=',
                helpnote: '@',
                label: '@',
                'require': '@',
                'kdpattr': '@',
                'strModel': '@model'
            },
            controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                $scope.defaults = {
                    initvalue: parseInt($attrs['initvalue']) || 0,
                    from: parseInt($attrs['from']) || 0,
                    to: parseInt($attrs['to']) || 100,
                    stepSize: parseInt($attrs['stepsize']) || 1,
                    readonly: false  /// note that a input can be made readonly
                };
                return $scope;
            }]
        };
    }
    ]).directive('numberInput', ['PlayerService', function(PlayerService) {
        return {
            require: ['^modelNumber', 'ngModel'],
            restrict: 'A',
            scope: true,
            templateUrl: 'template/formcontrols/numberInput.html',
            link: function($scope, $element, $attrs, controllers) {
                var modelScope = controllers[0];
                var ngModelCtrl = controllers[1];
                modelScope.modelCntrl = ngModelCtrl;
                if (typeof $scope.model != 'number' && !(typeof $scope.model == 'string' && parseInt($scope.model))) {
                    ngModelCtrl.$setViewValue($scope.defaults['initvalue'] || 0);
                }
                if ($scope.kdpattr) {
                    ngModelCtrl.$viewChangeListeners.push(function(value) {
                        PlayerService.setKDPAttribute($scope.kdpattr, value);
                    });
                }
                var change = function(value) {
                    ngModelCtrl.$setViewValue(value);
                };
                $scope.increment = function() {
                    var resultVal = ngModelCtrl.$viewValue + $scope.defaults.stepSize;
                    if (resultVal < $scope.defaults.to)
                        change(resultVal);
                    else change($scope.defaults.to)
                }
                $scope.decrement = function() {
                    var resultVal = ngModelCtrl.$viewValue - $scope.defaults.stepSize;
                    if (resultVal > $scope.defaults.from)
                        change(resultVal);
                    else change($scope.defaults.from)
                }
            }
        }
    }
    ]);