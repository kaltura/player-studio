'use strict';

/* Controllers */

KMCModule.controller('PlayerCreateCtrl',
    ['$scope', '$filter','templates',
        function ($scope, $filter,templates ) {
            $scope.title = $filter('i18n')('New player');
            $scope.templates = templates.data;
            $scope.makeTooltip = function(index){
                var item = $scope.templates[index];

                return item.settings.name + '<br/>' + item.id +  '<br/> Any information you will decide to show';
            }
        }]);
