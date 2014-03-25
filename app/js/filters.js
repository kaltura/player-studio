'use strict';
//
///* Filters */
//
angular.module('KMC.filters', ['ngSanitize' ])
    .filter('HTMLunsafe',function ($sce) {
        return function (val) {
            return $sce.trustAsHtml(val);
        };
    }).filter('timeago', function () {
        return function (input) {
            if (typeof $.timeago == 'function' && !isNaN(input)) {
                var date = input * 1000;
                return $.timeago(date);
            }
            else
                return input;
        };
    })
    .filter('capitalize', function () {
        return function (input) {
            if (input !== null)
                input = input.toLowerCase();
            return input.substring(0, 1).toUpperCase() + input.substring(1);
        };
    })
    .
    filter('range',function () {
        return function (input) {
            var lowBound, highBound;
            switch (input.length) {
                case 1:
                    lowBound = 0;
                    highBound = parseInt(input[0]) - 1;
                    break;
                case 2:
                    lowBound = parseInt(input[0]);
                    highBound = parseInt(input[1]);
                    break;
                default:
                    return input;
            }
            var result = [];
            for (var i = lowBound; i <= highBound; i++)
                result.push(i);
            return result;
        };
    }).filter('startFrom', function () {
        return function (input, start) {
            if (input) {
                start = +start; //parse to int
                return input.slice(start);
            }
            return [];
        };
    });