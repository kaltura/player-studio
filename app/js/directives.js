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
    }])
    .directive('menuHead', ['menuSvc', '$compile', function (menuSvc, $compile) {
        return {
            restrict: 'E',
            template: "<div id='mp-mainlevel'><ul></ul></div>",
            replace: true,
            link: function (scope, iElement, iAttrs) {
                var ul = iElement.find('ul');
                var elements = menuSvc.get();
                angular.forEach(elements, function (value, key) {
                    var elm = angular.element('<li></li>');
                    elm.html('<a class="icon icon-' + value.icon + '" tooltip-placement="right" tooltip="' + value.label + '"></a>');
                    elm.on('click', function () {
                        menuSvc.setMenu(value.model);
                    });
                    $compile(elm)(scope).appendTo(ul);

                })
            }
        }
    }])
    .directive('navmenu', ["$compile", '$parse', 'menuSvc' , function ($compile, $parse, menuSvc) {
        return  {
            template: "<nav id='mp-menu'>" +
                "<div id='mp-inner'>" +
                "<div id='mp-base' class='mp-level'>" +
                "<ul ng-transclude=''></ul>" +
                "</div>" +
                "</div>" +
                "</nav>",
            replace: true,
            restrict: 'E',
            transclude: true,
            controller: function ($scope, $element, $attrs) {
                var BaseData = $attrs['data'];
                var menuObj = menuSvc.get();
                var menuList = $element.find('ul[ng-transclude]:first');
                angular.forEach(menuObj, function (value, key) {
                    menuSvc.renderMenuItems(value, menuList, BaseData, $scope);
                });

            }, link: function ($scope, $element, $attrs) {
                //open first level
                $element.find('#mp-base >ul > li > div.mp-level').addClass('mp-level-open');
            }
        }
    }]).
    directive('menuLevel', ['menuSvc', function (menuSvc) {
        return  {
            template: "<li>" +
                "<a class='menu-level-trigger' data-ng-click='openLevel()'>{{label}}</a>" +
                "<div class='mp-level'>" +
                "<a class='mp-back' ng-click='goBack()' ng-show='isOnTop'>Back</a>" +
                "<h2>{{label}}</h2>" +
                "<ul ng-transclude=''></ul>" +
                "</div>" +
                "</li>",
            replace: true,
            restrict: 'E',
            controller: function ($scope, $element) {
                $scope.goBack = function () {
                    $scope.isOnTop = false;
                }
                $scope.openLevel = function (arg) {
                    if (typeof arg == 'undefined')
                        $scope.isOnTop = true;

                    else {
                        if (arg == $scope.pagename) {
                            $scope.isOnTop = true;
                        }
                        else {
                            $scope.isOnTop = false;
                        }
                    }
                }
                $scope.isOnTop = false;
                $scope.$on('menuChange', function (event, arg) {
                    $scope.openLevel(arg);
                });
                $scope.$watch('isOnTop', function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        if (newVal) { // open
                            $element.parents('.mp-level:first').addClass('mp-level-in-stack');
                            $element.children('.mp-level').addClass('mp-level-open');
                        }
                        else { //close
                            $element.find('.mp-level').removeClass('mp-level-open');
                            $element.parents('.mp-level').removeClass('mp-level-in-stack');
                        }
                    }
                });
            },
            scope: {
                'label': '@',
                'pagename': '@'
            },
            transclude: 'true'
        };
    }])
    .directive('modelColor',function () {
        return  {
            restrict: 'E',
            replace: true,
            scope: {
                class: '@',
                label: '@',
                model: '='
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
            template: "<label><i class='icon {{icon}}'></i>" +
                "<input class='form-control' tooltip-placement='right' tooltip='{{label}}' type='text' ng-model='model'/></label>"        };
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
                    $scope.options = JSON.parse($attrs.options);
                }
            },
            controller: function ($scope, $element, $attrs) {
                $scope.options = [];
                if ($scope.model == '' || typeof $scope.model == 'undefined') {
                    $scope.model = $attrs.initvalue;
                }

                this.setOptions = function (optsArr) {
                    $scope.options = optsArr;

                }
            },

            template: '<label>{{label}}' +
                '<select ui-select2="selectOpts" ng-model="model" ng-options="item.value as item.label for item in options"> ' +
                '</select></label>'
        }
    }
).
    directive('modelChecbox',function () {
        return  {
            template: '<label>{{label}}' +
                '<div class="clearfix prettyCheck prettycheckbox">' +
                '<input type="checkbox" class="pretty-checkable" ng-model="model">' +
                '<a href="#" class=""></a>' +
                '</div></label>',
            replace: true,
            restrict: 'E',
            scope: {
                label: '@',
                model: '='
            },
            link: function (scope, iElement, iAttrs) {
                var input = iElement.find('input').hide();
                iElement.on('click', 'a', function (e) {
                    e.preventDefault();
                    input.trigger('click');
                    $(e.target).toggleClass('checked');
                    return false;
                })
            }
        };
    }).directive('modelNumber', function () {
        return{
            templateUrl: 'template/spinedit/spinedit.html',
            replace: true,
            restrict: 'EA',
            scope: {
                model: '=',
                from: '@',
                to: '@',
                label: '@',
                stepsize: '@',
                initvalue: '@',
                numberofdecimals: '@'
            },
            link: function ($scope, $element, $attrs) {

                var $spinner = $element.find('input').spinedit({
                    minimum: parseInt($scope.from),
                    maximum: parseInt($scope.to),
                    step: parseInt($scope.stepsize),
                    value: parseInt($scope.initvalue),
                    numberOfDecimals: parseInt($scope.numberofdecimals)
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
                if (!$attrs.from) $scope.from = 0;
                else $scope.from = $attrs.from;
                if (!$attrs.to) $scope.to = 10;
                $scope.to = $attrs.to;
                if (!$attrs.stepsize) $scope.stepsize = 1;
                $scope.stepsize = $attrs.stepsize;
                if (!$attrs.numberofdecimals) $scope.numberofdecimals = 0;
                $scope.numberofdecimals = $attrs.numberofdecimals;
                if (typeof $scope.model != 'undefined') {
                    $scope.initvalue = $scope.model;
                } else {
                    if (!$attrs['default']) $scope.initvalue = 1;
                    else  $scope.initvalue = $attrs['default'];
                }

            }
        }
    })
;