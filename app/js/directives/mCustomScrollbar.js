'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('mcustomScrollbar', [
    '$timeout',
    function($timeout) {
        return {
            priority: 0,
            restrict: 'AC',
            link: function(scope, element, attr) {
                scope.scroller = null;
                var options = scope.$eval(attr['mcustomScrollbar']);
                var timeVar = null;
                scope.$on('layoutChange', function() {
                    if (scope.scroller)
                        timeVar = $timeout(function() {
                            if (timeVar) {
                                $timeout.cancel(timeVar);
                            }
                            scope.scroller.mCustomScrollbar('update');
                        }, 800);
                });
                var opts = {
                    horizontalScroll: false,
                    mouseWheel: true,
                    autoHideScrollbar: true,
                    contentTouchScroll: true,
                    theme: 'dark',
                    advanced: {
                        autoScrollOnFocus: false,
                        updateOnBrowserResize: true,
                        updateOnContentResize: false
                    }
                };
                angular.extend(opts, options);
                var afterScroll = $timeout(function() {
                    if (typeof $().mCustomScrollbar == 'function') {
                        scope.scroller = element.mCustomScrollbar(opts);
                    }
                }, 1000);
                var checkScroll = function(value) {
                    if (value == 'block') {
                        $('#tableHead').css('padding-right', '18px');
                    }
                    else {
                        $('#tableHead').css('padding-right', '0px');
                    }
                };
                if ($('#tableHead').length) {
                    afterScroll.then(function() {
                        var scrollTools = $(element).find('.mCSB_scrollTools');
                        scope.scrollerCss = scrollTools.css('display');
                        $timeout(function() {
                            checkScroll(scope.scrollerCss);
                        }, 200);
                        scope.$watch(function() {
                            return  scope.scrollerCss = scrollTools.css('display');
                        }, function(value) {
                            checkScroll(value);
                        });
                        var timeVar;
                        $(window).resize(function() { //TODO: wrap in single timeout check
                            timeVar = $timeout(function() {
                                if (timeVar) {
                                    $timeout.cancel(timeVar);
                                }
                                checkScroll(scrollTools.css('display'));
                            }, 200);

                        });
                    });
                }
            }
        };
    }
]);