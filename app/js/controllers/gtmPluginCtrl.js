KMCMenu.controller('gtmPluginCtrl', ['$scope',
	function ($scope) {
		$scope.customListOfCustomEvents = '';

		if(!("googleTagManager" in $scope.playerData.config.plugins)) {
			$scope.playerData.config.plugins["googleTagManager"] = {disable: true};
		}

		// init radio buttons according to selected related entries source
		if ($scope.playerData.config.plugins["googleTagManager"].enabled) {
			var data = $scope.playerData.config.plugins["googleTagManager"];
			if (Array.isArray(data?.customEventsTracking?.custom) && data?.customEventsTracking?.custom.length > 0){
				$scope.customListOfCustomEvents = data.customEventsTracking.custom.join(',');
			} else if (!('customEventsTracking' in $scope.playerData.config.plugins["googleTagManager"])) {
				$scope.playerData.config.plugins["googleTagManager"].customEventsTracking = {custom: []};
			} else {
				$scope.playerData.config.plugins["googleTagManager"].customEventsTracking.custom = '';
			}
		}

		// update player custom events list
		$scope.customListOfCustomEventsChange = function(){
			$scope.playerData.config.plugins["googleTagManager"].customEventsTracking.custom = $scope.customListOfCustomEvents.split(',');
		};
	}
]);
