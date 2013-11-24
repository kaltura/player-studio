'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
    ['$scope', 'PlayerData', '$routeParams', '$filter', 'menuSvc', 'PlayerService', 'apiService', 'userEntries', 'localStorageService',
        function($scope, PlayerData, $routeParams, $filter, menuSvc, PlayerService, apiService, userEntries, localStorageService) {
            // $("head").append('<script src="http://cdnapi.kaltura.com/p/1405721/sp/140572100/embedIframeJs/uiconf_id/' + 21224102 + '/partner_id/' + '1405721' + '"></script>');
            $scope.ks = localStorageService.get('ks');
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
            $scope.previewEntry = ($scope.data.settings.basicDisplay.previewentry) ? $scope.data.settings.basicDisplay.previewentry.id : '0_ji4qh61l';
            $scope.$watch('data.settings.basicDisplay.previewentry', function(newVal, oldVal) {
                if (newVal != oldVal) {
                    $scope.previewEntry = newVal.id;
                    $scope.renderPlayer();
                }
            })
            $scope.renderPlayer = function() {
                kWidget.embed({
                    "targetId": "kplayer",
                    "wid": "_" + $scope.data.partnerId,
                    "uiconf_id": $scope.data.id,
                    "flashvars": {},
                    "cache_st": 1385293901,
                    "entry_id": $scope.previewEntry
                });
            }
            $(document).ready(function() {
                $scope.renderPlayer();
            });

        }
    ])
;
KMCModule.controller('editPageDataCntrl', ['$scope', function($scope) {


}]);