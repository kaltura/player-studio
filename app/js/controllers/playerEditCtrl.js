'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
    ['$scope', 'PlayerData', '$routeParams', '$filter', 'editProperties',
        function ($scope, PlayerData, $routeParams, $filter, editProperties) {
            $scope.playerId = $routeParams.id;
            $scope.title = $filter('i18n')('Edit player');
            $scope.data = PlayerData.data;
            $scope.menuShown = true;
            $scope.togglemenu = function(){
                $scope.menuShown = !$scope.menuShown;
            }
            $scope.editProperties = editProperties.data;
            $scope.$watch('menuShown', function(newVal, oldVal) {
                if (newVal != oldVal) {
                    if (newVal) {
                        $('#mp-menu').css('left', '-100%');
                        $('.mp-pusher').css('margin-left', '0');
                    }
                    else{
                        $('.mp-pusher').css('margin-left', '30%');
                        $('#mp-menu').css('left', '0');
                    }
                }
            })
        }]);
