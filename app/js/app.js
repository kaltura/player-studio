'use strict';

window.lang = 'en-US';
// Declare app level module which depends on filters, and services
var KMCModule = angular.module('KMCModule', ['localization', 'myApp.filters','ui.bootstrap.pagination']);
KMCModule.config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/player/list', {
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
        $routeProvider.otherwise({redirectTo: '/player/list'});
    }]);

