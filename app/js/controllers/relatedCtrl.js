KMCMenu.controller('relatedCtrl', ['$scope',
	function ($scope) {
		$scope.relatedOption = "relatedToEntry";
		$scope.entryList = '';
		$scope.playlistId = {id:'' ,text:''};
		if(!("related" in $scope.playerData.config.plugins)) {
			$scope.playerData.config.plugins["related"] = {disable: true};
			$scope.playerData.config.plugins["related"].useContext = true;
		}

		// init radio buttons according to selected related entries source
		if ($scope.playerData.config.plugins["related"].enabled) {
			var data = $scope.playerData.config.plugins["related"];
			if (data.entryList?.length > 0){
				$scope.relatedOption = "entryList";
				$scope.entryList = data.entryList.map(mediaInfo => mediaInfo.entryId).join(',');
			}
			if (data.playlistId && data.playlistId !== ""){
				$scope.relatedOption = "playlistId";
				$scope.playlistId = data.playlistId;
			}
		}

		// update entries list
		$scope.entryListChange = function(){
			// unselect playlist ID
			$scope.playerData.config.plugins["related"].playlistId = null;
			$scope.playerData.config.plugins["related"].useContext = false;
			// set entries list
			$scope.playerData.config.plugins["related"].entryList = $scope.entryList.split(',').map(id => ({entryId: id.trim()}));
		};

		// update playlist ID
		$scope.playlistIdChange = function(){
			// unselect entries list
			$scope.playerData.config.plugins["related"].entryList = [];
			$scope.playerData.config.plugins["related"].useContext = false;
			// set playlist ID
			$scope.playerData.config.plugins["related"].playlistId = $scope.playlistId.id;
		};

		// clear selection of unselected radio button potions
		$scope.relatedSelected = function(){
			$scope.playerData.config.plugins["related"].playlistId = null;
			$scope.playerData.config.plugins["related"].entryList = [];
			$scope.playerData.config.plugins["related"].useContext = true;

			$scope.propertyChanged("related", true);
		};

		// required for the playlist selector
		$scope.getLabel = function(id, configObject){
			var searchArr = configObject === "playlistSelectBox" ? $scope.userPlaylists : $scope.userEntries;
			for (var i = 0; i < searchArr.length; i++){
				if (searchArr[i].id === id){
					return searchArr[i].text;
				}
			}
			return id;
		};
	}
]);
