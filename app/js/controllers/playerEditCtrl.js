'use strict';

/* Controllers */

KMCModule.controller('PlayerEditCtrl', [ '$rootScope','$scope','PlayerService', function($rootScope,$scope,PlayerService) {
  $scope.Categories = [{name:'Basic display',id:1,subCategories:[{

  }]},
      {name:'Branding',id:2}];
}]);