'use strict';

 window.lang = 'en-US';
// Declare app level module which depends on filters, and services
 var KMCModule = angular.module('KMCModule',['localization']);



KMCModule.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/player/list',
        {templateUrl: 'view/list.html',
            controller: 'PlayerListCtrl'});
    $routeProvider.when('/player/new',
        {templateUrl: 'view/edit.html',
            controller: 'PlayerEditCtrl'});


  //  $routeProvider.when('/view2', {templateUrl: 'partials/partial2.html', controller: 'MyCtrl2'});
 //   $routeProvider.otherwise({redirectTo: '/view1'});
  }]);

