'use strict';

/* Controllers */

KMCModule.controller('PlayerListCtrl', [ '$rootScope','$scope','PlayerService', function($rootScope,$scope,PlayerService) {
    $rootScope.lang='he-IL'
    $scope.data = PlayerService.getPlayers();
    $scope.newPlayer = function(){
        window.location = '#/player/new' ;
    }
    $scope.copy = function(item){
        alert("copy:"+item.id)
    }
}]);