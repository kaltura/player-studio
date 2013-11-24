'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
    ['$scope', 'PlayerData', '$routeParams', '$filter', 'menuSvc', 'PlayerService', 'apiService', 'userEntries',
        function($scope, PlayerData, $routeParams, $filter, menuSvc, PlayerService, apiService, userEntries) {
            $scope.playerId = $routeParams.id;
            $scope.title = $filter('i18n')('Edit player');
            $scope.data = PlayerData.data;
            if (parseFloat($scope.data.version) < PlayerService.getRequiredVersion()) {
                menuSvc.registerAction('update', function() {
                    PlayerService.playerUpdate($scope.data)
                });
            }
            if (userEntries && typeof userEntries.objects != 'undefined') {
                var userEntriesList = [];
                angular.forEach(userEntries.objects, function(value) {
                    userEntriesList.push({'id': value.id, 'text': value.name});
                });
                menuSvc.registerAction('listEntries', function() {
                    return  userEntriesList;
                });
            }


        }
    ])
;
KMCModule.controller('editPageDataCntrl', ['$scope', function($scope) {


}]);