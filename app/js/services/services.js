'use strict';
/* Services */
angular.module('KMC.services', [])
        .factory('PlayerService', ['$http', function($http) {
                var playerdata = {'players': []};
                playerdata.promise = $http.get('/js/services/allplayers.json')
                        .success(function(data) {
                            playerdata.players = data.objects;
                            return data.objects;
                        }
                        );
                playerdata.getPlayers = function() {
                    if (playerdata.players && playerdata.players.length > 0)
                        return playerdata.players;
                };
                playerdata.getPlayer = function(id) {
                    var promise = $http.get('/js/services/oneplayer.json') //probably really using the id to get a specific player
                            .success(function(data) {
                                promise.data = data;
                            });
                    return promise;
                };
                return playerdata;
            }])
        .factory('editableProperties', ['$http', function($http) {
                var proObj = {'properties': []};
                proObj.promise = $http.get('/js/services/editableProperties.json')
                        .success(function(data) {
                            proObj.properties = data.properties;
                        });
                proObj.get = function() {
                    if (proObj.players && proObj.properties.length > 0)
                        return proObj.players;
                };
                return proObj;
            }]);