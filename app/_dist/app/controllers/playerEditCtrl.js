'use strict';
KMCModule.controller('PlayerEditCtrl', [
  '$scope',
  'PlayerData',
  '$routeParams',
  '$filter',
  'menuSvc',
  'PlayerService',
  'apiService',
  'localStorageService',
  'userEntries',
  function ($scope, PlayerData, $routeParams, $filter, menuSvc, PlayerService, apiService, localStorageService, userEntries) {
    $scope.ks = localStorageService.get('ks');
    $scope.playerId = PlayerData.id;
    $scope.title = $routeParams.id ? $filter('i18n')('Edit player') : $filter('i18n')('New  player');
    $scope.data = PlayerData;
    $scope.userEntriesList = [];
    $scope.userEntries = userEntries;
    $scope.tags = [];
    if (typeof $scope.data.tags != 'undefined' && $scope.data.tags) {
      var tags = typeof $scope.data.tags == 'string' ? $scope.data.tags.split(',') : $scope.data.tags;
      for (var i = 0; i < tags.length; i++)
        $scope.tags.push({
          id: tags[i],
          text: tags[i]
        });
    }
    menuSvc.registerAction('getTags', function () {
      return $scope.tags;
    });
    angular.forEach($scope.userEntries.objects, function (value) {
      $scope.userEntriesList.push({
        'id': value.id,
        'text': value.name
      });
    });
    menuSvc.registerAction('listEntries', function () {
      return $scope.userEntriesList;
    });
    menuSvc.registerAction('queryEntries', function (query) {
      var data = { results: [] };
      console.log(query.term);
      if (query.term) {
        angular.forEach($scope.userEntriesList, function (item, key) {
          if (query.term.toUpperCase() === item.text.substring(0, query.term.length).toUpperCase()) {
            data.results.push(item);
          }
        });
        return query.callback(data);
      } else
        return query.callback({ results: $scope.userEntriesList });
    });
    if (parseFloat($scope.data.version) < PlayerService.getRequiredVersion()) {
      menuSvc.registerAction('update', function () {
        PlayerService.playerUpdate($scope.data);
      });
    }
    $scope.previewEntry = $scope.data.previewentry ? $scope.data.previewentry.id : '0_ji4qh61l';
    $scope.$watch('data.previewentry', function (newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.previewEntry = newVal.id;
        PlayerService.setPreviewEntry($scope.previewEntry);
        PlayerService.renderPlayer();
      }
    });
    $(document).ready(function () {
      PlayerService.setPreviewEntry($scope.previewEntry);
      PlayerService.renderPlayer();
    });
  }
]);
;
KMCModule.controller('editPageDataCntrl', [
  '$scope',
  function ($scope) {
  }
]);