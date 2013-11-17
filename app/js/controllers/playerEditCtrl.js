'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
    ['$scope', 'PlayerData', '$routeParams', '$filter', 'menuSvc', 'PlayerService',
        function ($scope, PlayerData, $routeParams, $filter, menuSvc, PlayerService) {
            $scope.playerId = $routeParams.id;
            $scope.title = $filter('i18n')('Edit player');
            $scope.data = PlayerData.data;
            if (parseFloat($scope.data.version) < PlayerService.getRequiredVersion()) {
                menuSvc.registerAction('update', function () {
                    PlayerService.playerUpdate($scope.data)
                });
            }

        }]);
KMCModule.controller('editPageDataCntrl', ['$scope', function ($scope) {

}]);