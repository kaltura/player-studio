KMCMenu.controller('entrySelectorCtrl', ['$scope',
	function ($scope) {
		$scope.getLabel = function(id, configObject){
			var searchArr = configObject == "playlistSelectBox" ? $scope.userPlaylists : $scope.userEntries;
			for (var i = 0; i < searchArr.length; i++){
				if (searchArr[i].id === id){
					return searchArr[i].text;
				}
			}
			return id;
		};
	}
]);
