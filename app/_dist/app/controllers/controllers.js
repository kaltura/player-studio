'use strict';
angular.module('KMC.controllers', []).controller('ModalInstanceCtrl', [
  '$scope',
  '$modalInstance',
  'settings',
  function ($scope, $modalInstance, settings) {
    $scope.title = '';
    $scope.message = '';
    $scope.buttons = [
      {
        result: false,
        label: 'Cancel',
        cssClass: 'btn-default'
      },
      {
        result: true,
        label: 'OK',
        cssClass: 'btn-primary'
      }
    ];
    $scope.close = function (result) {
      $modalInstance.close(result);
    };
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
    angular.extend($scope, settings);
  }
]);
;