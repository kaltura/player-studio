'use strict';

/* Controllers */

angular.module('KMCModule').controller('PlayerListCtrl',
	['apiService', 'loadINI', '$location', '$rootScope', '$scope', '$filter', '$modal', '$timeout', '$log', "$compile", "$window", 'localStorageService', 'requestNotificationChannel', 'PlayerService', '$q', 'utilsSvc',
		function (apiService, loadINI, $location, $rootScope, $scope, $filter, $modal, $timeout, $log, $compile, $window, localStorageService, requestNotificationChannel, PlayerService, $q, utilsSvc) {
			// start request to show the spinner. When data is rendered, the onFinishRender directive will hide the spinner
			requestNotificationChannel.requestStarted('list');
			$rootScope.lang = 'en-US';

			var getHTML5Version = function (path) {
				var version = '';
				if (path.indexOf("{latest}") !== -1) {
					version = "latest";
				} else {
					version = path.substring(path.lastIndexOf('/v') + 2, path.indexOf('/mwEmbedLoader.php'));
				}
				return version;
			};
			// init search
			$scope.search = '';
			$scope.searchSelect2Options = {};

			// init paging
			$scope.currentPage = 1;
			$scope.maxSize = parseInt(localStorageService.get('listSize')) || 10;
			$scope.$watch('maxSize', function (newval, oldval) {
				if (newval != oldval) {
					localStorageService.set('listSize', newval); // save list size for when we return to the list from the edit page or reload the list page
					$scope.$broadcast('layoutChange');// update the scroller
				}
			});
			$scope.triggerLayoutChange = function () {
				$scope.$broadcast('layoutChange');
			};

			// default values for select2: width and no search
			$scope.uiSelectOpts = {
				width: '60px',
				minimumResultsForSearch: -1
			};

			// get studio UICONF to setup studio configuration
			var config = null;
			// try to get studio config from KMC (should work if we are in KMC)
			try {
				var kmc = window.parent.kmc;
				if (kmc && kmc.vars && kmc.vars.studio.config) {
					config = kmc.vars.studio.config;
					$scope.UIConf = angular.fromJson(config);
				}
			} catch (e) {
				// standalone version
				$log.error('Could not located parent.kmc: ' + e);
			}

			// if we didn't get the uiconf from kmc.vars - load the configuration from base.ini
			if (!config) {
				loadINI.getINIConfig().success(function (data) {
					$scope.UIConf = data;
				});
			}

			// get KDP default XML
			PlayerService.getKDPConfig();

			// delete temp players if exists in cache (players that were created but not saved)
			if (localStorageService.get('tempPlayerID')) {
				var deletePlayerRequest = {
					'service': 'uiConf',
					'action': 'delete',
					'id': localStorageService.get('tempPlayerID')
				};
				apiService.doRequest(deletePlayerRequest).then(function (data) {
					localStorageService.remove('tempPlayerID');
				});
			}

			// get players list from KMC
			var playersRequest = {
				'filter:tagsMultiLikeOr': 'kdp3,html5studio',
				'filter:orderBy': '-updatedAt',
				'filter:objTypeIn': '1,8',
				'filter:objectType': 'KalturaUiConfFilter',
				'filter:creationModeEqual': '2',
				'ignoreNull': '1',
				'responseProfile:objectType': 'KalturaDetachedResponseProfile',
				'responseProfile:type': '1',
				'responseProfile:fields': 'id,name,html5Url,createdAt,updatedAt,tags',
				'page:objectType': 'KalturaFilterPager',
				'pager:pageIndex': '1',
				'pager:pageSize': '999',
				'service': 'uiConf',
				'action': 'list'
			};
			apiService.doRequest(playersRequest).then(function (data) {
				$scope.data = data.objects;   // players list
				$scope.calculateTotalItems(); // calculate the total items including search filters to display in the pager
				PlayerService.cachePlayers(data.objects); // save players list data to memory cache
				requestNotificationChannel.requestEnded('list');
				setTimeout(function () {
					$scope.triggerLayoutChange(); // update scroller;
				}, 300);

			});

			// set a filtered data array of the players after search criteria
			$scope.filtered = $filter('filter')($scope.data, $scope.search) || $scope.data;

			// calculate the total items including search filters to display in the pager
			$scope.calculateTotalItems = function () {
				if ($scope.filtered)
					$scope.totalItems = $scope.filtered.length;
				else if ($scope.data) {
					$scope.totalItems = $scope.data.length;
				}
			};

			// get the minimal required player version so we can mark outdated players in the list
			$scope.requiredVersion = PlayerService.getRequiredVersion();

			// set sort order of the players
			$scope.sort = {
				sortCol: 'createdAt',
				reverse: true
			};
			$scope.sortBy = function (colName) {
				$scope.sort.sortCol = colName;
				$scope.sort.reverse = !$scope.sort.reverse;
			};
			// check if this player is a v2 player that can be upgraded to a new version
			$scope.checkV2Upgrade = function (item) {
				var html5libVersion = getHTML5Version(item.html5Url); // get html5 lib version from its URL
				return !$scope.checkVersionNeedsUpgrade(item) && window.MWEMBED_VERSION !== html5libVersion && html5libVersion !== "latest";
			};

			// check if this player should be upgraded (binded to the player's HTML outdated message)
			$scope.checkVersionNeedsUpgrade = function (item) {
				var html5libVersion = getHTML5Version(item.html5Url)[0]; // get html5 lib version number from its URL
				return ((html5libVersion == "1") ); // need to upgrade if the version is lower than 2 or the player doesn't have a config object
			};

			// check if this player is an old playlist
			$scope.checkOldPlaylistPlayer = function (item) {
				var html5libVersion = getHTML5Version(item.html5Url)[0]; // get html5 lib version number from its URL
				return ((html5libVersion == "1") && item.tags.indexOf("playlist") !== -1); // this player is an old playlist that is not supported in Universal studio
			};

			$scope.showSubTitle = true; // show the subtitle text below the title

			// get the player thumbnail - currently a static image. should be change to display the real thumbnail once we add the grabbing mechanism
			$scope.getThumbnail = function (item) {
				if (typeof item.thumbnailUrl != 'undefined')
					return item.thumbnailUrl; // TODO: prehaps some checking on the URL validity?
				else return $scope.defaultThumbnailUrl;
			};
			$scope.defaultThumbnailUrl = 'img/mockPlayerThumb.png';

			// apply search filter. Wait 100ms before applying to make sure the user finished typing
			var timeVar;
			$scope.$watch('search', function (newValue, oldValue) {
				$scope.showSubTitle = newValue; // use the subtitle to display the search term
				if (newValue.length > 0) {
					$scope.title = $filter('translate')('search for') + ' "' + newValue + '"'; // use the title to display search mode title
				}
				else {
					if (oldValue)
						$scope.title = $filter('translate')('Players list'); // restore title
				}
				if (timeVar) {
					$timeout.cancel(timeVar);
				}
				timeVar = $timeout(function () {
					$scope.triggerLayoutChange(); // update scroller
					$scope.calculateTotalItems(); // update pager
					timeVar = null;
				}, 100);
			});

			// when a player is clicked - check if this player is outdated. If so - display a message, if not - go to edit page
			$scope.oldVersionEditText = $filter('translate')(
				'This player must be updated before editing. <br/>' +
				'Some features and design may be lost.');
			// check for old playlist player
			$scope.oldPlaylistEditText = $filter('translate')(
				'Playlists created in Flash Studio cannot be edited in Universal Studio.<br>Please use Flash Studio to edit this player.');
			var goToEditPage = function (id) {
				requestNotificationChannel.requestStarted('edit');
				$location.path('/edit/' + id);
			};
			$scope.goToEditPage = function (item, $event) {
				if ($event)
					$event.preventDefault();
				if (!$scope.checkVersionNeedsUpgrade(item) && !$scope.checkOldPlaylistPlayer(item)) {
					goToEditPage(item.id);
					return false;
				} else {
					var msgText, buttons;
					if ($scope.checkVersionNeedsUpgrade(item)) {
						msgText = $filter('translate')('This player must be updated before editing. <br/>Some features and design may be lost.');
						buttons = [{result: false, label: 'Cancel', cssClass: 'btn-default'}, {
							result: true,
							label: 'Update',
							cssClass: 'btn-primary'
						}];
					}
					if ($scope.checkOldPlaylistPlayer(item)) {
						msgText = $filter('translate')('Playlists created in Flash Studio cannot be edited in Universal Studio.<br>Please use Flash Studio to edit this player.');
						buttons = [{result: false, label: 'OK', cssClass: 'btn-default'}];
					}
					var modal = $modal.open({
							templateUrl: 'templates/message.html',
							controller: 'ModalInstanceCtrl',
							resolve: {
								settings: function () {
									return {
										'title': 'Edit confirmation',
										'message': msgText,
										buttons: buttons
									};
								}
							}
						}
					);
					modal.result.then(function (result) {
						if (result) {
							// update the player and when its done - go to the edit page
							$scope.update(item).then(function () {
								goToEditPage(item.id); // player finished updating - go to the edit page
							});
						}
					}, function () {
						return $log.info('edit when outdated modal dismissed at: ' + new Date());
					});
				}

			};

			// clicking on the "new player" button should go to the new player page
			$scope.newPlayer = function () {
				$location.path('/new');
			};

			// duplicating a player
			$scope.duplicate = function (item) {
				PlayerService.clonePlayer(item).then(function (data) {
					// player finished duplicating - add it to the players list in memory in the first place (unshift the array)
					$scope.data.unshift(data[1]);
					PlayerService.cachePlayers($scope.data); // update memory cache with the new player
					$scope.goToEditPage(data[1]);
				});
			};

			// delete a player (after user confirmation)
			$scope.deletePlayer = function (item) {
				var modal = $modal.open({
					templateUrl: 'templates/message.html',
					controller: 'ModalInstanceCtrl',
					resolve: {
						settings: function () {
							return {
								'title': 'Delete confirmation',
								'message': 'Are you sure you want to delete the player?'
							};
						}
					}
				});
				modal.result.then(function (result) {
					if (result)
						PlayerService.deletePlayer(item.id).then(function () {
							// player was deleted from the database
							$scope.data.splice($scope.data.indexOf(item), 1); // delete player from local memory list of players (splice)
							$scope.triggerLayoutChange(); // update scroller as the list size changed
						}, function (reason) {
							$modal.open({
								templateUrl: 'templates/message.html',
								controller: 'ModalInstanceCtrl',
								resolve: {
									settings: function () {
										return {
											'title': 'Delete failure',
											'message': reason
										};
									}
								}
							});
						});
				}, function () {
					$log.info('Delete modal dismissed at: ' + new Date());
				});
			};
			// upgrade a V2 player to the latest version
			$scope.upgrade = function (player) {
				var upgradeProccess = $q.defer();
				var html5libVersion = getHTML5Version(player.html5Url);
				var currentVersion = window.MWEMBED_VERSION;
				var msg = 'This will update the player "' + player.name + '" (ID: ' + player.id + ').';
				msg += '<br>Current player version: ' + html5libVersion;
				msg += '<br>Update to version: ' + currentVersion + '<a href="https://github.com/kaltura/mwEmbed/releases/tag/v' + currentVersion + '" target="_blank"> (release notes)</a>';
				var modal = utilsSvc.confirm('Updating confirmation', msg, 'Update');
				modal.result.then(function (result) {
					if (result) {
						var html5lib = player.html5Url.substr(0, player.html5Url.lastIndexOf('/v') + 2) + window.MWEMBED_VERSION + "/mwEmbedLoader.php";
						PlayerService.playerUpgrade(player, html5lib).then(function (data) {
							// update local data (we will not retrieve from the server again)
							player.html5Url = html5lib;
							upgradeProccess.resolve('update finished successfully');
							utilsSvc.alert('Player Updated', 'The player was updated successfully.');
							if ($("#kcms", window.parent.document).length > 0) {
								$("#kcms", window.parent.document)[0].refreshPlayersList(); // trigger players list refresh on KMC
							}
						}, function (reason) {
							utilsSvc.alert('Update player failure', reason);
							upgradeProccess.reject('update canceled');
						});
					} else {
						$log.info('Update player dismissed at: ' + new Date());
						upgradeProccess.reject('update canceled');
					}
				});
				return upgradeProccess.promise;
			};

			// updater an outdated player
			$scope.update = function (player) {
				var upgradeProccess = $q.defer();
				var currentVersion = player.html5Url.split("/v")[1].split("/")[0];
				var text = '<span>' + $filter("translate")("Do you want to upgrade this player?<br>Some features and design may be lost.") + '</span>';
				var isPlaylist = player.tags.indexOf("playlist") !== -1;
				if (isPlaylist) {
					text += "<br><span><b>Note:</b> Playlist configuration will not be updated.<br>Please re-configure your playlist plugin after this upgrade.</span>";
				}
				var html5lib = player.html5Url.substr(0, player.html5Url.lastIndexOf('/v') + 2) + window.MWEMBED_VERSION + "/mwEmbedLoader.php";
				var modal = utilsSvc.confirm('Upgrade confirmation', text, 'Upgrade');
				modal.result.then(function (result) {
					if (result)
						PlayerService.playerUpdate(player, html5lib, isPlaylist).then(function (data) {
							// update local data (we will not retrieve from the server again)
							player.config = angular.fromJson(data.config);
							player.html5Url = html5lib;
							player.tags = isPlaylist ? 'html5studio,playlist' : 'html5studio,player';
							upgradeProccess.resolve('upgrade finished successfully');
							if ($("#kcms", window.parent.document).length > 0) {
								$("#kcms", window.parent.document)[0].refreshPlayersList(); // trigger players list refresh on KMC
							}
						}, function (reason) {
							utilsSvc.alert('Update player failure', reason);
							upgradeProccess.reject('upgrade canceled');
						});
				}, function () {
					$log.info('Update player dismissed at: ' + new Date());
					upgradeProccess.reject('upgrade canceled');
				});
				return upgradeProccess.promise;
			};
		}
	])
;