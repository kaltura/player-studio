'use strict';
/* Services */
angular.module('KMC.services', [])
        .factory('PlayerService', ['$http', function($http) {
                return {
                    'getPlayer': function(id) {
                        //actually does not use the id for now...
                        return $http.get('js/services/oneplayer.json'); //probably really using the id to get a specific player

                    }};
            }])
        .factory('editableProperties', ['$http', function($http) {
                return $http.get('js/services/editableProperties.json');
            }])
		.factory('ApiService', ['$q', '$timeout', function( $q, $timeout ) {
			return{
				apiObj : null,
				getClient: function () {
					//first request - create new kwidget.api
					if ( !this.apiObj ) {
						this.apiObj =  new kWidget.api();
					}
					return this.apiObj;
				},
				setKs: function ( ks ) {
					this.getClient().setKs( ks );
				},
				setWid: function ( wid ) {
					this.getClient().wid = wid;
				},
				doRequest: function( params ){
					//Creating a deferred object
					var deferred = $q.defer();
					this.getClient().doRequest( params , function(data ){
							//timeout will trigger another $digest cycle that will trigger the "then" function
							$timeout( function() {
								if ( data.code ) {
									deferred.reject( data.code );
								} else {
									deferred.resolve( data );
								}
							}, 0 )   ;
					});
					//Returning the promise object
					return deferred.promise;
				}
			};
		}]);
