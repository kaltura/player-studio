'use strict';

/* Controllers */

KMCModule.controller('PlayerListCtrl', ['$rootScope', '$scope', 'PlayerService', '$filter', '$routeParams', function($rootScope, $scope, PlayerService, $filter) {
        $rootScope.lang = 'en-US';
        $scope.search = '';
        $scope.data = PlayerService.getPlayers();
        $scope.currentPage = 1;
        $scope.maxSize = 5;
        $scope.totalItems = $scope.data.length;
        $scope.title = $filter('i18n')('players list');
        $scope.showSubTitle = true;
        $scope.$watch('search', function(newValue, oldValue) {
            $scope.showSubTitle = newValue;
            if (newValue.length > 0)
                $scope.title = $filter('i18n')('search for') + ' "' + newValue + '"';
            else if (oldValue)
                $scope.title = $filter('i18n')('players list');
        });
        $scope.showPlayers = function() {
            var begin = ($scope.currentPage - 1) * $scope.maxSize;
            var end = $scope.currentPage * $scope.maxSize;
            return $scope.data.slice(begin, end);
        };
        $scope.newPlayer = function() {
            window.location.href = '#/player/new';
        };
        $scope.duplicate = function(item) {
            alert("duplicate:" + item.id);
        };
    }]);