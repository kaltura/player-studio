KMCMenu.controller('keyValuePairsCtrl', ['$scope',
	function ($scope) {
		$scope.keyValuePairs = [];
		// build key/value array
		if ($scope.playerData.config.plugins && $scope.playerData.config.plugins[$scope.plugin.model]) {
			var data = $scope.playerData.config.plugins[$scope.plugin.model];
			for (var key in data){
				if (key !== "plugin" && key !== "enabled" && key !== "keyValuePairs"){
					$scope.keyValuePairs.push({"key":key ,"value": data[key]});
				}
			}
		}

		// update player data before rendering the player
		$scope.$on('beforeRenderEvent', function (event) {
			$scope.updateKeyValueData();
		});

		// update player data
		$scope.updateData = function () {
			$scope.updateKeyValueData();
		};

		$scope.updateKeyValueData = function(){
			if ($scope.playerData.config.plugins && $scope.playerData.config.plugins[$scope.plugin.model]) {
				var data = $scope.playerData.config.plugins[$scope.plugin.model];
				for (var prop in data){
					if (prop !== "plugin" && prop !== "enabled"){
						delete data[prop];
					}
				}
				for (var i=0; i<$scope.keyValuePairs.length; i++){
					data[$scope.keyValuePairs[i].key.toString()] = $scope.keyValuePairs[i].value.toString();
				}
			}
		};
	}
]);
