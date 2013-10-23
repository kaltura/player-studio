'use strict';

window.lang = 'en-US';
// Declare app level module which depends on filters, and services
var KMCModule = angular.module('KMCModule',
    ['localization', 'KMC.controllers', 'KMC.filters', 'KMC.services', 'KMC.directives', 'ui.bootstrap']);

KMCModule.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
	$routeProvider.when('/login', {
			templateUrl: 'view/login.html',
			controller: 'LoginCtrl',
			resolve: {'apiService': function (ApiService) {
				return ApiService;
			}
			}
		}
	);
    $routeProvider.when('/list', {
            templateUrl: 'view/list.html',
            controller: 'PlayerListCtrl',
            resolve: {'playersData': function (ApiService) {
                return ApiService;
            }
            }
        }
    );
    $routeProvider.when('/edit/:id',
        {templateUrl: 'view/edit.html',
            controller: 'PlayerEditCtrl',
            resolve: {
                'PlayerData': function (PlayerService, $route) {
                    return  PlayerService.getPlayer($route.current.params.id);
                },
                'editProperties': 'editableProperties'
            }
        }
    );
      $routeProvider.otherwise({redirectTo: '/login'});
}]);

