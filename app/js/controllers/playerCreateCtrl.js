'use strict';

/* Controllers */

angular.module('KMCModule').controller('PlayerCreateCtrl',
    ['$scope', '$filter', 'templates', 'userId', 'playerTemplates',
        function($scope, $filter, templates, userId, playerTemplates) {
            $scope.title = $filter('translate')('New player - from template');
            $scope.templates = templates.data;
            $scope.templateType = 'system';
            $scope.userId = userId;
            $scope.loading = false;
            $scope.$watch('templateType', function(newVal, oldVal) {
                if (newVal != oldVal) {
                    if (newVal == 'user') {
                        $scope.loading = true;
                        playerTemplates.listUser($scope.userID).success(function(response) {
                            $scope.templates = response;
                            $scope.loading = false;
                        });
                    }
                    else {
                        $scope.loading = true;
                        $scope.templates = templates.data;
                        $scope.loading = false;
                    }
                }
            });
            $scope.makeTooltip = function(index) {
                var item = $scope.templates[index];
                if (item && typeof item.settings != 'undefined' && typeof item.settings.name != 'undefined')
                    return item.settings.name + '<br/>' + item.id + '<br/> Any information you will decide to show';
            };
        }])
;
