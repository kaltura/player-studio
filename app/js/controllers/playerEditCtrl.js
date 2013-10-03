'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
        ['$scope', 'PlayerData', '$routeParams', '$filter', 'editProperties',
            function($scope, PlayerData, $routeParams, $filter, editProperties) {
                $scope.playerId = $routeParams.id;
                $scope.title = $filter('i18n')('Edit player');
                $scope.data = PlayerData.data;
                $scope.editProperties = editProperties.data.properties;
            }]);
