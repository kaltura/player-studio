'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('modelNumber', ['PlayerService', '$timeout', function(PlayerService, $timeout) {
    return {
        templateUrl: 'template/formcontrols/spinEdit.html',
        replace: true,
        restrict: 'EA',
        scope: {
            model: '=',
            helpnote: '@',
            label: '@',
            'strModel': '@model',
            'require': '@',
            'kdpattr': '@'
        },
        link: function($scope, $element, $attrs) {
            var $spinner = $element.find('input');
            $timeout(function() {
                $spinner.spinedit({
                    minimum: parseFloat($attrs.from) || 0,
                    maximum: parseFloat($attrs.to) || 100,
                    step: parseFloat($attrs.stepsize) || 1,
                    value: parseFloat($attrs.initvalue) || 0,
                    numberOfDecimals: parseFloat($attrs.numberofdecimals) || 0
                });
            });
            $spinner.on('valueChanged', function(e) {
                if (typeof e.value == 'number') {
                    $scope.model = e.value;
                    if ($scope.kdpattr) {
                        PlayerService.setKDPAttribute($scope.kdpattr, e.value);
                    }
                }
            });
        },
        controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
            var def = {
                from: 5,
                to: 10,
                stepsize: 1,
                numberOfDecimals: 0
            };
            var keys = [
                'from',
                'to',
                'stepsize',
                'numberofdecimals'
            ];
            angular.forEach(keys, function(keyName) {
                if (!$attrs[keyName])
                    $scope[keyName] = def[keyName];
                else
                    $scope[keyName] = $attrs[keyName];
            });
            if (typeof $scope.model != 'undefined') {
                $scope.initvalue = $scope.model;
                var $spinner = $element.find('input');
                $spinner.spinedit({value: parseFloat($scope.initvalue)});
            } else {
                if (!$attrs['initvalue'])
                    $scope.initvalue = 1;
                else
                    $scope.initvalue = $attrs['initvalue'];
            }
        }]
    };
}]);