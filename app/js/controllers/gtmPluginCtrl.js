KMCMenu.controller('gtmPluginCtrl', ['$scope',
	function ($scope) {
		$scope.customEvents = '';

		if(!("googleTagManager" in $scope.playerData.config.plugins)) {
			$scope.playerData.config.plugins["googleTagManager"] = {disable: true};
		}

		// init radio buttons according to selected related entries source
		if ($scope.playerData.config.plugins["googleTagManager"].enabled) {
			var data = $scope.playerData.config.plugins["googleTagManager"];
			if (Array.isArray(data.customEvents) && data.customEvents.length > 0){
				$scope.customEvents = data.customEvents.join(',');
			}
		}

		// update entries list
		$scope.customEventsChange = function(){
			$scope.playerData.config.plugins["googleTagManager"].customEvents = $scope.customEvents.split(',');
		};
	}
]);
