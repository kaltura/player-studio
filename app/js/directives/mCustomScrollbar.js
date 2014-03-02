'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('mcustomScrollbar', [
    '$timeout',
    function ($timeout) {
        return {
            priority: 0,
            restrict: 'AC',
            link: function (scope, element, attr) {
                scope.scroller = null;
                var options = scope.$eval(attr['mcustomScrollbar']);
                var timeVar = null;
                scope.$on('layoutChange', function () {
                    if (timeVar) {
                        $timeout.cancel(timeVar);
                    }
                    timeVar = $timeout(function () {
                        if (scope.scroller)
                            scope.scroller.mCustomScrollbar('update');
                        timeVar = null;
                    }, 300);
                });
                var opts = {
                    horizontalScroll: false,
                    mouseWheel: true,
                    autoHideScrollbar: true,
                    contentTouchScroll: true,
                    theme: 'dark',
                    set_height: '99%',
                    advanced: {
                        autoScrollOnFocus: false,
                        updateOnBrowserResize: true,
                        updateOnContentResize: false
                    }
                };
                angular.extend(opts, options);
                //in the past we used to run the scroller only on '.mp-level-open:last' now it exists on all pages
                // instate a scroller on the selected menupage withut using the css selector
//                if (scope.scroller) {
//                    scope.scroller.mCustomScrollbar('destroy');
//                    scope.scroller = null;
//                }
//             //   element.find('.mCustomScrollbar').mCustomScrollbar('destroy'); // clear all scrollbars (nested won't work well)
                var afterScroll = $timeout(function () {
                    if (typeof $().mCustomScrollbar == 'function' && !scope.scroller) {
                        scope.scroller = element.mCustomScrollbar(opts);
                    }
                }, 1000);

                /// everything below is only relevant to the list screen
                var checkScroll = function (value) {
                    if (value == 'block') {
                        $('#tableHead').css('padding-right', '18px');
                    }
                    else {
                        $('#tableHead').css('padding-right', '0px');
                    }
                };
                if ($('#tableHead').length) {
                    afterScroll.then(function () {
                        var scrollTools = $(element).find('.mCSB_scrollTools');
                        scope.scrollerCss = scrollTools.css('display');
                        $timeout(function () {
                            checkScroll(scope.scrollerCss);
                        }, 200);
                        scope.$watch(function () {
                            return  scope.scrollerCss = scrollTools.css('display');
                        }, function (value) {
                            checkScroll(value);
                        });
                        var timeVar;
                        $(window).resize(function () { //TODO: wrap in single timeout check
                            if (timeVar) {
                                $timeout.cancel(timeVar);
                            }
                            timeVar = $timeout(function () {
                                checkScroll(scrollTools.css('display'));
                                timeVar = null;
                            }, 200);

                        });
                    });
                }
            }
        };
    }
]);