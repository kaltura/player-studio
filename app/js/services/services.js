'use strict';
/* Services */

var KMCServices = angular.module('KMC.services', []);
KMCServices.config(['$httpProvider', function($httpProvider) {
	$httpProvider.defaults.useXDomain = true;
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
}]);
KMCServices.factory('PlayerService', ['$http', function($http) {
                return {
                    'getPlayer': function(id) {
                        //actually does not use the id for now...
                        return $http.get('js/services/oneplayer.json'); //probably really using the id to get a specific player

                    }};
            }])
        .factory('editableProperties', ['$http', function($http) {
                return $http.get('js/services/editableProperties.json');
            }])
		.factory('ApiService', ['$q', '$timeout', '$location', function( $q, $timeout, $location ) {
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
									if ( data.code == "INVALID_KS") {
										$location.path( "/login" );
									}
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
		}])
		.factory('playerTemplates', ['$http', function($http) {
			return {
				'listSystem' : function() {
					return $http.get('http://mrjson.com/data/5263e32d85f7fef869f2a63b/template/list.json');
				},
				'listUser':function(){
					return $http.get('http://mrjson.com/data/5263e32d85f7fef869f2a63b/userTemplates/list.json');
				}
			}

		}]);

