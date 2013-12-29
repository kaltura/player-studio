'use strict';
var DirectivesModule = angular.module('KMC.directives', [
    'colorpicker.module',
    'ui.bootstrap',
    'ui.select2',
    'ui.sortable'
]);
DirectivesModule.directive('mcustomScrollbar', [
    '$timeout',
    function ($timeout) {
        return {
            priority: 0,
            restrict: 'AC',
            controller: [
                '$scope',
                '$element',
                '$attrs',
                function ($scope, $element, $attrs) {
                    $scope.$on('layoutChange', function () {
                        if ($scope.scroller)
                            $timeout(function () {
                                $scope.scroller.mCustomScrollbar('update');
                            }, 500);
                    });
                }
            ],
            link: function (scope, element, attr) {
                var options = scope.$eval(attr['mcustomScrollbar']);
                var opts = {
                    horizontalScroll: false,
                    mouseWheel: true,
                    autoHideScrollbar: true,
                    contentTouchScroll: true,
                    theme: 'dark',
                    advanced: {
                        updateOnBrowserResize: true,
                        updateOnContentResize: true
                    }
                };
                angular.extend(opts, options);
                $timeout(function () {
                    if (typeof $().mCustomScrollbar == 'function') {
                        scope.scroller = element.mCustomScrollbar(opts);
                    }
                }, 500);
            }
        };
    }
]);
DirectivesModule.directive('timeago', [function () {
    return {
        scope: { timestamp: '@' },
        restrict: 'CA',
        link: function (scope, iElement, iAttrs) {
            if (typeof $.timeago == 'function')
                scope.$watch('timestamp', function (newVal, oldVal) {
                    if (newVal) {
                        var date = scope.timestamp * 1000;
                        iElement.text($.timeago(date));
                    }
                });
        }
    };
}]);
DirectivesModule.directive('modelRadio', ['menuSvc', function (menuSvc) {
    return {
        restrict: 'EA',
        replace: true,
        templateUrl: 'template/formcontrols/modelRadio.html',
        scope: {
            'model': '=',
            'label': '@',
            'helpnote': '@'
        },
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            var menuData = menuSvc.getControlData($attrs.model);
            $scope.options = menuData.options;
        }],
        link: function (scope, element, attributes) {
            element.find('input').attr('name', scope.model);
        }
    };
}]);
DirectivesModule.directive('modelColor', function () {
    return {
        restrict: 'EA',
        replace: true,
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
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
            'model': '='
        },
        templateUrl: 'template/formcontrols/modalColor.html'
    };
});
DirectivesModule.directive('modelText', function () {
    return {
        replace: true,
        restrict: 'EA',
        scope: {
            'label': '@',
            'model': '=',
            'icon': '@',
            'helpnote': '@'
        },
        compile: function (tElement, tAttr) {
            if (tAttr['endline'] == 'true') {
                tElement.append('<hr/>');
            }
        },
        templateUrl: 'template/formcontrols/modelText.html'
    };
});
DirectivesModule.directive('select2Data', [
    'menuSvc',
    function (menuSvc) {
        return {
            replace: true,
            restrict: 'EA',
            scope: {
                'label': '@',
                'model': '=',
                'icon': '@',
                'helpnote': '@',
                'initvalue': '@'
            },
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                $scope.selectOpts = {};
                $scope.selectOpts['data'] = menuSvc.doAction($attrs.source);
                if ($attrs.query) {
                    $scope.selectOpts['data'].results = [];
                    $scope.selectOpts['query'] = menuSvc.getAction($attrs.query);
                }
                $scope.selectOpts['width'] = $attrs.width;
            }],
            templateUrl: 'template/formcontrols/select2Data.html',
            compile: function (tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.append('<hr/>');
                }
                if (tAttr.showEntriesThumbs == 'true') {
                    tElement.find('input').attr('list-entries-thumbs', 'true');
                }
                if (tAttr.placeholder)
                    tElement.find('input').attr('data-placeholder', tAttr.placeholder);
                return function (scope, element) {
                };
            }
        };
    }
]);
DirectivesModule.directive('modelEdit', ['$modal',
    function ($modal) {
        var modalEditCntrl = ['$scope' , function ($scope) {
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
                'icon': '@'
            },
            controller: modalEditCntrl,
            templateUrl: 'template/formcontrols/modelEdit.html',
            compile: function (tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.append('<hr/>');
                }
                return function (scope, element, attrs) {
                    scope.doModal = function () {
                        var modal = $modal.open({
                            templateUrl: 'template/dialog/textarea.html',
                            controller: 'ModalInstanceCtrl',
                            resolve: {
                                settings: function () {
                                    return {
                                        'close': function (result, value) {
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
    function (menuSvc) {
        return {
            replace: true,
            restrict: 'EA',
            scope: {
                'label': '@',
                'model': '=',
                'helpnote': '@',
                'icon': '@'
            },
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
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
            compile: function (tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.append('<hr/>');
                }
                return function (scope, element) {
                };
            }
        };
    }
]);
DirectivesModule.directive('listEntriesThumbs', function () {
    return {
        restrict: 'A',
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            if ($attrs.listEntriesThumbs == 'true') {
                var format = function (player) {
                    if (!player.thumbnailUrl)
                        return player.name;
                    return '<img class=\'thumb\' src=\'' + player.thumbnailUrl + '\'/>' + player.name;
                };
                $scope.addOption({
                    formatResult: format,
                    formatSelection: format,
                    escapeMarkup: function (m) {
                        return m;
                    }
                });
            }
        }]
    };
});
DirectivesModule.directive('modelSelect', ['menuSvc', function (menuSvc) {
    return {
        replace: true,
        restrict: 'EA',
        require: '?parentContainer',
        scope: {
            label: '@',
            model: '=',
            initvalue: '@',
            helpnote: '@',
            selectOpts: '@'
        },
        compile: function (tElement, tAttr) {
            if (tAttr['endline'] == 'true') {
                tElement.append('<hr/>');
            }
            return function ($scope, $element, $attrs, controller) {
                if (controller) {
                    var pubObj = {
                        model: $attrs.model,
                        label: $attrs.label.replace('Location', ''),
                        sortVal: menuSvc.getControlData($attrs.model).sortVal
                    };
                    controller.register($scope.model, pubObj);
                    $scope.$watch('model', function (newVal, oldVal) {
                        if (newVal != oldVal)
                            controller.update(newVal, oldVal, pubObj);
                    });
                }
                var menuData = menuSvc.getControlData($attrs.model);
                $scope.options = menuData.options;
            };
        },
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            if (!$scope.selectOpts) {
                $scope.selectOpts = {};
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
            this.setOptions = function (optsArr) {
                $scope.options = optsArr;
            };
        }],
        templateUrl: 'template/formcontrols/modelSelect.html'
    };
}]);
DirectivesModule.directive('parentContainer', ['sortSvc', function (sortSvc) {
    return {
        restrict: 'A',
        controller: function () {
            var cntrl = {
                register: function (container, model) {
                    sortSvc.register(container, model);
                },
                update: function (newVal, oldVal, model) {
                    sortSvc.update(newVal, oldVal, model);
                }
            };
            return cntrl;
        }
    };
}]);
DirectivesModule.directive('sortOrder', [
    'sortSvc',
    function (sortSvc) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'template/formcontrols/sortOrder.html',
            controller: ['$scope', function ($scope) {
                $scope.getObjects = function () {
                    $scope.containers = sortSvc.getObjects();
                };
                $scope.getObjects();
                sortSvc.sortScope = $scope;
                $scope.$on('sortContainersChanged', function () {
                    $scope.getObjects();
                });
                $scope.$watchCollection('containers', function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        sortSvc.saveOrder($scope.containers);
                    }
                });
                $scope.sortableOptions = {
                    update: function (e, ui) {
                        cl($scope.containers);
                    },
                    axis: 'y'
                };
            }],
            link: function (scope, element, attrs) {
            }
        };
    }
]);
DirectivesModule.directive('playerRefresh', ['PlayerService', 'menuSvc', function (PlayerService, menuSvc) {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attrs) {
            if ($attrs['playerRefresh'] != 'false') {
                var model = $attrs['model'];
                menuSvc.menuScope.$watch(model, function () {
                    PlayerService.playerRefresh($attrs['playerRefresh']);
                });
            }
        }
    };
}]);
DirectivesModule.directive('infoAction', ['menuSvc', function (menuSvc) {
    return {
        restrict: 'EA',
        replace: 'true',
        controller: ['$scope', function ($scope) {
            $scope.check = function (action) {
                return menuSvc.checkAction(action);
            };
            $scope.btnAction = function (action) {
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
DirectivesModule.directive('prettyCheckbox', function () {
    return {
        restrict: 'AC',
        require: 'ngModel',
        transclude: 'element',
        compile: function (tElement, tAttrs, transclude) {
            return function (scope, $element, iAttr, ngController) {
                var wrapper = angular.element('<div class="prettycheckbox"></div>');
                var clickHandler = wrapper.append('<a href="#" class=""></a>');
                transclude(scope, function (clone) {
                    return $element.replaceWith(wrapper).append(clone);
                });
                var input = wrapper.find('input').hide();
                var watchProp = iAttr['model'] || 'model';
                wrapper.on('click', 'a', function (e) {
                    e.preventDefault();
                    ngController.$setViewValue(!ngController.$viewValue);
                    return false;
                });
                var formatter = function () {
                    if (ngController.$viewValue)
                        $(wrapper).find('a').addClass('checked');
                    else
                        $(wrapper).find('a').removeClass('checked');
                };
                ngController.$viewChangeListeners.push(formatter);
                if (scope.$eval(watchProp)) {
                    clickHandler.find('a').addClass('checked');
                }
            };
        }
    };
});
DirectivesModule.directive('prettyRadio', function () {
    return {
        restrict: 'AC',
        priority: 1000,
        transclude: 'element',
        compile: function (tElement, tAttrs, transclude) {
            return function (scope, iElement, iAttr) {
                var wrapper = angular.element('<span class="clearfix prettyradio"></span>');
                var clickHandler = wrapper.append('<a href="#" class=""></a>');
                var watchProp = 'model';
                if (typeof iAttr['model'] != 'undefined') {
                    watchProp = iAttr['model'];
                }
                transclude(scope, function (clone) {
                    return wrapper.append(clone);
                });
                iElement.replaceWith(wrapper);
                var input = wrapper.find('input').hide();
                clickHandler.on('click', 'a', function (e) {
                    e.preventDefault();
                    input.trigger('click');
                    input.trigger('click');
                    return false;
                });
                scope.$watch(function () {
                    return scope.$eval(watchProp) == input.val();
                }, function (newVal, oldVal) {
                    if (newVal != oldVal)
                        $(wrapper).find('a').toggleClass('checked');
                });
            };
        }
    };
});
DirectivesModule.directive('modelCheckbox', function () {
    return {
        restrict: 'EA',
        templateUrl: 'template/formcontrols/modelCheckbox.html',
        replace: true,
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            if ($scope.model === '' || typeof $scope.model == 'undefined') {
                if ($attrs.initvalue === 'true')
                    $scope.model = true;
            }
        }],
        scope: {
            label: '@',
            helpnote: '@',
            model: '='
        }
    };
});
DirectivesModule.directive('readOnly', ['$filter', function ($filter) {
    return {
        restrict: 'EA',
        replace: 'true',
        scope: {
            model: '=',
            label: '@',
            helpnote: '@'
        },
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
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
DirectivesModule.directive('modelButton', ['menuSvc', function (menuSvc) {
    return {
        restrict: 'EA',
        replace: 'true',
        controller: ['$scope', function ($scope) {
            $scope.check = function (action) {
                return menuSvc.checkAction(action);
            };
            $scope.btnAction = function (action) {
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
DirectivesModule.directive('modelNumber', function () {
    return {
        templateUrl: 'template/formcontrols/spinEdit.html',
        replace: true,
        restrict: 'EA',
        scope: {
            model: '=',
            helpnote: '@',
            label: '@'
        },
        link: function ($scope, $element, $attrs) {
            var $spinner = $element.find('input').spinedit({
                minimum: parseFloat($attrs.from),
                maximum: parseFloat($attrs.to),
                step: parseFloat($attrs.stepsize),
                value: parseFloat($attrs.initvalue),
                numberOfDecimals: parseFloat($attrs.numberofdecimals)
            });
            $spinner.on('valueChanged', function (e) {
                if (typeof e.value == 'number') {
                    $scope.$apply(function () {
                        $scope.model = e.value;
                    });
                }
            });
        },
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
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
            angular.forEach(keys, function (keyName) {
                if (!$attrs[keyName])
                    $scope[keyName] = def[keyName];
                else
                    $scope[keyName] = $attrs[keyName];
            });
            if (typeof $scope.model != 'undefined') {
                $scope.initvalue = $scope.model;
            } else {
                if (!$attrs['default'])
                    $scope.initvalue = 1;
                else
                    $scope.initvalue = $attrs['default'];
            }
        }]
    };
});
DirectivesModule.directive('onFinishRender', [
    '$timeout',
    'requestNotificationChannel',
    function ($timeout, requestNotificationChannel) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        requestNotificationChannel.requestEnded('list');
                    });
                }
            }
        };
    }
]);