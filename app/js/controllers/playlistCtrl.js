KMCMenu.controller('playlistCtrl', ['$scope', '$modal', 'utilsSvc',
	function ($scope, $modal, utilsSvc) {

		$scope.additionalPlaylists = [];
		// build playlists array
		for (var i = 0; i < $scope.plugin.properties.length; i++) {
			var prop = $scope.plugin.properties[i];
			if (prop.model.indexOf("config.plugins.playlistAPI.kpl") === 0 && prop.model.indexOf("Id") === prop.model.length - 2) {
				var playlistID = prop.initvalue;
				var playlistName = $scope.plugin.properties[i + 1].initvalue;
				var editable = (prop.model.indexOf("config.plugins.playlistAPI.kpl0Id") === -1);
				$scope.additionalPlaylists.push({"id": playlistID, "name": playlistName, "editable": editable});
			}
		}

		// update the table when the user change playlist selection
		if ($scope.playerData.config.plugins && $scope.playerData.config.plugins.playlistAPI) {
			$scope.additionalPlaylists[0] = {"id": $scope.playerData.config.plugins.playlistAPI.kpl0Id, "name": $scope.playerData.config.plugins.playlistAPI.kpl0Name, "editable": false};
		}
		$scope.$on('setPlaylistEvent', function (event, params) {
			$scope.additionalPlaylists[0] = {"id": params[0], "name": params[1], "editable": false};
		});

		$scope.addPlaylist = function (prop) {
			$scope.additionalPlaylists.push({"id": "", "name": "", "editable": true});
			$scope.propertyChanged(prop, true);
		};

		$scope.deletePlaylist = function (index, prop) {
			$scope.additionalPlaylists.splice(index, 1);
			$scope.updatePlaylist(prop, true);
		};

		$scope.updatePlaylist = function (prop, trigger) {
			// remove previous playlist properties
			for (var i = $scope.plugin.properties.length - 1; i >= 0; i--) {
				var p = $scope.plugin.properties[i];
				if (p.model.indexOf("config.plugins.playlistAPI.kpl") === 0) { // this is a playlist property
					$scope.plugin.properties.splice(i, 1); // remove property
				}
			}
			// add updated playlist properties
			for (var playlistIndex = 0; playlistIndex < $scope.additionalPlaylists.length; playlistIndex++) {
				$scope.plugin.properties.push({"model": "config.plugins.playlistAPI.kpl" + playlistIndex + "Id", "initvalue": $scope.additionalPlaylists[playlistIndex].id, "type": "hiddenValue"});
				$scope.plugin.properties.push({"model": "config.plugins.playlistAPI.kpl" + playlistIndex + "Name", "initvalue": $scope.additionalPlaylists[playlistIndex].name, "type": "hiddenValue"});
			}

			// remove redundant playlists from playerData
			if ($scope.playerData.config.plugins && $scope.playerData.config.plugins.playlistAPI) {
				var pData = $scope.playerData.config.plugins.playlistAPI;
				if (pData["kpl" + $scope.additionalPlaylists.length + "Id"]) {
					delete pData["kpl" + $scope.additionalPlaylists.length + "Id"];
					delete pData["kpl" + $scope.additionalPlaylists.length + "Name"];
				}
			}
			$scope.propertyChanged(prop, trigger);
		};

	}]);
