'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.provider('sections', [ function () {
    var templates = {
        dynamic: 'template/menu/dynamicSections.html',
        tabs: 'template/menu/tabs.html'
    };
    this.$get = ['$compile', 'menuSvc', function ($compile, menuSvc) {
        return function (sectionType) {
            return {
                restrict: "AE",
                replace: true,
                priority: 1000,
                templateUrl: templates[sectionType],
                transclude: true,
                scope: {heading: '@'},
                controller: function ($scope, $element, $attrs) {
                    $scope.sections = {};
                    var configData = menuSvc.getControlData($attrs.model);
                    if (configData) {
                        $scope.configData = configData.sections.sectionsConfig[$attrs.section];
                    }
                    $scope.dynamic = (sectionType === 'dynamic') ? true : false;
                    if ($scope.dynamic) {
                        $scope.sections = [];
                    }

                },
                link: function ($scope, $element, $attrs, controller, transclude) {
                    if (sectionType == 'tabs') {
                        $scope.tabset = {heading: $attrs['heading']};
                    }
                    if (sectionType == 'dynamic') {
                        transclude($scope, function (clone) {
                            $scope.template = clone;
                            $scope.sections.push({template:clone});
                        });
                        window.dScope = $scope;
                    }
                }
            };
        };
    }]
    ;
}])
;
DirectivesModule.directive('kaDynamicSection', ['sections', function (sections) {
    return sections('dynamic');
}]);
DirectivesModule.directive('kaTabs', ['sections', function (sections) {
    return sections('tabs');
}]);