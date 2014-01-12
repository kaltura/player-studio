'use strict';
var cl = function(val) {
    return console.log(val);
};
window.lang = 'en-US';
// Declare app level module which depends on filters, and services
var KMCModule = angular.module('KMCModule',
    ['localization', 'ngRoute', 'KMC.controllers', 'KMC.filters',
        'KMC.services', 'KMC.directives', 'ngAnimate', 'LocalStorageModule', 'KMC.menu']);

KMCModule.config(['$routeProvider', '$locationProvider', '$httpProvider', '$tooltipProvider',function($routeProvider, $locationProvider, $httpProvider, $tooltipProvider) {
    $tooltipProvider.options({ placement: 'right', 'appendToBody': true, 'popupDelay': 800 });
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    //request loading indication//
    var $http,
        interceptor = ['$q', '$injector', function($q, $injector) {
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

            return function(promise) {
                // get requestNotificationChannel via $injector because of circular dependency problem
                notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
                // send a notification requests are complete
                notificationChannel.requestStarted();
                return promise.then(success, error);
            };
        }];

    $httpProvider.responseInterceptors.push(interceptor);
    $routeProvider.when('/login', {
            templateUrl: 'view/login.html',
            controller: 'LoginCtrl',
            resolve: {'apiService': ['apiService', function(apiService) {
                return apiService;
            }], 'localize': 'localize'
            }
        }
    );
    $routeProvider.when('/list', {
            templateUrl: 'view/list.html',
            controller: 'PlayerListCtrl',
            resolve: {
                'apiService': ['apiService', 'localStorageService', '$location', function(apiService, localStorageService, $location) {
                    return ksCheck(apiService, localStorageService, $location);
                }]
            }
        }
    );
    var ksCheck = function(apiService, localStorageService, $location) {
    // Check if we have ks in locaclstorage
        try{
            var kmc = window.parent.kmc;
            if (kmc && kmc.vars) {
                // got ks from KMC - save to local storage
                if (kmc.vars.ks)
                    localStorageService.add('ks', kmc.vars.ks);
            }
        }catch (e){
            cl('Could not located parent.kmc: ' + e);
        }
        var ks = localStorageService.get('ks');
        if (!ks) { //navigate to login
            $location.path("/login");
            return false;
        } else {
            apiService.setKs(ks);
        }
        return apiService;
    };
    $routeProvider.when('/edit/:id',
        {templateUrl: 'view/edit.html',
            controller: 'PlayerEditCtrl',
            resolve: {
                'PlayerData': ['PlayerService', '$route', 'apiService', 'localStorageService', '$location', function(PlayerService, $route, apiService, localStorageService, $location) {
                    ksCheck(apiService, localStorageService, $location);
                    return  PlayerService.getPlayer($route.current.params.id);
                }],
                'editProperties': 'editableProperties',
                'menuSvc': 'menuSvc',
                'localize': 'localize',
                'userEntries': ['apiService', 'localStorageService', '$location', function(apiService, localStorageService, $location) {
                    ksCheck(apiService, localStorageService, $location);
                    return apiService.listMedia(); // should only load the first 20...
                }]
            }
        }
    );
    $routeProvider.when('/newByTemplate',
        {templateUrl: 'view/new-template.html',
            controller: 'PlayerCreateCtrl',
            resolve: {
                'templates': ['playerTemplates', function(playerTemplates) {
                    return  playerTemplates.listSystem();
                }],
                'userId': function() {
                    return '1'; //  KMC would need to give us the userID ?
                }

            }
        }
    );
    $routeProvider.when('/new',
        {templateUrl: 'view/edit.html',
            controller: 'PlayerEditCtrl',
            resolve: {
                'PlayerData': ['PlayerService', 'apiService', 'localStorageService', '$location', function(PlayerService, apiService, localStorageService, $location) {
                    ksCheck(apiService, localStorageService, $location);
                    return  PlayerService.newPlayer();
                }],
                'editProperties': 'editableProperties',
                'menuSvc': 'menuSvc',
                'localize': 'localize',
                'userEntries': ['apiService', 'localStorageService', '$location', function(apiService, localStorageService, $location) {
                    ksCheck(apiService, localStorageService, $location);
                    return apiService.listMedia(); // should only load the first 20...
                }]
            }
        }
    );
    $routeProvider.when('/logout', {
        resolve: {'logout': ['localStorageService', 'apiService', '$location', function(localStorageService, apiService, $location) {
            if (localStorageService.isSupported()) {
                localStorageService.clearAll();
            }
            apiService.unSetks();
            $location.path('/login');
        }]}

    });
    $routeProvider.otherwise({
        resolve: {'res': ['apiService', 'localStorageService', '$location', function(apiService, localStorageService, $location) {
            if (ksCheck(apiService, localStorageService, $location)) {
                return $location.path('/list');
            }
        }]}
    });
}])
;


