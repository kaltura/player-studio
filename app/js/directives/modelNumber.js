'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('modelNumber', [ function() {
        return {
            templateUrl: 'template/formcontrols/modelNumber.html',
            replace: true,
            restrict: 'EA',
            scope: {
                model: '=',
                helpnote: '@',
                label: '@',
                'require': '@',
                'kdpattr': '@'
            },
            controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                $scope.defaults = {
                    initvalue: $attrs['initvalue'] || 0,
                    from: $attrs['from'] || 0,
                    to: $attrs['to'] || 100,
                    stepSize: $attrs['stepsize'] || 1
                };
            }]
        };
    }]).directive('numberInput', ['PlayerService', function(PlayerService) {
        return {
            require: 'ngModel',
            restrict: 'A',
            scope: true,
            templateUrl: 'template/formcontrols/numberInput.html',
            link: function($scope, $element, $attrs, ngModelCtrl) {
                if (typeof $scope.model != 'number' || !(typeof $scope.model == 'string' && parseInt($scope.model))) {
                    ngModelCtrl.$viewValue = $scope.defaults['initvalue'] || 0;
                }
                var change = function(value) {
                    ngModelCtrl.$setViewValue(value);
                };
                if ($scope.kdpattr) {
                    ngModelCtrl.$viewChangeListeners.push(function(value) {
                        PlayerService.setKDPAttribute($scope.kdpattr, value);
                    });
                }
                $scope.increment = function() {
                    change(ngModelCtrl.$viewValue + $scope.defaults.stepSize);
                }
                $scope.decrement = function() {
                    change(ngModelCtrl.$viewValue - $scope.defaults.stepSize);
                }
            }
        }
    }]);