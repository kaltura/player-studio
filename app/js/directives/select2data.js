'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('select2Data', [
    'menuSvc', '$filter',
    function (menuSvc, $filter) {
        return {
            replace: true,
            restrict: 'EA',
            scope: {
                'label': '@',
                'model': '=',
                'icon': '@',
                'helpnote': '@',
                'initvalue': '@',
                "require": '@',
                'strModel': '=model'
            },
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                $scope.selectOpts = {};
                if (typeof $attrs['allowCustomValues'] != 'undefined') {
                    $scope.selectOpts.createSearchChoice = function (term) {
                        var translatedText = $filter('translate')($attrs['allowCustomValues']);
                        return {id: term, text: term + ' (' + translatedText + ")"};
                    };
                }
                $scope.selectOpts['data'] = menuSvc.doAction($attrs.source);
                if ($attrs.query) {
                    $scope.selectOpts['data'].results = [];
                    if ($attrs.minimumInputLength){
                        $scope.selectOpts['minimumInputLength'] = $attrs.minimumInputLength;
                    }
                    $scope.selectOpts['query'] = menuSvc.getAction($attrs.query);
                }
                if ($attrs.placehold) {
                    $scope.selectOpts['placeholder'] = $attrs.placehold;
                }
                $scope.selectOpts['width'] = $attrs.width;
            }],
            templateUrl: 'template/formcontrols/select2Data.html',
            compile: function (tElement, tAttr) {
                if (tAttr['endline'] == 'true') {
                    tElement.append('<hr/>');
                }
                if (tAttr.showEntriesThumbs == 'true') {
                    tElement.find('input').attr('list-entries-thumbs', 'true');
                }
                if (tAttr.placeholder)
                    tElement.find('input').attr('data-placeholder', tAttr.placeholder);
                return function (scope, element) {
                };
            }
        };
    }
]);