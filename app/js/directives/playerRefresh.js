'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.service('prSvc', [function() {
    return {
        currentRefreshes: {}
    };
}]);
DirectivesModule.directive('playerRefresh', ['PlayerService', 'menuSvc', '$timeout', '$interval', 'prSvc', function(PlayerService, menuSvc, $timeout, $interval, prSvc) {
    return {
        restrict: 'A',
        priority: 100,
        scope: true,
        require: ['?ngModel'],
        controllerAs: 'prController',
        controller: function($scope, $element, $attrs) {
            $scope.options = {
                valueBased: false
            };
            $scope.prModel = {
                key: '',
                value: null,
                valueChanged: false,
                oldValue: null // used only when not using $watch (ngController);
            };
            // used to track the input control, for example it changes to true only if text field has had a blur event
            $scope.updateFunction = function(prScope, elem) { // the function used to set controlUpdateAllowed - works for text inputs etc.
                // a custom function can be set with setUpdateFunction
                var triggerElm;
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
                    prScope.$emit('controlUpdateAllowed', prScope.prModel.key);
                });
            };
            var timeOutRun = null;
            $scope.$on('$destroy', function() {
                if (timeOutRun) {
                    $interval.cancel(timeOutRun);
                }
            });
            var ctrObj = {
                makeRefresh: function() { // once set to action it will refresh!
                    if (!prSvc.currentRefreshes[$scope.prModel.key]) {
                        // get the promise into the hash table
                        prSvc.currentRefreshes[$scope.prModel.key] = PlayerService.playerRefresh($attrs['playerRefresh']).then(function() {
                            //reset all params;
                            $scope.prModel.valueChanged = false;
                            //delete the currentRefresh
                            delete prSvc.currentRefreshes[$scope.prModel.key];
                        }, function() {
                            var time = ($scope.prModel.key.indexOf('_featureEnabled') > 0) ? 3000 : 500;
                            if (timeOutRun) {
                                $timeout.cancel(timeOutRun);
                            }
                            timeOutRun = $timeout(function() {
                                delete prSvc.currentRefreshes[$scope.prModel.key];
                                ctrObj.makeRefresh();
                            }, time);
                        });
                    }
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
                    scope.prModel.key = iAttrs['model'];
                }
                else {
                    scope.prModel.key = iAttrs['ngModel'];
                }
            }
            $timeout(function() {
                if (!scope.options.valueBased) {
                    scope.updateFunction(scope, iElement);//optional  parameters -expected to trigger controlUpdateAllowed event with modelKey as event.data
                    scope.$parent.$parent.$on('controlUpdateAllowed', function(e, modelKey) {
                        if (modelKey == scope.prModel.key && scope.prModel.valueChanged === true) {
                            e.stopPropagation();

                           scope.prController.makeRefresh();
                        }
                    });
                }
                var actOnModelChange = function() {
                    if (iAttrs['playerRefresh'] == 'true') {
                        if (scope.prModel.key =='featureModelCon._featureEnabled'){
                            scope.prController.makeRefresh();
                        }
                        else{
//                        if (!scope.options.valueBased) {
//                            scope.prModel.valueChanged = true;
//                            PlayerService.refreshNeeded = true;
//                        }
//                        else {
//                            scope.prController.makeRefresh();
//                        }
                        PlayerService.refreshNeeded = true;}

                    }
                    else {
                        if (iAttrs['playerRefresh'] == 'aspectToggle'){
                            $('#spacer').toggleClass('narrow');
                        }else {
                        PlayerService.setKDPAttribute(iAttrs['playerRefresh'], scope.prModel.value);}
                    }
                };
                if (!ngController) {
                    scope.$watch(function() {
                            return  scope.prModel.value = menuScope.$eval(iAttrs['model']);
                        },
                        function(newVal, oldVal) {
                            if (newVal != oldVal) {
                                actOnModelChange();
                            }
                        });
                }
                else { // ngmodel based
                    ngController.$viewChangeListeners.push(function() {
                        scope.prModel.oldValue = scope.prModel.value;
                        scope.prModel.value = ngController.$viewValue;
                        if (scope.prModel.oldValue != ngController.$viewValue) {
                            actOnModelChange();
                        }
                    });
                }
            }, 100);
        }
    };
}]);
