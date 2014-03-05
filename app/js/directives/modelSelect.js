'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('modelSelect', ['menuSvc', function (menuSvc) {
    return {
        replace: true,
        restrict: 'EA',
        priority: 1,
        scope: {
            label: '@',
            model: '=',
            initvalue: '@',
            helpnote: '@',
            selectOpts: '@',
            'strModel': '@model',
            'require': '@'
        },
        compile: function (tElement, tAttr) {
            if (tAttr['endline'] == 'true') {
                tElement.append('<hr/>');
            }
            return function ($scope, $element, $attrs) {
                var menuData = menuSvc.getControlData($attrs.model);
                if (menuData) {
                    $scope.options = menuData.options;
                }
            };
        },
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            if (!$scope.selectOpts) {
                $scope.selectOpts = {};
            }
            if ($attrs.placehold) {
                $scope.selectOpts['placeholder'] = $attrs.placehold;
            }
            if (!$attrs.showSearch) {
                $scope.selectOpts.minimumResultsForSearch = -1;
            }
            $scope.options = [];
            $scope.checkSelection = function (value) {
                if (value == $scope.model)
                    return true;
                else if (typeof value == 'number' && parseFloat($scope.model) == value) {
                    return true;
                }
                return false;
            };
            $scope.initSelection = function () {
                if ($scope.model === '' || typeof $scope.model == 'undefined') {
                    $scope.model = $attrs.initvalue;
                }
                return $scope.model;
            };
            $scope.selectOpts.initSelection = $scope.initSelection();
            $scope.uiselectOpts = angular.toJson($scope.selectOpts);
            $scope.setOptions = function (optsArr) {
                $scope.options = optsArr;
            };
        }],
        templateUrl: 'template/formcontrols/modelSelect.html'
    };
}]);