'use strict';

/* Controllers */
//
angular.module('KMC.controllers', [])
        .controller('ModalInstanceCtrl',
                function($scope, $modalInstance, settings) {
                    $scope.title = '';
                    $scope.message = '';
                    $scope.buttons = [{result: false, label: 'Cancel', cssClass: 'btn-default'}, {result: true, label: 'OK', cssClass: 'btn-primary'}];
                    angular.extend($scope, settings);
                    $scope.close = function(result) {
                        $modalInstance.close(result);
                    };

                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                }
        );