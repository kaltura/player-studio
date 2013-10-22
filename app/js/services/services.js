'use strict';
/* Services */
var KMCServices = angular.module('KMC.services', []);
KMCServices.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
}]);
KMCServices.factory('PlayerService', ['$http', function($http) {
        return {
            'getPlayers': function() {
                return $http.get('js/services/allplayers.json');
            },
            'getPlayer': function(id) {
                //actually does not use the id for now...
                return $http.get('js/services/oneplayer.json'); //probably really using the id to get a specific player

            }};
    }])
    .factory('editableProperties', ['$http', function($http) {
        return $http.get('js/services/editableProperties.json');
    }])
    .factory('playerTemplates', ['$http', function($http) {
        return $http.get('http://mrjson.com/data/5263e32d85f7fef869f2a63b/template/list.json');
    }]);