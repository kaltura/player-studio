'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('playerRefresh', ['PlayerService', 'menuSvc', '$timeout', '$interval', '$q', function (PlayerService, menuSvc, $timeout, $interval, $q) {
    return {
        restrict: 'A',
        priority: 1000,
        scope:true,
        require: ['playerRefresh', '?ngModel'],
        controller: function ($scope, $element, $attrs) {
            $scope.options = {
                valueBased: false
            };
            $scope.prModel = {value: null};
            // used to track the input control, for example it changes to true only if text field has had a blur event
            $scope.updateFunction = function (prScope, elem) { // the function used to set controlUpdateAllowed - works for text inputs etc.
                // a custom function can be set with setUpdateFunction
                var triggerElm;
                var defer = $q.defer();
                if (elem.is('input') || elem.is('select')) {
                    triggerElm = elem;
                }
                else {
                    triggerElm = $(elem).find('input[ng-model], select[ng-model]');
                }
                var event = 'change';
                if (triggerElm.is('input')) {
                    event = 'blur';
                }
                triggerElm.on(event, function () {
                    defer.resolve(true);
                });
                return defer.promise;
            };
            var timeOutRun = null;
            $scope.makeRefresh = function () { // once set to action it will refresh! tries 10 times at 500ms intervals
                if (timeOutRun) {
                    $interval.cancel(timeOutRun);
                }
                if (PlayerService.playerRefresh($attrs['playerRefresh'])) {
                    //reset all params;
                    ctrObj.stopTrigger = false;
                }
                else {
                    timeOutRun = $interval(function () {
                        $scope.makeRefresh();
                    }, 500, 10);
                }
            };
            $scope.$on('$destroy', function () {
                if (timeOutRun) {
                    $interval.cancel(timeOutRun);
                }
            });
            var stopTimeVar = null;
            var ctrObj = {
                stopTrigger: false,
                setStopTrigger: function () {
                    ctrObj.stopTrigger = true;
                    if (stopTimeVar) {
                        $timeout.cancel(stopTimeVar);
                    }
                    stopTimeVar = $timeout(function () {
                        ctrObj.stopTrigger = false;
                    }, 1000);// necessary because sometime one change inflicts a dozen or more changes in the model .e.g feature enable

                },
                setValueBased: function () {
                    $scope.options.valueBased = true;
                },
                setUpdateFunction: function (func) {
                    $scope.updateFunction = func;
                }
            };
            return ctrObj;
        },
        link: function (scope, iElement, iAttrs, controllers) {
            // if set only model changes are used without update function/ modelCheckbox does this automatically via setValueBased controller function
            if (iAttrs['playerRefresh'] == 'boolean') {
                scope.options.valueBased = true;
            }
            var menuScope = menuSvc.menuScope;
            var playerRefresh = controllers[0];
            var ngController = null;
            if (iAttrs['playerRefresh'] != 'false') {
                if (controllers[1]) {
                    ngController = controllers[1];
                }
                if (!ngController) {
                    var model = iAttrs['model'];
                    menuScope.$watch(function (menuScope) {
                        return menuScope.$eval(model);
                    }, function (newVal, oldVal) {
                        if (newVal != oldVal) {
                            scope.prModel.value = newVal;
                        }
                    });
                }
                else {
                    ngController.$parsers.push(function (value) {
                        return  scope.prModel.value = value;
                    });
                }
            }
            $timeout(function () { // set the timeout to call the updateFunction watch
                    if (!scope.options.valueBased) {
                        var promise = scope.updateFunction(scope, iElement);//optional  parameters
                    }
                    scope.$watch('prModel.value',
                        function (newVal, oldVal) {
                            if (newVal != oldVal) {
                                if (iAttrs['playerRefresh'] == 'true' || iAttrs['playerRefresh'] == 'aspectToggle') {
                                    if (!playerRefresh.stopTrigger) {
                                        playerRefresh.setStopTrigger();
                                        if (promise && typeof promise.then == "function") {// verify we got a promise to work with (ducktyping..)}
                                            promise.then(function () {
                                                scope.makeRefresh();
                                                //re-set the promise
                                                promise = scope.updateFunction(scope, iElement);//optional  parameters
                                            });
                                        }
                                        else {
                                            scope.makeRefresh();
                                        }
                                    }
                                }
                                else {
                                    PlayerService.setKDPAttribute(iAttrs['playerRefresh'], scope.prModel.value);
                                }
                            }
                        });

                }, 200
            );
        }};
}]);