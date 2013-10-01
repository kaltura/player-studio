'use strict';

window.lang = 'en-US';
// Declare app level module which depends on filters, and services
var KMCModule = angular.module('KMCModule',
        ['localization', 'KMC.controllers', 'KMC.filters', 'KMC.services', 'ui.bootstrap'])
        .config(['$routeProvider', function($routeProvider) {
                $routeProvider.when('/list', {
                    templateUrl: 'view/list.html',
                    controller: 'PlayerListCtrl',
                    resolve: {'playersData': function(PlayerService) {
                            return PlayerService.promise;
                        }
                    }
                }
                );
                $routeProvider.when('/player/new',
                        {templateUrl: 'view/edit.html',
                            controller: 'PlayerEditCtrl'});
                //  $routeProvider.when('/view2', {templateUrl: 'partials/partial2.html', controller: 'MyCtrl2'});
                $routeProvider.otherwise({redirectTo: '/list'});
            }]);

