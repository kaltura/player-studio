'use strict';
var cl = function (val) {
    return console.log(val);
};

window.lang = 'en-US';
// Declare app level module which depends on filters, and services
var KMCModule = angular.module('KMCModule',
    ['localization', 'ngRoute', 'KMC.controllers', 'KMC.filters',
        'KMC.services', 'KMC.directives', 'ngAnimate', 'LocalStorageModule', 'KMC.menu']);

KMCModule.config(['$routeProvider', '$locationProvider', '$httpProvider', '$tooltipProvider', function ($routeProvider, $locationProvider, $httpProvider, $tooltipProvider) {

        $tooltipProvider.options({ placement: 'right', 'appendToBody': true, 'popupDelay': 800 });
        $tooltipProvider.setTriggers({
            'customShow': 'customShow'
        });

        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
        //request load158ing indication//
        var $http, interceptor = ['$q', '$injector',
            function ($q, $injector) {
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
                    logTime('httpRequest failed -' );
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
                };
            }];

        $httpProvider.responseInterceptors.push(interceptor);
        $routeProvider.when('/login', {
                templateUrl: 'view/login.html',
                controller: 'LoginCtrl',
                resolve: {'apiService': ['apiService', function (apiService) {
                    return apiService;
                }], 'localize': 'localize'
                }
            }
        );
        $routeProvider.when('/list', {
                templateUrl: 'view/list.html',
                controller: 'PlayerListCtrl',
                resolve: {
                    'apiService': ['api', 'apiService', 'localStorageService', '$location', function (api, apiService, localStorageService, $location) {
                        return ksCheck(api, apiService, localStorageService, $location).then(function () {
                            return apiService;
                        });
                    }]
                }
            }
        );
        var ksCheck = function (api, apiService, localStorageService, $location) {
            // Check if we have ks in locaclstorage
            try {
                var kmc = window.parent.kmc;
                if (kmc && kmc.vars) {
                    // got ks from KMC - save to local storage
                    if (kmc.vars.ks)
                        localStorageService.add('ks', kmc.vars.ks);
                }
            } catch (e) {
                cl('Could not located parent.kmc: ' + e);
            }
            var ks = localStorageService.get('ks');
            if (!ks) { //navigate to login
                $location.path("/login");
                return false;
            } else {
                api.then(function () {
                    apiService.setKs(ks);
                });
            }
            return api; // changed to return the promise of the API
        };
        $routeProvider.when('/edit/:id/:menuPage?/:plugin?',
            {templateUrl: 'view/edit.html',
                controller: 'PlayerEditCtrl',
                resolve: {
                    'PlayerData': ['PlayerService', '$route', 'api', 'apiService', 'localStorageService', '$location', function (PlayerService, $route, api, apiService, localStorageService, $location) {
                        var apiLoaded = ksCheck(api, apiService, localStorageService, $location);
                        return apiLoaded.then(function (api) {
                            return PlayerService.getPlayer($route.current.params.id);
                        });
                    }],
//                    'defaultPage': ['$location', '$route', function($location, $route) {
//                        if (typeof $route.current.params['menuPage'] == 'undefined') {
//                            $location.path($location.search() + '/' + 'basicDisplay');
//                        }
//                    }],
                    'editProperties': 'editableProperties',
                    'menuSvc': 'menuSvc',
                    'localize': 'localize'
                }
            }
        );
        $routeProvider.when('/newByTemplate',
            {templateUrl: 'view/new-template.html',
                controller: 'PlayerCreateCtrl',
                resolve: {
                    'templates': ['playerTemplates', function (playerTemplates) {
                        return  playerTemplates.listSystem();
                    }],
                    'userId': function () {
                        return '1'; //  KMC would need to give us the userID ?
                    }

                }
            }
        );
        $routeProvider.when('/new',
            {templateUrl: 'view/edit.html',
                controller: 'PlayerEditCtrl',
                resolve: {
                    'Api': ['api', 'apiService', 'localStorageService', '$location', function (api, apiService, localStorageService, $location) {
                        return ksCheck(api, apiService, localStorageService, $location);
                    }],
                    'PlayerData': function ($q, api, PlayerService) {
                        return api.then(function () {
                            return PlayerService.newPlayer();
                        });
                    },
                    'editProperties': 'editableProperties',
                    'menuSvc': 'menuSvc',
                    'localize': 'localize'
                }
            }
        );
        $routeProvider.when('/logout', {
            resolve: {'logout': ['localStorageService', 'apiService', '$location', function (localStorageService, apiService, $location) {
                if (localStorageService.isSupported()) {
                    localStorageService.clearAll();
                }
                apiService.unSetks();
                $location.path('/login');
            }]}

        });
        $routeProvider.otherwise({
            resolve: {'res': ['api', 'apiService', 'localStorageService', '$location', function (api, apiService, localStorageService, $location) {
                if (ksCheck(api, apiService, localStorageService, $location)) {
                    return $location.path('/list');
                }
            }]}
        });
    }]).run(function ($rootScope, $rootElement, $location) {
        var appLoad = new Date();
        var logTime = function (eventName) {
            if ($location.search()['debug']){
                var now = new Date();
                var diff = Math.abs(appLoad.getTime() - now.getTime());
                cl(eventName + ' ' + Math.ceil(diff/1000)+'sec '+  diff % 1000 + 'ms');
            }
        }
        window.logTime = logTime;
        logTime('AppJsLoad');
        $rootScope.$safeApply = function (scope, fn) {
            var phase = scope.$root.$$phase;
            if (phase == '$apply' || phase == '$digest')
                scope.$eval(fn);
            else
                scope.$apply(fn);
        };
        $rootScope.$on('$routeChangeSuccess', function () {
            var url = $location.url().split('/');
            $rootScope.routeName = url[1];
        });
    });