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
                    'apiService': ['api', 'apiService', 'sessionService', '$location', '$q', function (api, apiService, sessionService, $location, $q) {
                        // make sure we load the list only if we have valid KS
                        return ksCheck(api, apiService, sessionService, $location, $q).then(function () {
                            return apiService;
                        });
                    }]
                }
            }
        );
        // resolves with the api once a ks is available (in memory, or requested from the hosting KMC); otherwise navigates to login
        var ksCheck = function (api, apiService, sessionService, $location, $q) {
            return sessionService.load().then(function (ks) {
                if (!ks) { //navigate to login
                    $location.path("/login");
                    return $q.reject('no ks');
                }
                return api.then(function (apiObj) {
                    apiObj.setKs(ks);
                    return apiObj;
                });
            });
        };

        // deep linking to plugin setup
        $routeProvider.when('/edit/:id',
            {templateUrl: 'view/edit.html',
                controller: 'EditCtrl',
                reloadOnSearch: false,
                resolve: {
                    'PlayerData': ['PlayerService', '$route', 'api', 'apiService', 'sessionService', '$location', '$q', function (PlayerService, $route, api, apiService, sessionService, $location, $q) {
                        return ksCheck(api, apiService, sessionService, $location, $q).then(function () {
                            return PlayerService.getPlayer($route.current.params.id);
                        });
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
                    'api': ['api', 'apiService', 'sessionService', '$location', '$q', function (api, apiService, sessionService, $location, $q) {
                        return ksCheck(api, apiService, sessionService, $location, $q);
                    }],
                    'PlayerData': ['api', 'apiService', 'sessionService', '$location', '$q', 'PlayerService', function (api, apiService, sessionService, $location, $q, PlayerService) {
                        // create the player only after the session is available
                        return ksCheck(api, apiService, sessionService, $location, $q).then(function () {
                            return PlayerService.newPlayer();
                        });
                    }]
                }
            }
        );
        $routeProvider.when('/logout', {
            resolve: {'logout': ['localStorageService', 'apiService', 'sessionService', '$location', function (localStorageService, apiService, sessionService, $location) {
                if (localStorageService.isSupported()) {
                    localStorageService.clearAll();
                }
                sessionService.clear();
                apiService.unSetks();
                $location.path('/login');
            }]}

        });
        $routeProvider.otherwise({
            resolve: {'res': ['api', 'apiService', 'sessionService', '$location', '$q', function (api, apiService, sessionService, $location, $q) {
                return ksCheck(api, apiService, sessionService, $location, $q).then(function () {
                    $location.path('/list');
                });
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
    if (kmc && kmc.vars.studio.showFlashStudio === false && kmc.vars.studio.showStudioV3 === false){
        $(".kmcSubNav").hide();
    }
    if (kmc && kmc.vars.studio.showFlashStudio === false){
        $("#flashStudioBtn").hide();
    }
    if (kmc && kmc.vars.studio.showStudioV3 === false){
        $("#htmlStudioBtnV3").hide();
    }

}]);
