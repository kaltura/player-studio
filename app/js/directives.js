'use strict';
var DirectivesModule = angular.module('KMC.directives', [
    'ui.bootstrap',
    'ui.select2',
    'ui.sortable'
]);
DirectivesModule.directive('bindOnce', function() {
	return {
		scope: true,
		link: function( $scope ) {
			setTimeout(function() {
				$scope.$destroy();
			}, 0);
		}
	};
});

DirectivesModule.directive('onFinishRender', ['$timeout','$compile', function ($timeout, $compile) {
	return {
		restrict: 'A',
		link: function (scope, element, attr) {
			if (scope.$last === true) { // accordion section finished loading - init jQuery plugins after 3 seconds to allow menu items to render first
				$timeout(function(){
					if ($(".playlistSetup").length === 0){
						$('div:contains("Playlist Configuration").panel').before('<div class="playlistSetup">Playlist setup:</div>'); // add playlist separator
					}
					if ($(".addPlugin").length === 0){
						var addPluginBtn = $compile(angular.element('<p style="margin-top: 40px; margin-bottom: 36px"><button ng-click="addPlugin()" class="btn btn-default addPlugin"><i class="glyphicon glyphicon-plus">&nbsp;</i>Create New Plugin</button></p>'))(scope);
						$('div:contains("UI Variables").panel').after(addPluginBtn);
					}
					if ($(".importPlugin").length === 0){
						var importPluginBtn = $compile(angular.element('<p style="float: left; margin-right: 20px"><button ng-click="importPlugin()" class="btn btn-default importPlugin"><i class="glyphicon glyphicon-import">&nbsp;</i>Import Plugin</button></p>'))(scope);
						$(".addPlugin").after(importPluginBtn);
					}
				},50);
				$timeout(function(){
					$(".numeric").not(".allowNegative").numeric({allowMinus: false, allowDecSep: false}); // set integer number fields to accept only numbers
					$(".allowNegative").numeric({allowMinus: true, allowDecSep: false}); // set integer number fields to accept only numbers
					$(".float").numeric({allowMinus: false, allowDecSep: true});    // set float number fields to accept only floating numbers
					$(".alpha").alphanum({allow:'-_=+,.!:;/@#$%^&*(){}[]|?~\'',disallow: '"'});    // set float number fields to accept only floating numbers
					$(".numbersArray").alphanum({allow:',.',allowUpper: false, allowLower:false, disallow: '-_=+"!:;/@#$%^&*(){}[]|?~\''});    // set numbers array fields to accept only numbers and comma
				},3000);
			}
		}
	};
}]);

DirectivesModule.directive('ngEnter', function () {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			if(event.which === 13) {
				scope.$apply(function (){
					scope.$eval(attrs.ngEnter);
				});

				event.preventDefault();
			}
		});
	};
});
DirectivesModule.directive('timeago', [function() {
    return {
        restrict: 'CA',
        link: function(scope, iElement, iAttrs) {
            if (typeof $.timeago == 'function') {
                scope.$observe('timeago', function(newVal) {
                    if (newVal && !isNaN(newVal)) {
                        var date = scope.timestamp * 1000;
                        iElement.text($.timeago(date));
                    }
                });
            }
        }
    };
}]);
DirectivesModule.directive('hiddenValue', [function() {
    return {
        template: '<input type="hidden" value="{{model}}"/>',
        scope: {
            model: '='
        },
        controller: function($scope, $element, $attrs) {
            if ($attrs['initvalue']) {
                $scope.model = $attrs['initvalue'];
            }
        },
        restrict: 'EA'
    };
}]);
DirectivesModule.directive('sortOrder', ['sortSvc', function (sortSvc) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'template/formcontrols/sortOrder.html',
            controller: ['$scope', function ($scope) {
                $scope.getObjects = function () {
                    $scope.containers = sortSvc.getObjects();
                };
                $scope.getObjects();
                sortSvc.sortScope = $scope;
                $scope.$on('sortContainersChanged', function () {
                    $scope.getObjects();
                });
                $scope.$watchCollection('containers', function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        sortSvc.saveOrder($scope.containers);
                    }
                });
                $scope.sortableOptions = {
                    update: function (e, ui) {
                        cl($scope.containers);
                    },
                    axis: 'y'
                };
            }],
            link: function (scope, element, attrs) {
            }
        };
    }
]);
DirectivesModule.directive("onbeforeunload", ["$window", "$filter", '$location',function ($window, $filter, $location) {
    var unloadtext, forms = [];

    function handleOnbeforeUnload() {
        var i, form, isDirty = false;

        for (i = 0; i < forms.length; i++) {
            form = forms[i];

            if (form.scope[form.name].$dirty) {
                isDirty = true;
                break;
            }
        }

        if (isDirty) {
            return unloadtext;
        } else {
            return undefined;
        }
    }

    return function ($scope, $element) {
        if ($element[0].nodeName.toLowerCase() !== 'form') {
            throw new Error("onbeforeunload directive must only be set on a angularjs form!");
        }

        forms.push({
            "name": $element[0].name,
            "scope": $scope
        });
        try {
            unloadtext = $filter("translate")("onbeforeunload");
        } catch (err) {
            unloadtext = "";
        }
        var formName = $element[0].name;
        $scope.$watch(formName + '.$dirty', function(newVal, oldVal) {
            if (newVal && newVal != oldVal) {
                $window.onbeforeunload = handleOnbeforeUnload;
            }
        });
        $scope.$on('$locationChangeSuccess',function(e,origin,dest){
            if (origin.split('?')[0] != dest.split('?')[0]){
                $window.ononbeforeunload = false;}
        });
        $scope.$on('$destory',function(){
            $window.ononbeforeunload = false;
        });
    };
}]);
DirectivesModule.directive('mcustomScrollbar', ['$timeout',	function ($timeout) {
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
				// everything below is only relevant to the list screen
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
		};
	}
]);