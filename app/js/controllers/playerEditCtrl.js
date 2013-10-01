'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl',
        ['$rootScope', '$scope', 'PlayerService', '$routeParams', '$filter','editableProperties',
            function($rootScope, $scope, PlayerService, $routeParams, $filter,editableProperties) {
                var playerId = $routeParams.id;
                $scope.title = $filter('i18n')('Edit player');
                PlayerService.getPlayer(playerId).success(function(data) {
                    $scope.data = data;
                });
                editableProperties.success(function(data){
                   console.log(data);
                });

//                $scope.toggleProperty = function($event) { 
//                    var checkbox = $($event.target).find('input[type="checkbox"]');
//                    if (checkbox.attr('checked'))
//                        checkbox.removeAttr('checked');
//                    else
//                        checkbox.attr('checked', 'checked');
//                };

            }]);