'use strict';

/* Controllers */

KMCModule.controller('LoginCtrl',
	['$scope', 'apiService', '$location', '$rootScope',
		function ( $scope, apiService , $location, $rootScope ) {
			$scope.login = function () {
				apiService.doRequest( {
					'service' : 'user',
					'action' : 'loginbyloginid',
					'loginId' : $scope.email,
					'password': $scope.pwd
				}).then( function( data ) {
						apiService.setKs( data );
						$location.path( "/list" );
					}, function( errorMsg ) {
						alert ( errorMsg );
					});
			};
		}]);