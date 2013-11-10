'use strict';
/* Menu */

var KMCMenu = angular.module('KMC.menu', []);
KMCMenu.factory('menuSvc', ['editableProperties', function (editableProperties) {
        var menudata = null;
        var promise = editableProperties
            .success(function (data) {
                menudata = data;
            });
        var menuSVC = {
            promise: promise,
            menuScope: {},
            get: function () {
                return menudata;
            },
            currentPage: 'basicSettings',
            setMenu: function (setTo) {
                menuSVC.currentPage = setTo;
                menuSVC.menuScope.$parent.$broadcast('menuChange', setTo);
            },
            buildMenuItem: function (item, targetMenu, BaseData, parentMenu) {
                var originAppendPos = angular.element(targetMenu).find('ul[ng-transclude]:first');
                if (originAppendPos.length < 1)
                    originAppendPos = targetMenu;
                switch (item.type) {
                    case  'menu':
                        var originModel = angular.element(targetMenu).attr('model') ? angular.element(targetMenu).attr('model') : BaseData;
                        var parentLabel = (parentMenu) ? parentMenu.label : 'Top';
                        var parent = writeFormElement(item, '<menu-level pagename="' + item.model + '" parent-menu="' + parentLabel + '"/>', originAppendPos, originModel);
                        var modelStr = originModel + '.' + item.model;
                        for (var j = 0; j < item.children.length; j++) {
                            var subitem = item.children[j];
                            switch (subitem.type) {
                                case 'checkbox' :
                                    writeFormElement(subitem, '<model-checbox/>', parent, modelStr);
                                    break;
                                case 'select' :
                                    writeFormElement(subitem, '<model-select/>', parent, modelStr);
                                    break;
                                case 'color' :
                                    writeFormElement(subitem, '<model-color/>', parent, modelStr);
                                    break;
                                case 'number':
                                    writeFormElement(subitem, '<model-number/>', parent, modelStr);
                                    break;
                                case 'text':
                                    writeFormElement(subitem, '<model-text/>', parent, modelStr);
                                    break;
                                case 'menu':
                                    menuSVC.buildMenuItem(subitem, parent, BaseData, item);
                                    break;
                            }
                        }
                        return parent;
                        break;
                    case 'select' :
                        return writeFormElement(item, '<model-select/>', originAppendPos);
                        break;
                    case 'checkbox' :
                        return writeFormElement(item, '<model-checbox/>', originAppendPos);
                        break;
                    case 'color' :
                        return writeFormElement(item, '<model-color/>', originAppendPos);
                        break;
                    case 'text' :
                        return  writeFormElement(item, '<model-text/>', originAppendPos);
                        break;
                    case 'number':
                        return writeFormElement(item, '<model-number/>', originAppendPos);
                        break;
                }
                function writeFormElement(item, directive, appendTo, parentModel) {
                    var elm = angular.element(directive);
                    elm.attr('highlight', item.model);
                    angular.forEach(item, function (value, key) {
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
                    return (elm).appendTo(appendTo);
                }
            },
            menuSearch: function (searchValue) {
                var search = function (path, obj, target) {
                    var found = false;
                    for (var k in obj) {
                        if (obj.hasOwnProperty(k) && ( k == 'label' || k == 'children' || typeof obj[k] == 'object'))
                            if (obj[k] === target)
                                return  path + "['" + k + "']"
                            else if (typeof obj[k] === "object") {
                                var result = search(path + "['" + k + "']", obj[k], target);
                                if (result)
                                    return result;
                            }
                    }
                    return false;
                }
                var foundLabel = search('menudata', menudata, searchValue);
                if (foundLabel) {
                    var foundModel = eval(foundLabel.substr(0, foundLabel.lastIndexOf("['label']"))).model;
                    var lastMenu = foundLabel.substr(0, foundLabel.lastIndexOf("['children']"));
                    var menuPage = eval(lastMenu);
                    menuSVC.menuScope.$broadcast('highlight', foundModel);
                    menuSVC.setMenu(menuPage.model);
                    return true;
                }
                else {
                    return false;
                }
            }

        };
        return menuSVC;
    }]).directive('highlight', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, iElem, iAttr) {
                scope.$on('highlight', function (e, data) {
                    if (iAttr.highlight == data) {
                        var originalBorder = iElem.css('border') || 'none';
                        var originalMargin = iElem.css('margin') || 'none';
                        iElem.css({'borderStyle':'solid','borderWidth': '2px','borderRadius':'10px','margin':'-4px 0'});
                        iElem.animate({'borderColor': '#FD0210'}, 1000);
                        $timeout(function () {
                            iElem.css({'border': originalBorder,'margin':originalMargin});
                        }, 4000);
                    }
                })
            }
        }
    }]).directive('navmenu', ['menuSvc' , function (menuSvc) {
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
            scope: {data: '='},
            transclude: true,
            compile: function (tElement) {
                var BaseData = 'data';
                var menuJsonObj = menuSvc.get(); // gets the  editableProperties json
                var menuList = tElement.find('ul[ng-transclude]:first');
                angular.forEach(menuJsonObj, function (value) {
                    menuSvc.buildMenuItem(value, menuList, BaseData);
                });
                return function ($scope, $element) {
                    //open first level
                    $element.find('#mp-base >ul > li:first > div.mp-level').addClass('mp-level-open');
                }
            },
            controller: function ($scope, $element, $attrs) {
                menuSvc.menuScope = $scope;
            }

        }
    }]).controller('menuSearchCtl',function ($scope, menuSvc) {
        var menuObj = menuSvc.get();
        $scope.menuData = [];
        $scope.menuSearch = '';
        $scope.$watch('menuSearch',function(newVal,oldVal){
            if (newVal!=oldVal){
                $scope.notFound=false;
            }
        })
        $scope.searchMenuFn = function () {
            $scope.notFound =false;
            var searchResult = menuSvc.menuSearch($scope.menuSearch);
            if (!searchResult)
                $scope.notFound = true;

        }
        var getLabels = function (obj) { // for autocomplete
            angular.forEach(obj, function (value, key) {
                $scope.menuData[key] = value.label;
                if (value.children) {
                    getLabels(value.children);
                }
            });
        };
        getLabels(menuObj);
    }
).
    directive('menuLevel', ['menuSvc', function (menuSvc) {
        return  {
            template: "<li>" +
                "<a class='menu-level-trigger' data-ng-click='openLevel()'>{{label}}</a>" +
                "<div class='mp-level'>" +
                "<a class='mp-back' ng-click='goBack()' ng-show='isOnTop'>Back to {{parentMenu}}</a>" +
                "<h2>{{label}}</h2>" +
                "<span class='levelDesc'>{{description}}</span>" +
                "<ul ng-transclude=''></ul>" +
                "</div>" +
                "</li>",
            replace: true,
            restrict: 'E',
            controller: function ($scope) {
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
            },
            link: function ($scope, $element) {
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
                'pagename': '@',
                'parentMenu': '@',
                'description': '@'
            },
            transclude: 'true'
        };
    }]).directive('menuHead', ['menuSvc', function (menuSvc) {
        return {
            restrict: 'E',
            template: "<div id='mp-mainlevel'><ul>" +
                "</ul></div>",
            replace: true,
            transclude: true,
            scope: {},
            controller: function ($scope, $element) {
                $scope.showSearchMenu = function (e) {
                    menuSvc.setMenu('search');
                    $(e.target).addClass('active');
                    $(e.target).parent('li').siblings('li').find('a').removeClass('active');
                }

            },
            compile: function (tElemnt, attr, transclude) {
                var ul = tElemnt.find('ul');
                var elements = menuSvc.get();
                angular.forEach(elements, function (value, key) {
                    var elm = angular.element('<li></li>');
                    elm.html('<a class="icon icon-' + value.icon + '" tooltip-placement="right" tooltip="' + value.label + '"></a>');
                    elm.on('click', function () {
                        menuSvc.setMenu(value.model);
                        elm.find('a').addClass('active');
                        elm.siblings('li').find('a').removeClass('active');
                    });
                    if (key == 0) elm.find('a').addClass('active');
                    elm.appendTo(ul);
                });
                return  function ($scope, $element) {
                    transclude($scope, function (transItem) {
                        ul.prepend(transItem);
                    });
                }
            }
        }
    }]);