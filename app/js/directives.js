'use strict';
/* Directives */
angular.module('KMC.directives', ['colorpicker.module'])
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
    }])
    .directive('navmenu', ["$compile", '$parse', function($compile, $parse) {
        return  {
            template: "<ul ng-transclude=''></ul>",
            replace: true,
            restrict: 'E',
            transclude: true,
            priority: 1000,
            link: function($scope, $element, $attrs) {
                var BaseData = $attrs['data'];

                function renderFormElement(item, directive, appendTo, parentModel) {
                    var elm = angular.element(directive);
                    angular.forEach(item, function(value, key) {
                        if (key != 'model' && (typeof value == 'string' || typeof value == 'number')) {
                            elm.attr(key, value);
                        } else {
                            if (key == 'options' && typeof value == 'object')
                                if (Array.isArray(value))
                                    elm.attr(key, JSON.stringify(value));
                        }
                    });
                    if (typeof parentModel != "undefined") {
                        var subModelStr = parentModel + '.' + item.model;
                        elm.attr('model', subModelStr);
                    }
                    else {
                        elm.attr('model', BaseData + '.' + item.model);
                    }
                    if (item.type != 'menu')
                        elm = $('<li/>').html(elm);
                    var compiled = $compile(elm)($scope).appendTo(appendTo);
                    return compiled;
                }

                function renderMenuItems(item, origin) {
                    var originAppendPos = origin.find('ul[ng-transclude]:first');
                    if (originAppendPos.length < 1)
                        originAppendPos = origin;
                    switch (item.type) {
                        case  'menu':
                            var originModel = origin.attr('model') ? origin.attr('model') + '.' : BaseData;
                            var parent = renderFormElement(item, '<menu-level/>', originAppendPos, originModel);
                            var modelStr = originModel + item.model;
                            for (var j = 0; j < item.children.length; j++) {
                                var subitem = item.children[j];
                                var subappendPos = parent.find('ul[ng-transclude]:first');
                                switch (subitem.type) {
                                    case 'checkbox' :
                                        renderFormElement(subitem, '<model-checbox/>', subappendPos, modelStr);
                                        break;
                                    case 'select' :
                                        renderFormElement(subitem, '<model-select/>', subappendPos, modelStr);
                                        break;
                                    case 'color' :
                                        renderFormElement(subitem, '<model-color/>', subappendPos, modelStr);
                                        break;
                                    case 'number':
                                        renderFormElement(subitem, '<model-number/>', subappendPos, modelStr);
                                        break;
                                    case 'text':
                                        renderFormElement(subitem, '<model-text/>', subappendPos, modelStr);
                                        break;
                                    case 'menu':
                                        renderMenuItems(subitem, parent);
                                        break;
                                }
                            }
                            break;
                        case 'select' :
                            renderFormElement(item, '<model-select/>', originAppendPos);
                            break;
                        case 'checkbox' :
                            renderFormElement(item, '<model-checbox/>', originAppendPos);
                            break;
                        case 'color' :
                            renderFormElement(item, '<model-color/>', originAppendPos);
                            break;
                        case 'text' :
                            renderFormElement(item, '<model-text/>', originAppendPos);
                            break;
                        case 'number':
                            renderFormElement(item, '<model-number/>', originAppendPos);
                            break;
                    }
                }

                for (var i = 0; i < $scope.editProperties.length; i++) {
                    var item = $scope.editProperties[i];
                    renderMenuItems(item, $element);
                }
            }
        }
    }]).
    directive('modelColor',function() {
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
    }).directive('modelText',function() {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                label: "@",
                model: "="
            },
            template: "<label><input type='text' ng-model='model'/>{{label}}</label>"
        };
    }).directive('modelSelect',function() {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                label: "@",
                model: "=",
                initvalue: '@',
                selectOpts: '@'
            },
            link: function($scope, $element, $attrs) {
                if (typeof $attrs.options != 'undefined') {
                    $scope.options = JSON.parse($attrs.options);
                }
            },
            controller: function($scope, $element, $attrs) {
                $scope.options = [];
                if ($scope.model == '' || typeof $scope.model == 'undefined') {
                    $scope.model = $attrs.initvalue;
                }

                this.setOptions = function(optsArr) {
                    $scope.options = optsArr;

                }
            },

            template: '<label>{{label}}' +
                '<select ui-select2="selectOpts" ng-model="model" ng-options="item.value as item.label for item in options"> ' +
                '</select></label>'
        }
    }
).
    directive('modelChecbox',function() {
        return  {
            template: "<label>{{label}}<input type='checkbox' ng-model='model'></label>",
            replace: true,
            restrict: 'E',
            priority: 50,
            transclude: true,
            scope: {
                label: '@',
                model: '='
            }
        };
    }).directive('modelNumber',function() {
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
            link: function($scope, $element, $attrs) {

                var $spinner = $element.find('input').spinedit({
                    minimum: parseInt($scope.from),
                    maximum: parseInt($scope.to),
                    step: parseInt($scope.stepsize),
                    value: parseInt($scope.initvalue),
                    numberOfDecimals: parseInt($scope.numberofdecimals)
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
    }).
    directive('menuLevel', function() {
        return  {
            template: "<li class='icon icon-arrow-left'>\n\
                    <a class='icon icon-phone' data-ng-click='openLevel($event)'>{{label}}</a>\n\
                    <a class='mp-back' ng-click='goBack()' ng-show='isOnTop'>Back</a>\n\
                    <div class='mp-level'>\n\
                        <h2 class='icon icon-arrow-right-3'>{{label}}</h2>\n\
                        <ul ng-transclude=''>\n\
                        </ul>\n\
                    </div>\n\
                </li>",
            replace: true,
            priority: 70,
            restrict: 'E',
            controller: function($scope, $element) {
                $scope.goBack = function() {
                    $scope.isOnTop = false;
                }
                $scope.openLevel = function($event) {
                    $scope.isOnTop = true;
                }
                $scope.isOnTop = false;
                $scope.$watch('isOnTop', function(newVal, oldVal) {
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
                'label': '@'
            },
            transclude: 'true'

        };
    })
;