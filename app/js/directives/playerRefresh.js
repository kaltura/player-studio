'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.service('prSvc', [function() {
    return {
        stopTrigger: false,
        currentRefreshes: []
    };
}]);
DirectivesModule.directive('playerRefresh', ['PlayerService', 'menuSvc', '$timeout', '$interval', 'prSvc', '$q', function(PlayerService, menuSvc, $timeout, $interval, prSvc, $q) {
    return {
        restrict: 'A',
        priority: 10,
        scope: true,
        require: ['?ngModel'],
        controllerAs: 'prController',
        controller: function($scope, $element, $attrs) {
            $scope.options = {
                valueBased: false
            };
            $scope.prModel = {
                key: '',
                value: null
            };
            // used to track the input control, for example it changes to true only if text field has had a blur event
            $scope.updateFunction = function(prScope, elem) { // the function used to set controlUpdateAllowed - works for text inputs etc.
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
                triggerElm.on(event, function() {
                    defer.resolve(prScope.prModel.value);
                });
                return defer.promise;
            };
            var timeOutRun = null;
            $scope.$on('$destroy', function() {
                if (timeOutRun) {
                    $interval.cancel(timeOutRun);
                }
            });
            var stopTimeVar = null;
            var ctrObj = {
                makeRefresh: function() { // once set to action it will refresh! tries 10 times at 500ms intervals
                    if (timeOutRun) {
                        $interval.cancel(timeOutRun);
                    }
                    if (PlayerService.playerRefresh($attrs['playerRefresh'])) {
                        //reset all params;
                        prSvc.stopTrigger = false;
                        //delete the currentRefresh
                        prSvc.currentRefreshes.splice($scope.prModel.key, 1);
                    }
                    else {
                        timeOutRun = $interval(function() {
                            ctrObj.makeRefresh();
                        }, 500, 10);
                    }
                },
                checkSetStopTrigger: function(modelKey) {
                    if (prSvc.currentRefreshes.indexOf(modelKey) === -1) {
                        prSvc.currentRefreshes.push(modelKey);
                        var time = ($scope.prModel.key.indexOf('_featureEnabled') > 0) ? 3000 : 1000;
                        prSvc.stopTrigger = true;
                        if (stopTimeVar) {
                            $timeout.cancel(stopTimeVar);
                        }
                        stopTimeVar = $timeout(function() {
                            prSvc.stopTrigger = false;
                            stopTimeVar = null;
                        }, time);// necessary because sometime one change inflicts a dozen or more changes in the model .e.g feature enable
                        return true;
                    } else
                        return false;
                },
                setValueBased: function() {
                    $scope.options.valueBased = true;
                },
                setUpdateFunction: function(func) {
                    $scope.updateFunction = func;
                }
            };
            return ctrObj;
        },
        link: function(scope, iElement, iAttrs, controllers) {
            // if set only model changes are used without update function/ modelCheckbox does this automatically via setValueBased controller function
            if (iAttrs['playerRefresh'] == 'boolean') {
                scope.options.valueBased = true;
            }
            var menuScope = menuSvc.menuScope;
            var ngController = (controllers[0]) ? controllers[0] : null;
            if (iAttrs['playerRefresh'] != 'false') {
                if (!ngController) {
                    var model = iAttrs['model'];
                    scope.prModel.key = model;
                    menuScope.$watch(function(menuScope) {
                        return menuScope.$eval(model);
                    }, function(newVal, oldVal) {
                        if (newVal != oldVal) {
                            scope.prModel.value = newVal;
                        }
                    });
                }
                else {
                    scope.prModel.key = iAttrs['ngModel'];
                    ngController.$parsers.push(function(value) {
                        return  scope.prModel.value = value;
                    });
                }
            }
            $timeout(function() { // set the timeout to call the updateFunction watch
                    var promise = null;
                    if (!scope.options.valueBased) {
                        promise = scope.updateFunction(scope, iElement);//optional  parameters
                    }
                    scope.$watch('prModel.value',
                        function(newVal, oldVal) {
                            if (newVal !== oldVal) {
                                if (iAttrs['playerRefresh'] == 'true' || iAttrs['playerRefresh'] == 'aspectToggle') {
                                    if (scope.prController.checkSetStopTrigger(scope.prModel.key)) {
                                        if (promise && typeof promise.then == "function") {// verify we got a promise to work with (ducktyping..)}
                                            promise.then(function() {
                                                scope.prController.makeRefresh();
                                                //re-set the promise
                                                promise = scope.updateFunction(scope, iElement);//optional  parameters
                                            }, function() {
                                                cl('here')
                                            }, function() {
                                                cl('here2')
                                            });
                                        }
                                        else {
                                            scope.prController.makeRefresh();
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