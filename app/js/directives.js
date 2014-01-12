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
            controller: [
                '$scope',
                '$element',
                '$attrs',
                function($scope, $element, $attrs) {
                    $scope.$on('layoutChange', function() {
                        if ($scope.scroller)
                            $timeout(function() {
                                $scope.scroller.mCustomScrollbar('update');
                            }, 500);
                    });
                }
            ],
            link: function(scope, element, attr) {
                var options = scope.$eval(attr['mcustomScrollbar']);
                var opts = {
                    horizontalScroll: false,
                    mouseWheel: true,
                    autoHideScrollbar: true,
                    contentTouchScroll: true,
                    theme: 'dark',
                    advanced: {
                        autoScrollOnFocus: false,
                        updateOnBrowserResize: true,
                        updateOnContentResize: true
                    }
                };
                angular.extend(opts, options);
                $timeout(function() {
                    if (typeof $().mCustomScrollbar == 'function') {
                        scope.scroller = element.mCustomScrollbar(opts);
                    }
                }, 500);
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
        link: function(scope, element, attributes) {
            if (scope.require) {
                scope.$watch('model', function(newval) {
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
DirectivesModule.directive('modelColor', function() {
    return {
        restrict: 'EA',
        replace: true,
        controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
            if (typeof $scope.model == 'undefined') {
                if ($attrs.initvalue)
                    $scope.model = $attrs.initvalue;
                else
                    $scope.model = '#fff';
            }
        }],
        scope: {
            'class': '@',
            'label': '@',
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
                        $timeout(function() {
                            ctrl.$setValidity('required', false);
                        });
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
                $attrs.label = '* ' + $attrs.label;
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
    'menuSvc', '$timeout',
    function(menuSvc, $timeout) {
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
                $scope.options = menuData.options;
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
DirectivesModule.directive('playerRefresh', ['PlayerService', 'menuSvc', function(PlayerService, menuSvc) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            if ($attrs['playerRefresh'] != 'false') {
                var model = $attrs['model'];
                menuSvc.menuScope.$watch(model, function(newVal, oldVal) {
                    if (newVal != oldVal){
                        PlayerService.playerRefresh($attrs['playerRefresh']);
                    }

                });
            }
        }
    };
}]);
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
                var watchProp = iAttr['model'] || 'model';
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
                    clickHandler.find('a').addClass('checked');
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
        replace: true,
        compile: function(tElement, tAttr) {
            if (tAttr['endline'] == 'true') {
                tElement.append('<hr/>');
            }
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
DirectivesModule.directive('readOnly', ['$filter', function($filter) {
    return {
        restrict: 'EA',
        replace: 'true',
        scope: {
            model: '=',
            label: '@',
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
DirectivesModule.directive('modelNumber', function($timeout) {
    return {
        templateUrl: 'template/formcontrols/spinEdit.html',
        replace: true,
        restrict: 'EA',
        scope: {
            model: '=',
            helpnote: '@',
            label: '@',
            'strModel': '@model',
            'require': '@'
        },
        link: function($scope, $element, $attrs) {
            var $spinner = $element.find('input');
            $timeout(function() {
                $spinner.
                    spinedit({
                        minimum: parseFloat($attrs.from),
                        maximum: parseFloat($attrs.to),
                        step: parseFloat($attrs.stepsize),
                        value: parseFloat($attrs.initvalue),
                        numberOfDecimals: parseFloat($attrs.numberofdecimals)
                    });
            });
            $spinner.on('valueChanged', function(e) {
                if (typeof e.value == 'number') {
                    $scope.model = e.value;
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
            } else {
                if (!$attrs['initvalue'])
                    $scope.initvalue = 1;
                else
                    $scope.initvalue = $attrs['initvalue'];
            }
        }]
    };
});
DirectivesModule.directive('onFinishRender', [
    '$timeout',
    'requestNotificationChannel',
    function($timeout, requestNotificationChannel) {
        return {
            restrict: 'A',
            link: function(scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function() {
                        requestNotificationChannel.requestEnded('list');
                    });
                }
            }
        };
    }
]);