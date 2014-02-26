'use strict';

/* Controllers */

angular.module('KMCModule').controller('PlayerListCtrl',
    ['apiService', 'loadINI', '$location', '$rootScope', '$scope', '$filter', '$modal', '$timeout', '$log', "$compile", "$window", 'localStorageService', 'requestNotificationChannel', 'PlayerService', '$q','menuSvc',
        function(apiService, loadINI, $location, $rootScope, $scope, $filter, $modal, $timeout, $log, $compile, $window, localStorageService, requestNotificationChannel, PlayerService, $q, menuSvc) {
            // start request to show the spinner. When data is rendered, the onFinishRender directive will hide the spinner
            requestNotificationChannel.requestStarted('list');
            $rootScope.lang = 'en-US';

            // init search
            $scope.search = '';
            $scope.searchSelect2Options = {};

            // init paging
            $scope.currentPage = 1;
            $scope.maxSize =  parseInt(localStorageService.get('listSize')) || 10;
            $scope.$watch('maxSize', function(newval, oldval) {
                if (newval != oldval)
                    localStorageService.set('listSize',newval); // save list size for when we return to the list from the edit page or reload the list page
                    $scope.$broadcast('layoutChange');          // update the scroller
            });
            $scope.triggerLayoutChange = function(){
                $scope.$broadcast('layoutChange');
            };

            // default values for select2: width and no search
            $scope.uiSelectOpts = {
                width: '60px',
                minimumResultsForSearch: -1
            };

            // get studio UICONF to setup studio configuration
            var config = null;
            // try to get studio config from KMC (should work if we are in KMC)
            try {
                var kmc = window.parent.kmc;
                if (kmc && kmc.vars && kmc.vars.studio.config) {
                    config = kmc.vars.studio.config;
                    $scope.UIConf = angular.fromJson(config);
                }
            } catch (e) {
                // standalone version
                $log.error('Could not located parent.kmc: ' + e);
            }

            // if we didn't get the uiconf from kmc.vars - load the configuration from base.ini
            if (!config) {
                loadINI.getINIConfig().success(function(data) {
                    $scope.UIConf = data;
                });
            }

            // delete temp players if exists in cache (players that were created but not saved)
            if (localStorageService.get('tempPlayerID')) {
                var deletePlayerRequest = {
                    'service': 'uiConf',
                    'action': 'delete',
                    'id': localStorageService.get('tempPlayerID')
                };
                apiService.doRequest(deletePlayerRequest).then(function(data) {
                    localStorageService.remove('tempPlayerID');
                });
            }

            // clear cache if we came back from edit page and we have dirty data
            if (menuSvc.menuScope.playerEdit && !menuSvc.menuScope.playerEdit.$pristine){
                apiService.setCache(false);
                PlayerService.clearCurrentPlayer();
            }

            // get players list from KMC
            var playersRequest = {
                'filter:tagsMultiLikeOr': 'kdp3,html5studio',
                'filter:orderBy': '-updatedAt',
                'filter:objTypeEqual': '1',
                'filter:objectType': 'KalturaUiConfFilter',
                'filter:creationModeEqual': '2',
                'ignoreNull': '1',
                'page:objectType': 'KalturaFilterPager',
                'pager:pageIndex': '1',
                'pager:pageSize': '999',
                'service': 'uiConf',
                'action': 'list'
            };
            apiService.doRequest(playersRequest).then(function(data) {
                $scope.data = data.objects;   // players list
                $scope.calculateTotalItems(); // calculate the total items including search filters to display in the pager
                PlayerService.cachePlayers(data.objects); // save players list data to memory cache
            });

            // set a filtered data array of the players after search criteria
            $scope.filtered = $filter('filter')($scope.data, $scope.search) || $scope.data;

            // calculate the total items including search filters to display in the pager
            $scope.calculateTotalItems = function() {
                if ($scope.filtered)
                    $scope.totalItems = $scope.filtered.length;
                else if ($scope.data) {
                    $scope.totalItems = $scope.data.length;
                }
            };

            // get the minimal required player version so we can mark outdated players in the list
            $scope.requiredVersion = PlayerService.getRequiredVersion();

            // set sort order of the players
            $scope.sort = {
                sortCol: 'createdAt',
                reverse: true
            };
            $scope.sortBy = function(colName) {
                $scope.sort.sortCol = colName;
                $scope.sort.reverse = !$scope.sort.reverse;
            };

            // check if this player should be upgraded (binded to the player's HTML outdated message)
            $scope.checkVersionNeedsUpgrade = function(item) {
                var html5libVersion = item.html5Url.substr(item.html5Url.indexOf('/v') + 2, 1); // get html5 lib version number from its URL
                return (html5libVersion == "1" || item.config === null); // need to upgrade if the version is lower than 2 or the player doesn't have a config object
            };

            $scope.showSubTitle = true; // show the subtitle text below the title

            // get the player thumbnail - currently a static image. should be change to display the real thumbnail once we add the grabbing mechanism
            $scope.getThumbnail = function(item) {
                if (typeof item.thumbnailUrl != 'undefined')
                    return item.thumbnailUrl; // TODO: prehaps some checking on the URL validity?
                else return $scope.defaultThumbnailUrl;
            };
            $scope.defaultThumbnailUrl = 'img/mockPlayerThumb.png';

            // apply search filter. Wait 100ms before applying to make sure the user finished typing
            var timeVar;
            $scope.$watch('search', function(newValue, oldValue) {
                $scope.showSubTitle = newValue; // use the subtitle to display the search term
                if (newValue.length > 0) {
                    $scope.title = $filter('i18n')('search for') + ' "' + newValue + '"'; // use the title to display search mode title
                }
                else {
                    if (oldValue)
                        $scope.title = $filter('i18n')('Players list'); // restore title
                }
                if (timeVar){
                    $timeout.cancel(timeVar);
                }
                timeVar =  $timeout(function() {
                    $scope.triggerLayoutChange(); // update scroller
                    $scope.calculateTotalItems(); // update pager
                    timeVar = null;
                }, 100);
            });

            // when a player is clicked - check if this player is outdated. If so - display a message, if not - go to edit page
            $scope.oldVersionEditText = $filter('i18n')(
                'This player must be updated before editing. <br/>' +
                'Some features and design may be lost.');
            var goToEditPage = function(id){
                requestNotificationChannel.requestStarted('edit');
                $location.path('/edit/' + id);
            };
            $scope.goToEditPage = function (item, $event) {
                $event.preventDefault();
                if (!$scope.checkVersionNeedsUpgrade(item)) {
                    goToEditPage(item.id);
                    return false;
                } else {
                    var msgText = $scope.oldVersionEditText;
                    var modal = $modal.open({
                            templateUrl: 'template/dialog/message.html',
                            controller: 'ModalInstanceCtrl',
                            resolve: {
                                settings: function() {
                                    return {
                                        'title': 'Edit confirmation',
                                        'message': msgText,
                                        buttons: [
                                            {result: false, label: 'Cancel', cssClass: 'btn-default'},
                                            {result: true, label: 'Upgrade', cssClass: 'btn-primary'}
                                        ]
                                    };
                                }}
                        }
                    );
                    modal.result.then(function(result) {
                        if (result) {
                            // update the player and when its done - go to the edit page
                            $scope.update(item).then(function() {
                                goToEditPage(item.id); // player finished updating - go to the edit page
                            });
                        }
                    }, function() {
                        return $log.info('edit when outdated modal dismissed at: ' + new Date());
                    });
                }

            };

            // clicking on the "new player" button should go to the new player page
            $scope.newPlayer = function() {
                $location.path('/new');
            };

            // duplicating a player - check if the player is outdated. If so - issue a message. If not - duplicate the player
            $scope.duplicate = function(item) {
                if ($scope.checkVersionNeedsUpgrade(item)){
                    $modal.open({ templateUrl: 'template/dialog/message.html',
                        controller: 'ModalInstanceCtrl',
                        resolve: {
                            settings: function() {
                                return {
                                    'title': 'Duplicate player',
                                    'message': 'Outdated players cannot be duplicated.<br>Please update the player before duplicating.',
                                    buttons: [
                                        {result: true, label: 'OK', cssClass: 'btn-primary'}
                                    ]
                                };
                            }
                        }
                    });
                }else{
                    PlayerService.clonePlayer(item).then(function(data) {
                        // player finished duplicating - add it to the players list in memory in the first place (unshift the array)
                        $scope.data.unshift(data[1]);
                        PlayerService.cachePlayers($scope.data); // update memory cache with the new player
                        $location.url('edit/' + data[1].id);     // go to edit page with the duplicated player ID
                    });
                }
            };

            // delete a player (after user confirmation)
            $scope.deletePlayer = function(item) {
                var modal = $modal.open({
                    templateUrl: 'template/dialog/message.html',
                    controller: 'ModalInstanceCtrl',
                    resolve: {
                        settings: function() {
                            return {
                                'title': 'Delete confirmation',
                                'message': 'Are you sure you want to delete the player?'
                            };
                        }
                    }
                });
                modal.result.then(function(result) {
                    if (result)
                        PlayerService.deletePlayer(item.id).then(function() {
                            // player was deleted from the database
                            $scope.data.splice($scope.data.indexOf(item), 1); // delete player from local memory list of players (splice)
                            $scope.triggerLayoutChange(); // update scroller as the list size changed
                        }, function(reason) {
                            $modal.open({ templateUrl: 'template/dialog/message.html',
                                controller: 'ModalInstanceCtrl',
                                resolve: {
                                    settings: function() {
                                        return {
                                            'title': 'Delete failure',
                                            'message': reason
                                        };
                                    }
                                }
                            });
                        });
                }, function() {
                    $log.info('Delete modal dismissed at: ' + new Date());
                });
            };

            // updater an outdated player
            $scope.update = function(player) {
                var upgradeProccess = $q.defer();
                var currentVersion = player.html5Url.split("/v")[1].split("/")[0];
                var text = '<span>' + $filter("i18n")("Do you want to update this player?") + '</span>';
                var html5lib = player.html5Url.substr(0, player.html5Url.indexOf('/v') + 2) + window.MWEMBED_VERSION + "/mwEmbedLoader.php";
                var modal = $modal.open({
                    templateUrl: 'template/dialog/message.html',
                    controller: 'ModalInstanceCtrl',
                    resolve: {
                        settings: function() {
                            return {
                                'title': 'Update confirmation',
                                'message': text
                            };
                        }
                    }
                });
                modal.result.then(function(result) {
                    if (result)
                        PlayerService.playerUpdate(player, html5lib).then(function(data) {
                            // update local data (we will not retrieve from the server again)
                            player.config = angular.fromJson(data.config);
                            player.html5Url = html5lib;
                            player.tags = 'html5studio,player';
                            upgradeProccess.resolve('upgrade finished successfully');
                        }, function(reason) {
                            $modal.open({ templateUrl: 'template/dialog/message.html',
                                controller: 'ModalInstanceCtrl',
                                resolve: {
                                    settings: function() {
                                        return {
                                            'title': 'Update player failure',
                                            'message': reason
                                        };
                                    }
                                }
                            });
                            upgradeProccess.reject('upgrade canceled');
                        });
                }, function() {
                    $log.info('Update player dismissed at: ' + new Date());
                    upgradeProccess.reject('upgrade canceled');
                });
                return  upgradeProccess.promise;
            };
        }
    ])
;