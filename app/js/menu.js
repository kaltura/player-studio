'use strict';
/* Menu */

var KMCMenu = angular.module('KMC.menu', []);
KMCMenu.controller('menuCntrl', ['menuSvc', '$scope', function (menuSvc, $scope) {
    logTime('menuCntrl');
    var getWidth = function () {
        return $('#mp-menu').width();
    };
    var closeMenu = function () {
        var width = getWidth();
        $('#mp-pusher').animate(
            {'left': '0'},
            { duration: 200, queue: true });
        $('#mp-menu').animate({'left': '-' + width});
        $('#mp-pusher >.wrapper').animate({'width': '100%'});
    };
    var resetMenu = function () {
        var width = getWidth();
        $('#mp-pusher').css({'left': width});
        $('#mp-menu').css({'left': -width});
    };
    var openMenu = function () {
        var width = getWidth();
        $('#mp-pusher').animate(
            {'left': width},
            { duration: 200, queue: true });
        $('#mp-menu').animate({'left': -width}, { duration: 200, queue: false });
        $('#mp-pusher >.wrapper').animate({'width': '70%'}, { duration: 200, queue: true });
    };
    $scope.menuShown = true; //initial value
    $scope.menuInitDone = false;
    resetMenu();
    $(window).resize(function () {
        if ($scope.menuShown === true)
            resetMenu();
        else {
            closeMenu();
        }
    });
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
    $scope.togglemenu = function (e) {
        $scope.menuShown = !$scope.menuShown;
        var disTarget = $(e.target);
        if (disTarget.is('i')) {
            disTarget = disTarget.parent('a');
        }
        if (!$scope.menuShown)
            disTarget.css('transform', 'rotate(180deg)');//.delay(500).toggleClass('icon-open icon-Close');
        else
            disTarget.css('transform', '');//.delay(500).toggleClass('icon-open icon-Close');
    };

    $scope.$watch('menuShown', function (newVal, oldVal) {
        if (newVal != oldVal) {
            if (newVal) {
                openMenu();
            }
            else {
                closeMenu();
            }
        }
    });
}]);
KMCMenu.factory('menuSvc', ['editableProperties', '$timeout', '$compile', function (editableProperties, $timeout, $compile) {
        var menudata = null;
        var promise = editableProperties
            .then(function (data) {
                menudata = data;
            });
        var menuItems = [];
        var menuFn = {};
        var refreshableDirectives = function (jsonName) {
            switch (jsonName) {
                case 'modaledit':
                case  'select2data':
                case 'dropdown':
                case  'checkbox':
                case  'color':
                case  'url':
                case  'text':
                case   'number':
                case  'radio':
                    return true;
                default:
                    return false;

            }
        };
        var JSON2directiveDictionary = function (jsonName) {
            //this is now the single place one need to edit in order to add a directive to the menu generator
            switch (jsonName) {
                case 'modaledit' :
                    return '<div model-edit/>';
                case 'divider' :
                    return '<div divider/>';
                case 'tags' :
                    return '<div model-tags/>';
                case 'select2data' :
                    return '<div select2-data/>';
                case 'dropdown' :
                    return  '<div model-select/>';
                case 'container' :
                    return  '<div model-select parent-container=""/>';
                case 'checkbox' :
                    return '<div model-checkbox/>';
                case 'color' :
                    return  '<div model-color/>';
                case 'text' :
                    return '<div model-text/>';
                case 'url' :
                    return '<div model-text validate="url"/>';
                case 'number':
                    return  '<div model-number/>';
                case 'readonly':
                    return '<div read-only/>';
                case 'featuremenu':
                    return '<div feature-menu/>';
                case 'radio':
                    return'<div model-radio/>';
                case 'button':
                    return '<div model-button/>';
                case 'infoAction':
                    return '<div info-action/>';
                case "sortOrder":
                    return '<div sort-order/>';
                case "hidden":
                    return '<span hidden-value/>';
            }
        };
        var searchGet = function (obj, target) { // get object by exact path
            if (typeof obj[target] != 'undefined') {
                return obj[target];
            }
        };
        var search = function (path, obj, target) {
            for (var k in obj) {
                if (obj.hasOwnProperty(k) && ( k == 'label' || k == 'children' || typeof obj[k] == 'object'))
                    if (obj[k] == target)
                        return  path + "['" + k + "']";
                    else if (typeof obj[k] == "object") {
                        var result = search(path + "['" + k + "']", obj[k], target);
                        if (result)
                            return result;
                    }
            }
            return false;
        };
        var Search4ControlModelData = function (path, obj, target) {
            for (var k in obj) {
                if (obj.hasOwnProperty(k) && ( k == 'label' || k == 'children' || typeof obj[k] == 'object'))
                    if (obj[k] && typeof obj[k].model != 'undefined' && obj[k].model == target)
                        return obj[k];
                    else if (typeof obj[k] === "object") {
                        var result = Search4ControlModelData(path + "['" + k + "']", obj[k], target);
                        if (result)
                            return result;
                    }
            }
            return false;
        };
        var menuSvc = {
            promise: promise,
            menuScope: {},
            currentTooltip: null,
            closeTooltips: function (e) {
                if (menuSvc.currentTooltip && e.target != menuSvc.currentTooltip) {
                    $(menuSvc.currentTooltip).trigger('customShow');
                    menuSvc.currentTooltip = null;
                }
            },
            get: function () {
                return menudata;
            },
            getModalData: function (model) {
                return searchGet(menuSvc.menuScope, model);
            },
            getControlData: function (model) {
                var modelStr = model.substr(model.indexOf(".") + 1); //remove the data.
                return  Search4ControlModelData('', menudata, modelStr);
            },
            currentPage: '',
            setMenu: function (setTo) {
                menuSvc.currentPage = setTo;
                if (typeof  menuSvc.spinnerScope != 'undefined' && setTo != 'search') {
                    menuSvc.spinnerScope.spin();
                }
                menuSvc.menuScope.$broadcast('menuChange', setTo);
            },
            menuCache: null,
            compliedMenuCache: null,
            getPutCompliedMenu2Cache: function (menuFn) {
                if (!menuFn) {
                    if (menuSvc.compliedMenuCache) {
                        return menuSvc.compliedMenuCache;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return menuSvc.compliedMenuCache = menuFn;
                }
            },
            buildMenu: function (baseData) {
                if (menuItems.length === 0) {
                    var menuJsonObj = menuSvc.get(); // gets the  editableProperties manifest json
                    angular.forEach(menuJsonObj, function (value) {
                        var menuItem = menuSvc.buildMenuItem(value, baseData);
                        menuFn[menuItem.attr('pagename')] = $compile(menuItem);
                    });
                }
                return menuFn;
            },
            buildMenuItem: function (item, BaseData, parentModel) {
                var elm = '';
                switch (item.type) {
                    case  'menu':
                        var menuLevelObj = angular.element('<div menu-level pagename="' + item.model + '" />');
                        if (typeof parentModel != 'undefined') {
                            menuLevelObj.attr('parent-label', parentModel.label);
                            menuLevelObj.attr('parent-page', parentModel.model);
                        }
                        var parentMenu = writeFormElement(item, menuLevelObj);
                        elm = writeChildren(item, parentMenu, true);
                        break;
                    case 'featuremenu':
                        elm = writeChildren(item, writeFormElement(item, 'featuremenu'));
                        break;
                    default :
                        var directive = JSON2directiveDictionary(item.type);
                        if (directive)
                            elm = writeFormElement(item, directive);
                        break;
                }
                return elm;

                function writeChildren(item, parent, eachInLi) {
                    angular.forEach(item.children, function (subitem) {
                        switch (subitem.type) {
                            case 'menu':
                                parent.append(menuSvc.buildMenuItem(subitem, item.model, item));
                                break;
                            case 'featuremenu':
                                parent.append(writeChildren(subitem, writeFormElement(subitem, 'featuremenu')));
                                break;
                            default :
                                parent.append(writeFormElement(subitem, subitem.type));
                                break;
                        }
                    });
                    if (eachInLi === true) { //problematic perhaps - creates another scope for some reason.
                        parent.children().each(function () {
                            if (!$(this).is('menu-level'))
                                $(this).wrap('<li>');
                        });
                    }
                    return parent;
                }

                function writeFormElement(item, directive) {
                    var strDirective;
                    if (typeof directive == 'string') {
                        strDirective = directive;
                        directive = JSON2directiveDictionary(directive);
                        if (!directive) return;
                    }
                    var elm = angular.element(directive);
                    if (typeof item.model != 'undefined' && item.model[0] == '~') {
                        elm.attr('model', item.model.substr(1));
                    }
                    else {
                        elm.attr('model', 'data.' + item.model);
                    }
                    if (strDirective) {
                        if (item['player-refresh'] !== false) { // undefined is also triggering player-refresh
                            if (refreshableDirectives(strDirective)) {
                                elm.attr('player-refresh', ( item['player-refresh'] || true));
                            }
                        }
                    }
                    angular.forEach(item, function (value, key) {
                        if (key != 'model' && key != 'player-refresh' &&
                            (typeof value == 'string' ||
                                typeof value == 'number' ||
                                typeof value == 'boolean')) {
                            elm.attr(key, value);
                        }
                    });
                    if (item.require) {
                        elm.attr('label', '* ' + item.label);
                    }
                    return elm;
                }
            },
            menuSearch: function (searchValue) {
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
                        else if (menuPage.type == 'menu' && menuPage.model.indexOf('.') !== -1) {
                            var previousMenu = eval(lastMenu.substr(0, lastMenu.lastIndexOf("['children']"))); // same as before but all together now...
                            menuSvc.setMenu(previousMenu.model);
                            $timeout(function () {
                                menuSvc.setMenu(menuPage.model);
                            });
                        }
                        else {
                            menuSvc.setMenu(menuPage.model);
                        }
                        menuSvc.menuScope.$broadcast('highlight', 'data.' + foundModel);
                        if (featureMenu.length) {
                            angular.forEach(featureMenu, function (value) {
                                menuSvc.menuScope.$broadcast('openFeature', 'data.' + value.model);
                            });
                        }
                        return true;
                    }
                }
                else {
                    return false;
                }
            },
            actions: [],
            registerAction: function (callStr, dataFn, context) {
                if (typeof dataFn == "function") {
                    if (!context)
                        menuSvc.actions[callStr] = dataFn;
                    else {
                        menuSvc.actions[callStr] = {applyOn: context, funcData: dataFn};
                    }
                } else if (typeof dataFn == "object") {
                    menuSvc.actions[callStr] = {applyOn: dataFn, funcData: function () {
                        return dataFn;
                    }};
                }
            },
            doAction: function (action, arg) {
                if (typeof menuSvc.actions[action] == "function") {
                    return  menuSvc.actions[action].call(arg);
                }
                else if (typeof menuSvc.actions[action] == "object" && typeof menuSvc.actions[action].funcData == "function") {
                    var retData = menuSvc.actions[action].funcData.apply(menuSvc.actions[action].applyOn, arg);
                    return  retData;
                }
            },
            getAction: function (action) {
                return menuSvc.actions[action];
            },
            checkAction: function (action) {
                if (typeof menuSvc.actions[action] == "function") {
                    return true;
                }
                return false;
            },
            makeFeatureCheckbox: function ($scope, $attrs) {
                if ($attrs['model']) {
                    var ModelArr = $attrs['model'].split('.');
                    $scope.FeatureModel = ModelArr.pop();
                    var parentStr = ModelArr.join('.');
                    $scope.parentModel = menuSvc.menuScope.$eval(parentStr);
                    $scope.featureModelCon = menuSvc.menuScope.$eval($attrs['model']);
                    $scope.featureCheckbox = ($attrs.featureCheckbox == 'false') ? false : true;//undefined is ok - notice the string type
                    if ($scope.featureCheckbox) {
                        if (!$scope.featureModelCon) {
                            if ($scope.parentModel)
                                $scope.featureModelCon = $scope.parentModel[$scope.FeatureModel] = {_featureEnabled: false};
                            else
                                $scope.featureModelCon = {_featureEnabled: false};
                        }
                        $scope.isDisabled = ($scope.featureModelCon._featureEnabled) ? false : true;
                    }
                }
            },
            linkFn4FeatureCheckbox: function (scope) {
                if (scope.featureCheckbox) {
                    scope.$watch('featureModelCon._featureEnabled', function (newval, oldVal) {
                        if (newval != oldVal) {
                            if (!newval) {// feature disabled  - delete control data
                                //scope.$parent.$broadcast('disableControls');
                                scope.isDisabled = true;
                                if (typeof scope.isCollapsed != 'undefined') { // if featureMenu
                                    $timeout(function () {
                                        scope.isCollapsed = true;
                                    });
                                }
                                else {// it's a subpage
                                    if (typeof scope.goBack == 'function') {
                                        scope.goBack();
                                    }
                                }
                            }
                            else {
                                //Enabled feature
                                scope.isDisabled = false;
                                if (scope.parentModel)
                                    scope.parentModel[scope.FeatureModel] = scope.featureModelCon;
                                //scope.$parent.$broadcast('enableControls');
                            }
                        }
                    });
                }
            }
        };
        return menuSvc;
    }
    ]).
    directive('featureMenu', ['menuSvc', function (menuSvc) { //TODO: implement ng-form controller for dirty state
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'template/menu/featureMenu.html',
            transclude: true,
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                menuSvc.makeFeatureCheckbox($scope, $attrs);
                $scope.isCollapsed = true;
                // feature made enabled - open the settings
                $scope.openFeature = function () {
                    if ($scope.isCollapsed) {
                        $scope.isCollapsed = false;
                    }
                };
                $scope.toggleFeature = function () {
                    $scope.isCollapsed = !$scope.isCollapsed;
                };
            }
            ],
            scope: {
                label: '@',
                description: '@'
            },
            compile: function (tElement, tAttr) {
                if (tAttr['endline'] != 'false') {
                    tElement.append('<hr/>');
                }
                return  function (scope, element, attributes) {
                    scope.$watch('isCollapsed', function (newVal, oldVal) {
                        if (newVal != oldVal) {
                            scope.$root.$broadcast('layoutChange');
                        }
                    });
                    //  var initDone = menuSvc.menuScope.$on('menuInitDone', function () {
                    menuSvc.linkFn4FeatureCheckbox(scope);
                    // initDone(); //remove the $on listener
                    //  });
                    scope.$on('openFeature', function (e, args) {
                        if (args == attributes['model']) {
                            scope.openFeature();
                        }
                    });
                };
            }
        };
    }]).
    directive('model', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, iElem, iAttr) {
                scope.$on('highlight', function (e, data) {
                    if (iAttr.model == data) {
                        var elm = iElem;
                        if (iElem.parent().is('li'))
                            elm = iElem.parent();
                        var originalBG = elm.css('background') || 'transparent';
                        elm.css({'backgroundColor': 'rgba(253,255,187,1)'});
                        $timeout(function () {
                            elm.animate({'backgroundColor': 'rgba(253,255,187,0)'}, 1000, function () {
                                elm.css({'backgroundColor': originalBG}, 1000);
                            });
                        }, 4000);
                    }
                });
            }
        };
    }]).directive('navmenu', ['menuSvc' , '$compile', '$timeout', '$routeParams', 'PlayerService' , '$q', '$templateCache', function (menuSvc, $compile, $timeout, $routeParams, PlayerService, $q, $templateCache) {
        return  {
            templateUrl: 'template/menu/navmenu.html',
            replace: true,
            restrict: 'EA',
            priority: 100,
            transclude: true,
            controller: function ($scope) {
                $scope.scroller = null;
                menuSvc.menuScope = $scope;
                $scope.menuInitDone = false;
                $scope.data = $scope.$parent.data;
                $scope.settings = $scope.$parent.settings;
                return {spinnerScope: null};
            },
            compile: function (tElement) {
                var menuData = menuSvc.buildMenu('data'); // is cached internally in menuSVC.
                var menuElem = tElement.find('#mp-base >  ul');
                return function ($scope, $element, $attrs, controller, transclude) {
                    menuSvc.spinnerScope = controller.spinnerScope;
                    transclude($scope, function (clone) {
                        angular.forEach(clone, function (elem) {
                            if ($(elem).is('li')) {
                                menuElem.append(elem);
                            }
                            else {
                                $(elem).prependTo(tElement);
                            }
                        });
                    });
                    var timeVar = null;
                    var timeVar1 = null;
                    $scope.menuInitDone = false;

                    $scope.$on('menuChange', function (e, page) { //TODO: move the scroller into the menuSVC and this $on into the menuLevel already existing event listener,
                        // instate a scroller on the selected menupage withut using the css selector
                        if (page != 'search') {
                            if (page.indexOf('.') === -1 && menuElem.children('[pagename="' + page + '"]').length === 0) { // check its not a subpage and doesn't exist already
                                menuData[page]($scope, function (htmlData) { // here the menu is invoked against the scope and so populated with data
                                    htmlData.appendTo(menuElem);
                                });
                            }
                            if (timeVar) {
                                $timeout.cancel(timeVar);
                            }
                            timeVar = $timeout(function () {
                                if (menuSvc.spinnerScope) {
                                    menuSvc.spinnerScope.endSpin();
                                }
                                if ($scope.scroller) {
                                    $scope.scroller.mCustomScrollbar('destroy');
                                    $scope.scroller = null;
                                }
                                $element.find('.mCustomScrollbar').mCustomScrollbar('destroy'); // clear all scrollbars (nested won't work well)
                                if (!$scope.scroller) {
                                    $scope.scroller = $element.find('.mp-level-open:last').mCustomScrollbar({set_height: '99%'});
                                }
                                timeVar = null;
                            });
                        }
                    });
                    $scope.$on('layoutChange', function () {
                        if (timeVar1) {
                            $timeout.cancel(timeVar1);
                        }
                        timeVar1 = $timeout(function () {
                            if ($scope.scroller)
                                $scope.scroller.mCustomScrollbar('update');
                            timeVar1 = null;
                        }, 200);
                    });
                    $timeout(function () {
                        // var page = $routeParams['menuPage'] | 'basicDisplay';
                        menuSvc.setMenu('basicDisplay');
                        logTime('menuInitDone');
                        $('div.section[ng-view]').on('click', menuSvc.closeTooltips);
                        $scope.menuInitDone = true;
                        $scope.$root.$broadcast('menuInitDone');
                    }, 200).then(function () {
                        $timeout(function () {
                            if (!$scope.newPlayer) {
                                $scope.playerEdit.$setPristine();
                            }
                        }, 500);
                    });
                };
            }
        };
    }]).
    controller('menuSearchCtl', ['$scope', 'menuSvc', function ($scope, menuSvc) {
        var menuObj = menuSvc.get();
        $scope.menuData = [];
        $scope.checkSearch = function (val) {
            if (val)
                console.log(val);
            $scope.notFound = false;
            if ($scope.menuSearch) {
                $scope.searchMenuFn();
            }
        };
        $scope.menuSearch = '';
        $scope.searchMenuFn = function () {
            var searchResult = menuSvc.menuSearch($scope.menuSearch);
            if (!searchResult)
                $scope.notFound = true;
            else {
                $scope.menuSearch = ''; //reset for next time
            }
        };
        var getLabels = function (obj) { // for autocomplete
            angular.forEach(obj, function (value, key) {
                $scope.menuData.push(value.label);
                if (value.children) {
                    getLabels(value.children);
                }
            });
        };
        getLabels(menuObj);
    }]
    ).
    directive('menuLevel', ['menuSvc', '$window', '$routeParams', function (menuSvc, $window, $routeParams) {
        return  {
            templateUrl: 'template/menu/menuPage.html',
            replace: true,
            transclude: 'true',
            restrict: 'EA',
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                menuSvc.makeFeatureCheckbox($scope, $attrs);
                if (!$attrs['parentPage']) { // only plugins can be disabled;
                    $scope.isDisabled = false;
                }
                $scope.selfOpenLevel = function () {
                    menuSvc.setMenu($attrs.pagename);
                };
                $scope.goBack = function () {
                    menuSvc.setMenu($attrs.parentPage);//call the parent
                };
                $scope.openLevel = function (arg) {
                    if (typeof arg == 'undefined')
                        return $scope.isOnTop = true;

                    else if (arg == $scope.pagename) {
                        return  $scope.isOnTop = true;
                    }
                    return $scope.isOnTop = false;
                };
                $scope.isOnTop = false;
            }],
            compile: function (tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.find('div.header').append('<hr/>');
                }
                if (tAttr['parentPage']) {
                    var content = tElement.html();
                    tElement.replaceWith(angular.element('<div type="menupage" class="form-element"></div>').append(content));
                }
                return  function ($scope, $element, $attrs) {
                    $scope.$on('menuChange', function (event, arg) {
                        $scope.openLevel(arg);
                    });
                    menuSvc.linkFn4FeatureCheckbox($scope);
                    $scope.$watch('isOnTop', function (newVal) {
                        if (newVal) { // open
//                            if (!$routeParams['menuPage'])
//                                $window.location('/edit/' + $routeParams['id'] + '/' + $attrs.pagename);
                            $element.parents('.mp-level:not("#mp-base")').addClass('mp-level-in-stack');
                            $element.children('.mp-level:first').addClass('mp-level-open').removeClass('mp-level-in-stack');
                        }
                        else { //close
                            $element.children('.mp-level:first').removeClass('mp-level-open');
                            $element.parents('.mp-level.mp-level-in-stack:not("#mp-base")').removeClass('mp-level-open mp-level-in-stack');
                        }
                    });
                };
            },
            scope: {
                'label': '@',
                'model': '=',
                'pagename': '@',
                'parentPage': '@',
                'parentLabel': '@',
                'description': '@'
            }
        };
    }]).
    directive('menuHead', ['menuSvc', function (menuSvc) {
        return {
            restrict: 'EA',
            template: "<div id='mp-mainlevel'><ul ng-transclude>" +
                "</ul></div>",
            replace: true,
            transclude: true,
            scope: {},
            controller: ['$scope', '$element', function ($scope) {
                $scope.changeActiveItem = function (element) {
                    var menuitem = $(element);
                    if (menuitem.length && menuitem.is('a') && menuitem.parent('li')) {
                        $(menuitem).addClass('active');
                        $(menuitem).parent('li').siblings('li').find('a').removeClass('active');
                    }
                };
            }],
            compile: function (tElement) {
                var ul = tElement.find('ul');
                var elements = menuSvc.get();
                return  function ($scope, $element, $attrs) {
                    angular.forEach(elements, function (value, key) {
                        var elm = angular.element('<li></li>');
                        elm.html('<a menupage="' + value.model + '" class="icon icon-' + value.icon + '" tooltip-placement="right" tooltip="' + value.label + '"></a>');
                        elm.appendTo(ul);
                    });
                    $element.find('a[menupage]').each(function () {
                        $(this).click(function () {
                            var model = $(this).attr('menupage');
                            menuSvc.setMenu(model);
                            $scope.changeActiveItem(this);
                        });
                    });
                    $element.find('li:eq(1) a').addClass('active');// set first icon active TODO:relate to the deeplinking feature
                };
            }
        };
    }]);