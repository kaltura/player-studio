'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
    ['$scope', 'PlayerData', '$routeParams', '$filter', 'menuSvc', 'PlayerService', 'apiService', 'localStorageService', 'userEntries',
        function ($scope, PlayerData, $routeParams, $filter, menuSvc, PlayerService, apiService, localStorageService, userEntries) {
            $scope.ks = localStorageService.get('ks');
            $scope.playerId = $routeParams.id;
            $scope.title = $filter('i18n')('Edit player');
            $scope.data = PlayerData.data;
            $scope.userEntriesList = [];
            $scope.userEntries = userEntries;
            $scope.tags = [
                {id: "testing", text: 'testing'},
                {id: "1", text: 'one'}
            ];
            menuSvc.registerAction('getTags', function () {
                return $scope.tags;
            });
            angular.forEach($scope.userEntries.objects, function (value) {
                $scope.userEntriesList.push({'id': value.id, 'text': value.name});
            });
            menuSvc.registerAction('listEntries', function () { // those should be the first 20...
                return $scope.userEntriesList;
            });
            menuSvc.registerAction('queryEntries', function (query) {
                var data = {results: []};
                console.log(query.term);
                if (query.term) {
                    // here you should do some AJAX API call with the query term and then()...
                    angular.forEach($scope.userEntriesList, function (item, key) {
                        if (query.term.toUpperCase() === item.text.substring(0, query.term.length).toUpperCase()) {
                            data.results.push(item);
                        }
                    });
                    return query.callback(data);
                }
                else
                    return query.callback({results: $scope.userEntriesList});

            });

            if (parseFloat($scope.data.version) < PlayerService.getRequiredVersion()) {
                menuSvc.registerAction('update', function () {
                    PlayerService.playerUpdate($scope.data)
                });
            }
            $scope.previewEntry = ($scope.data.settings.basicDisplay.previewentry) ? $scope.data.settings.basicDisplay.previewentry.id : '0_ji4qh61l';
            $scope.$watch('data.settings.basicDisplay.previewentry', function (newVal, oldVal) {
                if (newVal != oldVal) {
                    $scope.previewEntry = newVal.id;
                    $scope.renderPlayer();
                }
            })
            $scope.renderPlayer = function () {
                kWidget.embed({
                    "targetId": "kplayer",
                    "wid": "_" + $scope.data.partnerId,
                    "uiconf_id": $scope.data.id,
                    "flashvars": {},
                    "cache_st": 1385293901,
                    "entry_id": $scope.previewEntry
                });
            }
            $(document).ready(function () {
                $scope.renderPlayer();
            });

        }
    ])
;
KMCModule.controller('editPageDataCntrl', ['$scope', function ($scope) {


}]);