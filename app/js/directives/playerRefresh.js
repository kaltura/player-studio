'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('playerRefresh', ['PlayerService', 'menuSvc', '$timeout', function (PlayerService, menuSvc, $timeout) {
    return {
        restrict: 'A',
        priority: 1000,
        require: ['playerRefresh', '?ngModel'],
        controller: function ($scope, $element, $attrs) {
            $scope.customRefresh = false;
            // if set only model changes are used without update function/ modelCheckbox does this automatically via setBoolean controller function
            if ($attrs['playerRefresh'] == 'boolean') {
                $scope.boolean = true;
            }
            $scope.modelChanged = false; // used to track the model
            $scope.controlUpdateAllowed = false; // used to track the input control, for example it changes to true only if text field has had a blur event
            $scope.controlFunction = function () {
                if ($scope.boolean) { // boolean controls don't need the extra watch so with that flag we just watch the model
                    return $scope.modelChanged;
                } else
                    return  ($scope.modelChanged && $scope.controlUpdateAllowed);
            };
            $scope.updateFunction = function (prScope, elem) { // the function used to set controlUpdateAllowed - works for text inputs etc.
                // a custom function can be set with setUpdateFunction
                var triggerElm;
                if (elem.is('input') || elem.is('select')) {
                    triggerElm = elem;
                }
                else {
                    triggerElm = $(elem).find('input[ng-model], select[ng-model]');
                }
                triggerElm.on('change', function (e) {
                    prScope.$apply(function () {
                        prScope.controlUpdateAllowed = true;
                    });
                });
            };
            var i = 0;
            var timeOutRun = null;
            $scope.makeRefresh = function () { // once set to action it will refresh!
                if (PlayerService.playerRefresh($attrs['playerRefresh'])) {
                    if (timeOutRun) {
                        $timeout.cancel(timeOutRun);
                    }
                    //reset all params;
                    i = 0;
                    $scope.modelChanged = false;
                    $scope.controlUpdateAllowed = false;
                } else { // we  initiated a call but the player is still not finished rendering, we will try 10 time;
                    if (i < 10) {
                        i++;
                        timeOutRun = $timeout(function () {
                            if (timeOutRun) {
                                $timeout.cancel(timeOutRun);
                                timeOutRun = null;
                            }
                            $scope.makeRefresh();
                        }, 500);
                    }
                }
            };
            var ctrObj = {
                setBoolean: function () {
                    $scope.boolean = true;
                },
                setUpdateFunction: function (func) {
                    $scope.customRefresh = true;
                    $scope.updateFunction = func;
                },
                setControlFunction: function (func) {
                    $scope.customRefresh = true;
                    $scope.controlFunction = func;
                },
                getPrScope: function () {
                    return $scope;
                }
            };
            return ctrObj;
        },
        link: function (scope, iElement, iAttrs, controllers) {
            var menuScope = menuSvc.menuScope;
            var playerRefresh = controllers[0];
            var ngController = null;
            if (iAttrs['playerRefresh'] != 'false' && !iAttrs['kdpattr']) {
                var model = iAttrs['model'];
                if (controllers[1]) {
                    ngController = controllers[1];
                    model = ngController.$modelValue;
                }
                if (!ngController) {
                    menuScope.$watch(function (menuScope) {
                        return menuScope.$eval(model);
                    }, function (newVal, oldVal) {
                        if (newVal != oldVal) {
                            scope.modelChanged = true;
                        } else {
                            scope.modelChanged = false;
                        }

                    });
                }
                else {
                    ngController.$viewChangeListeners.push(function () {
                        scope.modelChanged = true;
                    });
                }
                $timeout(function () { // set the timeout to call the updateFunction watch
                    scope.updateFunction(scope, iElement);//optional  parameters
                    scope.$watch(function () {
                        return scope.controlFunction(scope);//optional scope parameter
                    }, function (newVal, oldVal) {
                        if (newVal != oldVal && newVal) {
                            scope.makeRefresh();
                        }
                    });
                }, 200);
            }
        }
    };
}]);