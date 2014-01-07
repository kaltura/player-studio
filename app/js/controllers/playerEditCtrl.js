'use strict';

/* Controllers */

angular.module('KMCModule').controller('PlayerEditCtrl',
    ['$scope', 'PlayerData', '$routeParams', '$filter', 'menuSvc', 'PlayerService', 'apiService', 'localStorageService', 'userEntries', '$timeout',
        function ($scope, PlayerData, $routeParams, $filter, menuSvc, PlayerService, apiService, localStorageService, userEntries, $timeout) {
            $scope.ks = localStorageService.get('ks');
            $scope.playerId = PlayerData.id;
            $scope.title = ($routeParams.id) ? $filter('i18n')('Edit player') : $filter('i18n')('New  player');
            $scope.data = PlayerData;
            $scope.masterData = angular.copy($scope.data);
            $scope.userEntriesList = [];
            $scope.userEntries = userEntries;
            // set tags
            $scope.tags = [];
            // all of the next block is just to show how to push into the tags autocomplete/dropdown the list of available tags should be loaded this way instead,
            // the model tags of the player are actually set properly from the ng-model of the tags directive and are not needed here
            if (typeof $scope.data.tags != "undefined" && $scope.data.tags) { //can also be null
                var tags = typeof $scope.data.tags == "string" ? $scope.data.tags.split(",") : $scope.data.tags;
                for (var i = 0; i < tags.length; i++)
                    $scope.tags.push({id: tags[i], text: tags[i]});
            }
            //registers the tags to be available to the directive
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
                    PlayerService.playerUpdate($scope.data);
                });
            }
            $scope.previewEntry = ($scope.data.previewentry) ? $scope.data.previewentry.id : '0_ji4qh61l'; //default entry
            $scope.$watch('data.previewentry', function (newVal, oldVal) {
                if (newVal != oldVal) {
                    $scope.previewEntry = newVal.id;
                    PlayerService.setPreviewEntry($scope.previewEntry);
                    PlayerService.renderPlayer();
                }
            });
            $(document).ready(function () {
                $scope.masterData = angular.copy($scope.data);
                PlayerService.setPreviewEntry($scope.previewEntry);
                PlayerService.renderPlayer();
            });
            $scope.save = function () {
                menuSvc.menuScope.playerEdit.$dirty = false;
                $scope.masterData = angular.copy($scope.data);
                //we should render from $scope.data but save $scope.masterData this way we can also offer a revert edit button
                //cl(menuSvc.menuScope.playerEdit);
            };
            $scope.saveEnabled = function () {
                //instead of using the form dirty state we compare to the master copy.
                if (typeof menuSvc.menuScope.playerEdit != 'undefined') {
                    if (menuSvc.menuScope.playerEdit.$valid)
                        return !angular.equals($scope.data, $scope.masterData);
                    else
                        return false;
                }
            };
        }
    ])
;
angular.module('KMCModule').controller('editPageDataCntrl', ['$scope', function ($scope) {


}]);