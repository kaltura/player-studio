'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.provider('sections', [ function () {
    var templates = {
        dynamic: 'template/menu/dynamicSections.html',
        tabs: 'template/menu/tabs.html'
    };
    this.$get = ['$compile', 'menuSvc', '$templateCache', function ($compile, menuSvc, $templateCache) {
        return function (sectionType) {
            return {
                restrict: "AE",
                replace: true,
                templateUrl: templates[sectionType],
                transclude: true,
                scope: {heading: '@'},
                controller: function ($scope, $element, $attrs) {
                    if (sectionType == 'tabs') {
                        $scope.tabset = {heading: $attrs['heading']};
                    }
                    else if (sectionType == 'dynamic') {
                        var configData = menuSvc.getControlData($attrs.model);
                        if (configData) {
                            $scope.configData = configData.sections.sectionsConfig[$attrs.section];
                            $scope.configData.sectionName = $attrs.section;
                        }

                        var modelParent = menuSvc.getOrMakeModelData(menuSvc.getKnownParent('data.' + $scope.configData.model));
                        $scope.modelData = modelParent[$attrs.section]; // number of sections

                        var sections = [1];
                        if (typeof $scope.modelData == 'number') {
                            for (var i = 1; $scope.modelData < i; i++) {
                                sections.push(sections.length + 1);
                            }
                        }
                        else {
                            $scope.modelData = 1;
                        }
                        //get template
                        var controlsTemplate = $templateCache.get('dynamicSections/' + $scope.configData.sectionName);
                        //add initial template
                        var html = $compile(controlsTemplate)(menuSvc.menuScope);
                        $element.find('div.dynSection').append(html);
                        ///
                        var modifyModel = function (template) {
                            var modelPre = $scope.configData.modelPre;
                            var modelPost = $scope.configData.modelPost;
                            // I haven't a clue what kind of other rules you need,
                            // index seems useful but perhaps you need to name sections? this would allow it, just add the relevant HTML to make sections have titles
                            if (modelPre.indexOf('#') != -1) modelPre = modelPre.replace('#', sections.length + 1);
                            if (modelPost.indexOf('#') != -1) modelPost = modelPost.replace('#', sections.length + 1);
                            template.find('[model]').each(function (index, control) {
                                var original = $(control).attr('model');
                                $(control).attr('model', modelPre + original + modelPost);
                            })
                        };
                        $scope.addSection = function () {
                            var newSection = controlsTemplate.clone();
                            modifyModel(newSection);
                            var html = $compile(newSection)(menuSvc.menuScope);
                            $element.find('div.dynSection').append(html);
                            sections.push(sections.length + 1);
                            modelParent[$attrs.section]++;
                        }
                    }

                },
                link: function ($scope, $element, $attrs, controller, transclude) {
                    if (sectionType == 'dynamic') {
                        $scope.model = menuSvc.getOrMakeModelData('data.' + $scope.configData.model, true);
                        $scope.model["_featureEnabled"] = true;
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