'use strict';
/* Services */
var KMCServices = angular.module('KMC.services', []);

KMCServices.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
}]);

KMCServices.factory('playerCache', function ($cacheFactory) {
    return $cacheFactory('playerCache', {
        capacity: 10
    });
});

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

KMCServices.factory('PlayerService', ['$http', '$modal', '$log', '$q', 'apiService' , '$filter', 'localStorageService',
    function ($http, $modal, $log, $q, apiService, $filter, localStorageService) {
        var playersCache = [];
        var currentPlayer = {};
        var previewEntry = '0_ji4qh61l';
        var playersService = {
            'setPreviewEntry': function (id) {
                previewEntry = id;
            },
            'renderPlayer': function () {
                if (currentPlayer && typeof kWidget != "undefined") {
                    var flashvars = ($('html').hasClass('IE8')) ? {'wmode': 'transparent'} : {};
                    kWidget.embed({
                        "targetId": "kVideoTarget", // hard coded for now?
                        "wid": "_" + currentPlayer.partnerId, //$scope.data.partnerId,
                        "uiconf_id": currentPlayer.id,// $scope.data.id,
                        "flashvars": flashvars,
                        "entry_id": previewEntry //$scope.previewEntry
                    });
                }
            },
            playerRefresh: function (option) {
                if (option == 'aspectToggle') {
                    $('#spacer').toggleClass('narrow');
                }
                playersService.renderPlayer(); // for now does nothing different than render,
// but could be used to trigger view changes via notify events rather than complete refresh
            },
            newPlayer: function () {
                var deferred = $q.defer();
                var request = {
                    'service': 'uiConf',
                    'action': 'add',
                    'uiConf:objectType': 'KalturaUiConf',
                    'uiConf:objType': 1,
                    'uiConf:creationMode': 2
                };
                apiService.doRequest(request).then(function (data) {
                    deferred.resolve(data);
                }, function (reason) {
                    deferred.reject(reason); //TODO: how to display the error...
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
                var cache = false;
                var deferred = $q.defer();
                if (typeof currentPlayer.id != 'undefined') { // find if player obj is already loaded
                    if (currentPlayer.id == id || id == 'currentEdit') { // this ability to get the player data  we alreayd work on is there for future revert update feature.
                        deferred.resolve(currentPlayer);
                        cache = true;
                    }
                }
                if (!cache) {
// find player data by its ID in the list cache
                    for (var i = 0; i < playersCache.length; i++)
                        if (playersCache[i].id == id) {
                            deferred.resolve(playersCache[i]);
                            currentPlayer = playersCache[i];
                            cache = true;
                        }
                }
                if (!cache) {
                    var request = {
                        'service': 'uiConf',
                        'action': 'get',
                        'id': id

                    };
                    apiService.doRequest(request).then(function (result) {
                            deferred.resolve(result);
                            currentPlayer = result;
                        }
                    );
                }
                return deferred.promise;
            },
            cachePlayers: function (playersList) {
                if ($.isArray(playersList))
                    playersCache = playersCache.concat(playersList);
                else playersCache.push(playersList);
            },
            'deletePlayer': function (id) {
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
            'getPlayers': function () {
                return $http.get('js/services/allplayers.json');
            },
            'playerUpdate': function (playerObj, html5lib) {
// use the upgradePlayer service to convert the old XML config to the new json config object
                var deferred = $q.defer();
                var rejectText = $filter('i18n')('Update player action was rejected: ');
                $http({
                    url: window.kWidget.getPath() + 'services.php',
                    method: "GET",
                    params: {service: 'upgradePlayer', uiconf_id: playerObj.id, ks: localStorageService.get("ks")}
                }).success(function (data, status, headers, config) {
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
                            'uiConf:config': angular.toJson(data)  // update the config object
                        };
                        apiService.doRequest(request).then(function (result) {
                                deferred.resolve(result);
                            }, function (msg) {
                                deferred.reject(rejectText + msg);
                            }
                        );
                    }).error(function (data, status, headers, config) {
                        deferred.reject("Error getting UIConf config: " + data);
                        $log.error('Error getting UIConf config: ' + data);
                    });
                return deferred.promise;
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
        $rootScope.$broadcast(_START_REQUEST_);
        if (customStart) {
            obj.customStart = customStart;
        }
    };
    // publish end request notification
    obj.requestEnded = function (customStart) {
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
    obj.onRequestStarted = function ($scope, handler) {
        $scope.$on(_START_REQUEST_, function (event) {
            handler();
        });
    };
    // subscribe to end request notification
    obj.onRequestEnded = function ($scope, handler) {
        $scope.$on(_END_REQUEST_, function (event) {
            handler();
        });
    };

    return obj;


}]);

KMCServices.directive('loadingWidget', ['requestNotificationChannel', function (requestNotificationChannel) {
    return {
        restrict: 'EA',
        scope: {},
        replace: true,
        template: '<div class=\'loadingOverlay\'><a><div id=\'spinWrapper\'></div></a></div>',
        controller: ['$scope', '$element', function ($scope, $element) {
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
                var target = $element.find('#spinWrapper');
                if ($scope.spinner === null)
                    initSpin();
                $scope.spinner.spin(target[0]);
                $scope.spinRunning = true;
            };
        }],
        link: function (scope, element) {
            element.hide();
            var startRequestHandler = function () {
                element.show();
                scope.spin();
            };
            var endRequestHandler = function () {
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

KMCServices.factory('editableProperties', ['$http', function ($http) {
    return  $http.get('http://kgit.html5video.org/pulls/515/studio/playerFeatures.php');
    // $http.get('http://mwembed.dev/studio/playerFeatures.php');
}]);

KMCServices.factory('loadINI', ['$http', function ($http) {
    var iniConfig = null;
    return {
        'getINIConfig': function () {
            if (!iniConfig) {
                iniConfig = $http.get('studio.ini', {transformResponse: function (data, headers) {
                    var config = data.substr(data.indexOf('widgets.studio.config = {')+24);
                    data = angular.fromJson(config);
                    return data;
                }});
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
                loadINI.getINIConfig().success(function (data) {
                    var url = data.html5lib;
                    var initKw = function () {
                        kWidget.api.prototype.type = 'POST';
                        apiObj = new kWidget.api();
                        deferred.resolve(apiObj);
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

                });
            }
            else
                deferred.resolve(apiObj);
            return deferred.promise;
        }
    };
});

KMCServices.factory('apiService', ['api', '$q', '$timeout', '$location' , 'localStorageService', 'playerCache', 'requestNotificationChannel', function (api, $q, $timeout, $location, localStorageService, playerCache, requestNotificationChannel) {
    var apiService = {
        apiObj: api,
        unSetks: function () {
            delete this.apiObj;
        },
        setKs: function (ks) {
            this.apiObj.then(function (api) {
                api.setKs(ks);
            });
        },
        setWid: function (wid) {
            this.getClient().then(function (api) {
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
                'service': 'media',
                'action': 'list'

            };
            return this.doRequest(request);
        },
        doRequest: function (params) {
            //Creating a deferred object
            var deferred = $q.defer();
            requestNotificationChannel.requestStarted();
            var params_key = this.getKey(params);
            if (playerCache.get(params_key)) {
                deferred.resolve(playerCache.get(params_key));
            } else {
                this.apiObj.then(function (api) {
                    api.doRequest(params, function (data) {
//timeout will trigger another $digest cycle that will trigger the "then" function
                        $timeout(function () {
                            if (data.code) {
                                if (data.code == "INVALID_KS") {
                                    localStorageService.remove('ks');
                                    $location.path("/login");
                                }
                                requestNotificationChannel.requestEnded();
                                deferred.reject(data.code);
                            } else {
                                playerCache.put(params_key, data);
                                requestNotificationChannel.requestEnded();
                                deferred.resolve(data);
                            }
                        }, 0);
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
