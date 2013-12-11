'use strict';
/* Directives */
angular.module('KMC.directives', ['colorpicker.module', 'ui.select2'])
    .directive('mcustomScrollbar', ['$timeout', function($timeout) {
        return{
            priority: 0,
            restrict: 'AC',
            controller: function($scope, $element, $attrs) {
                $scope.$on('layoutChange', function() {
                    if ($scope.scroller)
                        $timeout(function() {
                            $scope.scroller.mCustomScrollbar('update');
                        }, 500)
                })
            },
            link: function(scope, element, attr) {
                var options = scope.$eval(attr['mcustomScrollbar']);
                var opts = {
                    horizontalScroll: false,
                    mouseWheel: true,
                    autoHideScrollbar: true,
                    contentTouchScroll: true,
                    theme: 'dark',
                    advanced: {
                        updateOnBrowserResize: true,
                        updateOnContentResize: true,
                    }
                };
                angular.extend(opts, options);
                $timeout(function() {

                    if (typeof $().mCustomScrollbar == 'function') {
                        scope.scroller = element.mCustomScrollbar(opts);
                    }
                }, 500)

            }
        }
    }])
    .directive('timeago', [function() {
        return {
            scope: {timestamp: '@'},
            restrict: 'C',
            link: function(scope, iElement, iAttrs) {
                if (typeof $.timeago == 'function')
                    scope.$watch('timestamp', function(newVal, oldVal) {
                            if (newVal) {
                                var date = scope.timestamp * 1000;
                                iElement.text($.timeago(date));
                            }
                        }
                    )

            }
        }
    }]).directive('modelRadio', function(menuSvc) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'template/formcontrols/modelRadio.html',
            scope: {
                'model': '=',
                'label': '@',
                'helpnote': '@'
            },
            controller: function($scope, $element, $attrs) {
                var menuData = menuSvc.getControlData($attrs.model);
                $scope.options = menuData.options;
            },
            link: function(scope, element, attributes) {
                element.find('input').attr('name', scope.model);
            }
        }
    })
    .directive('modelColor',function() {
        return  {
            restrict: 'E',
            replace: true,
            controller: function($scope, $element, $attrs) {
                if (typeof  $scope.model == 'undefined') {
                    if ($attrs.initvalue)
                        $scope.model = $attrs.initvalue;
                    else
                        $scope.model = '#fff';
                }
            },
            scope: {
                'class': '@',
                'label': '@',
                'helpnote': '@',
                'model': "="
            },
            templateUrl: 'template/formcontrols/modalColor.html'
        };
    }).directive('modelText',function() {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                'label': "@",
                'model': "=",
                'icon': '@',
                'helpnote': '@'
            },
            compile: function(tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.append('<hr/>');
                }
            },
            // $parent.model is used as model because tooltip is creating an isolate scope.
            templateUrl: 'template/formcontrols/modalText.html'
        };
    }).directive('select2Data', ['menuSvc', function(menuSvc) {
        return {
            replace: true,
            restrict: "E",
            scope: {
                'label': "@",
                'model': "=",
                'icon': '@',
                'helpnote': '@',
                'initvalue': '@'
            },
            controller: function($scope, $element, $attrs) {
                $scope.selectOpts = {};
                $scope.selectOpts['data'] = menuSvc.doAction($attrs.source);

                if ($attrs.query) {
                    $scope.selectOpts['data'].results = [];
                    $scope.selectOpts['query'] = menuSvc.getAction($attrs.query);
                }
                $scope.selectOpts['width'] = $attrs.width;
            },
            templateUrl: 'template/formcontrols/select2Data.html',
            compile: function(tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.append('<hr/>');
                }
                if (tAttr.showEntriesThumbs == 'true') {
                    tElement.find('input').attr('list-entries-thumbs', "true")
                }
                if (tAttr.placeholder)
                    tElement.find('input').attr('data-placeholder', tAttr.placeholder);

                return function(scope, element) {
                }

            }
        }
    }])
    .directive('modelEdit', ['$modal' , function($modal) {
        var modalEditCntrl = function($scope, $element, $attrs) {
            if (typeof  $scope.model == 'undefined')
                $scope.model = '';
            $scope.modelValue = $scope.model;
        }
        return {
            replace: true,
            restrict: "E",
            scope: {
                'label': "@",
                'helpnote': "@",
                'model': "=",
                'icon': '@'
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
                                                modal.close(result)
                                            },
                                            'title': attrs.label,
                                            'message': scope.model
                                        }
                                    }
                                }
                            }
                        )
                    };
                };

            }
        }
    }
    ]).
    directive('modelTags', ['menuSvc', function(menuSvc) {
        return {
            replace: true,
            restrict: "E",
            scope: {
                'label': "@",
                'model': "=",
                'helpnote': '@',
                'icon': '@'
            },
            controller: function($scope, $element, $attrs) {
                $scope.selectOpts = {simple_tags: true, 'multiple': true, tokenSeparators: [",", " "]};
                $scope.selectOpts['tags'] = menuSvc.doAction($attrs.source); // these tags will be available from the dropdown list/ autocomplete suggestions

            },
            templateUrl: 'template/formcontrols/modelTags.html',
            compile: function(tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.append('<hr/>');
                }
                return function(scope, element) {
                }

            }
        }
    }]).
    directive('listEntriesThumbs', function() {
        //not finished
        return {
            restrict: 'A',
            controller: function($scope, $element, $attrs) {
                if ($attrs.listEntriesThumbs == 'true') {
                    var format = function(player) {
                        if (!player.thumbnailUrl) return player.name;
                        return "<img class='thumb' src='" + player.thumbnailUrl + "'/>" + player.name
                    }
                    $scope.addOption({
                        formatResult: format,
                        formatSelection: format,
                        escapeMarkup: function(m) {
                            return m;
                        }
                    });
                }
            }
        }
    })
    .directive('infoAction', function(menuSvc) {
        return {
            restrict: 'E',
            replace: 'true',
            controller: function($scope, $element, $attrs) {
                $scope.check = function(action) {
                    // for update button.. checks if needed
                    return   menuSvc.checkAction(action);
                }
                $scope.btnAction = function(action) {
                    menuSvc.doAction(action);
                }
            },
            scope: {
                'model': '=',
                'btnLabel': '@',
                'btnClass': '@',
                'action': '@',
                'helpnote': '@',
                'label': '@'
            },
            templateUrl: 'template/formcontrols/infoAction.html'
        }
    })
    .directive('modelSelect',function(menuSvc) {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                label: "@",
                model: "=",
                initvalue: '@',
                helpnote: '@',
                selectOpts: '@'
            },
            compile: function(tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.append('<hr/>');
                }
                return function($scope, $element, $attrs) {
                    var menuData = menuSvc.getControlData($attrs.model);
                    $scope.options = menuData.options;

                }
            },
            controller: function($scope, $element, $attrs) {
                if (!$scope.selectOpts) {
                    $scope.selectOpts = {};
                }
                if (!$attrs.showSearch) {
                    $scope.selectOpts.minimumResultsForSearch = -1;
                }
                $scope.options = [];
                $scope.checkSelection = function(value) {
                    if (value == $scope.model)
                        return true
                    else if (typeof  value == 'number' && parseFloat($scope.model) == value) {
                        return true
                    }
                    return false;

                }
                $scope.initSelection = function() {
                    if ($scope.model == '' || typeof $scope.model == 'undefined') {
                        $scope.model = $attrs.initvalue;
                    }
                    return $scope.model;
                }

                $scope.selectOpts.initSelection = $scope.initSelection();
                $scope.uiselectOpts = angular.toJson($scope.selectOpts);
                this.setOptions = function(optsArr) {
                    $scope.options = optsArr;
                }
            },

            templateUrl: 'template/formcontrols/modelSelect.html'
        }
    }
).
    directive('prettyCheckbox',function() {
        return {
            restrict: 'AC',
            priority: 1000,
            transclude: 'element',
            compile: function(tElement, tAttrs, transclude) {
                return  function(scope, iElement, iAttr) {
                    var wrapper = angular.element('<div class="prettycheckbox"></div>');
                    var clickHandler = wrapper.append('<a href="#" class=""></a>');
                    transclude(scope, function(clone) {
                        return wrapper.append(clone);
                    });
                    iElement.replaceWith(wrapper);
                    var input = wrapper.find('input').hide();
                    clickHandler.on('click', 'a', function(e) {
                        e.preventDefault();
                        input.trigger('click');
                        return false;
                    });
                    var watchProp = 'model'
                    if (typeof iAttr['model'] != 'undefined') {
                        watchProp = iAttr['model'];
                    }
                    scope.$watch(function() {
                        return scope.$eval(watchProp);
                    }, function(newVal, oldVal) {
                        if (newVal != oldVal)
                            $(wrapper).find('a').toggleClass('checked');
                    });
                }
            }
        }
    }).directive('prettyRadio',function() {
        return {
            restrict: 'AC',
            priority: 1000,
            transclude: 'element',
            compile: function(tElement, tAttrs, transclude) {
                return  function(scope, iElement, iAttr) {
                    var wrapper = angular.element('<span class="clearfix prettyradio"></span>');
                    var clickHandler = wrapper.append('<a href="#" class=""></a>');
                    var watchProp = 'model'
                    if (typeof iAttr['model'] != 'undefined') {
                        watchProp = iAttr['model'];
                    }
                    transclude(scope, function(clone) {
                        return wrapper.append(clone);
                    });
                    iElement.replaceWith(wrapper);
                    var input = wrapper.find('input').hide();
                    clickHandler.on('click', 'a', function(e) {
                        e.preventDefault();
                        input.trigger('click');
                        input.trigger('click'); // it beats me why it needs 2 but it does.
                        return false;
                    });
                    scope.$watch(function() {
                        return scope.$eval(watchProp) == input.val();
                    }, function(newVal, oldVal) {
                        if (newVal != oldVal)
                            $(wrapper).find('a').toggleClass('checked');
                    });
                }
            }
        }
    }).
    directive('modelCheckbox',function() {
        return  {
            templateUrl: 'template/formcontrols/modelCheckbox.html',
            replace: true,
            restrict: 'E',
            scope: {
                label: '@',
                helpnote: '@',
                model: "="
            }
        };
    }).directive('readOnly',function() {
        return {
            restrict: 'E',
            replace: 'true',
            scope: {
                model: '=',
                label: '@',
                helpnote: '@'
            },
            templateUrl: 'template/formcontrols/readOnly.html'
        }
    }).directive('modelButton',function(menuSvc) {
        return {
            restrict: 'E',
            replace: 'true',
            controller: function($scope) {
                $scope.check = function(action) {
                    // for update button.. checks if needed
                    return   menuSvc.checkAction(action);
                }
                $scope.btnAction = function(action) {
                    menuSvc.doAction(action);
                }
            },
            scope: {
                'label': '@',
                'action': '@',
                "btnClass": '@',
                helpnote: '@'
            },
            templateUrl: 'template/formcontrols/modelButton.html'
        }
    }).directive('modelNumber', function() {
        return{
            templateUrl: 'template/formcontrols/spinEdit.html',
            replace: true,
            restrict: 'EA',
            scope: {
                model: "=",
                label: "@"
            },
            link: function($scope, $element, $attrs) {
                var $spinner = $element.find('input').spinedit({
                    minimum: parseFloat($scope.from),
                    maximum: parseFloat($scope.to),
                    step: parseFloat($scope.stepsize),
                    value: parseFloat($scope.initvalue),
                    numberOfDecimals: parseFloat($scope.numberofdecimals)
                });
                $spinner.on("valueChanged", function(e) {
                    if (typeof e.value == 'number') {
                        $scope.$apply(function() {
                            $scope.model = e.value;
                        });
                    }

                });
            },
            controller: function($scope, $element, $attrs) {
                var def = {
                    from: 5,
                    to: 10,
                    stepsize: 1,
                    numberOfDecimals: 0
                }
                var keys = ['from', 'to', 'stepsize', 'numberofdecimals'];

                angular.forEach(keys, function(keyName) {
                    if (!$attrs[keyName]) $scope[keyName] = def[keyName];
                    else $scope[keyName] = $attrs[keyName];
                });
                if (typeof $scope.model != 'undefined') {
                    $scope.initvalue = $scope.model;
                } else {
                    if (!$attrs['default']) $scope.initvalue = 1;
                    else  $scope.initvalue = $attrs['default'];
                }

            }
        }
    })
    .directive('loadingWidget', ['requestNotificationChannel', function(requestNotificationChannel) {
        return {
            restrict: "E",
            scope: {},
            replace: true,
            template: "<div class='loadingOverlay'><a><div id='spinWrapper'></div></a></div>",
            controller: function($scope, $element) {
                $scope.spinner = null;
                $scope.spinRunning = false;
                $scope.opts = {
                    lines: 15, // The number of lines to draw
                    length: 27, // The length of each line
                    width: 8, // The line thickness
                    radius: 60, // The radius of the inner circle
                    corners: 1, // Corner roundness (0..1)
                    rotate: 0, // The rotation offset
                    direction: 1, // 1: clockwise, -1: counterclockwise
                    color: '#000', // #rgb or #rrggbb or array of colors
                    speed: 0.6, // Rounds per second
                    trail: 24, // Afterglow percentage
                    shadow: true, // Whether to render a shadow
                    hwaccel: true, // Whether to use hardware acceleration
                    className: 'spinner', // The CSS class to assign to the spinner
                    zIndex: 2e9, // The z-index (defaults to 2000000000)
                    top: 'auto', // Top position relative to parent in px
                    left: 'auto' // Left position relative to parent in px
                };
                var initSpin = function() {
                    $scope.spinner = new Spinner($scope.opts).spin();
                }
                $scope.endSpin = function() {
                    if ($scope.spinner)
                        $scope.spinner.stop();
                    $scope.spinRunning = false;
                }
                $scope.spin = function() {
                    if ($scope.spinRunning) return;
                    var target = $element.find('#spinWrapper');
                    if ($scope.spinner == null)
                        initSpin();
                    $scope.spinner.spin(target[0]);
                    $scope.spinRunning = true;
                }
            },
            link: function(scope, element) {
                // hide the element initially
                element.hide();

                var startRequestHandler = function() {
                    // got the request start notification, show the element
                    element.show();
                    scope.spin();
                };

                var endRequestHandler = function() {
                    // got the request start notification, show the element
                    element.hide();
                    scope.endSpin();
                };

                requestNotificationChannel.onRequestStarted(scope, startRequestHandler);

                requestNotificationChannel.onRequestEnded(scope, endRequestHandler);
            }
        };
    }]).directive('onFinishRender', ["$timeout", 'requestNotificationChannel', function($timeout, requestNotificationChannel) {
        // requieres having requestNotificationChannel.requestStarted('list'); in parent controller
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
    ]
    );
