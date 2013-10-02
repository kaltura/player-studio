'use strict';
/* Directives */
angular.module('KMC.directives', []).
        directive('navmenu', function($compile) {
            return  {
                template: "<ul ng-transclude=''></ul>",
                replace: true,
                restrict: 'E',
                transclude: true,
                priority: 1000,
                scope: false,
                controller:
                        function($scope, $element, $attrs) {
                            function renderMenuItems(item, origin) {
                                var originAppendPos = origin.find('ul[ng-transclude]:first');
                                if (originAppendPos.length < 1)
                                    originAppendPos = origin;
                                if (item.type === 'menu') {
                                    var newmenu = angular.element('<menulevel/>');
                                    newmenu.attr('label', item.label);
                                    var originModel = origin.attr('model') ? origin.attr('model') + '.' : 'data.';
                                    var modelStr = originModel + item.model;
                                    newmenu.attr('model', modelStr);
                                    var parent = $compile(newmenu)($scope).appendTo(originAppendPos);
                                    for (var j = 0; j < item.children.length; j++) {
                                        var subitem = item.children[j];
                                        var subappendPos = parent.find('ul[ng-transclude]:first');
                                        if (subitem.type === 'checkbox') {
                                            var newChecbox = angular.element('<modelchecbox/>');
                                            newChecbox.attr('label', subitem.label);
                                            var subModelStr = modelStr + '.' + subitem.model;
                                            newChecbox.attr('model', subModelStr);
                                            $compile(newChecbox)($scope).appendTo(subappendPos);
                                        }
                                        else if (subitem.type === 'menu') {
                                            renderMenuItems(subitem, parent);
                                        }
                                    }
                                }
                                else if (item.type === 'checkbox') {
                                    var newChecbox = angular.element('<modelchecbox/>');
                                    newChecbox.attr('label', item.label);
                                    newChecbox.attr('model', item.model);
                                    $compile(newChecbox)($scope).appendTo(originAppendPos);
                                }
                            }
                            for (var i = 0; i < $scope.editProperties.length; i++) {
                                var item = $scope.editProperties[i];
                                renderMenuItems(item, $element);
                            }
                        }

            };
        }).
        directive('modelchecbox', function() {
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
        }).directive('menulevel', function() {
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



         