'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
    ['$scope', 'PlayerData', '$routeParams', '$filter', 'menuSvc',
        function ($scope, PlayerData, $routeParams, $filter, menuSvc) {
            $scope.playerId = $routeParams.id;
            $scope.title = $filter('i18n')('Edit player');
            $scope.data = PlayerData.data;

        }]);
KMCModule.controller('editPageDataCntrl',['$scope',function($scope){

}]);