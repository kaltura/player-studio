'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('modelColor', [function () {
    return {
        restrict: 'EA',
        require: '?playerRefresh',
        replace: true,
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            if (typeof $scope.model == 'undefined') {
                if ($attrs.initvalue)
                    $scope.model = $attrs.initvalue;
                else
                    $scope.model = '#ffffff';
            }
        }],
        link: function ($scope, $elemennt, $attrs, prController) {
            if (prController) {
                prController.setValueBased();
            }
        },
        scope: {
            'class': '@',
            'label': '@',
            'kdpattr': '@',
            'strModel': '@model',
            'helpnote': '@',
            'model': '=',
            require: '@'
        },
        templateUrl: 'template/formcontrols/modelColor.html'
    };
}]);