'use strict';

window.lang = 'en-US';
// Declare app level module which depends on filters, and services
var KMCModule = angular.module('KMCModule',
    ['localization', 'ngRoute', 'KMC.controllers', 'KMC.filters',
        'KMC.services', 'KMC.directives', 'ui.bootstrap',
        'ui.select2', 'LocalStorageModule', 'KMC.menu']);

KMCModule.config(['$routeProvider', '$locationProvider', '$httpProvider', '$tooltipProvider', function ($routeProvider, $locationProvider, $httpProvider, $tooltipProvider) {
    $tooltipProvider.options({ placement: 'right', 'appendToBody': true });
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
            resolve: {'apiService': function (apiService) {
                return apiService;
            }, 'localize': 'localize'
            }
        }
    );
    $routeProvider.when('/list', {
            templateUrl: 'view/list.html',
            controller: 'PlayerListCtrl',
            resolve: {'apiService': function (apiService, localStorageService, $location) {
                // Check if we have ks in locaclstorage
                var ks = localStorageService.get('ks');
                if (!ks) { //navigate to login
                    return $location.path("/login");
                } else {
                    apiService.setKs(ks);
                }
                return apiService;
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
                'menuSvc': 'menuSvc',
                'localize': 'localize'
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
    $routeProvider.when('/logout', {
        resolve: {'logout': function (localStorageService, apiService, $location) {
            if (localStorageService.isSupported()) {
                localStorageService.clearAll();
            }
            apiService.unSetks();
            $location.path('/login');
        }}

    });
    $routeProvider.otherwise({
        redirectTo: '/login'
    });
}]);


