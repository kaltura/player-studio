'use strict';
/* Menu */

var KMCMenu = angular.module('KMC.menu', []);
KMCMenu.controller('menuCntrl', ['menuSvc', '$scope', function (menuSvc, $scope) {
    $scope.menuShown = true;
    $scope.$on('menuChange', function () {
        $scope.menuShown = true;
    });
    $scope.$watch(function () {
        return menuSvc.currentPage;
    }, function (newVal, oldVal) {
        if (newVal != oldVal) {
            if (!$scope.menuShown) {
                $scope.menuShown = true;
            }
        }
    });
    $scope.togglemenu = function () {
        $scope.menuShown = !$scope.menuShown;
    }
    $scope.$watch('menuShown', function (newVal, oldVal) {
        if (newVal != oldVal) {
            if (newVal) { //close
                $('#mp-pusher').animate(
                    {'left': '30%'},
                    { duration: 200, queue: true });
            }
            else {//open
                $('#mp-pusher').animate(
                    {'left': '0'},
                    { duration: 200, queue: true });

            }
        }
    })
}]);
KMCMenu.factory('menuSvc', ['editableProperties', function (editableProperties) {
        var menudata = null;
        var promise = editableProperties
            .success(function (data) {
                menudata = data;
            });

        var JSON2directiveDictionary = function (jsonName) {
            //this is now the single place one need to edit in order to add a directive to the menu generator
            switch (jsonName) {
                case 'dropdown' :
                    return  '<model-select/>';
                    break;
                case 'checkbox' :
                    return '<model-checkbox/>';
                    break;
                case 'color' :
                    return  '<model-color/>';
                    break;
                case 'text' :
                    return  '<model-text/>';
                    break;
                case 'number':
                    return  '<model-number/>';
                    break;
                case 'readonly':
                    return '<read-only/>';
                    break;
                case 'featuremenu':
                    return '<feature-menu/>';
                    break;
                case 'radio':
                    return '<model-radio/>';
                    break;
                case 'button':
                    return '<model-button/>';
                    break;
            }
        };
        var menuSvc = {
            promise: promise,
            menuScope: {},
            get: function () {
                return menudata;
            },
            currentPage: 'basicSettings',
            setMenu: function (setTo) {
                menuSvc.currentPage = setTo;
                menuSvc.menuScope.$parent.$broadcast('menuChange', setTo);
            },
            buildMenu: function (baseData) {
                var menuJsonObj = menuSvc.get(); // gets the  editableProperties json
                var menuElm = angular.element('<ul></ul>');
                angular.forEach(menuJsonObj, function (value) {
                    menuElm.append(menuSvc.buildMenuItem(value, menuElm, baseData));
                });
                return menuElm;
            },
            buildMenuItem: function (item, targetMenu, BaseData, parentModel) {
                var originAppendPos = angular.element(targetMenu).find('ul[ng-transclude]:first');
                if (originAppendPos.length < 1)
                    originAppendPos = targetMenu;
                var elm = '';
                switch (item.type) {
                    case  'menu':
                        var originModel = angular.element(targetMenu).attr('model') ? angular.element(targetMenu).attr('model') : BaseData;
                        var parentLabel = (parentModel) ? parentModel.label : 'Top';
                        var parentMenu = writeFormElement(item, '<menu-level pagename="' + item.model + '" parent-menu="' + parentLabel + '"/>', originModel);
                        elm = writeChildren(item, parentMenu, true);
                        break;
                    case 'featuremenu':
                        elm = writeChildren(item, writeFormElement(item, '<feature-menu/>', originAppendPos, originModel));
                        break;
                    default :
                        var directive = JSON2directiveDictionary(item.type);
                        if (directive)
                            elm = writeFormElement(item, JSON2directiveDictionary(item.type), originAppendPos);
                        break;

                }
                return elm;

                function writeChildren(item, parent, eachInLi) {
                    var parentModelStr = parent.attr('model');
                    for (var j = 0; j < item.children.length; j++) {
                        var subitem = item.children[j];
                        switch (subitem.type) {
                            case 'menu':
                                parent.append(menuSvc.buildMenuItem(subitem, parent, item.model, item));
                                break;
                            case 'featuremenu':
                                parent.append(writeChildren(subitem, writeFormElement(subitem, '<feature-menu/>', parentModelStr)));
                                break;
                            default :
                                var directive = JSON2directiveDictionary(subitem.type);
                                if (directive)
                                    parent.append(writeFormElement(subitem, directive, parentModelStr));
                                break;
                        }
                    }
                    if (eachInLi == true) {
                        parent.children().each(function () {
                            $(this).wrap('<li>');
                        });
                    }
                    return parent;
                }

                function writeFormElement(item, directive, parentModel) {
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
                    return elm;
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
                    var lastChild = foundLabel.lastIndexOf("['children']");
                    var lastMenu = foundLabel.substr(0, lastChild);
                    var menuPage = eval(lastMenu);
                    var featureMenu = [];
                    if (typeof menuPage == 'object') {
                        if (menuPage.type == 'featuremenu') {
                            while (typeof menuPage == 'object' && menuPage.type == 'featuremenu') {
                                featureMenu.push(menuPage);
                                lastChild = lastMenu.lastIndexOf("['children']");
                                menuPage = eval(lastMenu.substr(0, lastChild));
                                lastMenu = foundLabel.substr(0, lastChild);
                            }
                        }
                        menuSvc.menuScope.$broadcast('highlight', foundModel);
                        menuSvc.setMenu(menuPage.model);
                        if (featureMenu.length) {
                            angular.forEach(featureMenu, function (value) {
                                menuSvc.menuScope.$broadcast('openFeature', value.model);
                            })
                        }
                        return true;
                    }
                }
                else {
                    return false;
                }
            },
            actions: [],
            registerAction: function (callStr, dataFn) {
                menuSvc.actions[callStr] = dataFn;
            },
            doAction: function (action, arg) {
                if (typeof menuSvc.actions[action] == "function") {
                    menuSvc.actions[action].call(arg);
                }
            },
            checkAction: function (action) {
                if (typeof menuSvc.actions[action] == "function") {
                    return true;
                }
                return false;
            }

        };
        return menuSvc;
    }]).directive('featureMenu',function ($parse) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'template/formcontrols/featuremenu.html',
            transclude: true,
            controller: function ($scope, $element, $attrs) {
                $scope.label = $attrs['label'];
                if ($attrs.featureCheckbox != false) { //undefined is ok
                    $scope.featureModelCon = $parse($attrs['model'] + '._featureEnabled');
                    $scope.featureModel = $scope.featureModelCon($scope);
                    $scope.featureCheckbox = ($attrs.featureCheckbox) ? $attrs.featureCheckbox : true;
                }
                $scope.id = $attrs['model'].replace(/\./g, '_');
            },
            scope: true,
            compile: function (tElement, tAttr, transclude) {
                return  function (scope, element, attributes) {
                    scope.$watch('featureModel', function (newVal, oldVal) {
                        if (newVal != oldVal)
                            scope.featureModelCon.assign(scope, newVal);
                    })
                    transclude(scope, function (clone) {
                        element.find('ng-transclude').replaceWith(clone);
                    })
                    element.on('show.bs.collapse hide.bs.collapse', function () {
                        $(this).find('.header i.glyphicon').toggleClass('glyphicon-chevron-right glyphicon-chevron-down');
                    });
                    scope.$on('openFeature', function (e, args) {
                        if (args == (attributes['model'].split('.').pop())) {
                            element.find('.header').trigger('click');
                        }
                    })
                }
            }
        }
    }).directive('highlight', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, iElem, iAttr) {
                scope.$on('highlight', function (e, data) {
                    if (iAttr.highlight == data) {
                        var originalBorder = iElem.css('border') || 'none';
                        var originalMargin = iElem.css('margin') || 'none';
                        iElem.css({'borderStyle': 'solid', 'borderWidth': '2px', 'borderRadius': '10px', 'margin': '-4px 0'});
                        iElem.animate({'borderColor': '#FD0210'}, 1000);
                        $timeout(function () {
                            iElem.css({'border': originalBorder, 'margin': originalMargin});
                        }, 4000);
                    }
                })
            }
        }
    }]).directive('navmenu', ['menuSvc' , '$compile', function (menuSvc, $compile) {

        return  {
            template: "<nav  ng-form name='playerEdit' id='mp-menu'>" +
                "<div id='mp-inner'>" +
                "<div id='mp-base' class='mp-level'>" +
                "<ul ng-transclude></ul>" +
                "</div>" +
                "</div>" +
                "</nav>",
            replace: true,
            restrict: 'E',
            scope: {data: '=', 'actions': '&'},
            transclude: true,
            compile: function (tElement, tAttrs, transclude) {
                var menuElem = tElement.find('ul[ng-transclude]:first');
                var menuData = menuSvc.buildMenu('data');
                return function ($scope, $element) {
                    // menuElem.append(menuData.html());
                    $compile(menuData.contents())($scope, function (clone) {
                        menuElem.prepend(clone);
                    });
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
        $scope.$watch('menuSearch', function (newVal, oldVal) {
            if (newVal != oldVal) {
                $scope.notFound = false;
            }
        })
        $scope.searchMenuFn = function () {
            $scope.notFound = false;
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
            template: "<li><a class='menu-level-trigger' data-ng-click='openLevel()'>{{label}}</a>" +
                "<div class='mp-level'>" +
                "<a class='mp-back' ng-click='goBack()' ng-show='isOnTop'>Back to {{parentMenu}}</a>" +
                "<h2>{{label}}</h2>" +
                "<span class='levelDesc'>{{description}}</span>" +
                "<ul ng-transclude></ul>" +
                "</div></li>",
            replace: true,
            transclude: 'true',
            restrict: 'E',
            controller: function ($scope, $element) {
                $scope.goBack = function () {
                    $scope.isOnTop = false;
                    $element.parents('.mp-level').addClass('mp-level-open'); // TODO: should be impoved to use more angular way...
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
            compile: function (telement, tattr, transclude) {
                return  function ($scope, $element) {

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
                }
            },
            scope: {
                'label': '@',
                'pagename': '@',
                'parentMenu': '@',
                'description': '@'
            }

        };
    }]).
    directive('menuHead', ['menuSvc', function (menuSvc) {
        return {
            restrict: 'E',
            template: "<div id='mp-mainlevel'><ul>" +
                "</ul></div>",
            replace: true,
            transclude: true,
            scope: {},
            controller: function ($scope, $element) {
                $scope.changeActiveItem = function (element) {
                    var menuitem = $(element);
                    if (menuitem.length && menuitem.is('a') && menuitem.parent('li')) {
                        $(menuitem).addClass('active');
                        $(menuitem).parent('li').siblings('li').find('a').removeClass('active');
                    }
                };
            },
            compile: function (tElement, attr, transclude) {
                var ul = tElement.find('ul');
                var elements = menuSvc.get();
                angular.forEach(elements, function (value, key) {
                    var elm = angular.element('<li></li>');
                    elm.html('<a menupage="' + value.model + '" class="icon icon-' + value.icon + '" tooltip-placement="right" tooltip="' + value.label + '"></a>');
                    if (key == 0) elm.find('a').addClass('active');// set first icon active
                    elm.appendTo(ul);
                });
                return  function ($scope, $element) {
                    transclude($scope, function (transItem) {
                        ul.prepend(transItem);
                    });
                    $element.find('a[menupage]').each(function () {
                        $(this).click(function () {
                            var model = $(this).attr('menupage');
                            menuSvc.setMenu(model);
                            $scope.changeActiveItem(this);
                        })
                    });
                }
            }
        }
    }]);