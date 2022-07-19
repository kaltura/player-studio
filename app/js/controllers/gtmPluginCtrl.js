KMCMenu.controller('gtmPluginCtrl', ['$scope',
	function ($scope) {
		$scope.customListOfCustomEvents = '';

		if(!("googleTagManager" in $scope.playerData.config.plugins)) {
			$scope.playerData.config.plugins["googleTagManager"] = {disable: true};
		}

		if ($scope.playerData.config.plugins["googleTagManager"].enabled) {
			var data = $scope.playerData.config.plugins["googleTagManager"];
			if (Array.isArray(data.customEventsTracking && data.customEventsTracking.custom) && data.customEventsTracking.custom.length > 0){
				$scope.customListOfCustomEvents = data.customEventsTracking.custom.join(',');
			} else {
				$scope.playerData.config.plugins["googleTagManager"] = {customEventsTracking: {custom:[]}};
			}
		}

		$scope.customListOfCustomEventsChange = function(){
			$scope.playerData.config.plugins["googleTagManager"].customEventsTracking.custom = $scope.customListOfCustomEvents
				.replace(/\s/g,'')
				.split(',');
		};
	}
]);
