'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
    ['$scope', 'PlayerData', '$routeParams', '$filter', 'menuSvc',
        function ($scope, PlayerData, $routeParams, $filter, menuSvc) {
            $scope.playerId = $routeParams.id;
            $scope.title = $filter('i18n')('Edit player');
            $scope.data = PlayerData.data;
            $scope.menuShown = true;
            $scope.$watch(function () {
                return menuSvc.menuEvent
            }, function () {
                if (!$scope.menuShown) {
                    $scope.menuShown = true;
                }
            });
            $scope.togglemenu = function () {
                $scope.menuShown = !$scope.menuShown;
            }
            $scope.$watch('menuShown', function (newVal, oldVal) {
                if (newVal != oldVal) {
                    if (newVal) { //close
                        $('#mp-pusher').animate(
                            {'left': '30%'},
                            { duration: 200, queue: true });
                    }
                    else {//open
                        $('#mp-pusher').animate(
                            {'left': '0'},
                            { duration: 200, queue: true });

                    }
                }
            })
        }]);
