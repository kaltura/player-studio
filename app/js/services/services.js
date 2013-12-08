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
})
KMCServices.factory('PlayerService', ['$http', '$modal', '$log', function ($http, $modal, $log) {
    return {
        'getPlayer': function (id) {
            // find player data by its ID

            for ( var i=0; i<this.playersData.length; i++)
                if (this.playersData[i].id == id){
                    return {"data" : this.playersData[i]};
                }

            //return $http.get('js/services/oneplayer.json'); //probably really using the id to get a specific player
        },
        'getRequiredVersion': function () {
            return 2;
        },
        'getPlayers': function () {
            return $http.get('js/services/allplayers.json');
        },
        'playerUpdate': function (playerObj) {
            //TODO: api call for update
            var text = '<span>Updating the player -- TEXT MISSING -- current version </span>';
            var modal = $modal.open({
                templateUrl: 'template/dialog/message.html',
                controller: 'ModalInstanceCtrl',
                resolve: {
                    settings: function () {
                        return {
                            'title': 'Update confirmation',
                            'message': text + playerObj.version
                        };
                    }
                }
            });
            modal.result.then(function (result) {
                if (result) {
                    $log.info('update modal confirmed for item version ' + playerObj.version + 'at: ' + new Date());
                }

            }, function () {
                $log.info('update modal dismissed at: ' + new Date());
            });
        }
    };
}])
KMCServices.factory('requestNotificationChannel', ['$rootScope', function ($rootScope) {
        // private notification messages
        var _START_REQUEST_ = '_START_REQUEST_';
        var _END_REQUEST_ = '_END_REQUEST_';
        var obj = {customStart: null};
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
    }])
    .factory('editableProperties', ['$http', function ($http) {
        return $http.get('js/services/editableProperties.json');
    }])
    .factory('apiService', ['$q', '$timeout', '$location' , 'playerCache', 'requestNotificationChannel', function ($q, $timeout, $location, playerCache, requestNotificationChannel) {
        return{
            apiObj: null,
            getClient: function () {
                //first request - create new kwidget.api
                if (!this.apiObj) {
                    this.apiObj = new kWidget.api();
                }
                return this.apiObj;
            },
            unSetks: function () {
                delete this.apiObj;
            },
            setKs: function (ks) {
                this.getClient().setKs(ks);
            },
            setWid: function (wid) {
                this.getClient().wid = wid;
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
                    this.getClient().doRequest(params, function (data) {
                        //timeout will trigger another $digest cycle that will trigger the "then" function
                        $timeout(function () {
                            if (data.code) {
                                if (data.code == "INVALID_KS") {
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
                }
                //Returning the promise object
                return deferred.promise;
            }
        };
    }])
    .factory('playerTemplates', ['$http', function ($http) {
        return {
            'listSystem': function () {
                return $http.get('http://mrjson.com/data/5263e32d85f7fef869f2a63b/template/list.json');
            },
            'listUser': function () {
                return $http.get('http://mrjson.com/data/5263e32d85f7fef869f2a63b/userTemplates/list.json');
            }
        }

    }]);
