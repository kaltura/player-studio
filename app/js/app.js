'use strict';
var cl = function (val) {
    return console.log(val);
};
// Declare app level module which depends on filters, and services
var KMCModule = angular.module('KMCModule',
    ['pascalprecht.translate', 'ngRoute', 'KMC.controllers', 'KMC.filters',
        'KMC.services', 'KMC.directives', 'ngAnimate', 'LocalStorageModule', 'KMCmenu', 'JSONedit']);

KMCModule.config(['$routeProvider', '$locationProvider', '$httpProvider', '$tooltipProvider', '$translateProvider', function ($routeProvider, $locationProvider, $httpProvider, $tooltipProvider, $translateProvider) {
        $translateProvider.useStaticFilesLoader({
            prefix: 'i18n/',
            suffix: '.json'
        });
        $translateProvider.preferredLanguage('en_US');
        $translateProvider.fallbackLanguage('en_US');
        if (window.location.href.indexOf('debug') != -1) {
            // add if you want to get all the missing translattions to the console when running in debug mode
          //  $translateProvider.useMissingTranslationHandlerLog();
        }
        $translateProvider.useStorage('localStorageService');
        $tooltipProvider.options({ placement: 'right', 'appendToBody': true, 'popupDelay': 800 });
        // set event name for opening and closing the tooltips
        $tooltipProvider.setTriggers({
            'customShow': 'customShow'
        });

        $httpProvider.defaults.useXDomain = true; // cors support (TODO - check if we can remove, should be true by default in this angular version)
        delete $httpProvider.defaults.headers.common['X-Requested-With']; // IE8 cors support

        //request loading indication
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
                    logTime('httpRequest failed -');
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
        // add the interceptor to the httpProvider
        $httpProvider.responseInterceptors.push(interceptor);
        // routing section
        $routeProvider.when('/login', {
                templateUrl: 'view/login.html',
                controller: 'LoginCtrl',
                resolve: {'apiService': ['api', 'apiService', function (api, apiService) {
                    // make sure apiService is available upon invalid KS redirect
                    return apiService;
                }]
                }
            }
        );
        $routeProvider.when('/list', {
                templateUrl: 'view/list.html',
                controller: 'PlayerListCtrl',
                resolve: {
                    'apiService': ['api', 'apiService', 'localStorageService', '$location', function (api, apiService, localStorageService, $location) {
                        // make sure we load the list only if we have valid KS
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

        // deep linking to plugin setup
        $routeProvider.when('/edit/:id',
            {templateUrl: 'view/edit.html',
                controller: 'EditCtrl',
                reloadOnSearch: false,
                resolve: {
                    'PlayerData': ['PlayerService', '$route', 'api', 'apiService', 'localStorageService', '$location', function (PlayerService, $route, api, apiService, localStorageService, $location) {
                        var apiLoaded = ksCheck(api, apiService, localStorageService, $location);
                        if (apiLoaded) {
                            return apiLoaded.then(function (api) {
                                return PlayerService.getPlayer($route.current.params.id);
                            });
                        }
                    }],
                    'editProperties': 'editableProperties'
                }
            }
        );

        // open template screen
        $routeProvider.when('/newByTemplate',
            {templateUrl: 'view/new-template.html',
                controller: 'PlayerCreateCtrl',
                reloadOnSearch: false,
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
                controller: 'EditCtrl',
                reloadOnSearch: false,
                resolve: {
                    'api': ['api', 'apiService', 'localStorageService', '$location', function (api, apiService, localStorageService, $location) {
                        return ksCheck(api, apiService, localStorageService, $location);
                    }],
                    'PlayerData': ['api', 'PlayerService', function (api, PlayerService) {
                        return api.then(function () {
                            return PlayerService.newPlayer();
                        });
                    }]
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
    }]).run(["$rootScope", "$rootElement", "$location", function ($rootScope, $rootElement, $location) {
    var appLoad = new Date();
    var debug = false;

    setTimeout(function(){
        window.localStorage.setItem('updateHash', "true"); // IE8 fix
    },1000);


    if (typeof window.parent.kmc != 'undefined') {
        $('html').addClass('inKmc');
    }

    // set the logTime function used in debug mode
    var logTime = function (eventName) {
        if ($location.search()['debug']) {
            var now = new Date();
            var diff = Math.abs(appLoad.getTime() - now.getTime());
            cl(eventName + ' ' + Math.ceil(diff / 1000) + 'sec ' + diff % 1000 + 'ms');
        }
    };
    window.logTime = logTime;
    logTime('AppJsLoad');

    // add functions to $rootScope constructor. $safeApply to prevent apply when digest is already in progress
    $rootScope.constructor.prototype.$safeApply = function (fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest')
            this.$eval(fn);
        else
            this.$apply(fn);
    };

    // custom show for tooltips
    $rootScope.constructor.prototype.openTooltip = function ($event) {
        $($event.target).trigger('customShow');
        $event.preventDefault();
        $event.stopPropagation();
        return false;
    };

    // for css - define the body ID according to route
    $rootScope.routeName = '';
    $rootScope.$on('$routeChangeSuccess', function () {
        appLoad = new Date();
        var url = $location.url().split('/');
        if (debug) {
            $location.search({debug: true});
        }
        if (url[1].indexOf('?') != -1) {
            url[1] = url[1].substr(0, url[1].indexOf('?'));
        }
        $rootScope.routeName = url[1];
    });

    // set debug flag across route changes
    $rootScope.$on('$routeChangeStart', function () {
        if ($location.search()['debug']) {
            debug = true;
        }
        else {
            debug = false;
        }
    });
	var kmc = window.parent.kmc;
    if (kmc && kmc.vars.studio.showFlashStudio === false){
        $(".kmcSubNav").hide();
    }
    if (kmc && kmc.vars.studio.showHTMLStudio === false){
        $("#htmlStudioBtn").hide();
    }

}]);
