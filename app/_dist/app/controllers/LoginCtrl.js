'use strict';
KMCModule.controller('LoginCtrl', [
  '$scope',
  'apiService',
  '$location',
  'localStorageService',
  'requestNotificationChannel',
  function ($scope, apiService, $location, localStorageService, requestNotificationChannel) {
    requestNotificationChannel.requestEnded('list');
    $scope.formError = true;
    $scope.formHelpMsg = 'You must login to use this application';
    $scope.email = '';
    $scope.pwd = '';
    $scope.login = function () {
      apiService.doRequest({
        'service': 'user',
        'action': 'loginbyloginid',
        'loginId': $scope.email,
        'password': $scope.pwd
      }).then(function (data) {
        if (localStorageService.isSupported()) {
          localStorageService.add('ks', data);
        }
        apiService.setKs(data);
        $location.path('/list');
      }, function (errorMsg) {
        $scope.formError = true;
        $scope.formHelpMsg = errorMsg;
      });
    };
  }
]);