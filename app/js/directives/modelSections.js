'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.provider('sections', [ function() {
    var templates = {
        dynamic: 'template/menu/dynamicSections.html',
        tabs: 'template/menu/tabs.html'
    };
    this.$get = ['$compile', function($compile) {
        return function(sectionType) {
            return {
                restrict: "AE",
                replace: true,
                priority: 1000,
                templateUrl: templates[sectionType],
                transclude: true,
                scope: {heading: '@'},
                controller: function($scope, $element, $attrs) {
                    $scope.sections = {};
                    $scope.dynamic = (sectionType === 'dynamic') ? true : false;
                },
                compile: function(tElem, tAttrs) {

                    return function($scope, $element, $attrs, sectionsCntrl) {
//                        var tabset = $compile($element.find('div[tabset]'))($scope);
//                        transcludeFn(function(clone) {
//                            tabset.append(clone);
//                        });
                        if (sectionType == 'tabs') {
                            $scope.tabset = {heading: $attrs['heading']};
                        }
                        if (sectionType == 'dynamic') {

                        }
                    };
                }
            };
        };
    }];
}]);
DirectivesModule.directive('kaDynamicSection', ['sections', function(sections) {
    return sections('dynamic');
}]);
DirectivesModule.directive('kaTabs', ['sections', function(sections) {
    return sections('tabs');
}]);