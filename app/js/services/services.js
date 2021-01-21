'use strict';
/* Services */
var KMCServices = angular.module('KMC.services', []);

KMCServices.config(['$httpProvider', function ($httpProvider) {
	$httpProvider.defaults.useXDomain = true;
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
}]);

KMCServices.factory('apiCache', ['$cacheFactory', function ($cacheFactory) {
	return $cacheFactory('apiCache', {
		capacity: 10
	});
}]);

KMCServices.factory('select2Svc', ['$timeout', function ($timeout) {
	var select2Svc = {
		'getConfig': function (entries, searchFunc) {
			var confObj = {
				allowClear: false,
				width: '100%',
				initSelection: function (element, callback) {
					callback($(element).data('$ngModelController').$modelValue);
				},
				query: function (query) {
					var timeVar = null;
					var data = {results: []};
					if (query.term) {
						if (timeVar) {
							$timeout.cancel(timeVar);
						}
						timeVar = $timeout(function () {
							searchFunc(query.term).then(function (results) {
								angular.forEach(results.objects, function (entry) {
									data.results.push({id: entry.id, text: entry.name});
								});
								timeVar = null;
								return query.callback(data);
							});
						}, 200);
					}
					else {
						return query.callback({results: entries});
					}
					query.callback(data);
				}
			};
			return confObj;
		}
	};
	return select2Svc;
}]);

KMCServices.factory('utilsSvc', ['$modal', function ($modal) {
	var utilsSvc = {
		'str2val': function (str) {
			if (typeof str !== "string")
				return str;

			var retVal = str;
			if (str.toLowerCase() === "true")
				retVal = true;
			if (str.toLowerCase() === "false")
				retVal = false;
			if (!isNaN(parseFloat(str)) && parseFloat(str).toString().length === str.length)
				retVal = parseFloat(str);
			return retVal;
		},
		'alert': function (title, msg) {
			var retVal = $modal.open({
				templateUrl: 'templates/message.html',
				controller: 'ModalInstanceCtrl',
				resolve: {
					settings: function () {
						return {
							'title': title,
							'message': msg,
							buttons: [
								{result: true, label: 'OK', cssClass: 'btn-primary'}
							]
						};
					}
				}
			});
			return retVal;
		},
		'confirm': function (title, msg, lbl) {
			var retVal = $modal.open({
				templateUrl: 'templates/message.html',
				controller: 'ModalInstanceCtrl',
				resolve: {
					settings: function () {
						return {
							'title': title,
							'message': msg,
							buttons: [
								{result: false, label: 'Cancel', cssClass: 'btn-default'}, {
									result: true,
									label: lbl,
									cssClass: 'btn-primary'
								}
							]
						};
					}
				}
			});
			return retVal;
		},
		'userInput': function (title, msg, lbl, inputStyle) {
			var retVal = $modal.open({
				templateUrl: 'templates/inputWindow.html',
				controller: 'ModalInstanceInputCtrl',
				resolve: {
					settings: function () {
						return {
							'title': title,
							'inputStyle': inputStyle ? inputStyle : {},
							'message': msg,
							buttons: [
								{result: false, label: 'Cancel', cssClass: 'btn-default'}, {
									result: true,
									label: lbl,
									cssClass: 'btn-primary'
								}
							]
						};
					}
				}
			});
			return retVal;
		}
	};
	return utilsSvc;
}]);

KMCServices.factory('sortSvc', [function () {
		var containers = {};
		var sorter = {};

		var Container = function Container(name) {
			this.name = name;
			this.elements = [];
			containers[name] = this;
		};
		Container.prototype.addElement = function (model) {
			this.elements.push(model);
		};
		Container.prototype.callObjectsUpdate = function () {
			angular.forEach(this.elements, function (model) {
				cl(model.sortVal + ' ' + model.model);
			});
		};
		Container.prototype.removeElement = function (model) {
			var index = this.elements.indexOf(model);
			if (index != -1)
				this.elements.splice(index, 1);
		};
		sorter.sortScope = '';
		sorter.register = function (containerName, model) {
			var container = (typeof  containers[containerName] == 'undefined') ? new Container(containerName) : containers[containerName];
			container.addElement(model);
		};
		sorter.update = function (newVal, oldVal, model) {
			var oldContainer = containers[oldVal];
			var newContainer = (!containers[newVal]) ? new Container(newVal) : containers[newVal];
			if (oldContainer) {
				oldContainer.removeElement(model);
			}
			newContainer.addElement(model);
			if (typeof  sorter.sortScope == 'object') {
				sorter.sortScope.$broadcast('sortContainersChanged');
			}
		};
		sorter.getObjects = function () {
			return containers;
		};
		sorter.saveOrder = function (containersObj) {
			containers = containersObj;
			angular.forEach(containers, function (container) {
				container.callObjectsUpdate();
			});
		};
		return sorter;
	}]
);

KMCServices.factory('PlayerService', ['$http', '$modal', '$log', '$q', 'apiService', '$filter', 'localStorageService', '$location', 'utilsSvc', 'loadINI',
	function ($http, $modal, $log, $q, apiService, $filter, localStorageService, $location, utilsSvc, loadINI) {
		var playersCache = {};
		var currentPlayer = {};
		var previewEntry;
		var previewEntryObj;
		var currentRefresh = null;
		var nextRefresh = false;
		var kdpConfig = '';
		var defaultCallback = function () {
			playersService.refreshNeeded = false;
			currentRefresh.resolve(true);
			currentRefresh = null;
			if (nextRefresh) {
				nextRefresh = false;
				playerRefresh();
			}
			logTime('renderPlayerDone');
		};
		var playerRefresh = function () {
			if (!currentRefresh) {
				currentRefresh = $q.defer();
				try {
					playersService.renderPlayer(defaultCallback);
				}
				catch (e) {
					currentRefresh.reject(e);
				}
			}
			else {
				nextRefresh = true;
			}
			return currentRefresh.promise;
		};
		var playersService = {
			kalturaPlayer: null,
			PLAYER_ID: 'kVideoTarget',
			KALTURA_PLAYER: 'kaltura-ovp-player',
			KALTURA_PLAYER_OTT: 'kaltura-tv-player',
			OVP: 'ovp',
			OTT: 'ott',
			playerVersionsMap: null,
			autoRefreshEnabled: false,
			clearCurrentRefresh: function () {
				currentRefresh = null;
			},
			'refreshNeeded': false,
			getCurrentRefresh: function () {
				return currentRefresh;
			},
			'clearCurrentPlayer': function () {
				currentPlayer = {};
			},
			'setPreviewEntry': function (previewObj) {
				localStorageService.set('previewEntry', previewObj);
				previewEntry = previewObj.id;
				previewEntryObj = previewObj;
			},
			'getPreviewEntry': function () {
				if (!previewEntry) {
					return localStorageService.get('previewEntry');
				}
				else {
					return previewEntryObj;
				}
			},
			'switchToNewStructure': function (oldConfigStructure) {
				var playerConfig = oldConfigStructure.player;
				delete oldConfigStructure.player;
				return angular.extend(oldConfigStructure, playerConfig);
			},
			'renderPlayer': function (playerData, playerConfig, entry_id, callback, isPlaylist, allLangCodes) {
				var partner_id = playerData.partnerId;
				var forceTouchUI = playerData.forceTouchUI;
				var loadPlayer = function () {
					if (playersService.kalturaPlayer) {
						playersService.kalturaPlayer.destroy();
						$("#" + playersService.PLAYER_ID).empty();
					}
					loadMedia();
				};
				var loadMedia = function () {
					var providerConfig = {
						partnerId: partner_id,
						uiConfId: playerData.id
					};
					if (window.parent.kmc && window.parent.kmc.vars && window.parent.kmc.vars.ks) {
						providerConfig['ks'] = window.parent.kmc.vars.ks;
					}
					try {
						var config = JSON.parse(playerConfig.jsonConfig);
						config.targetId = playersService.PLAYER_ID;
						Object.assign(config.provider, providerConfig);
						if (window.__kalturaplayerdata) {
							config.provider.env = $.extend(true, {}, window.__kalturaplayerdata.UIConf[playerData.id].provider.env, config.provider.env);
						}
						if (forceTouchUI) {
							Object.assign(config, {ui: {forceTouchUI: true}});
						}
						playersService.kalturaPlayer = KalturaPlayer.setup(config);
						if (isPlaylist) {
							playersService.kalturaPlayer.loadPlaylist({playlistId: entry_id});
						} else {
							playersService.kalturaPlayer.loadMedia({entryId: entry_id});
						}
						callback();
					} catch (error) {
						console.error(error);
						callback();
					}
				};
				logTime('renderPlayer');
				// clear companion divs
				$("#Comp_300x250").empty();
				$("#Comp_728x90").empty();
				playersService.loadKalturaPlayerScript(playerData, function () {
					if (window.KalturaPlayer) {
						loadPlayer();
					} else {
						callback();
					}
				}, allLangCodes);
			},
			'loadKalturaPlayerScript': function (playerData, callback, allLangCodes) {
				if (window.KalturaPlayer) {
					callback();
					return;
				}
				var partner_id = playerData.partnerId;
				var uiconf_id = playerData.id;
				var playerBundle = playersService.getPlayerBundle(playerData);
				var playerVersion = playersService.getPlayerVersion(playerData);
				var playerVersionParam = playerBundle + '=' + playerVersion;

				var getPluginsVersion = function () {
					var pluginsVersion = '';
					for (var plugin in playerData.config.plugins) {
						var pluginData = playerData.plugins[plugin];
						if (pluginData && pluginData.componentName) {
							pluginsVersion += (',' + pluginData.componentName + '=' + playersService.getComponentVersion(playerData, pluginData.componentName));
						}
					}
					if (playerData.config.cast) {
                        var castData = playerData.plugins.cast;
                        if (castData && castData.componentName) {
                            pluginsVersion += (',' + castData.componentName + '=' + playersService.getComponentVersion(playerData, castData.componentName));
                        }
					}
					return pluginsVersion;
				};

				var require = function (url, callback) {
					var head = document.getElementsByTagName("head")[0];
					var script = document.createElement('script');
					script.src = url;
					script.type = 'text/javascript';
					// bind the event to the callback function
					if (script.addEventListener) { // IE9+, Chrome, Firefox
						script.addEventListener("load", callback, false);
						script.addEventListener("error", callback, false);
					}
					else if (script.readyState) {
						script.onreadystatechange = callback; // IE8
					}
					head.appendChild(script);
				};

				var loadScript = function (env) {
					require('//' + env + '/p/' + partner_id + '/embedPlaykitJs/uiconf_id/' + uiconf_id + '/versions/' + playerVersionParam + getPluginsVersion() + '/langs/' + allLangCodes, callback);
				};

				if (window.parent.kmc && window.parent.kmc.vars && window.parent.kmc.vars.host) {
					loadScript(window.parent.kmc.vars.host);
				} else {
					loadINI.getINIConfig().success(function (data) {
						loadScript(data.service_url);
					});
				}
			},
			'setKDPAttribute': function (attrStr, value) {
				var kdp = document.getElementById('kVideoTarget');
				if ($.isFunction(kdp.setKDPAttribute) && typeof attrStr != "undefined" && attrStr.indexOf(".") != -1) {
					var obj = attrStr.split(".")[0];
					var property = attrStr.split(".")[1];
					kdp.setKDPAttribute(obj, property, value);
				}
			},
			playerRefresh: playerRefresh,
			newPlayer: function () {
				var deferred = $q.defer();
				playersService.getDefaultConfig().success(function (data, status, headers, config) {
					var request = {
						'service': 'uiConf',
						'action': 'add',
						'uiConf:objectType': 'KalturaUiConf',
						'uiConf:objType': 1,
						'uiConf:description': '',
						'uiConf:height': '395',
						'uiConf:width': '560',
						'uiConf:swfUrl': '/',
						'uiConf:version': '161',
						'uiConf:name': 'New Player',
						'uiConf:tags': 'kalturaPlayerJs,player,' + playersService.getPartnerType(),
						'uiConf:confVars': '{"versions":{"' + playersService.getPlayerBundle() + '":"{latest}"}, "langs": ["en"]}',
						'uiConf:creationMode': 2,
						'uiConf:config': angular.toJson(data, true)
					};
					apiService.setCache(false); // disable cache before this request to prevent fetching last created player from cache
					apiService.doRequest(request).then(function (data) {
						var playerData = $.isArray(data) ? data[1] : data; // when using kmc.vars.default_kdp.id we get an array because of the multi request
						playerData["autoUpdate"] = true; // new players always auto-update
						playersService.setCurrentPlayer(playerData);
						apiService.setCache(true); // restore cache usage
						localStorageService.set('tempPlayerID', playerData.id);
						deferred.resolve(playerData);
					}, function (reason) {
						deferred.reject(reason);
					});
				}).error(function (data, status, headers, config) {
					cl("Error getting default player config");
				});
				return deferred.promise;
			},
			clonePlayer: function (srcUi) {
				var deferred = $q.defer();
				var request = {
					service: 'multirequest',
					'action': null,
					'1:service': 'uiconf',
					'1:action': 'clone',
					'1:id': srcUi.id,
					'2:service': 'uiconf',
					'2:action': 'update',
					'2:id': '{1:result:id}',
					'2:uiConf:name': 'Copy of ' + srcUi.name,
					'2:uiConf:objectType': 'KalturaUiConf'
//'2:uiConf:objType': 1,
// 'uiConf:creationMode': 2
				};
				apiService.doRequest(request).then(function (data) {
					deferred.resolve(data);
				}, function (reason) {
					deferred.reject(reason); //TODO: how to display the error...
				});
				return deferred.promise;

			},
			'getPlayer': function (id) {
				var deferred = $q.defer();
				apiService.setCache(false);
				var request = {
					'service': 'uiConf',
					'action': 'get',
					'id': id
				};
				apiService.doRequest(request).then(function (result) {
						// validate result to catch invalid JSON configs
						if (typeof result.config === 'string') {
							try {
								angular.fromJson(result.config);
								playersService.setCurrentPlayer(result);
								deferred.resolve(currentPlayer);
							} catch (e) {
								deferred.reject("invalid JSON config");
								utilsSvc.alert('Invalid Player', 'The player configuration object is not valid.<br>Consider deleting this player or contact support.<br>Player ID: ' + result.id);
								$location.url('/list');
							}
						}
					}
				);
				return deferred.promise;
			},
			setCurrentPlayer: function (player) {
				if (typeof player.config == 'string') {
					player.config = angular.fromJson(player.config);
				}
				if (player.config.player) {
					player.config = playersService.switchToNewStructure(player.config);
				}
				if (typeof player.config != 'undefined' && typeof player.config.plugins != 'undefined') {
					player.config = playersService.addFeatureState(player.config); // preloaded data will get _featureEnabled
				}
				currentPlayer = player;
			},
			addFeatureState: function (data) {
				angular.forEach(data.plugins, function (value, key) {
					if ($.isArray(value)) data.plugins[key] = {};
					if (angular.isObject(data.plugins[key]) && data.plugins[key].enabled !== false)
						data.plugins[key].enabled = true;
				});
				return data;
			},
			cachePlayers: function (playersList) {
				if ($.isArray(playersList)) { // it is an array
					angular.forEach(playersList, function (player) {
						playersCache[player.id] = player;
					});
				} else { // it is one object
					playersCache[playersList.id] = playersList;
				}
			},
			'deletePlayer': function (id) {
				var deferred = $q.defer();
				var rejectText = $filter('translate')('Delete action was rejected: ');
				if (typeof id == 'undefined' && currentPlayer)
					id = currentPlayer.id;
				if (id) {
					var request = {
						'service': 'uiConf',
						'action': 'delete',
						'id': id

					};
					apiService.doRequest(request).then(function (result) {
							deferred.resolve(result);
						}, function (msg) {
							deferred.reject(rejectText + msg);
						}
					);
				}
				else {
					deferred.reject(rejectText);
				}
				return deferred.promise;
			},
			'getRequiredVersion': function () {
				return 2;
			},
			'getDefaultConfig': function () {
				return $http.get('js/services/defaultPlayer.json');
			},
			'getKDPConfig': function () {
				$http.get('js/services/kdp.xml').success(function (data, status, headers, config) {
					kdpConfig = data;
				});
			},
			"preparePluginsDataForRender": function (data) {
				// clean data before save (remove _featureEnabled and objects that contain enabled recursively)
				var copyobj = data.plugins || data;
				angular.forEach(copyobj, function (value, key) {
					if (angular.isObject(value)) {
						if (value.disable || (value.enabled && value.enabled === false)) {
							delete copyobj[key];
						}
						else {
							playersService.preparePluginsDataForRender(value);
						}
					} else {
						if (key == "enabled") {
							delete copyobj[key];
						}
					}
				});
				return copyobj;
			},
			'savePlayer': function (data) {
				var deferred = $q.defer();
				var data2Save = angular.copy(data.config);
                data2Save.plugins = playersService.preparePluginsDataForRender(data2Save.plugins);
                data2Save.ui.components = playersService.preparePluginsDataForRender(data2Save.ui.components);
                if ($.isEmptyObject(data2Save.ui.components)) {
	                delete data2Save.ui.components;
                }
                if ($.isEmptyObject(data2Save.ui)) {
	                delete data2Save.ui;
                }
                if (data2Save.cast) {
                    data2Save.cast = playersService.preparePluginsDataForRender(data2Save.cast);
                }
				// remove preview playlist from data before saving
				if (data2Save.plugins.playlistAPI) {
					if (data2Save.plugins.playlistAPI.kpl0Id) {
						delete data2Save.plugins.playlistAPI.kpl0Id;
					}
					if (data2Save.plugins.playlistAPI.kpl0Name) {
						delete data2Save.plugins.playlistAPI.kpl0Name;
					}
				}
				if (data2Save.enviornmentConfig) {
					delete data2Save.enviornmentConfig.enabled;
					if (data2Save.enviornmentConfig.localizationCode !== undefined && data2Save.enviornmentConfig.localizationCode === "") {
						delete data2Save.enviornmentConfig.localizationCode;
					}
					if (angular.equals({}, data2Save.enviornmentConfig)) {
						delete data2Save.enviornmentConfig;
					}
				}
				if (data.autoUpdate) {
					data.freezeVersions = null;
				}
				var request = {
					'service': 'uiConf',
					'action': 'update',
					'id': data.id,
					'uiConf:name': data.name,
					'uiConf:tags': data.tags,
					'uiConf:height': data.height,
					'uiConf:width': data.width,
					'uiConf:description': data.description ? data.description : ''
				};
				request['uiConf:confVars'] = JSON.stringify({versions: playersService.getPlayerAndPluginsVersionObj(data), langs: data.playerLangCodes});
				request['uiConf:config'] = JSON.stringify(data2Save, null, "\t");
				apiService.doRequest(request).then(function (result) {
					playersCache[data.id] = data; // update player data in players cache
					currentPlayer = {};
					// refresh KMC players list so that the new player will appear in the "Preview and Embed" screen
					var kmc = window.parent.kmc;
					if (kmc && kmc.preview_embed) {
						kmc.preview_embed.updateList(data.tags.indexOf("playlist") !== -1);
					}
					deferred.resolve(result);
				});
				return deferred.promise;
			},
			'getEnvType': function () {
				if (window.parent.kmc && window.parent.kmc.vars && window.parent.kmc.vars.studioV3) {
					return window.parent.kmc.vars.studioV3.publisherEnvType;
				} else {
					// for local development
					return 2;
				}
			},
			'getPlayerBundle': function () {
				switch (playersService.getEnvType()) {
					case 0: //OVP
						return playersService.KALTURA_PLAYER;
					case 1: //OTT
						return playersService.KALTURA_PLAYER_OTT;
					case 2: //Hybrid
						return (playersService.OvpOrOtt === playersService.OTT) ? playersService.KALTURA_PLAYER_OTT : playersService.KALTURA_PLAYER;
				}
			},
			'getPartnerType': function () {
				switch (playersService.getEnvType()) {
					case 0: //OVP
						return playersService.OVP;
					case 1: //OTT
						return playersService.OTT;
					case 2: //Hybrid
						return playersService.OvpOrOtt || playersService.OVP;
				}
			},
			'getPlayerVersionsMap': function () {
				if (!playersService.playerVersionsMap) {
					var kmc = window.parent.kmc;
					if (kmc && kmc.vars && kmc.vars.studioV3 && kmc.vars.studioV3.playerVersionsMap) {
						try {
							playersService.playerVersionsMap = JSON.parse(kmc.vars.studioV3.playerVersionsMap);
						} catch (e) {}
					}
					playersService.playerVersionsMap = angular.isObject(playersService.playerVersionsMap) ? playersService.playerVersionsMap : {};
				}
				return playersService.playerVersionsMap;
			},
			'getComponentVersion': function (data, componentName) {
				if (data.playerVersion === "beta") {
					return '{beta}';
				}
				if (!data.autoUpdate) {
					if (data.freezeVersions && data.freezeVersions[componentName]) {
						return data.freezeVersions[componentName];
					}
					var componentVersion = playersService.getPlayerVersionsMap()[componentName];
					if (componentVersion) {
						return componentVersion;
					}
				}
				return '{latest}';
			},
			'getPlayerVersionObj': function (data) {
				var playerObj = {};
				var playerBundle = playersService.getPlayerBundle(data);
				playerObj[playerBundle] = playersService.getComponentVersion(data, playerBundle);
				return playerObj;
			},
			'getPlayerAndPluginsVersionObj': function (data) {
				var playerAndPluginsVersionObj = playersService.getPlayerVersionObj(data);
				for (var plugin in data.plugins) {
					var pluginData = data.plugins[plugin] || {};
					if (data.externals && data.config.plugins[plugin]) {
						delete data.externals[pluginData.componentName];
					}
					if (((data.config.plugins[plugin] && !data.config.plugins[plugin].disable)|| data.config[plugin]) && pluginData.componentName) {
						playerAndPluginsVersionObj[pluginData.componentName] = playersService.getComponentVersion(data, pluginData.componentName);
					}
				}
				for (var external in data.externals) {
					if (data.externals[external].active){
						playerAndPluginsVersionObj[external] = playersService.getComponentVersion(data, external);
					}
				}
				return playerAndPluginsVersionObj;
			},
			'getPlayerVersion': function (data) {
				var playerBundle = playersService.getPlayerBundle(data);
				var playerVersionObj = playersService.getPlayerVersionObj(data);
				return playerVersionObj[playerBundle];
			}
		};
		return playersService;
	}])
;

KMCServices.factory('requestNotificationChannel', ['$rootScope', function ($rootScope) {
// private notification messages
	var _START_REQUEST_ = '_START_REQUEST_';
	var _END_REQUEST_ = '_END_REQUEST_';
	var obj = {'customStart': null};
// publish start request notification
	obj.requestStarted = function (customStart) {
		$rootScope.$broadcast(_START_REQUEST_, customStart);
		if (customStart) {
			obj.customStart = customStart;
		}
	};
// publish end request notification
	obj.requestEnded = function (customStart) {
		if (obj.customStart) {
			if (customStart == obj.customStart) {
				$rootScope.$broadcast(_END_REQUEST_, customStart);
				obj.customStart = null;
			}
			else return;
		}
		else
			$rootScope.$broadcast(_END_REQUEST_);
	};
// subscribe to start request notification
	obj.onRequestStarted = function ($scope, handler) {
		$scope.$on(_START_REQUEST_, function (event, evdata) {
			if (evdata != 'ignore')
				handler();
		});
	};
// subscribe to end request notification
	obj.onRequestEnded = function ($scope, handler) {
		$scope.$on(_END_REQUEST_, function (event, evdata) {
			if (evdata != 'ignore')
				handler();
		});
	};

	return obj;


}]);

KMCServices.directive('canSpin', [function () {
	return {
		require: ['?^loadingWidget', '?^navmenu'],
		priority: 1000,
		link: function ($scope, $element, $attrs, controllers) {
			$scope.target = $('<div class="spinWrapper"></div>').prependTo($element);
			$scope.spinner = null;
			$scope.spinRunning = false;
			$scope.opts = {
				lines: 15,
				length: 27,
				width: 8,
				radius: 60,
				corners: 1,
				rotate: 0,
				direction: 1,
				color: '#000',
				speed: 0.6,
				trail: 24,
				shadow: true,
				hwaccel: true,
				className: 'spinner',
				zIndex: 2000000000,
				top: 'auto',
				left: 'auto'
			};
			var initSpin = function () {
				$scope.spinner = new Spinner($scope.opts).spin();
			};
			$scope.endSpin = function () {
				if ($scope.spinner)
					$scope.spinner.stop();
				$scope.spinRunning = false;
			};
			$scope.spin = function () {
				if ($scope.spinRunning)
					return;

				if ($scope.spinner === null)
					initSpin();
				$scope.spinner.spin($scope.target[0]);
				$scope.spinRunning = true;
			};
			angular.forEach(controllers, function (controller) {
				if (typeof controller != 'undefined')
					controller.spinnerScope = $scope;
			});
		}
	};
}]);
KMCServices.directive('loadingWidget', ['requestNotificationChannel', function (requestNotificationChannel) {
	return {
		restrict: 'EA',
		scope: {},
		replace: true,
		controller: function () {
		},
		template: '<div class=\'loadingOverlay\'><a can-spin></a></div>',
		link: function (scope, element, attrs, controller) {
			element.hide();
			var startRequestHandler = function () {
				element.show();
				controller.spinnerScope.spin();
			};
			var endRequestHandler = function () {
				element.hide();
				controller.spinnerScope.endSpin();
			};
			requestNotificationChannel.onRequestStarted(scope, startRequestHandler);
			requestNotificationChannel.onRequestEnded(scope, endRequestHandler);
		}
	};
}
])
;

KMCServices.factory('editableProperties', ['$q', 'api', '$http', function ($q, api, $http) {
	var deferred = $q.defer();
	$http.get('js/services/v3Properties.json').then(function (result) {
		deferred.resolve(result.data);
	});
	return deferred.promise;
}]);

KMCServices.factory('loadINI', ['$http', function ($http) {
	var iniConfig = null;
	return {
		'getINIConfig': function () {
			if (!iniConfig) {
				iniConfig = $http.get('studio.ini', {
						responseType: 'text',
						headers: {'Content-type': 'text/plain'},
						transformResponse: function (data, headers) {
							var config = data.match(/widgets\.studio\.config \= \'(.*)\'/)[1];
							data = angular.fromJson(config);
							return data;
						}
					}
				);
			}
			return iniConfig;
		}
	};
}]);

KMCServices.provider('api', function () {
	var injector = angular.injector(['ng']);
	var $q = injector.get('$q');

	var apiObj = null;
	return {
		$get: function (loadINI) {
			var deferred = $q.defer();
//first request - create new kwidget.api
			if (!apiObj) {
				var require = function (file, callback) {
					var head = document.getElementsByTagName("head")[0];
					var script = document.createElement('script');
					script.src = file;
					script.type = 'text/javascript';
// bind the event to the callback function
					if (script.addEventListener) {
						script.addEventListener("load", callback, false); // IE9+, Chrome, Firefox
					}
					else if (script.readyState) {
						script.onreadystatechange = callback; // IE8
					}
					head.appendChild(script);
				};
				var loadHTML5Lib = function (url) {
					var initKw = function () {
						if (typeof kWidget != 'undefined') {
							kWidget.api.prototype.type = 'POST';
							apiObj = new kWidget.api();
							deferred.resolve(apiObj);
						}
					};
					require(url, function () {
						if (typeof kWidget == 'undefined') {
							setTimeout(function () {
								initKw();
							}, 100);
						}
						else {
							initKw();
						}

					});
				};

				var html5lib = null;
				try {
					var kmc = window.parent.kmc;
					if (kmc && kmc.vars && kmc.vars.studioV3) {
						var config = angular.fromJson(kmc.vars.studioV3);
						html5lib = kmc.vars.api_url + "/html5/html5lib/" + config.html5_version + "/mwEmbedLoader.php";
						loadHTML5Lib(html5lib);
					}
				} catch (e) {
					cl('Could not located parent.kmc: ' + e);
				}

				if (!html5lib) {
					loadINI.getINIConfig().success(function (data) {
						var url = data.html5lib;
						loadHTML5Lib(url);
					});
				}
			}
			else
				deferred.resolve(apiObj);
			return deferred.promise;
		}
	};
});
KMCServices.factory('apiService', ['api', '$q', '$timeout', '$location', 'localStorageService', 'apiCache', 'requestNotificationChannel', '$filter', function (api, $q, $timeout, $location, localStorageService, apiCache, requestNotificationChannel, $filter) {
	var apiService = {
		apiObj: api,
		unSetks: function () {
			delete apiService.apiObj;
		},
		setKs: function (ks) {
			apiService.apiObj.then(function (api) {
				api.setKs(ks);
			});
		},
		setWid: function (wid) {
			apiService.getClient().then(function (api) {
				api.wid = wid;
			});
		},
		getKey: function (params) {
			var key = '';
			for (var i in params) {
				key += params[i] + '_';
			}
			return key;
		},
		listMedia: function () {
			var request = {
				'service': 'baseentry',
				'filter:mediaTypeIn': '1,2,5,6,201', // copied from KMC search
				'filter:objectType': 'KalturaMediaEntryFilter',
				'action': 'list'

			};
			return apiService.doRequest(request);
		},
		searchMedia: function (term) {
			var request = {
				'service': 'baseentry',
				'action': 'list',
				'filter:freeText': term,
				'filter:mediaTypeIn': '1,2,5,6,201', // copied from KMC search
				'filter:objectType': 'KalturaMediaEntryFilter',
				ignoreNull: '1'
			};
			return apiService.doRequest(request, true);
		},
		listPlaylists: function () {
			var request = {
				'service': 'baseentry',
				'filter:objectType': 'KalturaBaseEntryFilter',
				'filter:typeEqual': '5',
				'action': 'list'

			};
			return apiService.doRequest(request);
		},
		searchPlaylists: function (term) {
			var request = {
				'service': 'baseentry',
				'action': 'list',
				'filter:freeText': term,
				'filter:objectType': 'KalturaBaseEntryFilter',
				'filter:typeEqual': '5',
				ignoreNull: '1'
			};
			return apiService.doRequest(request, true);
		},
		useCache: true,
		setCache: function (useCache) {
			apiService.useCache = useCache;
		},
		doRequest: function (params, ignoreSpinner) {
			//Creating a deferred object
			var deferred = $q.defer();
			var params_key = apiService.getKey(params);
			if (apiCache.get(params_key) && apiService.useCache) {
				deferred.resolve(apiCache.get(params_key));
			} else {
				if (!ignoreSpinner) {
					requestNotificationChannel.requestStarted('api');
				}
				apiService.apiObj.then(function (api) {
					api.doRequest(params, function (data) {
						if (data.code) {
							if (data.code == "INVALID_KS") {
								localStorageService.remove('ks');
								$location.path("/login");
							}
							if (!ignoreSpinner) {
								requestNotificationChannel.requestEnded('api');
							}
							var message = $filter('translate')(data.code);
							deferred.reject(message);
						} else {
							apiCache.put(params_key, data);
							apiService.useCache = true;
							if (!ignoreSpinner) {
								requestNotificationChannel.requestEnded('api');
							}
							deferred.resolve(data);
						}
					});
				});
			}
			//Returning the promise object
			return deferred.promise;
		}
	};
	return apiService;
}]);
KMCServices.factory('playerTemplates', ['$http', function ($http) {
	return {
		'listSystem': function () {
			return $http.get('http://mrjson.com/data/5263e32d85f7fef869f2a63b/template/list.json');
		},
		'listUser': function () {
			return $http.get('http://mrjson.com/data/5263e32d85f7fef869f2a63b/userTemplates/list.json');
		}
	};

}]);
