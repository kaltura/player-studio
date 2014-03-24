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
                scope: function () {
                    if (sectionType == 'tabs') {
                        return   {heading: '@'};
                    } else if
                        (sectionType == 'dynamic') {
                        return {modelData: '=model'};
                    }
                }(),
                controller: function ($scope, $element, $attrs) {
                    if (sectionType == 'tabs') {
                        $scope.tabset = {heading: $attrs['heading']};
                    }
                    else if (sectionType == 'dynamic') {
                        $scope.configData = menuSvc.getControlData($attrs.model);
                        $scope.configData.sectionName = $attrs.section;
                        var sections = [1];
                        if (typeof $scope.modelData.sections != 'undefined') {
                            sections = $scope.modelData.sections.split(',');
                            if (sections.length <= 0) { //error checking
                                cl('section' + $attrs.section + ' has been reset because of bad data');
                                sections = [1];
                                $scope.modelData.sections = 1;
                            }
                        }
                        else {
                            $scope.modelData = menuSvc.getOrMakeModelData($attrs.model, true);
                            $scope.modelData.sections = 1;
                        }
                        $scope.modelData["_featureEnabled"] = true; // make this enabled for saving
                        //get template

                        var removeHandel = angular.element('<a class="btn btn-xs" ng-click="removeSection($event)">X</a>');
                        var wrapper = angular.element('<div class="dynSection" index=""></div>');
                        var box = wrapper.append(removeHandel);

                        var createSection = function (index) {
                            var newSection = $compile(box.clone().attr('index', index))($scope);
                            var Controls = $templateCache.get('dynamicSections/' + $scope.configData.sectionName).clone();
                            modifyModel(Controls, index);
                            var html = $compile(Controls)(menuSvc.menuScope);
                            $element.find('div.dynSections').append(newSection.append(html));
                        };
                        var getModelByIndex = function (orginalModel, index) {
                            if (typeof index == 'undefined') index = '';
                            var modelPre = $scope.configData.modelPre;
                            var modelPost = $scope.configData.modelPost;
                            // I haven't a clue what kind of other rules you need,
                            // index seems useful but perhaps you need to name sections? this would allow it, just add the relevant HTML to make sections have titles
                            if (modelPre.indexOf('#') != -1) modelPre = modelPre.replace('#', index);
                            if (modelPost.indexOf('#') != -1) modelPost = modelPost.replace('#', index);
                            return  modelPre + orginalModel + modelPost;

                        };
                        var modifyModel = function (template, modelindex) {
                            template.find('[model]').each(function (index, control) {
                                $(control).attr('model', getModelByIndex($(control).attr('model'), modelindex));
                            });
                        };
                        var removeSectionData = function (inputHolder) {
                            inputHolder.find('[model]').each(function (index, obj) {
                                var model = $(obj).attr('model');
                                var parent = menuSvc.getModalData(menuSvc.getKnownParent(model));
                                if (parent) {
                                    var child = model.substr(model.lastIndexOf('.') + 1);
                                    if (typeof parent[child] != 'undefined') {
                                        delete (parent[child]);
                                    }
                                }
                            });
                        };
                        //add initial template
                        angular.forEach(sections, function (value) {
                            if (value == 1 && $scope.configData.remove1 === true) {
                                createSection();
                            } else
                                createSection(value);
                        });
                        ///

                        $scope.addSection = function () {
                            createSection(sections.length + 1);
                            sections.push(sections.length + 1);
                            $scope.modelData.sections += ',' + sections.length;
                        };
                        $scope.removeSection = function (e) {
                            var dynbox = $(e.target).parent();
                            var index = $(dynbox).attr('index');
                            if (index === true || index === '')  index = 0;// non number in
                            removeSectionData(dynbox);
                            dynbox.remove();
                            sections.splice(index - 1, 1);// we start from 0 in array 1 in sections
                            $scope.modelData.sections = sections.join(',');
                        };
                    }

                },
                link: function ($scope, $element, $attrs, controller, transclude) {
                    if (sectionType == 'dynamic') {
                        //window.dScope = $scope; //debug
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