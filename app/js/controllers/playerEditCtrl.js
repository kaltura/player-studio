'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
        ['$scope', 'PlayerService', '$routeParams', '$filter', 'editProperties',
            function($scope, PlayerService, $routeParams, $filter, editProperties) {
                var playerId = $routeParams.id;
                $scope.title = $filter('i18n')('Edit player');
                PlayerService.getPlayer(playerId).success(function(data) {
                    $scope.data = data;
                });
                $scope.editProperties = editProperties.data.properties;
                  console.log( $scope);

            }]);
