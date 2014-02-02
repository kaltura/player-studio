'use strict';

/* Controllers */

angular.module('KMCModule').controller('PlayerListCtrl',
    ['apiService', 'loadINI', '$location', '$rootScope', '$scope', '$filter', '$modal', '$timeout', '$log', "$compile", "$window", 'localStorageService', 'requestNotificationChannel', 'PlayerService', '$q',
        function(apiService, loadINI, $location, $rootScope, $scope, $filter, $modal, $timeout, $log, $compile, $window, localStorageService, requestNotificationChannel, PlayerService, $q) {
            requestNotificationChannel.requestStarted('list');
            $rootScope.lang = 'en-US';
            $scope.search = '';
            $scope.searchSelect2Options = {};
            $scope.currentPage = 1;
            $scope.maxSize = 10;
            $scope.$watch('maxSize', function(newval, oldval) {
                if (newval != oldval)
                    $scope.$broadcast('layoutChange');
            });
            $scope.triggerLayoutChange = function(){
                $scope.$broadcast('layoutChange');
            };
            $scope.uiSelectOpts = {
                width: '60px',
                minimumResultsForSearch: -1
            };
            // get studio UICONF to setup studio configuration
            var config = null;

            try {
                var kmc = window.parent.kmc;
                if (kmc && kmc.vars && kmc.vars.studio.config) {
                    config = kmc.vars.studio.config;
                    $scope.UIConf = angular.fromJson(config);
                }
            } catch (e) {
                $log.error('Could not located parent.kmc: ' + e);
            }

            // if we didin't get the uiconf from kmc.vars - load the configuration from base.ini
            if (!config) {
                loadINI.getINIConfig().success(function(data) {
                    $scope.UIConf = data;
                });
            }

            // delete temp players if exists in cache (plaers that were created but not saved
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
                $scope.data = data.objects;
                $scope.calculateTotalItems();
                PlayerService.cachePlayers(data.objects);
            });
            $scope.filtered = $filter('filter')($scope.data, $scope.search) || $scope.data;
            $scope.requiredVersion = PlayerService.getRequiredVersion();
            $scope.calculateTotalItems = function() {
                if ($scope.filtered)
                    $scope.totalItems = $scope.filtered.length;
                else if ($scope.data) {
                    $scope.totalItems = $scope.data.length;
                }
            };
            $scope.sort = {
                sortCol: 'createdAt',
                reverse: true
            };
            $scope.sortBy = function(colName) {
                $scope.sort.sortCol = colName;
                $scope.sort.reverse = !$scope.sort.reverse;
            };
            $scope.checkVersionNeedsUpgrade = function(item) {
                var html5libVersion = item.html5Url.substr(item.html5Url.indexOf('/v') + 2, 1); // get html5 lib version number from its URL
                return (html5libVersion == "1" || item.config === null); // need to upgrade if the version is lower than 2 or the player doesn't have a config object
            };

            $scope.showSubTitle = true;
            $scope.getThumbnail = function(item) {
                if (typeof item.thumbnailUrl != 'undefined')
                    return item.thumbnailUrl; // TODO: prehaps some checking on the URL validity?
                else return $scope.defaultThumbnailUrl;
            };
            $scope.defaultThumbnailUrl = 'img/mockPlayerThumb.png';
            var timeVar;
            $scope.$watch('search', function(newValue, oldValue) {
                $scope.showSubTitle = newValue;
                if (newValue.length > 0) {
                    $scope.title = $filter('i18n')('search for') + ' "' + newValue + '"';
                }
                else {
                    if (oldValue)
                        $scope.title = $filter('i18n')('Players list');
                }
                timeVar =  $timeout(function() {
                    if (timeVar){
                        $timeout.cancel(timeVar);
                    }
                    $scope.triggerLayoutChange();
                    $scope.calculateTotalItems();
                }, 100);
            });
            $scope.oldVersionEditText = $filter('i18n')(
                'This player must be updated before editing. <br/>' +
                'Some features and design may be lost.');
            $scope.goToEditPage = function (item, $event) {
                $event.preventDefault();
//TODO filter according to what? we don't have "version" field
                if (!$scope.checkVersionNeedsUpgrade(item)) {
                    $location.path('/edit/' + item.id);
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
                            $scope.update(item).then(function() {
                                $location.url('edit/' + item.id);
                            });
                        }
                    }, function() {
                        return $log.info('edit when outdated modal dismissed at: ' + new Date());
                    });
                }

            }
            ;
            $scope.newPlayer = function() {
                $location.path('/new');
            };
            $scope.duplicate = function(item) {
                PlayerService.clonePlayer(item).then(function(data) {
                    $location.url('edit/' + data[1].id);
                });
            };
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
                            $scope.data.splice($scope.data.indexOf(item), 1);
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
            $scope.update = function(player) {
                var upgradeProccess = $q.defer();
                var currentVersion = player.html5Url.split("/v")[1].split("/")[0];
                var text = '<span>' + $filter("i18n")("upgradeMsg") + '</span>';
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
                            upgradeProccess.resolve('upgrade canceled');
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