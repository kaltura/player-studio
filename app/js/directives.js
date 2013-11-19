'use strict';
/* Directives */
angular.module('KMC.directives', ['colorpicker.module'])
    .directive('timeago', [function () {
        return {
            scope: {timestamp: '@'},
            restrict: 'C',
            link: function (scope, iElement, iAttrs) {
                if (typeof $.timeago == 'function')
                    scope.$watch('timestamp', function (newVal, oldVal) {
                            if (newVal) {
                                var date = scope.timestamp * 1000;
                                iElement.text($.timeago(date));
                            }
                        }
                    )

            }
        }
    }]).directive('modelRadio', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="form-element">' +
                '<div class="radioLabel">{{ label }}</div>' +
                '<div class="form-group">' +
                '<label  ng-repeat="option in options" >' +
                '<input value="{{ option.value }}"  type="radio" ng-model="$parent.model"/>{{ option.label }}</label>' +
                '</div></div>',
            scope: {
                model: '=',
                label: '@'
            },
            controller: function ($scope, $element, $attrs) {
                if (typeof $attrs.options != 'undefined') {
                    $scope.options = JSON.parse($attrs.options);
                }

            },
            link: function (scope, element, attributes) {
                element.find('input').attr('name', scope.model);
            }
        }
    })

    .directive('modelColor',function () {
        return  {
            restrict: 'E',
            replace: true,
            scope: {
                class: '@',
                label: '@',
                model: "="
            },
            template: '<label>{{label}} \n\
                                <input colorpicker class="colorinput {{class}}" type="text" ng-model="model" />\n\
                                <span class="colorExample" style="background-color: {{model}}"></span>\n\
                            </label>'
        };
    }).directive('modelText',function () {
        return {
            replace: true,
            restrict: 'E',

            scope: {
                label: "@",
                model: "=",
                icon: '@'
            },
            // $parent.model is used because tooltip is creating an isolate scope.
            template: "<label ><i ng-if='icon' class='icon {{icon}}'></i>" +
                "<span class='inputHolder'><input class='form-control' tooltip='{{label}}' type='text' ng-model='$parent.model'/></span></label>"        };
    }).directive('modelSelect',function () {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                label: "@",
                model: "=",
                initvalue: '@',
                selectOpts: '@'
            },
            link: function ($scope, $element, $attrs) {

                if (typeof $attrs.options != 'undefined') {
                    $scope.options = angular.fromJson($attrs.options);
                }

            },
            controller: function ($scope, $element, $attrs) {
                if (!$scope.selectOpts) {
                    $scope.selectOpts = {};
                }
                if (!$attrs.showSearch) {
                    $scope.selectOpts.minimumResultsForSearch = -1;
                }
                $scope.uiselectOpts = angular.toJson($scope.selectOpts);
                $scope.options = [];
                if ($scope.model == '' || typeof $scope.model == 'undefined') {
                    $scope.model = $attrs.initvalue;
                }

                this.setOptions = function (optsArr) {
                    $scope.options = optsArr;

                }
            },

            template: '<label>{{label}}' +
                '<select ui-select2="{{uiselectOpts}}" ng-model="model" ng-options="item.value as item.label for item in options"> ' +
                '</select></label>'
        }
    }
).directive('prettyCheckbox',function () {
        return {
            restrict: 'AC',
            priority: 1000,
            transclude: 'element',
            compile: function (tElement, tAttrs, transclude) {
                return  function (scope, iElement, iAttr) {
                    var wrapper = angular.element('<div class="clearfix prettycheckbox"></div>');
                    var clickHandler = wrapper.append('<a href="#" class=""></a>');
                    transclude(scope, function (clone) {
                        return wrapper.append(clone);
                    });
                    iElement.replaceWith(wrapper);
                    var input = wrapper.find('input').hide();
                    clickHandler.on('click', 'a', function (e) {
                        e.preventDefault();
                        input.trigger('click');
                        return false;
                    });
                    var watchProp = 'model'
                    if (typeof iAttr['model'] != 'undefined') {
                        watchProp = iAttr['model'];
                    }
                    scope.$watch(function () {
                        return scope.$eval(watchProp);
                    }, function (newVal, oldVal) {
                        if (newVal != oldVal)
                            $(wrapper).find('a').toggleClass('checked');
                    });
                }
            }
        }
    }).
    directive('modelCheckbox',function () {
        return  {
            template: '<label>{{label}}' +
                '<input type="checkbox" class="prettyCheckbox" ng-model="model">' +
                '</label>',
            replace: true,
            restrict: 'E',
            scope: {
                label: '@',
                model: "="
            }
        };
    }).directive('readOnly',function () {
        return {
            restrict: 'E',
            replace: 'true',
            scope: {
                model: '=',
                label: '@'
            },
            template: '<label>{{ label }}<i class="icon {{icon}}"></i><span class="form-control" disabled>{{ model }}</span> </label>'
        }
    }).directive('modelButton',function (menuSvc) {
        return {
            restrict: 'E',
            replace: 'true',
            controller: function ($scope) {
                $scope.check = function (action) {
                    // for update button.. checks if needed
                    return   menuSvc.checkAction(action);
                }
                $scope.btnAction = function (action) {
                    menuSvc.doAction(action);
                }
            },
            scope: {
                label: '@',
                action: '@'
            },
            template: '<label ng-if="check(action)"><i class="icon {{icon}}"></i><button type="button" ng-click="btnAction(action)" class="btn btn-default">{{ label }}</button></label>'
        }
    }).directive('modelNumber', function () {
        return{
            templateUrl: 'template/spinedit/spinedit.html',
            replace: true,
            restrict: 'EA',
            scope: {
                model: "=",
                label: "@"
            },
            link: function ($scope, $element, $attrs) {
                var $spinner = $element.find('input').spinedit({
                    minimum: parseFloat($scope.from),
                    maximum: parseFloat($scope.to),
                    step: parseFloat($scope.stepsize),
                    value: parseFloat($scope.initvalue),
                    numberOfDecimals: parseFloat($scope.numberofdecimals)
                });
                $spinner.on("valueChanged", function (e) {
                    if (typeof e.value == 'number') {
                        $scope.$apply(function () {
                            $scope.model = e.value;
                        });
                    }

                });
            },
            controller: function ($scope, $element, $attrs) {
                var def = {
                    from: 5,
                    to: 10,
                    stepsize: 1,
                    numberOfDecimals: 0
                }
                var keys = ['from', 'to', 'stepsize', 'numberofdecimals'];

                angular.forEach(keys, function (keyName) {
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
    .directive('loadingWidget', ['requestNotificationChannel', function (requestNotificationChannel) {
        return {
            restrict: "E",
            scope: {},
            replace: true,
            template: "<div class='loadingOverlay'><a><div id='spinWrapper'></div></a></div>",
            controller: function ($scope, $element) {
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
                var initSpin = function () {
                    $scope.spinner = new Spinner($scope.opts).spin();
                }
                $scope.endSpin = function () {
                    if ($scope.spinner)
                        $scope.spinner.stop();
                    $scope.spinRunning = false;
                }
                $scope.spin = function () {
                    if ($scope.spinRunning) return;
                    var target = $element.find('#spinWrapper');
                    if ($scope.spinner == null)
                        initSpin();
                    $scope.spinner.spin(target[0]);
                    $scope.spinRunning = true;
                }
            },
            link: function (scope, element) {
                // hide the element initially
                element.hide();

                var startRequestHandler = function () {
                    // got the request start notification, show the element
                    element.show();
                    scope.spin();
                };

                var endRequestHandler = function () {
                    // got the request start notification, show the element
                    element.hide();
                    scope.endSpin();
                };

                requestNotificationChannel.onRequestStarted(scope, startRequestHandler);

                requestNotificationChannel.onRequestEnded(scope, endRequestHandler);
            }
        };
    }]).directive('onFinishRender', ["$timeout", 'requestNotificationChannel', function ($timeout, requestNotificationChannel) {
        // requieres having requestNotificationChannel.requestStarted('list'); in parent controller
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
    ]
    )
