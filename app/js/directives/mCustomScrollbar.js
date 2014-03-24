'use strict';
var DirectivesModule = angular.module('KMC.directives');
DirectivesModule.directive('mcustomScrollbar', [
    '$timeout',
    function ($timeout) {
        return {
            priority: 0,
            scope: {},
            restrict: 'AC',
            link: function (scope, element, attr) {
                var afterScroll;
                var height = '99%'; // default for scrollers
                if (scope['pagename'] == 'search') return;
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
                    set_height: height,
                    advanced: {
                        autoScrollOnFocus: false,
                        updateOnBrowserResize: true,
                        updateOnContentResize: false
                    }
                };
                angular.extend(opts, options);
                var makeOrUpdateScroller = function () {
                    return  $timeout(function () {
                        if (typeof $().mCustomScrollbar == 'function') {
                            if (scope.scroller) {
                                scope.scroller.mCustomScrollbar("update");
                            } else {
                                scope.scroller = element.mCustomScrollbar(opts);
                            }
                        }
                    }, 1000);
                };
                //special case for menu scrollers not be nested
                if (attr['menuscroller']) {
                    scope.$on('menuChange', function (e, menupage) {
                            if (attr['menuscroller'] == menupage) {
                                makeOrUpdateScroller();
                            }
                            else if (scope.scroller) {
                                scope.scroller.mCustomScrollbar("destroy");
                                scope.scroller = null;
                            }
                        }
                    );
                }
                else { // other places (list etc)
                    afterScroll = makeOrUpdateScroller();
                }
/// everything below is only relevant to the list screen
                var checkScroll = function (value) {
                    if (value == 'block') {
                        $('#tableHead').css('padding-right', '18px');
                    }
                    else {
                        $('#tableHead').css('padding-right', '0px');
                    }
                };
                if (scope.$root.routeName == 'list' && $('#tableHead').length) {
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
        }
            ;
    }
])
;