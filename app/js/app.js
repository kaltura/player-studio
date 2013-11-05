'use strict';

window.lang = 'en-US';
// Declare app level module which depends on filters, and services
var KMCModule = angular.module('KMCModule',
    ['localization', 'KMC.controllers', 'KMC.filters', 'KMC.services', 'KMC.directives', 'ui.bootstrap', 'ui.select2', 'LocalStorageModule']);

KMCModule.factory('playerCache', function ($cacheFactory) {
    return $cacheFactory('playerCache', {
        capacity: 10
    });
})

KMCModule.config(['$routeProvider', '$locationProvider', '$httpProvider', function ($routeProvider, $locationProvider, $httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    //request loading indication///
    var $http,
        interceptor = ['$q', '$injector', function ($q, $injector) {
            var notificationChannel;
            function success(response) {
                // get $http via $injector because of circular dependency problem
                $http = $http || $injector.get('$http');
                // don't send notification until all requests are complete
                if ($http.pendingRequests.length < 1) {
                    // get requestNotificationChannel via $injector because of circular dependency problem
                    notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
                    // send a notification requests are complete
                    notificationChannel.requestEnded();
                }
                return response;
            }

            function error(response) {
                // get $http via $injector because of circular dependency problem
                $http = $http || $injector.get('$http');
                // don't send notification until all requests are complete
                if ($http.pendingRequests.length < 1) {
                    // get requestNotificationChannel via $injector because of circular dependency problem
                    notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
                    // send a notification requests are complete
                    notificationChannel.requestEnded();
                }
                return $q.reject(response);
            }

            return function (promise) {
                // get requestNotificationChannel via $injector because of circular dependency problem
                notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
                // send a notification requests are complete
                notificationChannel.requestStarted();
                return promise.then(success, error);
            }
        }];

    $httpProvider.responseInterceptors.push(interceptor);
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
            resolve: {'apiService': function (ApiService) {
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
                'editProperties': 'editableProperties',
                'menuSvc': function (menuSvc) {
                    return menuSvc.promise;
                }
            }
        }
    );
    $routeProvider.when('/new',
        {templateUrl: 'view/new-template.html',
            controller: 'PlayerCreateCtrl',
            resolve: {
                'templates': function (playerTemplates) {
                    return  playerTemplates.listSystem();
                },
                'userId': function () {
                    return '1' //  KMC would need to give us the userID ?
                }

            }
        }
    );

    $routeProvider.otherwise({
        redirectTo: '/list'
    });
}]);


