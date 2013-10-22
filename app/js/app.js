'use strict';

window.lang = 'en-US';
// Declare app level module which depends on filters, and services
var KMCModule = angular.module('KMCModule',
    ['localization', 'KMC.controllers', 'KMC.filters', 'KMC.services', 'KMC.directives', 'ui.bootstrap', 'ui.select2']);

KMCModule.config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $locationProvider.html5Mode(true);
    $routeProvider.when('/list', {
            templateUrl: 'view/list.html',
            controller: 'PlayerListCtrl',
            resolve: {'playersData': function(PlayerService) {
                return PlayerService.getPlayers();
            }
            }
        }
    );
    $routeProvider.when('/edit/:id',
        {templateUrl: 'view/edit.html',
            controller: 'PlayerEditCtrl',
            resolve: {
                'PlayerData': function(PlayerService, $route) {
                    return  PlayerService.getPlayer($route.current.params.id);
                },
                'editProperties': 'editableProperties'
            }
        }
    );
    $routeProvider.when('/new',
        {templateUrl: 'view/new-template.html',
            controller: 'PlayerCreateCtrl',
            resolve: {
                'templates': function(playerTemplates) {
                    return  playerTemplates.listSystem();
                },
                'userId': function() {
                    return '1' //  KMC would need to give us the userID ?
                }

            }
        }
    );

    $routeProvider.otherwise({redirectTo: '/list'});
}]);


