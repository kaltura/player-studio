'use strict';

/* Controllers */

KMCModule.controller('PlayerListCtrl', ['$rootScope', '$scope', 'PlayerService', '$filter', '$routeParams', function($rootScope, $scope, PlayerService, $filter) {
        $rootScope.lang = 'he-IL'
        $scope.search = '';
        $scope.data = PlayerService.getPlayers();
        $scope.perPage = 5;
        $scope.currentPage = 0;
        $scope.pages = 0;
        $scope.title = $filter('i18n')('players list');
        $scope.showSubTitle = true;
        $scope.$watch('search', function(newValue, oldValue) {
            $scope.showSubTitle = newValue;
            if (newValue.length > 0)
                $scope.title = $filter('i18n')('search for') + ' "' + newValue + '"';
            else if (oldValue)
                $scope.title = $filter('i18n')('players list');
        })
        $scope.$watch('perPage', function() {
            $scope.pages = $scope.data.length / $scope.perPage;
        });
        $scope.gotoPage = function(page) {
            $scope.currentPage = page;
        };
        $scope.nextPage = function() {
            if ($scope.data.length > $scope.currentPage * $scope.perPage)
                 $scope.currentPage =  $scope.currentPage+1;
        };
        $scope.prevPage = function() {
            if ($scope.currentPage > 1)
                $scope.currentPage =  $scope.currentPage-1;
        };
        $scope.showPlayers = function() {
            var begin = $scope.currentPage * $scope.perPage;
            var end = ($scope.currentPage + 1) * $scope.perPage
            return $scope.data.slice(begin, end);
        };
        $scope.newPlayer = function() {
            window.location.href = '#/player/new';
        };
        $scope.duplicate = function(item) {
            alert("duplicate:" + item.id);
        };
    }]);