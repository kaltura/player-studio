KMCMenu.controller('relatedCtrl', ['$scope',
	function ($scope) {
		$scope.relatedOption = "relatedToEntry";
		$scope.entryList = "";
		$scope.playlistId = {id:'' ,text:''};

		// init radio buttons according to selected related entries source
		if ($scope.playerData.config.player.plugins && $scope.playerData.config.player.plugins["related"]) {
			var data = $scope.playerData.config.player.plugins["related"];
			if (data.entryList && data.entryList !== ""){
				$scope.relatedOption = "entryList";
				$scope.entryList = data.entryList;
			}
			if (data.playlistId && data.playlistId !== ""){
				$scope.relatedOption = "playlistId";
				$scope.playlistId = data.playlistId;
			}
		}

		// update entries list
		$scope.entryListChange = function(){
			// unselect playlist ID
			$scope.playerData.config.player.plugins["related"].playlistId = null;
			$scope.playlistId = {id:'',text:''};
			// set entries list
			$scope.playerData.config.player.plugins["related"].entryList = $scope.entryList;
		};

		// update playlist ID
		$scope.playlistIdChange = function(){
			// unselect entries list
			$scope.playerData.config.player.plugins["related"].entryList = null;
			$scope.entryList = "";
			// set playlist ID
			$scope.playerData.config.player.plugins["related"].playlistId = $scope.playlistId.id;
		};

		// clear selection of unselected radio button potions
		$scope.relatedSelected = function(){
			$scope.playerData.config.player.plugins["related"].playlistId = undefined;
			$scope.playerData.config.player.plugins["related"].entryList = null;
			$scope.playlistId = {id:'',text:''};
			$scope.entryList = "";
			$scope.propertyChanged("related", true);
		};

		// required for the playlist selector
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
