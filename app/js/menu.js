'use strict';
/* Menu */
var KMCMenu = angular.module('KMC.menu', []);
KMCMenu.factory('menuSvc', ['editableProperties', '$rootScope', '$compile', function(editableProperties, $rootScope, $compile) {
    var menudata = null;
    var promise = editableProperties
        .success(function(data) {
            menudata = data;
        });
    var menuSVC = {
        promise: promise,
        get: function() {
            return menudata;
        },
        setMenu: function(setTo) {
            $rootScope.$broadcast('menuChange', setTo);
        },
        renderMenuItems: function(item, origin, BaseData, scope) {
            var originAppendPos = origin.find('ul[ng-transclude]:first');
            if (originAppendPos.length < 1)
                originAppendPos = origin;
            switch (item.type) {
                case  'menu':
                    var originModel = origin.attr('model') ? origin.attr('model') : BaseData;
                    var parent = renderFormElement(item, '<menu-level pagename=' + item.model + '/>', originAppendPos, originModel);
                    var modelStr = originModel + '.' + item.model;
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
                                menuSVC.renderMenuItems(subitem, parent, BaseData, scope);
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
                var compiled = $compile(elm)(scope).appendTo(appendTo);
                return compiled;
            }
        }
    };
    return menuSVC;

}]).directive('menuHead', ['menuSvc', '$compile', function(menuSvc, $compile) {
        return {
            restrict: 'E',
            template: "<div id='mp-mainlevel'><ul></ul></div>",
            replace: true,
            link: function(scope, iElement, iAttrs) {
                var ul = iElement.find('ul');
                var elements = menuSvc.get();
                angular.forEach(elements, function(value, key) {
                    var elm = angular.element('<li></li>');
                    elm.html('<a class="icon icon-' + value.icon + '" tooltip-placement="right" tooltip="' + value.label + '"></a>');
                    elm.on('click', function() {
                        menuSvc.setMenu(value.model);
                    });
                    $compile(elm)(scope).appendTo(ul);

                })
            }
        }
    }])
    .directive('navmenu', ["$compile", '$parse', 'menuSvc' , function($compile, $parse, menuSvc) {
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
            controller: function($scope, $element, $attrs) {
                var BaseData = $attrs['data'];
                var menuObj = menuSvc.get();
                var menuList = $element.find('ul[ng-transclude]:first');
                angular.forEach(menuObj, function(value, key) {
                    menuSvc.renderMenuItems(value, menuList, BaseData, $scope);
                });

            }, link: function($scope, $element, $attrs) {
                //open first level
                $element.find('#mp-base >ul > li > div.mp-level').addClass('mp-level-open');
            }
        }
    }]).
    directive('menuLevel', ['menuSvc', function(menuSvc) {
        return  {
            template: "<li>" +
                "<a class='menu-level-trigger' data-ng-click='openLevel()'>{{label}}</a>" +
                "<div class='mp-level'>" +
                "<a class='mp-back' ng-click='goBack()' ng-show='isOnTop'>Back</a>" +
                "<h2>{{label}}</h2>" +
                "<span class='levelDesc'>{{description}}</span>" +
                "<ul ng-transclude=''></ul>" +
                "</div>" +
                "</li>",
            replace: true,
            restrict: 'E',
            controller: function($scope, $element) {
                $scope.goBack = function() {
                    $scope.isOnTop = false;
                }
                $scope.openLevel = function(arg) {
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
                $scope.$on('menuChange', function(event, arg) {
                    $scope.openLevel(arg);
                });
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
                'label': '@',
                'pagename': '@',
                'description': '@'
            },
            transclude: 'true'
        };
    }]);