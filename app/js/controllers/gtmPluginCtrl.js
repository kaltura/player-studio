KMCMenu.controller('gtmPluginCtrl', ['$scope',
	function ($scope) {
		$scope.customListOfCustomEvents = '';

		if(!("googleTagManager" in $scope.playerData.config.plugins)) {
			$scope.playerData.config.plugins["googleTagManager"] = {disable: true};
		}

		if ($scope.playerData.config.plugins["googleTagManager"].enabled) {
			const data = $scope.playerData.config.plugins["googleTagManager"];
			if (Array.isArray(data?.customEventsTracking?.custom) && data?.customEventsTracking?.custom.length > 0){
				$scope.customListOfCustomEvents = data.customEventsTracking.custom.join(',');
			} else if (!('customEventsTracking' in $scope.playerData.config.plugins["googleTagManager"])) {
				$scope.playerData.config.plugins["googleTagManager"].customEventsTracking = {custom: []};
			} else {
				$scope.playerData.config.plugins["googleTagManager"].customEventsTracking.custom = '';
			}
		}

		$scope.customListOfCustomEventsChange = function(){
			$scope.playerData.config.plugins["googleTagManager"].customEventsTracking.custom = $scope.customListOfCustomEvents
				.replace(/\s/g,'')
				.split(',');
		};
	}
]);
