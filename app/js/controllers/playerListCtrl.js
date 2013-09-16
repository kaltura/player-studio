'use strict';

/* Controllers */

KMCModule.controller('PlayerListCtrl', ['$rootScope', '$scope', 'PlayerService', '$filter', function($rootScope, $scope, PlayerService, $filter,pagination) {
        $rootScope.lang = 'he-IL'
        $scope.data = PlayerService.getPlayers();
        $scope.search = '';
        $scope.perPage = 5;
        $scope.title = $filter('i18n')('players list');
        $scope.showSubTitle = true;
        $scope.$watch('search', function(newValue,oldValue) {
            $scope.showSubTitle = newValue;
            if (newValue.length > 0)
                $scope.title = $filter('i18n')('search for') + ' "' + newValue + '"';
            else if (oldValue)
                $scope.title = $filter('i18n')('players list');
        })
       $scope.$watch('perPage',function(){
            $scope.pages =  $scope.data.length / $scope.perPage;
        });
        $scope.newPlayer = function() {
            window.location = '#/player/new';
        }
        $scope.duplicate = function(item) {
            alert("duplicate:" + item.id)
        }
    }]);