'use strict';

/* Controllers */

angular.module('KMCModule').controller('LoginCtrl',
    ['$scope', 'apiService', '$location', 'sessionService', 'requestNotificationChannel','$filter',
        function($scope, apiService, $location, sessionService, requestNotificationChannel,$filter) {
            requestNotificationChannel.requestEnded('list'); // if coming from list this would stop the spinner
            $scope.formError = true;
            $scope.formHelpMsg = $filter('translate')('You must login to use this application');
            $scope.email = '';
            $scope.pwd = '';
            $scope.login = function() {
                apiService.doRequest({
                    'service': 'user',
                    'action': 'loginbyloginid',
                    'loginId': $scope.email,
                    'password': $scope.pwd
                }).then(function(data) {
                        // keep the ks in memory only
                        sessionService.setKs(data);
                        apiService.setKs(data);
                        $location.path("/list");
                    }, function(errorMsg) {
                        $scope.formError = true;
                        $scope.formHelpMsg = errorMsg;
                    });
            };
        }]);