'use strict';
/* Services */


KMCModule.factory('PlayerService', ['$http', function($http) {
        var playerdata = {'players': []};
        playerdata.promise = $http.get('/js/services/tempdata.json')
                .success(function(data) {
            playerdata.players = data.objects;
            return data.objects
        }
        );
        playerdata.getPlayers = function() {
            if (playerdata.players.length > 0)
                return playerdata.players;
        }
        return playerdata;
    }])
