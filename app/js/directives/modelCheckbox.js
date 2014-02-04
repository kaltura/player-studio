'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('modelCheckbox',function() {
    return {
        restrict: 'EA',
        templateUrl: 'template/formcontrols/modelCheckbox.html',
        require: '?playerRefresh',
        replace: true,
        compile: function(tElement, tAttr) {
            if (tAttr['endline'] == 'true') {
                tElement.append('<hr/>');
            }
            return function($scope, $element, $attrs, playerRefreshCnt) {
                if (playerRefreshCnt) {
                    playerRefreshCnt.setBoolean(); // by such disable use of control function
                }
            };
        },
        controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
            if ($scope.model === '' || typeof $scope.model == 'undefined') {
                if ($attrs.initvalue === 'true')
                    $scope.model = true;
            }
        }],
        scope: {
            label: '@',
            helpnote: '@',
            model: '=',
            'require': '@'
        }
    };
}).directive('prettycheckbox', function() {
    return {
        restrict: 'AC',
        require: 'ngModel',
        template: '<a data-ng-click="check()"></a>',
        link: function(scope, $element, iAttr, ngController) {
            var clickHandler = $($element).find('a');
            ngController.$render = function() {
                if (ngController.$viewValue) {
                    clickHandler.addClass('checked');
                }
                else
                    ngController.$viewValue = false;
            };
            scope.check = function() {
                ngController.$setViewValue(!ngController.$viewValue);
            };

            var formatter = function() {
                if (ngController.$viewValue) {
                    clickHandler.addClass('checked');
                }
                else {
                    clickHandler.removeClass('checked');
                }
            };
            ngController.$viewChangeListeners.push(formatter);
            if (scope['require']) {
                ngController.$setValidity('required', true);
            }
        }
    };
});