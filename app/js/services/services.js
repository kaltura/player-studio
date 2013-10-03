'use strict';
/* Services */
angular.module('KMC.services', [])
        .factory('PlayerService', ['$http', function($http) {
                return {
                    'getPlayers': function() {
                        return $http.get('/js/services/allplayers.json');
                    },
                    'getPlayer': function(id) {
                        //actually does not use the id for now...
                        return $http.get('/js/services/oneplayer.json'); //probably really using the id to get a specific player

                    }};
            }])
        .factory('editableProperties', ['$http', function($http) {
                return $http.get('/js/services/editableProperties.json');
            }]);