'use strict';

/* Controllers */

KMCModule.controller('PlayerListCtrl',
        ['PlayerService', '$rootScope', '$scope', '$filter', '$modal', '$timeout', '$log',
            function(PlayerService, $rootScope, $scope, $filter, $modal, $timeout, $log) {
                $rootScope.lang = 'en-US';
                $scope.search = '';
                $scope.data = PlayerService.getPlayers();
                $scope.currentPage = 1;
                $scope.maxSize = 5;
                $scope.filterd = $filter('filter')($scope.data, $scope.search);
                $scope.calculateTotalItems = function() {
                    $scope.totalItems = $scope.filterd.length;
                    return $scope.totalItems;
                };
                $scope.calculateTotalItems();
                $scope.title = $filter('i18n')('players list');
                $scope.showSubTitle = true;
                $scope.$watch('search', function(newValue, oldValue) {
                    $scope.showSubTitle = newValue;
                    if (newValue.length > 0) {
                        $scope.title = $filter('i18n')('search for') + ' "' + newValue + '"';
                    }
                    else {
                        if (oldValue)
                            $scope.title = $filter('i18n')('players list');
                    }

                    $timeout(function() {
                        $scope.calculateTotalItems();
                    }, 100);
                });
                $scope.newPlayer = function() {
                    window.location.href = '#/player/new';
                };
                $scope.duplicate = function(item) {
                    $scope.data.splice($scope.data.indexOf(item) + 1, 0, item);
                };
                $scope.delete = function(item) {
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
                            $scope.data.splice($scope.data.indexOf(item), 1);
                    }, function() {
                        $log.info('Modal dismissed at: ' + new Date());
                    });
                };

            }]);