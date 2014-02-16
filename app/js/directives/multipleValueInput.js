'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('multipleValueInput', function() {
    return {
        templateUrl: 'template/formcontrols/multipleValueInput.html',
        replace: true,
        scope: {
            model: '=',
            label: '@',
            icon: '@'
        }, controller: function($scope, $element, $attrs) {
            $scope.splitModel = [];
            if ($attrs['initvalue'] && !$scope.model) {
                $scope.model = $attrs['initvalue'];
            }
            $scope.remove = function(index) {
                $scope.splitModel.splice(index, 1);
            };
            $scope.splitChar = $attrs['splitChar'] || ';';
            if ($scope.model) {
                $scope.splitModel = $scope.model.split($scope.splitChar);
                if ($scope.splitModel[$scope.splitModel.length-1] == '') {
                    $scope.splitModel.splice($scope.splitModel.length-1, 1);
                }
            }

            $scope.add = function() {
                $scope.splitModel.push('');
            };
        }, compile: function(tElem, tAttrs) {
            if (tAttrs['endline']) {
                tElem.append('<hr/>');
            }
            return function($scope, $element, $attrs) {
                $scope.$watchCollection('splitModel', function(newVal, oldVal) {
                    if (newVal === oldVal) return;
                    var str = '';
                    angular.forEach(newVal, function(value) {
                        if ($.trim(value).length) {
                            str += value + $scope.splitChar;
                        }
                    });
                    if (str !== $scope.model) { // to prevent unneeded digests
                        $scope.model = str;
                    }
                });
            }
        }
    }
});
