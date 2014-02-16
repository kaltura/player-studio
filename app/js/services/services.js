'use strict';
/* Services */
var KMCServices = angular.module('KMC.services', []);

KMCServices.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
}]);

KMCServices.factory('apiCache', function($cacheFactory) {
    return $cacheFactory('apiCache', {
        capacity: 10
    });
});

KMCServices.factory('sortSvc', [function() {
    var containers = {};
    var sorter = {};

    var Container = function Container(name) {
        this.name = name;
        this.elements = [];
        containers[name] = this;
    };
    Container.prototype.addElement = function(model) {
        this.elements.push(model);
    };
    Container.prototype.callObjectsUpdate = function() {
        angular.forEach(this.elements, function(model) {
            cl(model.sortVal + ' ' + model.model);
        });
    };
    Container.prototype.removeElement = function(model) {
        var index = this.elements.indexOf(model);
        if (index != -1)
            this.elements.splice(index, 1);
    };
    sorter.sortScope = '';
    sorter.register = function(containerName, model) {
        var container = (typeof  containers[containerName] == 'undefined') ? new Container(containerName) : containers[containerName];
        container.addElement(model);
    };
    sorter.update = function(newVal, oldVal, model) {
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
    sorter.getObjects = function() {
        return containers;
    };
    sorter.saveOrder = function(containersObj) {
        containers = containersObj;
        angular.forEach(containers, function(container) {
            container.callObjectsUpdate();
        });
    };
    return sorter;
}]
);

KMCServices.factory('PlayerService', ['$http', '$modal', '$log', '$q', 'apiService' , '$filter', 'localStorageService',
    function($http, $modal, $log, $q, apiService, $filter, localStorageService) {
        var playersCache = {};
        var currentPlayer = {};
        var previewEntry;
        var previewEntryObj;
        var playerId = 'kVideoTarget';
        var currentRefresh = null;

        var callback = function() {
            currentRefresh.resolve(true);
            playersService.refreshNeeded = false;
            currentRefresh = null;
            logTime('renderPlayerDone');
        };
        var playerRefresh = function(option) {
            if (!currentRefresh) {
                currentRefresh = $q.defer();
                try {
                    playersService.renderPlayer(callback);
                }
                catch (e) {
                    currentRefresh.reject(e);
                }
            }
            return currentRefresh.promise;
        };
        var playersService = {
            clearCurrentRefresh: function() {
                currentRefresh = null;
            },
            'refreshNeeded': false,
            getCurrentRefresh: function() {
                return currentRefresh;
            },
            'clearCurrentPlayer': function() {
                currentPlayer = {};
            },
            'setPreviewEntry': function(previewObj) {
                localStorageService.set('previewEntry', previewObj);
                previewEntry = previewObj.id;
                previewEntryObj = previewObj;
            },
            'getPreviewEntry': function() {
                if (!previewEntry) {
                    return localStorageService.get('previewEntry');
                }
                else {
                    return previewEntryObj;
                }
            },
            'renderPlayer': function(callback) {
                logTime('renderPlayer');
                if (currentPlayer && typeof kWidget != "undefined") {
                    var data2Save = angular.copy(currentPlayer.config);
                    data2Save.plugins = playersService.preparePluginsDataForRender(data2Save.plugins);
                    var flashvars = {'jsonConfig': angular.toJson(data2Save)}; // update the player with the new configuration
                    if ($('html').hasClass('IE8')) {                      // for IE8 add transparent mode
                        angular.extend(flashvars, {'wmode': 'transparent'});
                    }
                    // clear companion divs
                    $("#Companion_300x250").empty();
                    $("#Companion_728x90").empty();
                    window.mw.setConfig('Kaltura.LeadWithHTML5', true);
                    window.mw.setConfig('Kaltura.EnableEmbedUiConfJs', true);
                    window.jsCallbackReady = function (playerId) {
                        document.getElementById(playerId).kBind("layoutBuildDone", function () {
                            if (typeof callback == 'function') {
                                callback();
                            }
                        });
                    };
                    kWidget.embed({
                        "targetId": playerId, // hard coded for now?
                        "wid": "_" + currentPlayer.partnerId, //$scope.data.partnerId,
                        "uiconf_id": currentPlayer.id,// $scope.data.id,
                        "flashvars": flashvars,
                        "entry_id": previewEntry //$scope.previewEntry
                    });

                }
                else {
                    throw function() {
                        return "player could not be rendered";
                    };
                }
            },
            'setKDPAttribute': function(attrStr, value) {
                var kdp = document.getElementById('kVideoTarget');
                if ($.isFunction(kdp.setKDPAttribute) && typeof attrStr != "undefined" && attrStr.indexOf(".") != -1) {
                    var obj = attrStr.split(".")[0];
                    var property = attrStr.split(".")[1];
                    kdp.setKDPAttribute(obj, property, value);
                }
            },
            playerRefresh: playerRefresh,
            newPlayer: function() {
                var deferred = $q.defer();
                playersService.getDefaultConfig().
                    success(function(data, status, headers, config) {
                        var request = {
                            'service': 'uiConf',
                            'action': 'add',
                            'uiConf:objectType': 'KalturaUiConf',
                            'uiConf:objType': 1,
                            'uiConf:description': '',
                            'uiConf:height': '395',
                            'uiConf:width': '560',
                            'uiConf:swfUrl': '/flash/kdp3/v3.9.4/kdp3.swf',
                            'uiConf:fUrlVersion': '3.9.4',
                            'uiConf:version': '161',
                            'uiConf:name': 'New Player',
                            'uiConf:tags': 'html5studio,player',
                            'uiConf:html5Url': window.kWidget.getPath() + 'mwEmbedLoader.php',
                            'uiConf:creationMode': 2,
                            'uiConf:config': angular.toJson(data)
                        };
                        apiService.setCache(false); // disable cache before this request to prevent fetching last created player from cache
                        apiService.doRequest(request).then(function(data) {
                            playersService.setCurrentPlayer(data);
                            apiService.setCache(true); // restore cache usage
                            localStorageService.set('tempPlayerID', data.id);
                            deferred.resolve(data);
                        }, function(reason) {
                            deferred.reject(reason);
                        });
                    }).
                    error(function(data, status, headers, config) {
                        cl("Error getting default player config");
                    });
                return deferred.promise;
            },
            clonePlayer: function(srcUi) {
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
                apiService.doRequest(request).then(function(data) {
                    deferred.resolve(data);
                }, function(reason) {
                    deferred.reject(reason); //TODO: how to display the error...
                });
                return deferred.promise;

            },
            'getPlayer': function(id) {
                var foundInCache = false;
                var deferred = $q.defer();
                if (typeof currentPlayer.id != 'undefined') { // find if player obj is already loaded
                    if (currentPlayer.id == id || id == 'currentEdit') { // this ability to get the player data  we alreayd work on is there for future revert update feature.
                        currentPlayer.config.plugins = this.preparePluginsDataForRender(currentPlayer.config.plugins); // refilter the data incase it was made dirty
                        playersService.setCurrentPlayer(currentPlayer); // reEnabled plugins.
                        deferred.resolve(currentPlayer);
                        foundInCache = true;
                    }
                }
                if (!foundInCache) {
                    // find player data by its ID in the list cache
                    if (typeof playersCache[id] != 'undefined') {
                        playersService.setCurrentPlayer(playersCache[id]);
                        deferred.resolve(currentPlayer);
                        foundInCache = true;
                    }
                }
                if (!foundInCache) {
                    var request = {
                        'service': 'uiConf',
                        'action': 'get',
                        'id': id

                    };
                    apiService.doRequest(request).then(function(result) {
                            playersService.setCurrentPlayer(result);
                            deferred.resolve(currentPlayer);
                        }
                    );
                }
                return deferred.promise;
            },
            setCurrentPlayer: function(player) {
                if (typeof player.config == 'string') {
                    player.config = angular.fromJson(player.config);
                }
                if (typeof player.config != 'undefined' && typeof player.config.plugins != 'undefined') {
                    player.config = playersService.addFeatureState(player.config); // preloaded data will get _featureEnabled
                }
                currentPlayer = player;
            },
            addFeatureState: function(data) {
                angular.forEach(data.plugins, function(value, key) {
                    if ($.isArray(value)) data.plugins[key] = {};
                    if (data.plugins[key]._featureEnabled !== false)
                        data.plugins[key]._featureEnabled = true;
                });
                return data;
            },
            cachePlayers: function(playersList) {
                if ($.isArray(playersList)) { // it is an array
                    angular.forEach(playersList, function(player) {
                        playersCache[player.id] = player;
                    });
                } else { // it is one object
                    playersCache[playersList.id] = playersList;
                }
            },
            'deletePlayer': function(id) {
                var deferred = $q.defer();
                var rejectText = $filter('i18n')('Delete action was rejected: ');
                if (typeof id == 'undefined' && currentPlayer)
                    id = currentPlayer.id;
                if (id) {
                    var request = {
                        'service': 'uiConf',
                        'action': 'delete',
                        'id': id

                    };
                    apiService.doRequest(request).then(function(result) {
                            deferred.resolve(result);
                        }, function(msg) {
                            deferred.reject(rejectText + msg);
                        }
                    );
                }
                else {
                    deferred.reject(rejectText);
                }
                return deferred.promise;
            },
            'getRequiredVersion': function() {
                return 2;
            },
            'getDefaultConfig': function() {
                return $http.get('js/services/defaultPlayer.json');
            },
            "preparePluginsDataForRender": function(data) {
                var copyobj = data.plugins || data;
                angular.forEach(copyobj, function(value, key) {
                    if (angular.isObject(value)) {
                        if (typeof value._featureEnabled == 'undefined' || value._featureEnabled === false) {
                            delete copyobj[key];
                        }
                        else {
                            playersService.preparePluginsDataForRender(value);
                        }
                    } else {
                        if (key == "_featureEnabled") {
                            copyobj["plugin"] = true;
                            delete copyobj[key];
                        }
                    }
                });
                return copyobj;
            },
            'savePlayer': function(data) {
                var deferred = $q.defer();
                var data2Save = angular.copy(data.config);
                data2Save.plugins = playersService.preparePluginsDataForRender(data2Save.plugins);
                var request = {
                    'service': 'uiConf',
                    'action': 'update',
                    'id': data.id,
                    'uiConf:name': data.name,
                    'uiConf:tags': data.tags,
                    'uiConf:description': data.description ? data.description : '',
                    'uiConf:config': angular.toJson(data2Save)
                };
                apiService.doRequest(request).then(function(result) {
                    playersCache[data.id] = data;
                    deferred.resolve(result);
                });
                return deferred.promise;
            },
            'playerUpdate': function(playerObj, html5lib) {
// use the upgradePlayer service to convert the old XML config to the new json config object
                var deferred = $q.defer();
                var rejectText = $filter('i18n')('Update player action was rejected: ');

                var method = 'get';
                var url = window.kWidget.getPath() + 'services.php';
                var params = {service: 'upgradePlayer', uiconf_id: playerObj.id, ks: localStorageService.get("ks")};
                if (window.IE < 10) {
                    params["callback"] = 'JSON_CALLBACK';
                    method = 'jsonp';
                }
                $http({
                    url: url,
                    method: method,
                    params: params
                }).success(function(data, status, headers, config) {
// clean some redundant data from received object
                    if (data['uiConfId']) {
                        delete data['uiConfId'];
                        delete data['widgetId'];
                        delete data.vars['ks'];
                    }
// set an api request to update the uiconf
                    var request = {
                        'service': 'uiConf',
                        'action': 'update',
                        'id': playerObj.id,                   // the id of the player to update
                        'uiConf:tags': 'html5studio,player',  // update tags to prevent breaking the old studio which looks for the tag kdp3
                        'uiConf:html5Url': html5lib,           // update the html5 lib to the new version
                        'uiConf:config': angular.toJson(data).replace("\"vars\":", "\"uiVars\":")  // update the config object and change vars to uiVars
                    };
                    apiService.doRequest(request).then(function(result) {
                            deferred.resolve(result);
                        }, function(msg) {
                            deferred.reject(rejectText + msg);
                        }
                    );
                }).error(function(data, status, headers, config) {
                    deferred.reject("Error updating UIConf: " + data);
                    $log.error('Error updating UIConf: ' + data);
                });
                return deferred.promise;
            }
        };
        return playersService;
    }])
;

KMCServices.factory('requestNotificationChannel', ['$rootScope', function($rootScope) {
// private notification messages
    var _START_REQUEST_ = '_START_REQUEST_';
    var _END_REQUEST_ = '_END_REQUEST_';
    var obj = {'customStart': null};
// publish start request notification
    obj.requestStarted = function(customStart) {
        $rootScope.$broadcast(_START_REQUEST_);
        if (customStart) {
            obj.customStart = customStart;
        }
    };
// publish end request notification
    obj.requestEnded = function(customStart) {
        if (obj.customStart) {
            if (customStart == obj.customStart) {
                $rootScope.$broadcast(_END_REQUEST_);
                obj.customStart = null;
            }
            else return;
        }
        else
            $rootScope.$broadcast(_END_REQUEST_);
    };
// subscribe to start request notification
    obj.onRequestStarted = function($scope, handler) {
        $scope.$on(_START_REQUEST_, function(event) {
            handler();
        });
    };
// subscribe to end request notification
    obj.onRequestEnded = function($scope, handler) {
        $scope.$on(_END_REQUEST_, function(event) {
            handler();
        });
    };

    return obj;


}]);

KMCServices.directive('loadingWidget', ['requestNotificationChannel', function(requestNotificationChannel) {
    return {
        restrict: 'EA',
        scope: {},
        replace: true,
        template: '<div class=\'loadingOverlay\'><a><div id=\'spinWrapper\'></div></a></div>',
        controller: ['$scope', '$element', function($scope, $element) {
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
            var initSpin = function() {
                $scope.spinner = new Spinner($scope.opts).spin();
            };
            $scope.endSpin = function() {
                if ($scope.spinner)
                    $scope.spinner.stop();
                $scope.spinRunning = false;
            };
            $scope.spin = function() {
                if ($scope.spinRunning)
                    return;
                var target = $element.find('#spinWrapper');
                if ($scope.spinner === null)
                    initSpin();
                $scope.spinner.spin(target[0]);
                $scope.spinRunning = true;
            };
        }],
        link: function(scope, element) {
            element.hide();
            var startRequestHandler = function() {
                element.show();
                scope.spin();
            };
            var endRequestHandler = function() {
                element.hide();
                scope.endSpin();
            };
            requestNotificationChannel.onRequestStarted(scope, startRequestHandler);
            requestNotificationChannel.onRequestEnded(scope, endRequestHandler);
        }
    };
}
])
;

KMCServices.factory('editableProperties', ['$q', 'api', '$http', function($q, api, $http) {
    var deferred = $q.defer();
    api.then(function() {
        //for debbuging
//       return $http.get('js/services/editableProperties.json').then(function(result){
//           deferred.resolve(result.data);
//        });
//

        var method = 'get';
        var url = window.kWidget.getPath() + 'services.php?service=studioService';
        if (window.IE < 10) {
            url += '&callback=JSON_CALLBACK';
            method = 'jsonp';
        }
        $http[method](url).then(function(result) {
            var data = result.data;
            if (typeof data == 'object') // json is OK
                deferred.resolve(result.data);
            else {
                cl('JSON parse error of playerFeatures');
                deferred.reject(false);
            }
        }, function(reason) {
            deferred.reject(reason);
        });
    });
    return deferred.promise;
}]);

KMCServices.factory('loadINI', ['$http', function($http) {
    var iniConfig = null;
    return {
        'getINIConfig': function() {
            if (!iniConfig) {
                iniConfig = $http.get('studio.ini', {
                        responseType: 'text',
                        headers: {'Content-type': 'text/plain'},
                        transformResponse: function(data, headers) {
                            var config = data.match(/widgets\.studio\.config \= \'(.*)\'/)[1];
                            data = angular.fromJson(config);
                            return data;
                        }}
                );
            }
            return iniConfig;
        }
    };
}]);

KMCServices.provider('api', function() {
    var injector = angular.injector(['ng']);
    var $q = injector.get('$q');

    var apiObj = null;
    return {
        $get: function(loadINI) {
            var deferred = $q.defer();
//first request - create new kwidget.api
            if (!apiObj) {
                var require = function(file, callback) {
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
                var loadHTML5Lib = function(url) {
                    var initKw = function() {
                        if (typeof kWidget != 'undefined') {
                            kWidget.api.prototype.type = 'POST';
                            apiObj = new kWidget.api();
                            deferred.resolve(apiObj);
                        }
                    };
                    require(url, function() {
                        if (typeof kWidget == 'undefined') {
                            setTimeout(function() {
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
                    if (kmc && kmc.vars && kmc.vars.studio.config) {
                        var config = angular.fromJson(kmc.vars.studio.config);
                        html5lib = kmc.vars.api_url + "/html5/html5lib/" + config.html5_version + "/mwEmbedLoader.php";
                        loadHTML5Lib(html5lib);
                    }
                } catch (e) {
                    cl('Could not located parent.kmc: ' + e);
                }

                if (!html5lib) {
                    loadINI.getINIConfig().success(function(data) {
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

KMCServices.factory('apiService', ['api', '$q', '$timeout', '$location' , 'localStorageService', 'apiCache', 'requestNotificationChannel', function(api, $q, $timeout, $location, localStorageService, apiCache, requestNotificationChannel) {
    var apiService = {
        apiObj: api,
        unSetks: function() {
            delete apiService.apiObj;
        },
        setKs: function(ks) {
            apiService.apiObj.then(function(api) {
                api.setKs(ks);
            });
        },
        setWid: function(wid) {
            apiService.getClient().then(function(api) {
                api.wid = wid;
            });
        },
        getKey: function(params) {
            var key = '';
            for (var i in params) {
                key += params[i] + '_';
            }
            return key;
        },
        listMedia: function() {
            var request = {
                'service': 'baseentry',
                'action': 'list'

            };
            return apiService.doRequest(request);
        },
        useCache: true,
        setCache: function(useCache) {
            apiService.useCache = useCache;
        },
        doRequest: function(params) {
            //Creating a deferred object
            var deferred = $q.defer();
            var params_key = apiService.getKey(params);
            if (apiCache.get(params_key) && apiService.useCache) {
                deferred.resolve(apiCache.get(params_key));
            } else {
                requestNotificationChannel.requestStarted('api');
                apiService.apiObj.then(function(api) {
                    api.doRequest(params, function(data) {
                        //timeout will trigger another $digest cycle that will trigger the "then" function
//                        $timeout(function() {
                        if (data.code) {
                            if (data.code == "INVALID_KS") {
                                localStorageService.remove('ks');
                                $location.path("/login");
                            }
                            requestNotificationChannel.requestEnded('api');
                            deferred.reject(data.code);
                        } else {
                            apiCache.put(params_key, data);
                            apiService.useCache = true;
                            requestNotificationChannel.requestEnded('api');
                            deferred.resolve(data);
                        }
//                        });
                    });
                });
            }
            //Returning the promise object
            return deferred.promise;
        }
    };
    return apiService;
}])
;

KMCServices.factory('playerTemplates', ['$http', function($http) {
    return {
        'listSystem': function() {
            return $http.get('http://mrjson.com/data/5263e32d85f7fef869f2a63b/template/list.json');
        },
        'listUser': function() {
            return $http.get('http://mrjson.com/data/5263e32d85f7fef869f2a63b/userTemplates/list.json');
        }
    };

}]);
