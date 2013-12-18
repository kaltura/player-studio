'use strict';

/* jasmine specs for filters go here */
//
describe('filter', function () {
    beforeEach(module('KMC.filters'));
    describe('startFrom', function () {
        it('should cut the beginging of a string by a set number of characters ', inject(function ($filter) {
            var startFrom = $filter('startFrom');
            expect(startFrom('CUTlongString', 3)).toEqual('longString');
        }));
    });
    describe('range', function () {
        it('should fill an array with numbers from lower to upper bounds (arguments) ', inject(function ($filter) {
            var range = $filter('range');
            expect(range([3])).toEqual([0, 1, 2]);
            expect(range([1, 3])).toEqual([1, 2, 3]);
        }));
    });
    describe('timeago', function () {
        it('should use the timeago 3rd party to convert timestamps to nicely formated strings ', inject(function ($filter) {
            var timeago = $filter('timeago');
            var now =  Math.round(+new Date()/1000);
            expect(timeago(now)).toEqual('less than a minute ago');
            var yesterday = (new Date().getTime()-(24*60*60*1000))/1000;
            expect(timeago(yesterday)).toEqual('a day ago');
        }));
    });
    describe('HTMLunsafe',function(){
        it('should allow any HTML to pass though',inject(function($filter){
        var htmlunsafe = $filter('HTMLunsafe');
            var nastyInput = '<script >console.log("very nasty stuff");</script>';
            var unsafe = htmlunsafe(nastyInput).$$unwrapTrustedValue();
            expect(unsafe).toBe(nastyInput);
        }));
    });
});

