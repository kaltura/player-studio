'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
    ['$scope', 'PlayerData', '$routeParams', '$filter', 'menuSvc', 'PlayerService','apiService',
        function ($scope, PlayerData, $routeParams, $filter, menuSvc, PlayerService,apiService) {
            $scope.playerId = $routeParams.id;
            $scope.title = $filter('i18n')('Edit player');
            $scope.data = PlayerData.data;
            if (parseFloat($scope.data.version) < PlayerService.getRequiredVersion()) {
                menuSvc.registerAction('update', function () {
                    PlayerService.playerUpdate($scope.data)
                });
            }
            apiService.listMedia().then(function (data) {
                $scope.userEntries = data.objects;
                console.log($scope.userEntries);
            });

        }]);
KMCModule.controller('editPageDataCntrl', ['$scope', function ($scope) {


}]);