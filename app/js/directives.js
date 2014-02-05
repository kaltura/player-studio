'use strict';
var DirectivesModule = angular.module('KMC.directives', [
    'colorpicker.module',
    'ui.bootstrap',
    'ui.select2',
    'ui.sortable'
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
        require: '?playerRefresh',
        templateUrl: 'template/formcontrols/modelRadio.html',
        scope: {
            'model': '=',
            'strModel': '@model',
            'label': '@',
            'helpnote': '@',
            'require': '@'
        },
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            var menuData = menuSvc.getControlData($attrs.model);
            $scope.options = menuData.options;
            var ngModelCntrl;
            var controls = [];
            return {
                setChoice: function (value) {
                    angular.forEach(controls, function (control) {
                        control.setValue(value);
                    });
                },
                registerControl: function (cntrl) {
                    controls.push(cntrl);
                },
                getValue: function () {
                    return $scope.model;
                },
                regContoller: function (cntrl) {
                    if (!ngModelCntrl)
                        menuSvc.menuScope.playerEdit.$addControl(cntrl);
                    ngModelCntrl = cntrl;
                },
                isRequired: $attrs.require
            };
        }
        ],
        link: function (scope, element, attributes, prController) {
            if (prController) {
                prController.setValueBased();
            }
            if (scope.require) {
                scope.$watch('model', function (newval) { //TODO: change to ngmodel + $setValidity
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

DirectivesModule.directive('dname', function (menuSvc) { // made to help with validation registers dynamic directives with form controller
    return {
        require: '?ngModel',
        priority: 100,
        compile: function (tElement, tAttrs) {
            return function ($scope, $element, $attrs, $ngModelCntrl) {
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
DirectivesModule.directive('valType', function () {
    return {
        restrict: "A",
        compile: function (tElem, tAttr) {
            if ((tAttr['valType'] == 'url' || tAttr['valType'] == 'email') && $('html').hasClass('IE8') === false) {
                tElem.attr('input', tAttr['valType']);
            }
        }
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
                'initvalue': '@',
                "require": '@',
                'strModel': '=model'
            },
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
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
                'icon': '@',
                'require': '@',
                'strModel': '=model'
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
                'icon': '@',
                'strModel': '=model'
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
                return function (scope, element, attr) {
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
DirectivesModule.directive('prettyRadio', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'AC',
        require: ['ngModel', '^modelRadio'],
        transclude: 'element',
        controller: function ($scope, $element, $attrs) {
            $scope.checked = false;
            $scope.setValue = function (value) {
                if (value == $attrs.value) {
                    $scope.checked = true;
                } else
                    $scope.checked = false;
            };
            if ($scope.$eval($attrs['model']) == $attrs.value) {
                $scope.checked = true;
            }
        },
        compile: function (tElement, tAttrs, transclude) {
            return function (scope, iElement, iAttr, cntrls) {
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
                transclude(scope, function (clone) {
                    return iElement.replaceWith(wrapper).append(clone);
                });
                clickHandler.on('click', function (e) {
                    e.preventDefault();
                    ngController.$setViewValue(inputVal);

                    $rootScope.$safeApply(scope, function () {
                            modelRadioCntrl.setChoice(inputVal);
                        }
                    );
                    return false;
                });
                var formatter = function () {
                    modelRadioCntrl.setChoice(inputVal);
                };
                ngController.$viewChangeListeners.push(formatter);
                scope.$watch('checked', function (newVal) {
                    if (newVal) {
                        clickHandler.addClass('checked');
                    }
                    else
                        clickHandler.removeClass('checked');
                });
            };
        }
    };
}]);
DirectivesModule.directive('divider', [function () {
    return {
        replace: true,
        restrict: 'EA',
        template: '<hr class="divider"/>'
    };
}]);
DirectivesModule.directive('readOnly', ['$filter', function ($filter) {
    return {
        restrict: 'EA',
        replace: 'true',
        scope: {
            model: '=',
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
            $scope.label = $attrs.label + ':';
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
DirectivesModule.directive('onFinishRender', [
    '$timeout',
    'requestNotificationChannel',
    function ($timeout, requestNotificationChannel) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    var timeVar;
                    if (timeVar) {
                        $timeout.cancel(timeVar);
                    }
                    timeVar = $timeout(function () {
                        requestNotificationChannel.requestEnded('list');
                    });
                }
            }
        };
    }
]);