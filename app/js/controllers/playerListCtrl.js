'use strict';

/* Controllers */

KMCModule.controller('PlayerListCtrl',
    ['apiService', '$location', '$rootScope', '$scope', '$filter', '$modal', '$timeout', '$log', "$compile", "$window", 'localStorageService', 'requestNotificationChannel', 'PlayerService',
        function (apiService, $location, $rootScope, $scope, $filter, $modal, $timeout, $log, $compile, $window, localStorageService, requestNotificationChannel, PlayerService) {
            requestNotificationChannel.requestStarted('list');
            $rootScope.lang = 'en-US';
            $scope.search = '';
            $scope.searchSelect2Options = {};
            $scope.currentPage = 1;
            $scope.maxSize = 5;
            $scope.$parent.myScrollOptions = {scrollY: true, scrollX: false, momentum: false, bounce: false, snap: false
            };
            var request = {
                'filter:tagsMultiLikeOr': 'kdp3',
                'filter:orderBy': '-updatedAt',
                'filter:objectTypeEqual': '1',
                'filter:objectType': 'KalturaUiConfFilter',
                //this was removed to allow client side paging,
                // else we need another request to know the totalSize
                // so we can make a pager that does requests per page
                //
//				'page:objectType': 'KalturaFilterPager',
//				'pager:pageIndex': '1',
//				'pager:pageSize': $scope.maxSize,
                'service': 'uiConf',
                'action': 'list'
            };
//real data
            apiService.doRequest(request).then(function (data) {
                $scope.data = data.objects;
                $scope.calculateTotalItems();
            });
//mock data
//            PlayerService.getPlayers().success(function (data) {
//                $scope.data = data.objects;
//                $scope.calculateTotalItems();
//            });
            //end
            $scope.$watch('maxSize', function (newVal, oldVal) {
                if (newVal != oldVal) {
                    $scope.$broadcast('layoutChange');
                }
            })

            $scope.filtered = $filter('filter')($scope.data, $scope.search) || [];


            $scope.playerVersions = [
                {"label": "1.0", "url": "", "value": "1.0"},
                {"label": "2.0", "url": "", "value": "2.0"},
                {"label": "2.0.1rc2", "url": '', "value": "2.0.1"}
            ]
            $scope.requiredVersion = '201';

            $scope.calculateTotalItems = function () {
                $scope.$broadcast('layoutChange');
                if ($scope.filtered)
                    $scope.totalItems = $scope.filtered.length;
                else if ($scope.data) {
                    $scope.totalItems = $scope.data.length;
                    return $scope.totalItems;
                }
            };
            $scope.checkVersionNeedsUpgrade = function (itemVersion) {
                if (!itemVersion) {
                    return false;
                }
                itemVersion = itemVersion.replace(/\./g, '');
                if (itemVersion >= $scope.requiredVersion)
                    return false
                else
                    return true
            }

// $scope.title = $filter('i18n')('Players list');
            $scope.showSubTitle = true;
            $scope.getThumbnail = function (item) {
                if (typeof item.thumbnailUrl != 'undefined')
                    return item.thumbnailUrl; // TODO: prehaps some checking on the URL validity?
                else return $scope.defaultThumbnailUrl;
            };
            $scope.defaultThumbnailUrl = 'img/mockPlayerThumb.png';
            $scope.$watch('search', function (newValue, oldValue) {
                $scope.showSubTitle = newValue;
                if (newValue.length > 0) {
                    $scope.title = $filter('i18n')('search for') + ' "' + newValue + '"';
                }
                else {
                    if (oldValue)
                        $scope.title = $filter('i18n')('Players list');
                }

                $timeout(function () {
                    $scope.calculateTotalItems();
                }, 100);
            });
            $scope.oldVersionEditText = $filter('i18n')('Warning this player is out of date. \n' +
                'Saving changes to this player upgrade, some features and \n' +
                'design may be lost. (read more about upgrading players)');
            $scope.goToEditPage = function (item) {
                //TODO filter according to what? we don't have "version" field
                if (!$scope.checkVersionNeedsUpgrade(item.version)) {
                    $location.path('/edit/' + item.id);
                    return false;
                } else {
                    var modal = $modal.open({
                        templateUrl: 'template/dialog/message.html',
                        controller: 'ModalInstanceCtrl',
                        resolve: {
                            settings: function () {
                                return {
                                    'title': 'Edit confirmation',
                                    'message': $scope.oldVersionEditText
                                };
                            }
                        }
                    })
                    modal.result.then(function (result) {
                        if (result) { // here we should move though an upgrade process before reaching the edit.
                            return  $location.url('edit/' + item.id);
                        }

                    }, function () {
                        return $log.info('edit when outdated modal dismissed at: ' + new Date());
                    });
                }
            };
            $scope.newPlayer = function () {
                $location.path('/new');
            };
            $scope.duplicate = function (item) {
//                TODO:will need to get the current ID and move it to the edit page with duplicate flag (save as new)
                $scope.data.splice($scope.data.indexOf(item) + 1, 0, item);
            };
//TODO: preview action...
            $scope.delete = function (item) {
                //TODO: api call for delete
                var modal = $modal.open({
                    templateUrl: 'template/dialog/message.html',
                    controller: 'ModalInstanceCtrl',
                    resolve: {
                        settings: function () {
                            return {
                                'title': 'Delete confirmation',
                                'message': 'Are you sure you want to delete the player?'
                            };
                        }
                    }
                });
                modal.result.then(function (result) {
                    if (result)
                        $scope.data.splice($scope.data.indexOf(item), 1);
                }, function () {
                    $log.info('Delete modal dismissed at: ' + new Date());
                });
            };
            $scope.update = function (player) {
                PlayerService.playerUpdate(player);
            }
        }
    ])
;