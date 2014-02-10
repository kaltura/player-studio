'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('modelCheckbox',function () {
    return {
        restrict: 'EA',
        templateUrl: 'template/formcontrols/modelCheckbox.html',
        require: '?playerRefresh',
        replace: true,
        compile: function (tElement, tAttr) {
            if (tAttr['endline'] == 'true') {
                tElement.append('<hr/>');
            }
            return function ($scope, $element, $attrs, playerRefreshCnt) {
                if (playerRefreshCnt) {
                    playerRefreshCnt.setValueBased(); // by such disable use of control function
                }
            };
        },
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            if ($scope.model === '' || typeof $scope.model == 'undefined') {
                if ($attrs.initvalue === 'true')
                    $scope.model = true;
            }
            $scope.refresh = $attrs.playerRefresh;
            $scope.onClick = function() {
                $scope.$emit('dataChanged',{"refresh":$scope.refresh, "data":$scope.model});
            };
        }],
        scope: {
            label: '@',
            helpnote: '@',
            model: '=',
            'require': '@'
        }
    };
}).directive('prettycheckbox', function () {
        return {
            restrict: 'AC',
            require: ['ngModel','?playerRefresh'],
            template: '<a data-ng-click="check()"></a>',
            link: function (scope, $element, iAttr, controllers) {
                var ngController = controllers[0];
                var prController = controllers[1];
                if (prController){
                    prController.setValueBased();
                }
                var clickHandler = $($element).find('a');
                scope.check = function () {
                    ngController.$setViewValue(!ngController.$viewValue);
                };
                var formatter = function (value) {
                    var innerVal = (typeof value != "undefined") ?  value : ngController.$modelValue;
                    if (innerVal) {
                        clickHandler.addClass('checked');
                    }
                    else {
                        clickHandler.removeClass('checked');
                    }
                    return innerVal;
                };
                //todo: we need to make sure the acutal featureChecbox will still be enabled...
//                scope.$on('disableControls', function () {
//                    clickHandler.addClass('disabled');
//                });
//                scope.$on('enableControls', function () {
//                    clickHandler.removeClass('disabled');
//                });
                ngController.$render = formatter;
                ngController.$parsers.push(formatter);
                if (scope['require']) {
                    ngController.$setValidity('required', true);
                }
            }
        };
    });