'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
    ['$scope', 'PlayerData', '$routeParams', '$filter',
        function ($scope, PlayerData, $routeParams, $filter) {
            $scope.playerId = $routeParams.id;
            $scope.title = $filter('i18n')('Edit player');
            $scope.data = PlayerData.data;

        }]);
KMCModule.controller('editPageDataCntrl',['$scope',function($scope){

}]);