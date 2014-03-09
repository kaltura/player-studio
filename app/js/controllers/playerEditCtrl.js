'use strict';

/* Controllers */

angular.module('KMCModule').controller('PlayerEditCtrl',
    ['$scope', 'PlayerData', '$routeParams', '$filter', 'menuSvc', 'PlayerService', 'apiService', '$timeout', 'requestNotificationChannel',
        function($scope, PlayerData, $routeParams, $filter, menuSvc, PlayerService, apiService, $timeout, requestNotificationChannel) {
            logTime('editCntrlLoad');
            $scope.playerId = PlayerData.id;
            $scope.newPlayer = !$routeParams.id;
            $scope.data = PlayerData;
            $scope.debug = $routeParams.debug;

            // clear the current refresh if the user navigates away from the edit screen during refresh
            $scope.$on('$destory', function() {
                PlayerService.clearCurrentRefresh();
            });

            // set debug info on screen when debug is set on the querystring
            $scope.getDebugInfo = function(partial) {
                if (!partial)
                    return $scope.data;
                else
                    return $scope.data[partial];
            };

            $scope.masterData = angular.copy($scope.data); // enable revert
            $scope.userEntriesList = [];
            $scope.settings = {}; // data like aspect ratio that is not part of the player data

            $timeout(function() {
                apiService.listMedia().then(function(data) {
                    $scope.userEntries = data;
                    angular.forEach($scope.userEntries.objects, function(value) {
                        // currently filter out playlist entries
                        if (typeof value.playlistType == "undefined")
                            $scope.userEntriesList.push({'id': value.id, 'text': value.name});
                    });
                    // get the preview entry
                    $scope.settings.previewEntry = ( PlayerService.getPreviewEntry()) ? PlayerService.getPreviewEntry() : $scope.userEntriesList[0]; //default entry
                    PlayerService.setPreviewEntry($scope.settings.previewEntry);
                    // render the player for the first time
                    PlayerService.playerRefresh().then(function() {
                        menuSvc.menuScope.playerInitDone = true;
                    });
                });
            }, 200);


            /* set tags
             $scope.tags = [];
             // all of the next block is just to show how to push into the tags autocomplete/dropdown the list of available tags should be loaded this way instead,
             // the model tags of the player are actually set properly from the ng-model of the tags directive and are not needed here
             if (typeof $scope.data.tags != "undefined" && $scope.data.tags) { //can also be null
             var tags = typeof $scope.data.tags == "string" ? $scope.data.tags.split(",") : $scope.data.tags;
             for (var i = 0; i < tags.length; i++)
             $scope.tags.push({id: tags[i], text: tags[i]});
             }
             //registers the tags to be available to the directive
             menuSvc.registerAction('getTags', function() {
             return $scope.tags;
             });
             //tags END */

            // register functions to be used by directives that need to call these function for data retrivial after linkage (select2data, infoaction)
            menuSvc.registerAction('listEntries', function() { // those should be the first 30
                return $scope.userEntriesList;
            });

            // search in media entries
            var timeVar = null;
            menuSvc.registerAction('queryEntries', function(query) {
                if (query.term) {
                    var data = {results: []};
                    if (timeVar) {
                        $timeout.cancel(timeVar);
                    }
                    timeVar = $timeout(function() {
                        apiService.searchMedia(query.term).then(function(results) {
                            angular.forEach(results.objects, function(entry) {
                                data.results.push({id: entry.id, text: entry.name});
                            });
                            timeVar = null;
                            return query.callback(data);
                        });
                    }, 200);
                }
                else
                    return query.callback({results: $scope.userEntriesList});
            });

            /*
             if (parseFloat($scope.data.version) < PlayerService.getRequiredVersion()) {
             menuSvc.registerAction('update', function () {
             PlayerService.playerUpdate($scope.data);
             });
             }*/

            // changing the entry should refresh the player
            $scope.$watch('settings.previewEntry', function(newVal, oldVal) {
                if (newVal != oldVal && typeof oldVal != "undefined") {
                    PlayerService.setPreviewEntry($scope.settings.previewEntry);
                    PlayerService.playerRefresh();
                }
            });

            requestNotificationChannel.requestEnded('edit'); // hide spinner
        }
    ]);

// controller to handle Save, return to list, menu collapse etc.
angular.module('KMCModule').controller('editPageDataCntrl', ['$scope', 'PlayerService', 'apiService', '$modal', '$location', 'menuSvc', 'localStorageService', function($scope, playerService, apiService, $modal, $location, menuSvc, localStorageService) {

    $scope.autoRefreshEnabled = playerService.autoRefreshEnabled;
    // binded to checkbox
    $scope.$watch('autoRefreshEnabled', function(newVal, oldVal) {
        if (newVal != oldVal) {
            if (newVal && $scope.checkPlayerRefresh()) {
                playerService.playerRefresh();
            }
            playerService.autoRefreshEnabled = newVal;
        }
    });

    // refresh button click function
    $scope.refreshPlayer = function() {
        playerService.playerRefresh().then(function() {
            playerService.refreshNeeded = false;
        });
    };

    // refresh button class selection
    $scope.checkPlayerRefresh = function() {
        if (menuSvc.menuScope && menuSvc.menuScope.menuInitDone && menuSvc.menuScope.playerInitDone)
            return playerService.refreshNeeded;
        else
            return false;
    };

    $scope.save = function() {
        playerService.savePlayer($scope.data).then(function(value) {
                // cleanup form and master data
                menuSvc.menuScope.playerEdit.$setPristine();
                $scope.masterData = value;
                localStorageService.remove('tempPlayerID'); // remove temp player from storage (used for deleting unsaved players)
                // if this is a new player - add it to the players list
                if ($scope.newPlayer) {
                    // prevent the list controller from using the cache the next time the list loads
                    apiService.setCache(false);
                }
                $modal.open({ templateUrl: 'template/dialog/message.html',
                    controller: 'ModalInstanceCtrl',
                    resolve: {
                        settings: function() {
                            return {
                                'title': 'Save Player Settings',
                                'message': 'Player Saved Successfully',
                                buttons: [
                                    {result: true, label: 'OK', cssClass: 'btn-primary'}
                                ]
                            };
                        }
                    }
                });
            },
            function(msg) {
                $modal.open({ templateUrl: 'template/dialog/message.html',
                    controller: 'ModalInstanceCtrl',
                    resolve: {
                        settings: function() {
                            return {
                                'title': 'Player save failure',
                                'message': msg
                            };
                        }
                    }
                });
            }
        );
    };

    // used by the debug info: go over all forms in playerEdit (recursively) and look for errors
    $scope.formValidation = function() {
        if (typeof  menuSvc.menuScope.playerEdit != 'undefined' && menuSvc.menuScope.playerEdit.$error) {
            var obj = menuSvc.menuScope.playerEdit.$error;
            var empty = true;
            angular.forEach(obj, function(value, key) {
                if (value !== false) {
                    empty = false;
                }
            });
            if (!empty)
                return obj;
            return null;
        }
    };

    // return to list if the data is clean. issue a message if need to be saved
    $scope.cancel = function() {
        if (menuSvc.menuScope.playerEdit.$pristine) {
            $location.url('/list');
        }
        else {
            var modal = $modal.open(
                { templateUrl: 'template/dialog/message.html',
                    controller: 'ModalInstanceCtrl',
                    resolve: {
                        settings: function() {
                            return {
                                'title': 'Navigation confirmation',
                                message: 'You are about to leave this page without saving, are you sure you want to discard the changes?'
                            };
                        }

                    }});
            modal.result.then(function(result) {
                if (result) {
                    $location.url('/list');
                }
            });
        }
    };

    // enable save button when the player data is not equal to the master data
    // TODO: check form $dirty instead of comapring to master data. in that case, we can remove master data unless we want to implement revert function
    $scope.saveEnabled = function() {
        //instead of using the form dirty state we compare to the master copy.
        if (typeof menuSvc.menuScope.playerEdit != 'undefined') {
            if (menuSvc.menuScope.playerEdit.$valid)
                return !angular.equals($scope.data, $scope.masterData);
            else
                return false;
        }
    };
}]);