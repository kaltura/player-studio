'use strict';

window.lang = 'en-US';
// Declare app level module which depends on filters, and services
var KMCModule = angular.module('KMCModule',
        ['localization', 'KMC.controllers', 'KMC.filters', 'KMC.services', 'KMC.directives', 'ui.bootstrap'])
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
                $routeProvider.when('/edit/:id',
                        {templateUrl: 'view/edit.html',
                            controller: 'PlayerEditCtrl',
                            resolve: {
                                'playerData': function(PlayerService) {
                                    return PlayerService.promise;
                                },
                                'editProperties': function(editableProperties) {
                                    return editableProperties.promise;
                                }
                            }
                        }
                );
                $routeProvider.otherwise({redirectTo: '/list'});
            }]);

