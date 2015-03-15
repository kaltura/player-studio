'use strict';

/* Controllers */
//
angular.module('KMC.controllers', [])
    .controller('ModalInstanceCtrl',
    function ($scope, $modalInstance, settings) {
        $scope.title = '';
        $scope.message = '';
        $scope.buttons = [
            {result: false, label: 'Cancel', cssClass: 'btn-default'},
            {result: true, label: 'OK', cssClass: 'btn-primary'}
        ];
        $scope.close = function (result) {
            $modalInstance.close(result);

        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        angular.extend($scope, settings);

    })
	.controller('ModalInstanceInputCtrl',
	function ($scope, $modalInstance, settings) {
		$scope.userInput = '';
		$scope.title = '';
		$scope.message = '';
		$scope.buttons = [
			{result: false, label: 'Cancel', cssClass: 'btn-default'},
			{result: true, label: 'OK', cssClass: 'btn-primary'}
		];
		$scope.close = function (result) {
			result = result ? this.userInput : false;
			$modalInstance.close(result);

		};
		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
		angular.extend($scope, settings);

	})
;

