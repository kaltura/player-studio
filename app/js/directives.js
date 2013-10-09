'use strict';
/* Directives */
angular.module('KMC.directives', ['colorpicker.module']).
    directive('navmenu', ["$compile", function ($compile) {


        return  {
            template: "<ul ng-transclude=''></ul>",
            replace: true,
            restrict: 'E',
            transclude: true,
            priority: 1000,
            scope: {
                editProperties: '=',
                data: '='
            },
            link: function ($scope, $element, $attrs) {
                function renderFormElement(item, directive, appendTo, parentModel) {
                    var elm = angular.element(directive);
                    if (typeof item.options != 'undefined') {
                        elm.attr('options', $scope.$eval(item.options));
                    }
                    elm.attr('label', item.label);
                    if (typeof parentModel != "undefined") {
                        var subModelStr = parentModel + '.' + item.model;
                        elm.attr('model', subModelStr);
                    }
                    else {
                        elm.attr('model', item.model);
                    }
                    return $compile(elm)($scope).appendTo(appendTo);
                }

                function renderMenuItems(item, origin) {
                    var originAppendPos = origin.find('ul[ng-transclude]:first');
                    if (originAppendPos.length < 1)
                        originAppendPos = origin;
                    switch (item.type) {
                        case  'menu':
                            var originModel = origin.attr('model') ? origin.attr('model') + '.' : 'data.';
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
                                    case 'colorinput' :
                                        renderFormElement(subitem, '<model-color/>', subappendPos, modelStr);
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
                        case 'colorinput' :
                            renderFormElement(item, '<model-color/>', originAppendPos);
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
    directive('modelColor',function () {
        return  {
            restrict: 'E',
            replace: true,
            scope: {
                class: '@',
                label: '@',
                model: '='
            },
            template: '<label>{{label}} \n\
                                <input colorpicker class="{{class}}" type="text" ng-model="model" />\n\
                            </label>'
        };
    }).directive('modelSelect',function () {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                options: "=",
                label: "@"
            },
            template: '<label>{{label}}' +
                '<select>' +
                '<option ng-repeat="option in options" value="{{option.value}}">{{option.label}}</option>' +
                '</select></label>'
        }
    }).directive('modelChecbox',function () {
        return  {
            template: "<label><input type='checkbox' ng-model='model'>{{label}}</label>",
            replace: true,
            restrict: 'E',
            priority: 50,
            transclude: true,
            scope: {
                label: '@',
                model: '='
            }
        };
    }).directive('menuLevel', function () {
        return  {
            template: "<li class='icon icon-arrow-left'>\n\
                    <a class='icon icon-phone' href='#'>{{label}}</a>\n\
                    <div class='mp-level'>\n\
                        <h2>{{label}}</h2>\n\
                        <ul ng-transclude=''>\n\
                        </ul>\n\
                    </div>\n\
                </li>",
            replace: true,
            priority: 70,
            restrict: 'E',
            scope: {
                'label': '@'
            },
            transclude: 'true'
        };
    });



         