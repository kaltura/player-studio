'use strict';
var cl = function (val) {
  return console.log(val);
};
window.lang = 'en-US';
var KMCModule = angular.module('KMCModule', [
    'localization',
    'ngRoute',
    'KMC.controllers',
    'KMC.filters',
    'KMC.services',
    'KMC.directives',
    'ui.bootstrap',
    'ngAnimate',
    'LocalStorageModule',
    'KMC.menu'
  ]);
KMCModule.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',
  '$tooltipProvider',
  function ($routeProvider, $locationProvider, $httpProvider, $tooltipProvider) {
    $tooltipProvider.options({
      placement: 'right',
      'appendToBody': true,
      'popupDelay': 800
    });
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    var $http, interceptor = [
        '$q',
        '$injector',
        function ($q, $injector) {
          var notificationChannel;
          function success(response) {
            $http = $http || $injector.get('$http');
            if ($http.pendingRequests.length < 1) {
              notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
              notificationChannel.requestEnded();
            }
            return response;
          }
          function error(response) {
            $http = $http || $injector.get('$http');
            if ($http.pendingRequests.length < 1) {
              notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
              notificationChannel.requestEnded();
            }
            return $q.reject(response);
          }
          return function (promise) {
            notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
            notificationChannel.requestStarted();
            return promise.then(success, error);
          };
        }
      ];
    $httpProvider.responseInterceptors.push(interceptor);
    $locationProvider.html5Mode(true);
    $routeProvider.when('/login', {
      templateUrl: 'view/login.html',
      controller: 'LoginCtrl',
      resolve: {
        'apiService': [
          'apiService',
          function (apiService) {
            return apiService;
          }
        ],
        'localize': 'localize'
      }
    });
    $routeProvider.when('/list', {
      templateUrl: 'view/list.html',
      controller: 'PlayerListCtrl',
      resolve: {
        'apiService': [
          'apiService',
          'localStorageService',
          '$location',
          function (apiService, localStorageService, $location) {
            return ksCheck(apiService, localStorageService, $location);
          }
        ]
      }
    });
    var ksCheck = function (apiService, localStorageService, $location) {
      var ks = localStorageService.get('ks');
      if (!ks) {
        $location.path('/login');
        return false;
      } else {
        apiService.setKs(ks);
      }
      return apiService;
    };
    $routeProvider.when('/edit/:id', {
      templateUrl: 'view/edit.html',
      controller: 'PlayerEditCtrl',
      resolve: {
        'PlayerData': [
          'PlayerService',
          '$route',
          'apiService',
          'localStorageService',
          '$location',
          function (PlayerService, $route, apiService, localStorageService, $location) {
            ksCheck(apiService, localStorageService, $location);
            return PlayerService.getPlayer($route.current.params.id);
          }
        ],
        'editProperties': 'editableProperties',
        'menuSvc': 'menuSvc',
        'localize': 'localize',
        'userEntries': [
          'apiService',
          'localStorageService',
          '$location',
          function (apiService, localStorageService, $location) {
            ksCheck(apiService, localStorageService, $location);
            return apiService.listMedia();
          }
        ]
      }
    });
    $routeProvider.when('/newByTemplate', {
      templateUrl: 'view/new-template.html',
      controller: 'PlayerCreateCtrl',
      resolve: {
        'templates': [
          'playerTemplates',
          function (playerTemplates) {
            return playerTemplates.listSystem();
          }
        ],
        'userId': function () {
          return '1';
        }
      }
    });
    $routeProvider.when('/new', {
      templateUrl: 'view/edit.html',
      controller: 'PlayerEditCtrl',
      resolve: {
        'PlayerData': [
          'PlayerService',
          'apiService',
          'localStorageService',
          '$location',
          function (PlayerService, apiService, localStorageService, $location) {
            ksCheck(apiService, localStorageService, $location);
            return PlayerService.newPlayer();
          }
        ],
        'editProperties': 'editableProperties',
        'menuSvc': 'menuSvc',
        'localize': 'localize',
        'userEntries': [
          'apiService',
          'localStorageService',
          '$location',
          function (apiService, localStorageService, $location) {
            ksCheck(apiService, localStorageService, $location);
            return apiService.listMedia();
          }
        ]
      }
    });
    $routeProvider.when('/logout', {
      resolve: {
        'logout': [
          'localStorageService',
          'apiService',
          '$location',
          function (localStorageService, apiService, $location) {
            if (localStorageService.isSupported()) {
              localStorageService.clearAll();
            }
            apiService.unSetks();
            $location.path('/login');
          }
        ]
      }
    });
    $routeProvider.otherwise({
      resolve: {
        'res': [
          'localStorageService',
          '$location',
          function (localStorageService, $location) {
            if (parent.kmc && parent.kmc.vars) {
              if (parent.kmc.vars.ks)
                localStorageService.add('ks', parent.kmc.vars.ks);
            }
            var ks = localStorageService.get('ks');
            if (!ks) {
              return $location.path('/login');
            } else
              return $location.path('/list');
          }
        ]
      }
    });
  }
]);
;