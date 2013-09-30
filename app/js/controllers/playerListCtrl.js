'use strict';

/* Controllers */

KMCModule.controller('PlayerListCtrl', ['$rootScope', '$scope', 'PlayerService', '$filter', '$timeout', function($rootScope, $scope, PlayerService, $filter, $timeout) {
        $rootScope.lang = 'en-US';
        $scope.search = '';
        $scope.data = PlayerService.getPlayers();
        $scope.currentPage = 1;
        $scope.maxSize = 5;
        $scope.filterd = $filter('filter')($scope.data, $scope.search);
        $scope.calculateTotalItems = function() {
            $scope.totalItems = $scope.filterd.length;
            $scope.totalPages = Math.ceil($scope.filterd.length / $scope.maxSize);
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
        };
        $scope.delete = function(item) {
            $scope.data.splice(item, 1);
            $scope.calculateTotalItems();
        };

    }]);