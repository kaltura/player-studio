KMCMenu.controller('jsonCtrl', ['$scope',
	function ($scope) {
		$scope.$on('jsonChangeEvent', function(event, mass) {
			$scope.propertyChanged({'player-refresh':'true'}, false);
		});
	}
]);
