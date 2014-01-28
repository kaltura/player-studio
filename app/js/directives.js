'use strict';
var DirectivesModule = angular.module('KMC.directives', [
    'colorpicker.module',
    'ui.bootstrap',
    'ui.select2',
    'ui.sortable'
]);
DirectivesModule.directive('mcustomScrollbar', [
    '$timeout',
    function($timeout) {
        return {
            priority: 0,
            restrict: 'AC',
            link: function(scope, element, attr) {
                var options = scope.$eval(attr['mcustomScrollbar']);
                var timeVar = null;
                scope.$on('layoutChange', function() {
                    if (scope.scroller)
                        timeVar = $timeout(function() {
                            if (timeVar) {
                                $timeout.cancel(timeVar);
                            }
                            scope.scroller.mCustomScrollbar('update');
                        }, 500);
                });
                var opts = {
                    horizontalScroll: false,
                    mouseWheel: true,
                    autoHideScrollbar: true,
                    contentTouchScroll: true,
                    theme: 'dark',
                    advanced: {
                        autoScrollOnFocus: false,
                        updateOnBrowserResize: true,
                        updateOnContentResize: false
                    }
                };
                angular.extend(opts, options);
                var afterScroll = $timeout(function() {
                    if (typeof $().mCustomScrollbar == 'function') {
                        scope.scroller = element.mCustomScrollbar(opts);
                    }
                }, 500);
                var checkScroll = function(value) {
                    if (value == 'block') {
                        $('#tableHead').css('padding-right', '18px');
                    }
                    else {
                        $('#tableHead').css('padding-right', '0px');
                    }
                };
                if ($('#tableHead').length) {
                    afterScroll.then(function() {
                        var scrollTools = $(element).find('.mCSB_scrollTools');
                        scope.scrollerCss = scrollTools.css('display');
                        $timeout(function() {
                            checkScroll(scope.scrollerCss);
                        }, 200);
                        scope.$watch(function() {
                            return  scope.scrollerCss = scrollTools.css('display');
                        }, function(value) {
                            checkScroll(value);
                        });
                        var timeVar;
                        $(window).resize(function() { //TODO: wrap in single timeout check
                            timeVar = $timeout(function() {
                                if (timeVar) {
                                    $timeout.cancel(timeVar);
                                }
                                checkScroll(scrollTools.css('display'));
                            }, 200);

                        });
                    });
                }
            }
        };
    }
]);
DirectivesModule.directive('timeago', [function() {
    return {
        scope: { timestamp: '@' },
        restrict: 'CA',
        link: function(scope, iElement, iAttrs) {
            if (typeof $.timeago == 'function')
                scope.$watch('timestamp', function(newVal, oldVal) {
                    if (newVal) {
                        var date = scope.timestamp * 1000;
                        iElement.text($.timeago(date));
                    }
                });
        }
    };
}]);
DirectivesModule.directive('modelRadio', ['menuSvc', function(menuSvc) {
    return {
        restrict: 'EA',
        replace: true,
        require: '?playerRefresh',
        templateUrl: 'template/formcontrols/modelRadio.html',
        scope: {
            'model': '=',
            'label': '@',
            'helpnote': '@',
            'strModel': '@model',
            'require': '@'
        },
        controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
            var menuData = menuSvc.getControlData($attrs.model);
            $scope.options = menuData.options;
            var ngModelCntrl;
            var controls = [];
            return {
                setChoice: function(value) {
                    angular.forEach(controls, function(control) {
                        control.setValue(value);
                    });
                },
                registerControl: function(cntrl) {
                    controls.push(cntrl);
                },
                getValue: function() {
                    return $scope.model;
                },
                regContoller: function(cntrl) {
                    if (!ngModelCntrl)
                        menuSvc.menuScope.playerEdit.$addControl(cntrl);
                    ngModelCntrl = cntrl;
                },
                isRequired: $attrs.require
            };
        }
        ],
        link: function(scope, element, attributes, prController) {
            if (prController) {
                element.attr('player-refresh', 'boolean');
            }
            if (scope.require) {
                scope.$watch('model', function(newval) { //TODO: change to ngmodel + $setValidity
                    if (!newval)
                        $(element).find('.form-group').addClass('ng-invalid');
                    else {
                        $(element).find('.form-group').removeClass('ng-invalid');
                    }

                });
            }
        }
    };
}])
;
DirectivesModule.directive('modelColor', function(PlayerService) {
    return {
        restrict: 'EA',
        replace: true,
        require: "playerRefresh",
        controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
            if (typeof $scope.model == 'undefined') {
                if ($attrs.initvalue)
                    $scope.model = $attrs.initvalue;
                else
                    $scope.model = '#ffffff';
            }
            $scope.$watch('model', function(newVal, oldVal) {
                if (newVal != oldVal) {
                    PlayerService.setKDPAttribute($scope.kdpattr, newVal);
                }
            });
        }],
        link: function(scope, element, attrs, prController) {
            /*
             if (prController) {
             scope.prScope = prController.getPrScope();
             prController.setUpdateFunction(function(prScope){
             scope.$on('colorPickerClosed',function(){
             prScope.controlUpdateAllowed = true;
             });
             });
             }*/
        },
        scope: {
            'class': '@',
            'label': '@',
            'kdpattr': '@',
            'helpnote': '@',
            'model': '=',
            'strModel': '@model',
            require: '@'
        },
        templateUrl: 'template/formcontrols/modelColor.html'
    };
});
DirectivesModule.directive('dname', function(menuSvc) { // made to help with validation registers dynamic directives with form controller
    return {
        require: '?ngModel',
        priority: 100,
        compile: function(tElement, tAttrs) {
            return function($scope, $element, $attrs, $ngModelCntrl) {
                if ($ngModelCntrl) {
                    var dname = $scope.$eval($attrs['dname']);
                    $element.attr('name', dname);
                    $ngModelCntrl.$name = dname;
                    menuSvc.menuScope.playerEdit.$addControl($ngModelCntrl);
                }
            };
        }
    };
});
DirectivesModule.directive('ngPlaceholder', function($timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attr, ctrl) {
            if (attr['ngPlaceholder']) {
                var value;
                var placehold = function() {
                    element.val(attr['ngPlaceholder']);
                    if (attr['require']) {
                        ctrl.$setValidity('required', false);
                    }
                    element.addClass('placeholder');
                };
                var unplacehold = function() {
                    element.val('');
                    element.removeClass('placeholder');
                };
                scope.$watch(function() {
                    return element.val();
                }, function(val) {
                    value = val || '';
                });
                element.bind('focus', function() {
                    if (value === '' || value == attr['ngPlaceholder']) unplacehold();
                });
                element.bind('blur', function() {
                    if (element.val() === '') placehold();
                });
                ctrl.$formatters.unshift(function(val) {
                    if (!val) {
                        placehold();
                        value = '';
                        return attr['ngPlaceholder'];
                    }
                    return val;
                });
            }
        }
    };
});
DirectivesModule.directive('modelText', function(menuSvc) {
    return {
        replace: true,
        restrict: 'EA',
        controller: function($scope, $element, $attrs) {
            $scope.type = 'text';
            $scope.form = menuSvc.menuScope.playerEdit;
            var makeWatch = function(value, retProp) {
                $scope.$watch(function() {
                        if ($scope.form[$scope['strModel']]) {
                            var inputCntrl = $scope.form[$scope['strModel']];
                            if (typeof inputCntrl.$error[value] != 'undefined');
                            return inputCntrl.$error[value];
                        }
                        return false;
                    },
                    function(newVal) {
                        $scope[retProp] = newVal;
                    }
                );
            };
            if ($scope.require) {
                makeWatch('required', 'reqState');
            }
            if ($attrs['validation'] == 'url' || $attrs['validation'] == 'email') {
                makeWatch($attrs['validation'], 'valState');
                $scope.type = $attrs['validation'];
                if ($attrs['validation'] == 'url') {
                    $scope.placehold = 'http://';
                }
            }
            else if ($attrs['validation']) {
                var pattern = $attrs['validation'];
                var isValid, regex;
                try {
                    regex = new RegExp(pattern, 'i');
                    isValid = true;
                }
                catch (e) {
                    isValid = false;
                }
                if (isValid) {
                    $scope.validation = regex;
                    makeWatch('pattern', 'valState');
                }
            }
            $scope.validation = {
                test: function() { // mock the RegExp object
                    return true;
                }, match: function() { // mock the RegExp object
                    return true;
                }
            };
        },
        scope: {
            'label': '@',
            'strModel': '@model',
            'model': '=',
            'icon': '@',
            'placehold': '@',
            'helpnote': '@',
            'require': '@'
        },
        compile: function(tElement, tAttr) {
            if (tAttr['endline'] == 'true') {
                tElement.append('<hr/>');
            }
        },
        templateUrl: 'template/formcontrols/modelText.html'
    };
});
DirectivesModule.directive('valType', function() {
    return {
        restrict: "A",
        compile: function(tElem, tAttr) {
            if ((tAttr['valType'] == 'url' || tAttr['valType'] == 'email') && $('html').hasClass('IE8') === false) {
                tElem.attr('input', tAttr['valType']);
            }
        }
    };
});
DirectivesModule.directive('select2Data', [
    'menuSvc',
    function(menuSvc) {
        return {
            replace: true,
            restrict: 'EA',
            scope: {
                'label': '@',
                'model': '=',
                'icon': '@',
                'helpnote': '@',
                'initvalue': '@',
                "require": '@',
                'strModel': '@model'
            },
            controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                $scope.selectOpts = {};
                $scope.selectOpts['data'] = menuSvc.doAction($attrs.source);
                if ($attrs.query) {
                    $scope.selectOpts['data'].results = [];
                    $scope.selectOpts['query'] = menuSvc.getAction($attrs.query);
                }
                if ($attrs.placehold) {
                    $scope.selectOpts['placeholder'] = $attrs.placehold;
                }
                $scope.selectOpts['width'] = $attrs.width;
            }],
            templateUrl: 'template/formcontrols/select2Data.html',
            compile: function(tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.append('<hr/>');
                }
                if (tAttr.showEntriesThumbs == 'true') {
                    tElement.find('input').attr('list-entries-thumbs', 'true');
                }
                if (tAttr.placeholder)
                    tElement.find('input').attr('data-placeholder', tAttr.placeholder);
                return function(scope, element) {
                };
            }
        };
    }
]);
DirectivesModule.directive('modelEdit', ['$modal',
    function($modal) {
        var modalEditCntrl = ['$scope' , function($scope) {
            if (typeof $scope.model == 'undefined')
                $scope.model = '';
            $scope.modelValue = $scope.model;
        }];
        return {
            replace: true,
            restrict: 'EA',
            scope: {
                'label': '@',
                'helpnote': '@',
                'model': '=',
                'icon': '@',
                'require': '@',
                'strModel': '@model'
            },
            controller: modalEditCntrl,
            templateUrl: 'template/formcontrols/modelEdit.html',
            compile: function(tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.append('<hr/>');
                }
                return function(scope, element, attrs) {
                    scope.doModal = function() {
                        var modal = $modal.open({
                            templateUrl: 'template/dialog/textarea.html',
                            controller: 'ModalInstanceCtrl',
                            resolve: {
                                settings: function() {
                                    return {
                                        'close': function(result, value) {
                                            scope.model = value;
                                            modal.close(result);
                                        },
                                        'title': attrs.label,
                                        'message': scope.model
                                    };
                                }
                            }
                        });
                    };
                };
            }
        };
    }
]);
DirectivesModule.directive('modelTags', [
    'menuSvc',
    function(menuSvc) {
        return {
            replace: true,
            restrict: 'EA',
            scope: {
                'label': '@',
                'model': '=',
                'helpnote': '@',
                'icon': '@'
            },
            controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                $scope.selectOpts = {
                    simple_tags: true,
                    'multiple': true,
                    tokenSeparators: [
                        ',',
                        ' '
                    ]
                };
                $scope.selectOpts['tags'] = menuSvc.doAction($attrs.source);
            }],
            templateUrl: 'template/formcontrols/modelTags.html',
            compile: function(tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.append('<hr/>');
                }
                return function(scope, element, attr) {
                };
            }
        };
    }
]);
DirectivesModule.directive('listEntriesThumbs', function() {
    return {
        restrict: 'A',
        controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
            if ($attrs.listEntriesThumbs == 'true') {
                var format = function(player) {
                    if (!player.thumbnailUrl)
                        return player.name;
                    return '<img class=\'thumb\' src=\'' + player.thumbnailUrl + '\'/>' + player.name;
                };
                $scope.addOption({
                    formatResult: format,
                    formatSelection: format,
                    escapeMarkup: function(m) {
                        return m;
                    }
                });
            }
        }]
    };
});
DirectivesModule.directive('modelSelect', ['menuSvc', function(menuSvc) {
    return {
        replace: true,
        restrict: 'EA',
        priority: 1,
        require: '?parentContainer',
        scope: {
            label: '@',
            model: '=',
            initvalue: '@',
            helpnote: '@',
            selectOpts: '@',
            'strModel': '@model',
            'require': '@'
        },
        compile: function(tElement, tAttr) {
            if (tAttr['endline'] == 'true') {
                tElement.append('<hr/>');
            }
            return function($scope, $element, $attrs, controller) {
                if (controller) {
                    var pubObj = {
                        model: $attrs.model,
                        label: $attrs.label.replace('Location', ''),
                        sortVal: menuSvc.getControlData($attrs.model).sortVal
                    };
                    controller.register($scope.model, pubObj);
                    $scope.$watch('model', function(newVal, oldVal) {
                        if (newVal != oldVal)
                            controller.update(newVal, oldVal, pubObj);
                    });
                }
                var menuData = menuSvc.getControlData($attrs.model);
                if (menuData) {
                    $scope.options = menuData.options;
                }
            };
        },
        controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
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
            $scope.checkSelection = function(value) {
                if (value == $scope.model)
                    return true;
                else if (typeof value == 'number' && parseFloat($scope.model) == value) {
                    return true;
                }
                return false;
            };
            $scope.initSelection = function() {
                if ($scope.model === '' || typeof $scope.model == 'undefined') {
                    $scope.model = $attrs.initvalue;
                }
                return $scope.model;
            };
            $scope.selectOpts.initSelection = $scope.initSelection();
            $scope.uiselectOpts = angular.toJson($scope.selectOpts);
            this.setOptions = function(optsArr) {
                $scope.options = optsArr;
            };
        }],
        templateUrl: 'template/formcontrols/modelSelect.html'
    };
}]);
DirectivesModule.directive('parentContainer', ['sortSvc', function(sortSvc) {
    return {
        restrict: 'A',
        controller: function() {
            var cntrl = {
                register: function(container, model) {
                    sortSvc.register(container, model);
                },
                update: function(newVal, oldVal, model) {
                    sortSvc.update(newVal, oldVal, model);
                }
            };
            return cntrl;
        }
    };
}]);
DirectivesModule.directive('sortOrder', [
    'sortSvc',
    function(sortSvc) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'template/formcontrols/sortOrder.html',
            controller: ['$scope', function($scope) {
                $scope.getObjects = function() {
                    $scope.containers = sortSvc.getObjects();
                };
                $scope.getObjects();
                sortSvc.sortScope = $scope;
                $scope.$on('sortContainersChanged', function() {
                    $scope.getObjects();
                });
                $scope.$watchCollection('containers', function(newVal, oldVal) {
                    if (newVal != oldVal) {
                        sortSvc.saveOrder($scope.containers);
                    }
                });
                $scope.sortableOptions = {
                    update: function(e, ui) {
                        cl($scope.containers);
                    },
                    axis: 'y'
                };
            }],
            link: function(scope, element, attrs) {
            }
        };
    }
]);
DirectivesModule.directive('playerRefresh', ['PlayerService', 'menuSvc', '$timeout', function(PlayerService, menuSvc, $timeout) {
    var menuScope = menuSvc.menuScope;
    return {
        restrict: 'A',
        priority: 1000,
        require: ['playerRefresh', '?ngModel'],
        controller: function($scope, $element, $attrs) {
            $scope.customRefresh = false;
            $scope.modelChanged = false; // used to track the model
            $scope.controlUpdateAllowed = false; // used to track the input control, for example it changes to true only if text field has had a blur event
            $scope.controlFunction = function() {
                if ($attrs['playerRefresh'] == 'boolean') { // boolean controls don't need the extra watch so with that flag we just watch the model
                    return $scope.modelChanged;
                } else
                    return  ($scope.modelChanged && $scope.controlUpdateAllowed);
            };
            $scope.updateFunction = function(prScope, elem) { // the function used to set controlUpdateAllowed - works for text inputs etc.
                // a custom function can be set with setUpdateFunction
                var triggerElm;
                if (elem.is('input') || elem.is('select')) {
                    triggerElm = elem;
                }
                else {
                    triggerElm = $(elem).find('input[ng-model], select[ng-model]');
                }
                prScope.$apply(function() {
                    triggerElm.on('change', function(e) {
                        prScope.controlUpdateAllowed = true;
                    });
                });
            };
            var i = 0;
            var timeOutRun = null;
            $scope.makeRefresh = function() { // once set to action it will refresh!
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
                        timeOutRun = $timeout(function() {
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
                setUpdateFunction: function(func) {
                    $scope.customRefresh = true;
                    $scope.updateFunction = func;
                },
                setControlFunction: function(func) {
                    $scope.customRefresh = true;
                    $scope.controlFunction = func;
                },
                getPrScope: function() {
                    return $scope;
                }
            };
            return ctrObj;
        },
        link: function(scope, iElement, iAttrs, controllers) {
            var playerRefresh = controllers[0];
            var ngController = null;
            if (iAttrs['playerRefresh'] != 'false') {
                var model = iAttrs['model'];
                if (controllers[1]) {
                    ngController = controllers[1];
                    model = ngController.$modelValue;
                }
                if (!ngController) {
                    menuScope.$watch(function(menuScope) {
                        return menuScope.$eval(model);
                    }, function(newVal, oldVal) {
                        if (newVal != oldVal) {
                            scope.modelChanged = true;
                        } else {
                            scope.modelChanged = false;
                        }

                    });
                }
                else {
                    ngController.$viewChangeListeners.push(function() {
                        scope.modelChanged = true;
                    });
                }
                $timeout(function() { // set the timeout to call the updateFunction watch
                    scope.updateFunction(scope, iElement);//optional  parameters
                    scope.$watch(function() {
                        return scope.controlFunction(scope);//optional scope parameter
                    }, function(newVal, oldVal) {
                        if (newVal != oldVal && newVal) {
                            scope.makeRefresh();
                        }
                    });
                }, 200);
            }
        }
    };
}])
;
DirectivesModule.directive('infoAction', ['menuSvc', function(menuSvc) {
    return {
        restrict: 'EA',
        replace: 'true',
        controller: ['$scope', function($scope) {
            $scope.check = function(action) {
                return menuSvc.checkAction(action);
            };
            $scope.btnAction = function(action) {
                menuSvc.doAction(action);
            };
        }],
        scope: {
            'model': '=',
            'btnLabel': '@',
            'btnClass': '@',
            'action': '@',
            'helpnote': '@',
            'label': '@'
        },
        templateUrl: 'template/formcontrols/infoAction.html'
    };
}]);
DirectivesModule.directive('prettyCheckbox', function() {
    return {
        restrict: 'AC',
        require: 'ngModel',
        transclude: 'element',
        compile: function(tElement, tAttrs, transclude) {
            return function(scope, $element, iAttr, ngController) {
                var wrapper = angular.element('<div class="prettycheckbox"></div>');
                var clickHandler = $('<a href="#" class=""></a>').appendTo(wrapper);
                transclude(scope, function(clone) {
                    return $element.replaceWith(wrapper).append(clone);
                });
                var watchProp = iAttr['model'] || iAttr['ngModel'];
                clickHandler.on('click', function(e) {
                    e.preventDefault();
                    ngController.$setViewValue(!ngController.$viewValue);
                    return false;
                });
                var formatter = function() {
                    if (ngController.$viewValue) {
                        clickHandler.addClass('checked');
                        if (scope['require']) {
                            clickHandler.removeClass('ng-invalid');
                        }
                    }
                    else {
                        clickHandler.removeClass('checked');
                        if (scope['require']) {
                            clickHandler.addClass('ng-invalid');
                        }
                    }
                };
                ngController.$viewChangeListeners.push(formatter);
                if (scope.$eval(watchProp)) {
                    clickHandler.addClass('checked');
                }
                if (scope['require'] && !ngController.$viewValue) {
                    clickHandler.addClass('ng-invalid');
                }
            };
        }
    };
});
DirectivesModule.directive('prettyRadio', function() {
    return {
        restrict: 'AC',
        require: ['ngModel', '^modelRadio'],
        transclude: 'element',
        controller: function($scope, $element, $attrs) {
            $scope.checked = false;
            $scope.setValue = function(value) {
                if (value == $attrs.value) {
                    $scope.checked = true;
                } else
                    $scope.checked = false;
            };
            if ($scope.$eval($attrs['model']) == $attrs.value) {
                $scope.checked = true;
            }
        },
        compile: function(tElement, tAttrs, transclude) {
            return function(scope, iElement, iAttr, cntrls) {
                var ngController = cntrls[0];
                var modelRadioCntrl = cntrls[1];
                var wrapper = $('<span class="clearfix prettyradio"></span>');
                var clickHandler = $('<a href="#" class=""></a>').appendTo(wrapper);
                modelRadioCntrl.registerControl(scope);
                modelRadioCntrl.regContoller(ngController);
                var inputVal = iAttr.value;
                var watchProp = 'model';
                if (typeof iAttr['model'] != 'undefined') {
                    watchProp = iAttr['model'];
                }
                transclude(scope, function(clone) {
                    return iElement.replaceWith(wrapper).append(clone);
                });
                clickHandler.on('click', function(e) {
                    e.preventDefault();
                    ngController.$setViewValue(inputVal);

                    scope.$apply(function() {
                            modelRadioCntrl.setChoice(inputVal);
                        }
                    );
                    return false;
                });
                var formatter = function() {
                    modelRadioCntrl.setChoice(inputVal);
                };
                ngController.$viewChangeListeners.push(formatter);
                scope.$watch('checked', function(newVal) {
                    if (newVal) {
                        clickHandler.addClass('checked');
                    }
                    else
                        clickHandler.removeClass('checked');
                });
            };
        }
    };
});
DirectivesModule.directive('modelCheckbox', function() {
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
                    if ($attrs['playerRefresh'] != 'boolean')
                        $element.attr('player-refresh', 'boolean');
                    playerRefreshCnt.setUpdateFunction(function(pRscope) { // scope here is pRscope.
                        pRscope.controlUpdateAllowed = true; // checkbox doesn't need a control watcher, the model is enough.
                    });
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
            'strModel': '@model',
            'require': '@'
        }
    };
});
DirectivesModule.directive('divider', [function() {
    return {
        replace: true,
        restrict: 'EA',
        template: '<hr class="divider"/>'
    };
}]);
DirectivesModule.directive('readOnly', ['$filter', function($filter) {
    return {
        restrict: 'EA',
        replace: 'true',
        scope: {
            model: '=',
            helpnote: '@'
        },
        controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
            if ($attrs['filter']) {
                if (typeof $filter($attrs['filter']) == 'function')
                    $scope.model = $filter($attrs['filter'])($scope.model);
            }
            if ($attrs['initvalue']) {
                if (typeof $scope.model == 'undefined' || $scope.model === '')
                    $scope.model = $attrs['initvalue'];
            }
            $scope.label = $attrs.label + ':';
        }],
        templateUrl: 'template/formcontrols/readOnly.html'
    };
}]);
DirectivesModule.directive('modelButton', ['menuSvc', function(menuSvc) {
    return {
        restrict: 'EA',
        replace: 'true',
        controller: ['$scope', function($scope) {
            $scope.check = function(action) {
                return menuSvc.checkAction(action);
            };
            $scope.btnAction = function(action) {
                menuSvc.doAction(action);
            };
        }],
        scope: {
            'label': '@',
            'action': '@',
            'btnClass': '@',
            helpnote: '@'
        },
        templateUrl: 'template/formcontrols/modelButton.html'
    };
}]);
DirectivesModule.directive('modelNumber', ['PlayerService', function(PlayerService) {
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
            $scope.$apply(function() {
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
DirectivesModule.directive('onFinishRender', [
    '$timeout',
    'requestNotificationChannel',
    function($timeout, requestNotificationChannel) {
        return {
            restrict: 'A',
            link: function(scope, element, attr) {
                if (scope.$last === true) {
                    var timeVar;
                    timeVar = $timeout(function() {
                        if (timeVar) {
                            $timeout.cancel(timeVar);
                        }
                        requestNotificationChannel.requestEnded('list');
                    });
                }
            }
        };
    }
]);