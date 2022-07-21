KMCMenu.controller('gtmPluginCtrl', ['$scope',
	function ($scope) {
		$scope.customListOfCustomEvents = '';

		// Plugin doesn't exist in this uiconf
		if(!("googleTagManager" in $scope.playerData.config.plugins)) {
			$scope.playerData.config.plugins["googleTagManager"] = {disable: true};
			$scope.playerData.config.plugins["googleTagManager"].customEventsTracking = {custom:[]};
		// Plugin enabled in this uiconf
		} else if ($scope.playerData.config.plugins["googleTagManager"].enabled) {
			var data = $scope.playerData.config.plugins["googleTagManager"];
			if (Array.isArray(data.customEventsTracking && data.customEventsTracking.custom) && data.customEventsTracking.custom.length > 0){
				$scope.customListOfCustomEvents = data.customEventsTracking.custom.join(',');
			}
		}

		$scope.customListOfCustomEventsChange = function(){
			$scope.playerData.config.plugins["googleTagManager"].customEventsTracking.custom = $scope.customListOfCustomEvents
				.replace(/\s/g,'')
				.replace(/^,|,$/g,'')
				.replace(/,,+/g,',')
				.split(',');
		};
	}
]);
