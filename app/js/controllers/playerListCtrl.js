'use strict';

/* Controllers */

KMCModule.controller('PlayerListCtrl',
    ['apiService', '$location', '$rootScope', '$scope', '$filter', '$modal', '$timeout', '$log', "$compile","$window", 'localStorageService',
        function (apiService, $location, $rootScope, $scope, $filter, $modal, $timeout, $log, $compile,$window, localStorageService) {
			// Check if we have ks in locaclstorage
			var ks = localStorageService.get('ks');
			if ( !ks ) { //navigate to login
				$location.path( "/login" );
			} else {
				apiService.setKs( ks );
			}
            $rootScope.lang = 'en-US';
            $scope.search = '';

			var request = {
				'filter:tagsMultiLikeOr' : 'kdp3',
				'filter:orderBy'  : '-updatedAt',
				'filter:objectTypeEqual': '1',
				'filter:objectType': 'KalturaUiConfFilter',
				'page:objectType': 'KalturaFilterPager',
				'pager:pageIndex': '1',
				'pager:pageSize': '25',
				'service' : 'uiConf',
				'action' : 'list'
			};
			apiService.doRequest( request ).then( function(data) {
				$scope.data = data.objects;
				$scope.calculateTotalItems();
			});


            //$scope.data = apiService.data.objects;

            $scope.searchSelect2Options = {};
            $scope.currentPage = 1;
            $scope.maxSize = 25;
            $scope.playerVersions = [
                {"label": "1.0", "url": "", "value": "1.0"},
                {"label": "2.0", "url": "", "value": "2.0"},
                {"label": "2.0.1rc2", "url": '', "value": "2.0.1"}
            ]
            $scope.requiredVersion = '201';
            $scope.filterd = $filter('filter')($scope.data, $scope.search);
			//TODO fix total count!
            $scope.calculateTotalItems = function () {
				if ( $scope.filterd )
              	  $scope.totalItems = $scope.filterd.length;
				else
					$scope.totalItems = 0;
                return $scope.totalItems;
            };
            $scope.checkVersionNeedsUpgrade = function (itemVersion) {
				if ( ! itemVersion ) {
					return false;
				}
                itemVersion = itemVersion.replace(/\./g, '');
                if (itemVersion >= $scope.requiredVersion)
                    return false
                else
                    return true
            }

            $scope.title = $filter('i18n')('players list');
            $scope.showSubTitle = true;
            $scope.$watch('search', function (newValue, oldValue) {
                $scope.showSubTitle = newValue;
                if (newValue.length > 0) {
                    $scope.title = $filter('i18n')('search for') + ' "' + newValue + '"';
                }
                else {
                    if (oldValue)
                        $scope.title = $filter('i18n')('players list');
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
                    return  $window.location.href = 'edit/' + item.id;
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
                $scope.data.splice($scope.data.indexOf(item) + 1, 0, item);
            };
            $scope.delete = function (item) {
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
            $scope.update = function (item) {
                var text = '<span>Updating the player -- TEXT MISSING -- current version </span>';
                var modal = $modal.open({
                    templateUrl: 'template/dialog/message.html',
                    controller: 'ModalInstanceCtrl',
                    resolve: {
                        settings: function () {
                            return {
                                'title': 'Update confirmation',
                                'message': text + item.version
                            };
                        }
                    }
                });
                modal.result.then(function (result) {
                    if (result) {
                        $log.info('update modal confirmed for item version ' + item.version + 'at: ' + new Date());
                    }

                }, function () {
                    $log.info('update modal dismissed at: ' + new Date());
                });
            };

        }]);