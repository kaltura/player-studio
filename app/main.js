/*! Studio-v2 - v2.0.0 - 2013-12-29
* https://github.com/kaltura/player-studio
* Copyright (c) 2013 Kaltura */
'use strict';
var cl = function (val) {
  return console.log(val);
};
window.lang = 'en-US';
var KMCModule = angular.module('KMCModule', [
    'localization',
    'ngRoute',
    'KMC.controllers',
    'KMC.filters',
    'KMC.services',
    'KMC.directives',
    'ngAnimate',
    'LocalStorageModule',
    'KMC.menu'
  ]);
KMCModule.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',
  '$tooltipProvider',
  function ($routeProvider, $locationProvider, $httpProvider, $tooltipProvider) {
    $tooltipProvider.options({
      placement: 'right',
      'appendToBody': true,
      'popupDelay': 800
    });
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    var $http, interceptor = [
        '$q',
        '$injector',
        function ($q, $injector) {
          var notificationChannel;
          function success(response) {
            $http = $http || $injector.get('$http');
            if ($http.pendingRequests.length < 1) {
              notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
              notificationChannel.requestEnded();
            }
            return response;
          }
          function error(response) {
            $http = $http || $injector.get('$http');
            if ($http.pendingRequests.length < 1) {
              notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
              notificationChannel.requestEnded();
            }
            return $q.reject(response);
          }
          return function (promise) {
            notificationChannel = notificationChannel || $injector.get('requestNotificationChannel');
            notificationChannel.requestStarted();
            return promise.then(success, error);
          };
        }
      ];
    $httpProvider.responseInterceptors.push(interceptor);
    $locationProvider.html5Mode(true);
    $routeProvider.when('/login', {
      templateUrl: 'view/login.html',
      controller: 'LoginCtrl',
      resolve: {
        'apiService': [
          'apiService',
          function (apiService) {
            return apiService;
          }
        ],
        'localize': 'localize'
      }
    });
    $routeProvider.when('/list', {
      templateUrl: 'view/list.html',
      controller: 'PlayerListCtrl',
      resolve: {
        'apiService': [
          'apiService',
          'localStorageService',
          '$location',
          function (apiService, localStorageService, $location) {
            return ksCheck(apiService, localStorageService, $location);
          }
        ]
      }
    });
    var ksCheck = function (apiService, localStorageService, $location) {
      if (window.parent.kmc && window.parent.kmc.vars) {
        if (window.parent.kmc.vars.ks)
          localStorageService.add('ks', window.parent.kmc.vars.ks);
      }
      var ks = localStorageService.get('ks');
      if (!ks) {
        $location.path('/login');
        return false;
      } else {
        apiService.setKs(ks);
      }
      return apiService;
    };
    $routeProvider.when('/edit/:id', {
      templateUrl: 'view/edit.html',
      controller: 'PlayerEditCtrl',
      resolve: {
        'PlayerData': [
          'PlayerService',
          '$route',
          'apiService',
          'localStorageService',
          '$location',
          function (PlayerService, $route, apiService, localStorageService, $location) {
            ksCheck(apiService, localStorageService, $location);
            return PlayerService.getPlayer($route.current.params.id);
          }
        ],
        'editProperties': 'editableProperties',
        'menuSvc': 'menuSvc',
        'localize': 'localize',
        'userEntries': [
          'apiService',
          'localStorageService',
          '$location',
          function (apiService, localStorageService, $location) {
            ksCheck(apiService, localStorageService, $location);
            return apiService.listMedia();
          }
        ]
      }
    });
    $routeProvider.when('/newByTemplate', {
      templateUrl: 'view/new-template.html',
      controller: 'PlayerCreateCtrl',
      resolve: {
        'templates': [
          'playerTemplates',
          function (playerTemplates) {
            return playerTemplates.listSystem();
          }
        ],
        'userId': function () {
          return '1';
        }
      }
    });
    $routeProvider.when('/new', {
      templateUrl: 'view/edit.html',
      controller: 'PlayerEditCtrl',
      resolve: {
        'PlayerData': [
          'PlayerService',
          'apiService',
          'localStorageService',
          '$location',
          function (PlayerService, apiService, localStorageService, $location) {
            ksCheck(apiService, localStorageService, $location);
            return PlayerService.newPlayer();
          }
        ],
        'editProperties': 'editableProperties',
        'menuSvc': 'menuSvc',
        'localize': 'localize',
        'userEntries': [
          'apiService',
          'localStorageService',
          '$location',
          function (apiService, localStorageService, $location) {
            ksCheck(apiService, localStorageService, $location);
            return apiService.listMedia();
          }
        ]
      }
    });
    $routeProvider.when('/logout', {
      resolve: {
        'logout': [
          'localStorageService',
          'apiService',
          '$location',
          function (localStorageService, apiService, $location) {
            if (localStorageService.isSupported()) {
              localStorageService.clearAll();
            }
            apiService.unSetks();
            $location.path('/login');
          }
        ]
      }
    });
    $routeProvider.otherwise({
      resolve: {
        'res': [
          'apiService',
          'localStorageService',
          '$location',
          function (apiService, localStorageService, $location) {
            if (ksCheck(apiService, localStorageService, $location)) {
              return $location.path('/list');
            }
          }
        ]
      }
    });
  }
]);
;
'use strict';
var DirectivesModule = angular.module('KMC.directives', [
    'colorpicker.module',
    'ui.bootstrap',
    'ui.select2',
    'ui.sortable'
  ]);
DirectivesModule.directive('mcustomScrollbar', [
  '$timeout',
  function ($timeout) {
    return {
      priority: 0,
      restrict: 'AC',
      controller: [
        '$scope',
        '$element',
        '$attrs',
        function ($scope, $element, $attrs) {
          $scope.$on('layoutChange', function () {
            if ($scope.scroller)
              $timeout(function () {
                $scope.scroller.mCustomScrollbar('update');
              }, 500);
          });
        }
      ],
      link: function (scope, element, attr) {
        var options = scope.$eval(attr['mcustomScrollbar']);
        var opts = {
            horizontalScroll: false,
            mouseWheel: true,
            autoHideScrollbar: true,
            contentTouchScroll: true,
            theme: 'dark',
            advanced: {
              updateOnBrowserResize: true,
              updateOnContentResize: true
            }
          };
        angular.extend(opts, options);
        $timeout(function () {
          if (typeof $().mCustomScrollbar == 'function') {
            scope.scroller = element.mCustomScrollbar(opts);
          }
        }, 500);
      }
    };
  }
]);
DirectivesModule.directive('timeago', [function () {
    return {
      scope: { timestamp: '@' },
      restrict: 'CA',
      link: function (scope, iElement, iAttrs) {
        if (typeof $.timeago == 'function')
          scope.$watch('timestamp', function (newVal, oldVal) {
            if (newVal) {
              var date = scope.timestamp * 1000;
              iElement.text($.timeago(date));
            }
          });
      }
    };
  }]);
DirectivesModule.directive('modelRadio', [
  'menuSvc',
  function (menuSvc) {
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: 'template/formcontrols/modelRadio.html',
      scope: {
        'model': '=',
        'label': '@',
        'helpnote': '@'
      },
      controller: [
        '$scope',
        '$element',
        '$attrs',
        function ($scope, $element, $attrs) {
          var menuData = menuSvc.getControlData($attrs.model);
          $scope.options = menuData.options;
        }
      ],
      link: function (scope, element, attributes) {
        element.find('input').attr('name', scope.model);
      }
    };
  }
]);
DirectivesModule.directive('modelColor', function () {
  return {
    restrict: 'EA',
    replace: true,
    controller: [
      '$scope',
      '$element',
      '$attrs',
      function ($scope, $element, $attrs) {
        if (typeof $scope.model == 'undefined') {
          if ($attrs.initvalue)
            $scope.model = $attrs.initvalue;
          else
            $scope.model = '#fff';
        }
      }
    ],
    scope: {
      'class': '@',
      'label': '@',
      'helpnote': '@',
      'model': '='
    },
    templateUrl: 'template/formcontrols/modalColor.html'
  };
});
DirectivesModule.directive('modelText', function () {
  return {
    replace: true,
    restrict: 'EA',
    scope: {
      'label': '@',
      'model': '=',
      'icon': '@',
      'helpnote': '@'
    },
    compile: function (tElement, tAttr) {
      if (tAttr['endline'] == 'true') {
        tElement.append('<hr/>');
      }
    },
    templateUrl: 'template/formcontrols/modelText.html'
  };
});
DirectivesModule.directive('select2Data', [
  'menuSvc',
  function (menuSvc) {
    return {
      replace: true,
      restrict: 'EA',
      scope: {
        'label': '@',
        'model': '=',
        'icon': '@',
        'helpnote': '@',
        'initvalue': '@'
      },
      controller: [
        '$scope',
        '$element',
        '$attrs',
        function ($scope, $element, $attrs) {
          $scope.selectOpts = {};
          $scope.selectOpts['data'] = menuSvc.doAction($attrs.source);
          if ($attrs.query) {
            $scope.selectOpts['data'].results = [];
            $scope.selectOpts['query'] = menuSvc.getAction($attrs.query);
          }
          $scope.selectOpts['width'] = $attrs.width;
        }
      ],
      templateUrl: 'template/formcontrols/select2Data.html',
      compile: function (tElement, tAttr) {
        if (tAttr['endline'] == 'true') {
          tElement.append('<hr/>');
        }
        if (tAttr.showEntriesThumbs == 'true') {
          tElement.find('input').attr('list-entries-thumbs', 'true');
        }
        if (tAttr.placeholder)
          tElement.find('input').attr('data-placeholder', tAttr.placeholder);
        return function (scope, element) {
        };
      }
    };
  }
]);
DirectivesModule.directive('modelEdit', [
  '$modal',
  function ($modal) {
    var modalEditCntrl = [
        '$scope',
        function ($scope) {
          if (typeof $scope.model == 'undefined')
            $scope.model = '';
          $scope.modelValue = $scope.model;
        }
      ];
    return {
      replace: true,
      restrict: 'EA',
      scope: {
        'label': '@',
        'helpnote': '@',
        'model': '=',
        'icon': '@'
      },
      controller: modalEditCntrl,
      templateUrl: 'template/formcontrols/modelEdit.html',
      compile: function (tElement, tAttr) {
        if (tAttr['endline'] == 'true') {
          tElement.append('<hr/>');
        }
        return function (scope, element, attrs) {
          scope.doModal = function () {
            var modal = $modal.open({
                templateUrl: 'template/dialog/textarea.html',
                controller: 'ModalInstanceCtrl',
                resolve: {
                  settings: function () {
                    return {
                      'close': function (result, value) {
                        scope.model = value;
                        modal.close(result);
                      },
                      'title': attrs.label,
                      'message': scope.model
                    };
                  }
                }
              });
          };
        };
      }
    };
  }
]);
DirectivesModule.directive('modelTags', [
  'menuSvc',
  function (menuSvc) {
    return {
      replace: true,
      restrict: 'EA',
      scope: {
        'label': '@',
        'model': '=',
        'helpnote': '@',
        'icon': '@'
      },
      controller: [
        '$scope',
        '$element',
        '$attrs',
        function ($scope, $element, $attrs) {
          $scope.selectOpts = {
            simple_tags: true,
            'multiple': true,
            tokenSeparators: [
              ',',
              ' '
            ]
          };
          $scope.selectOpts['tags'] = menuSvc.doAction($attrs.source);
        }
      ],
      templateUrl: 'template/formcontrols/modelTags.html',
      compile: function (tElement, tAttr) {
        if (tAttr['endline'] == 'true') {
          tElement.append('<hr/>');
        }
        return function (scope, element) {
        };
      }
    };
  }
]);
DirectivesModule.directive('listEntriesThumbs', function () {
  return {
    restrict: 'A',
    controller: [
      '$scope',
      '$element',
      '$attrs',
      function ($scope, $element, $attrs) {
        if ($attrs.listEntriesThumbs == 'true') {
          var format = function (player) {
            if (!player.thumbnailUrl)
              return player.name;
            return '<img class=\'thumb\' src=\'' + player.thumbnailUrl + '\'/>' + player.name;
          };
          $scope.addOption({
            formatResult: format,
            formatSelection: format,
            escapeMarkup: function (m) {
              return m;
            }
          });
        }
      }
    ]
  };
});
DirectivesModule.directive('modelSelect', [
  'menuSvc',
  function (menuSvc) {
    return {
      replace: true,
      restrict: 'EA',
      require: '?parentContainer',
      scope: {
        label: '@',
        model: '=',
        initvalue: '@',
        helpnote: '@',
        selectOpts: '@'
      },
      compile: function (tElement, tAttr) {
        if (tAttr['endline'] == 'true') {
          tElement.append('<hr/>');
        }
        return function ($scope, $element, $attrs, controller) {
          if (controller) {
            var pubObj = {
                model: $attrs.model,
                label: $attrs.label.replace('Location', ''),
                sortVal: menuSvc.getControlData($attrs.model).sortVal
              };
            controller.register($scope.model, pubObj);
            $scope.$watch('model', function (newVal, oldVal) {
              if (newVal != oldVal)
                controller.update(newVal, oldVal, pubObj);
            });
          }
          var menuData = menuSvc.getControlData($attrs.model);
          $scope.options = menuData.options;
        };
      },
      controller: [
        '$scope',
        '$element',
        '$attrs',
        function ($scope, $element, $attrs) {
          if (!$scope.selectOpts) {
            $scope.selectOpts = {};
          }
          if (!$attrs.showSearch) {
            $scope.selectOpts.minimumResultsForSearch = -1;
          }
          $scope.options = [];
          $scope.checkSelection = function (value) {
            if (value == $scope.model)
              return true;
            else if (typeof value == 'number' && parseFloat($scope.model) == value) {
              return true;
            }
            return false;
          };
          $scope.initSelection = function () {
            if ($scope.model == '' || typeof $scope.model == 'undefined') {
              $scope.model = $attrs.initvalue;
            }
            return $scope.model;
          };
          $scope.selectOpts.initSelection = $scope.initSelection();
          $scope.uiselectOpts = angular.toJson($scope.selectOpts);
          this.setOptions = function (optsArr) {
            $scope.options = optsArr;
          };
        }
      ],
      templateUrl: 'template/formcontrols/modelSelect.html'
    };
  }
]);
DirectivesModule.directive('parentContainer', [
  'sortSvc',
  function (sortSvc) {
    return {
      restrict: 'A',
      controller: function () {
        var cntrl = {
            register: function (container, model) {
              sortSvc.register(container, model);
            },
            update: function (newVal, oldVal, model) {
              sortSvc.update(newVal, oldVal, model);
            }
          };
        return cntrl;
      }
    };
  }
]);
DirectivesModule.directive('sortOrder', [
  'sortSvc',
  function (sortSvc) {
    return {
      restrict: 'EA',
      replace: true,
      scope: {},
      templateUrl: 'template/formcontrols/sortOrder.html',
      controller: [
        '$scope',
        function ($scope) {
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
        }
      ],
      link: function (scope, element, attrs) {
      }
    };
  }
]);
DirectivesModule.directive('playerRefresh', [
  'PlayerService',
  'menuSvc',
  function (PlayerService, menuSvc) {
    return {
      restrict: 'A',
      link: function ($scope, $element, $attrs) {
        if ($attrs['playerRefresh'] != 'false') {
          var model = $attrs['model'];
          menuSvc.menuScope.$watch(model, function () {
            PlayerService.playerRefresh($attrs['playerRefresh']);
          });
        }
      }
    };
  }
]);
DirectivesModule.directive('infoAction', [
  'menuSvc',
  function (menuSvc) {
    return {
      restrict: 'EA',
      replace: 'true',
      controller: [
        '$scope',
        function ($scope) {
          $scope.check = function (action) {
            return menuSvc.checkAction(action);
          };
          $scope.btnAction = function (action) {
            menuSvc.doAction(action);
          };
        }
      ],
      scope: {
        'model': '=',
        'btnLabel': '@',
        'btnClass': '@',
        'action': '@',
        'helpnote': '@',
        'label': '@'
      },
      templateUrl: 'template/formcontrols/infoAction.html'
    };
  }
]);
DirectivesModule.directive('prettyCheckbox', function () {
  return {
    restrict: 'AC',
    require: 'ngModel',
    transclude: 'element',
    compile: function (tElement, tAttrs, transclude) {
      return function (scope, $element, iAttr, ngController) {
        var wrapper = angular.element('<div class="prettycheckbox"></div>');
        var clickHandler = wrapper.append('<a href="#" class=""></a>');
        transclude(scope, function (clone) {
          return $element.replaceWith(wrapper).append(clone);
        });
        var input = wrapper.find('input').hide();
        var watchProp = iAttr['model'] || 'model';
        wrapper.on('click', 'a', function (e) {
          e.preventDefault();
          ngController.$setViewValue(!ngController.$viewValue);
          return false;
        });
        var formatter = function () {
          if (ngController.$viewValue)
            $(wrapper).find('a').addClass('checked');
          else
            $(wrapper).find('a').removeClass('checked');
        };
        ngController.$viewChangeListeners.push(formatter);
        if (scope.$eval(watchProp)) {
          clickHandler.find('a').addClass('checked');
        }
      };
    }
  };
});
DirectivesModule.directive('prettyRadio', function () {
  return {
    restrict: 'AC',
    priority: 1000,
    transclude: 'element',
    compile: function (tElement, tAttrs, transclude) {
      return function (scope, iElement, iAttr) {
        var wrapper = angular.element('<span class="clearfix prettyradio"></span>');
        var clickHandler = wrapper.append('<a href="#" class=""></a>');
        var watchProp = 'model';
        if (typeof iAttr['model'] != 'undefined') {
          watchProp = iAttr['model'];
        }
        transclude(scope, function (clone) {
          return wrapper.append(clone);
        });
        iElement.replaceWith(wrapper);
        var input = wrapper.find('input').hide();
        clickHandler.on('click', 'a', function (e) {
          e.preventDefault();
          input.trigger('click');
          input.trigger('click');
          return false;
        });
        scope.$watch(function () {
          return scope.$eval(watchProp) == input.val();
        }, function (newVal, oldVal) {
          if (newVal != oldVal)
            $(wrapper).find('a').toggleClass('checked');
        });
      };
    }
  };
});
DirectivesModule.directive('modelCheckbox', function () {
  return {
    restrict: 'EA',
    templateUrl: 'template/formcontrols/modelCheckbox.html',
    replace: true,
    controller: [
      '$scope',
      '$element',
      '$attrs',
      function ($scope, $element, $attrs) {
        if ($scope.model == '' || typeof $scope.model == 'undefined') {
          if ($attrs.initvalue === 'true')
            $scope.model = true;
        }
      }
    ],
    scope: {
      label: '@',
      helpnote: '@',
      model: '='
    }
  };
});
DirectivesModule.directive('readOnly', [
  '$filter',
  function ($filter) {
    return {
      restrict: 'EA',
      replace: 'true',
      scope: {
        model: '=',
        label: '@',
        helpnote: '@'
      },
      controller: [
        '$scope',
        '$element',
        '$attrs',
        function ($scope, $element, $attrs) {
          if ($attrs['filter']) {
            if (typeof $filter($attrs['filter']) == 'function')
              $scope.model = $filter($attrs['filter'])($scope.model);
          }
          if ($attrs['initvalue']) {
            if (typeof $scope.model == 'undefined' || scope.model == '')
              $scope.model = $attrs['initvalue'];
          }
        }
      ],
      templateUrl: 'template/formcontrols/readOnly.html'
    };
  }
]);
DirectivesModule.directive('modelButton', [
  'menuSvc',
  function (menuSvc) {
    return {
      restrict: 'EA',
      replace: 'true',
      controller: [
        '$scope',
        function ($scope) {
          $scope.check = function (action) {
            return menuSvc.checkAction(action);
          };
          $scope.btnAction = function (action) {
            menuSvc.doAction(action);
          };
        }
      ],
      scope: {
        'label': '@',
        'action': '@',
        'btnClass': '@',
        helpnote: '@'
      },
      templateUrl: 'template/formcontrols/modelButton.html'
    };
  }
]);
DirectivesModule.directive('modelNumber', function () {
  return {
    templateUrl: 'template/formcontrols/spinEdit.html',
    replace: true,
    restrict: 'EA',
    scope: {
      model: '=',
      helpnote: '@',
      label: '@'
    },
    link: function ($scope, $element, $attrs) {
      var $spinner = $element.find('input').spinedit({
          minimum: parseFloat($attrs.from),
          maximum: parseFloat($attrs.to),
          step: parseFloat($attrs.stepsize),
          value: parseFloat($attrs.initvalue),
          numberOfDecimals: parseFloat($attrs.numberofdecimals)
        });
      $spinner.on('valueChanged', function (e) {
        if (typeof e.value == 'number') {
          $scope.$apply(function () {
            $scope.model = e.value;
          });
        }
      });
    },
    controller: [
      '$scope',
      '$element',
      '$attrs',
      function ($scope, $element, $attrs) {
        var def = {
            from: 5,
            to: 10,
            stepsize: 1,
            numberOfDecimals: 0
          };
        var keys = [
            'from',
            'to',
            'stepsize',
            'numberofdecimals'
          ];
        angular.forEach(keys, function (keyName) {
          if (!$attrs[keyName])
            $scope[keyName] = def[keyName];
          else
            $scope[keyName] = $attrs[keyName];
        });
        if (typeof $scope.model != 'undefined') {
          $scope.initvalue = $scope.model;
        } else {
          if (!$attrs['default'])
            $scope.initvalue = 1;
          else
            $scope.initvalue = $attrs['default'];
        }
      }
    ]
  };
});
DirectivesModule.directive('onFinishRender', [
  '$timeout',
  'requestNotificationChannel',
  function ($timeout, requestNotificationChannel) {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        if (scope.$last === true) {
          $timeout(function () {
            requestNotificationChannel.requestEnded('list');
          });
        }
      }
    };
  }
]);
'use strict';
angular.module('KMC.filters', ['ngSanitize']).filter('HTMLunsafe', [
  '$sce',
  function ($sce) {
    return function (val) {
      return $sce.trustAsHtml(val);
    };
  }
]).filter('timeago', function () {
  return function (input) {
    if (typeof $.timeago == 'function') {
      var date = input * 1000;
      return $.timeago(date);
    }
  };
}).filter('range', function () {
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
      start = +start;
      return input.slice(start);
    }
    return [];
  };
});
'use strict';
var KMCMenu = angular.module('KMC.menu', []);
KMCMenu.controller('menuCntrl', [
  'menuSvc',
  '$scope',
  function (menuSvc, $scope) {
    var getWidth = function () {
      return $('#mp-menu').width();
    };
    var closeMenu = function () {
      var width = getWidth();
      $('#mp-pusher').animate({ 'left': '0' }, {
        duration: 200,
        queue: true
      });
      $('#mp-menu').animate({ 'left': '-' + width });
      $('#mp-pusher >.wrapper').animate({ 'width': '100%' });
    };
    var resetMenu = function () {
      var width = getWidth();
      $('#mp-pusher').css({ 'left': width });
      $('#mp-menu').css({ 'left': -width });
    };
    var openMenu = function () {
      var width = getWidth();
      $('#mp-pusher').animate({ 'left': width }, {
        duration: 200,
        queue: true
      });
      $('#mp-menu').animate({ 'left': -width }, {
        duration: 200,
        queue: false
      });
      $('#mp-pusher >.wrapper').animate({ 'width': '70%' }, {
        duration: 200,
        queue: true
      });
    };
    $scope.menuShown = true;
    resetMenu();
    $(window).resize(function () {
      if ($scope.menuShown == true)
        resetMenu();
      else {
        closeMenu();
      }
    });
    $scope.$on('menuChange', function () {
      $scope.menuShown = true;
    });
    $scope.$watch(function () {
      return menuSvc.currentPage;
    }, function (newVal, oldVal) {
      if (newVal != oldVal) {
        if (!$scope.menuShown) {
          $scope.menuShown = true;
        }
      }
    });
    $scope.togglemenu = function (e) {
      $scope.menuShown = !$scope.menuShown;
      if (!$scope.menuShown)
        $(e.target).parent().css('transform', 'rotate(180deg)');
      else
        $(e.target).parent().css('transform', '');
    };
    $scope.$watch('menuShown', function (newVal, oldVal) {
      if (newVal != oldVal) {
        if (newVal) {
          openMenu();
        } else {
          closeMenu();
        }
      }
    });
  }
]);
KMCMenu.factory('menuSvc', [
  'editableProperties',
  function (editableProperties) {
    var menudata = null;
    var promise = editableProperties.success(function (data) {
        menudata = data;
      });
    var JSON2directiveDictionary = function (jsonName) {
      switch (jsonName) {
      case 'modaledit':
        return '<div model-edit/>';
        break;
      case 'tags':
        return '<div model-tags/>';
        break;
      case 'select2data':
        return '<div select2-data/>';
        break;
      case 'dropdown':
        return '<div model-select/>';
        break;
      case 'container':
        return '<div model-select parent-container=""/>';
        break;
      case 'checkbox':
        return '<div model-checkbox/>';
        break;
      case 'color':
        return '<div model-color/>';
        break;
      case 'text':
        return '<div model-text/>';
        break;
      case 'number':
        return '<div model-number/>';
        break;
      case 'readonly':
        return '<div read-only/>';
        break;
      case 'featuremenu':
        return '<div feature-menu/>';
        break;
      case 'radio':
        return '<div model-radio/>';
        break;
      case 'button':
        return '<div model-button/>';
        break;
      case 'infoAction':
        return '<div info-action/>';
        break;
      case 'sortOrder':
        return '<div sort-order/>';
        break;
      }
    };
    var searchGet = function (obj, target) {
      if (typeof obj[target] != 'undefined') {
        return obj[target];
      }
    };
    var search = function (path, obj, target) {
      for (var k in obj) {
        if (obj.hasOwnProperty(k) && (k == 'label' || k == 'children' || typeof obj[k] == 'object'))
          if (obj[k] == target)
            return path + '[\'' + k + '\']';
          else if (typeof obj[k] == 'object' || typeof obj[k] == 'Array') {
            var result = search(path + '[\'' + k + '\']', obj[k], target);
            if (result)
              return result;
          }
      }
      return false;
    };
    var Search4ControlModelData = function (path, obj, target) {
      for (var k in obj) {
        if (obj.hasOwnProperty(k) && (k == 'label' || k == 'children' || typeof obj[k] == 'object'))
          if (typeof obj[k].model != 'undefined' && obj[k].model == target)
            return obj[k];
          else if (typeof obj[k] === 'object') {
            var result = Search4ControlModelData(path + '[\'' + k + '\']', obj[k], target);
            if (result)
              return result;
          }
      }
      return false;
    };
    var menuSvc = {
        promise: promise,
        menuScope: {},
        get: function () {
          return menudata;
        },
        getModalData: function (model) {
          return searchGet(menuSvc.menuScope, model);
        },
        getControlData: function (model) {
          var modelStr = model.substr(model.indexOf('.') + 1);
          return Search4ControlModelData('', menudata, modelStr);
        },
        currentPage: '',
        setMenu: function (setTo) {
          menuSvc.currentPage = setTo;
          menuSvc.menuScope.$parent.$broadcast('menuChange', setTo);
        },
        buildMenu: function (baseData) {
          var menuJsonObj = menuSvc.get();
          var menuElm = angular.element('<ul></ul>');
          angular.forEach(menuJsonObj, function (value) {
            menuElm.append(menuSvc.buildMenuItem(value, menuElm, baseData));
          });
          return menuElm;
        },
        buildMenuItem: function (item, targetMenu, BaseData, parentModel) {
          var elm = '';
          switch (item.type) {
          case 'menu':
            var menuLevelObj = angular.element('<div menu-level pagename="' + item.model + '" />');
            if (typeof parentModel != 'undefined') {
              menuLevelObj.attr('parent-label', parentModel.label);
              menuLevelObj.attr('parent-page', parentModel.model);
            }
            var parentMenu = writeFormElement(item, menuLevelObj);
            elm = writeChildren(item, parentMenu, true);
            break;
          case 'featuremenu':
            elm = writeChildren(item, writeFormElement(item, '<div feature-menu/>'));
            break;
          default:
            var directive = JSON2directiveDictionary(item.type);
            if (directive)
              elm = writeFormElement(item, directive);
            break;
          }
          return elm;
          function writeChildren(item, parent, eachInLi) {
            for (var j = 0; j < item.children.length; j++) {
              var subitem = item.children[j];
              switch (subitem.type) {
              case 'menu':
                parent.append(menuSvc.buildMenuItem(subitem, parent, item.model, item));
                break;
              case 'featuremenu':
                parent.append(writeChildren(subitem, writeFormElement(subitem, '<div feature-menu/>')));
                break;
              default:
                var directive = JSON2directiveDictionary(subitem.type);
                if (directive)
                  parent.append(writeFormElement(subitem, directive));
                break;
              }
            }
            if (eachInLi == true) {
              parent.children().each(function () {
                if (!$(this).is('menu-level'))
                  $(this).wrap('<li>');
              });
            }
            return parent;
          }
          function writeFormElement(item, directive) {
            var elm = angular.element(directive);
            elm.attr('model', 'data.' + item.model);
            angular.forEach(item, function (value, key) {
              if (key != 'model' && (typeof value == 'string' || typeof value == 'number' || typeof value == 'boolean')) {
                elm.attr(key, value);
              }
            });
            return elm;
          }
        },
        menuSearch: function (searchValue) {
          var foundLabel = search('menudata', menudata, searchValue);
          if (foundLabel) {
            var foundModel = eval(foundLabel.substr(0, foundLabel.lastIndexOf('[\'label\']'))).model;
            var lastChild = foundLabel.lastIndexOf('[\'children\']');
            var lastMenu = foundLabel.substr(0, lastChild);
            var menuPage = eval(lastMenu);
            var featureMenu = [];
            if (typeof menuPage == 'object') {
              if (menuPage.type == 'featuremenu') {
                while (typeof menuPage == 'object' && menuPage.type == 'featuremenu') {
                  featureMenu.push(menuPage);
                  lastChild = lastMenu.lastIndexOf('[\'children\']');
                  menuPage = eval(lastMenu.substr(0, lastChild));
                  lastMenu = foundLabel.substr(0, lastChild);
                }
              }
              menuSvc.menuScope.$broadcast('highlight', foundModel);
              menuSvc.setMenu(menuPage.model);
              if (featureMenu.length) {
                angular.forEach(featureMenu, function (value) {
                  menuSvc.menuScope.$broadcast('openFeature', value.model);
                });
              }
              return true;
            }
          } else {
            return false;
          }
        },
        actions: [],
        registerAction: function (callStr, dataFn, context) {
          if (typeof dataFn == 'function') {
            if (!context)
              menuSvc.actions[callStr] = dataFn;
            else {
              menuSvc.actions[callStr] = {
                applyOn: context,
                funcData: dataFn
              };
            }
          } else if (typeof dataFn == 'object') {
            menuSvc.actions[callStr] = {
              applyOn: dataFn,
              funcData: function () {
                return dataFn;
              }
            };
          }
        },
        doAction: function (action, arg) {
          if (typeof menuSvc.actions[action] == 'function') {
            return menuSvc.actions[action].call(arg);
          } else if (typeof menuSvc.actions[action] == 'object' && typeof menuSvc.actions[action].funcData == 'function') {
            var retData = menuSvc.actions[action].funcData.apply(menuSvc.actions[action].applyOn, arg);
            return retData;
          }
        },
        getAction: function (action) {
          return menuSvc.actions[action];
        },
        checkAction: function (action) {
          if (typeof menuSvc.actions[action] == 'function') {
            return true;
          }
          return false;
        }
      };
    return menuSvc;
  }
]).directive('featureMenu', [
  '$parse',
  function ($parse) {
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: 'template/menu/featureMenu.html',
      transclude: true,
      controller: [
        '$scope',
        '$element',
        '$attrs',
        function ($scope, $element, $attrs) {
          $scope.label = $attrs['label'];
          $scope.helpnote = $attrs['helpnote'];
          $scope.featureCheckbox = $attrs.featureCheckbox == 'false' ? false : true;
          if ($scope.featureCheckbox) {
            $scope.modelPath = $attrs['model'] + '._featureEnabled';
            $scope.featureModelCon = $parse($scope.modelPath);
            $scope.featureModel = $scope.featureModelCon($scope);
          }
          $scope.id = $attrs['model'].replace(/\./g, '_');
        }
      ],
      scope: true,
      compile: function (tElement, tAttr, transclude) {
        if (tAttr['endline'] != 'false') {
          tElement.append('<hr/>');
        }
        return function (scope, element, attributes) {
          scope.$watch('featureModel', function (newVal, oldVal) {
            if (newVal != oldVal) {
              scope.featureModelCon.assign(scope, newVal);
              if (newVal) {
                if (element.find('.collapse').length > 0)
                  element.find('#' + scope.id).collapse('toggle');
              }
            }
          });
          transclude(scope, function (clone) {
            element.find('ng-transclude').replaceWith(clone);
          });
          element.on('show.bs.collapse hide.bs.collapse', function (e) {
            if (e.target.id == scope.id)
              $(this).find('.header:first i.glyphicon').toggleClass('rotate90');
          });
          scope.$on('openFeature', function (e, args) {
            if (args == attributes['highlight']) {
              element.find('#' + scope.id).collapse('show');
            }
          });
        };
      }
    };
  }
]).directive('model', [
  '$timeout',
  function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, iElem, iAttr) {
        scope.$on('highlight', function (e, data) {
          if (iAttr.model.replace('data.', '') == data) {
            var elm = iElem;
            if (iElem.parent().is('li'))
              elm = iElem.parent();
            var originalBG = elm.css('background') || 'transparent';
            elm.css({ 'backgroundColor': 'rgba(253,255,187,1)' });
            $timeout(function () {
              elm.animate({ 'backgroundColor': 'rgba(253,255,187,0)' }, 1000, function () {
                elm.css({ 'backgroundColor': originalBG }, 1000);
              });
            }, 4000);
          }
        });
      }
    };
  }
]).directive('navmenu', [
  'menuSvc',
  '$compile',
  '$timeout',
  function (menuSvc, $compile, $timeout) {
    return {
      templateUrl: 'template/menu/navmenu.html',
      replace: true,
      restrict: 'EA',
      scope: { 'data': '=' },
      transclude: true,
      compile: function (tElement, tAttrs, transclude) {
        var menuElem = tElement.find('ul[ng-transclude]:first');
        var menuData = menuSvc.buildMenu('data');
        return function ($scope, $element) {
          $compile(menuData.contents())($scope, function (clone) {
            menuElem.prepend(clone);
          });
          $scope.$on('menuChange', function (e, page) {
            $element.find('.mCustomScrollbar').mCustomScrollbar('destroy');
            if (page != 'search')
              $timeout(function () {
                $element.find('.mp-level-open:last').mCustomScrollbar({ set_height: '100%' });
              }, 500);
          });
          $timeout(function () {
            menuSvc.setMenu('basicDisplay');
          }, 500);
        };
      },
      controller: [
        '$scope',
        '$element',
        function ($scope, $element) {
          $element.on('shown.bs.collapse hidden.bs.collapse', function (e) {
            $('.mCustomScrollbar').mCustomScrollbar('update');
          });
          menuSvc.menuScope = $scope;
        }
      ]
    };
  }
]).controller('menuSearchCtl', [
  '$scope',
  'menuSvc',
  function ($scope, menuSvc) {
    var menuObj = menuSvc.get();
    $scope.menuData = [];
    $scope.checkSearch = function (val) {
      if (val)
        console.log(val);
      $scope.notFound = false;
      if ($scope.menuSearch) {
        $scope.searchMenuFn();
      }
    };
    $scope.menuSearch = '';
    $scope.searchMenuFn = function () {
      var searchResult = menuSvc.menuSearch($scope.menuSearch);
      if (!searchResult)
        $scope.notFound = true;
      else {
        $scope.menuSearch = '';
      }
    };
    var getLabels = function (obj) {
      angular.forEach(obj, function (value, key) {
        $scope.menuData.push(value.label);
        if (value.children) {
          getLabels(value.children);
        }
      });
    };
    getLabels(menuObj);
  }
]).directive('menuLevel', [
  'menuSvc',
  function (menuSvc) {
    return {
      templateUrl: 'template/menu/menuPage.html',
      replace: true,
      transclude: 'true',
      restrict: 'EA',
      controller: [
        '$scope',
        '$element',
        '$attrs',
        function ($scope, $element, $attrs) {
          $scope.selfOpenLevel = function () {
            menuSvc.setMenu($attrs.pagename);
          };
          $scope.goBack = function () {
            menuSvc.setMenu($attrs.parentPage);
          };
          $scope.openLevel = function (arg) {
            if (typeof arg == 'undefined')
              return $scope.isOnTop = true;
            else if (arg == $scope.pagename) {
              return $scope.isOnTop = true;
            }
            return $scope.isOnTop = false;
          };
          $scope.isOnTop = false;
        }
      ],
      compile: function (tElement, tAttr) {
        if (tAttr['endline'] == 'true') {
          tElement.find('div.menu-level-trigger').append('<hr/>');
        }
        return function ($scope, $element) {
          $scope.$on('menuChange', function (event, arg) {
            $scope.openLevel(arg);
          });
          $scope.$watch('isOnTop', function (newVal) {
            if (newVal) {
              $element.parents('.mp-level:not("#mp-base")').addClass('mp-level-in-stack');
              $element.children('.mp-level:first').addClass('mp-level-open').removeClass('mp-level-in-stack');
            } else {
              $element.children('.mp-level:first').removeClass('mp-level-open');
              $element.parents('.mp-level.mp-level-in-stack:not("#mp-base")').removeClass('mp-level-open mp-level-in-stack');
            }
          });
        };
      },
      scope: {
        'label': '@',
        'pagename': '@',
        'parentPage': '@',
        'parentLabel': '@',
        'description': '@'
      }
    };
  }
]).directive('menuHead', [
  'menuSvc',
  function (menuSvc) {
    return {
      restrict: 'EA',
      template: '<div id=\'mp-mainlevel\'><ul>' + '</ul></div>',
      replace: true,
      transclude: true,
      scope: {},
      controller: [
        '$scope',
        '$element',
        function ($scope, $element) {
          $scope.changeActiveItem = function (element) {
            var menuitem = $(element);
            if (menuitem.length && menuitem.is('a') && menuitem.parent('li')) {
              $(menuitem).addClass('active');
              $(menuitem).parent('li').siblings('li').find('a').removeClass('active');
            }
          };
        }
      ],
      compile: function (tElement, attr, transclude) {
        var ul = tElement.find('ul');
        var elements = menuSvc.get();
        angular.forEach(elements, function (value, key) {
          var elm = angular.element('<li></li>');
          elm.html('<a menupage="' + value.model + '" class="icon icon-' + value.icon + '" tooltip-placement="right" tooltip="' + value.label + '"></a>');
          if (key == 0)
            elm.find('a').addClass('active');
          elm.appendTo(ul);
        });
        return function ($scope, $element) {
          transclude($scope, function (transItem) {
            ul.prepend(transItem);
          });
          $element.find('a[menupage]').each(function () {
            $(this).click(function () {
              var model = $(this).attr('menupage');
              menuSvc.setMenu(model);
              $scope.changeActiveItem(this);
            });
          });
        };
      }
    };
  }
]);
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
'use strict';
angular.module('KMC.controllers', []).controller('ModalInstanceCtrl', [
  '$scope',
  '$modalInstance',
  'settings',
  function ($scope, $modalInstance, settings) {
    $scope.title = '';
    $scope.message = '';
    $scope.buttons = [
      {
        result: false,
        label: 'Cancel',
        cssClass: 'btn-default'
      },
      {
        result: true,
        label: 'OK',
        cssClass: 'btn-primary'
      }
    ];
    $scope.close = function (result) {
      $modalInstance.close(result);
    };
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
    angular.extend($scope, settings);
  }
]);
;
'use strict';
KMCModule.controller('PlayerCreateCtrl', [
  '$scope',
  '$filter',
  'templates',
  'userId',
  'playerTemplates',
  function ($scope, $filter, templates, userId, playerTemplates) {
    $scope.title = $filter('i18n')('New player - from template');
    $scope.templates = templates.data;
    $scope.templateType = 'system';
    $scope.userId = userId;
    $scope.loading = false;
    $scope.$watch('templateType', function (newVal, oldVal) {
      if (newVal != oldVal) {
        if (newVal == 'user') {
          $scope.loading = true;
          playerTemplates.listUser($scope.userID).success(function (response) {
            $scope.templates = response;
            $scope.loading = false;
          });
        } else {
          $scope.loading = true;
          $scope.templates = templates.data;
          ;
          $scope.loading = false;
        }
      }
    });
    $scope.makeTooltip = function (index) {
      var item = $scope.templates[index];
      if (item && typeof item.settings != 'undefined' && typeof item.settings.name != 'undefined')
        return item.settings.name + '<br/>' + item.id + '<br/> Any information you will decide to show';
    };
  }
]);
;
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
'use strict';
KMCModule.controller('PlayerListCtrl', [
  'apiService',
  '$location',
  '$rootScope',
  '$scope',
  '$filter',
  '$modal',
  '$timeout',
  '$log',
  '$compile',
  '$window',
  'localStorageService',
  'requestNotificationChannel',
  'PlayerService',
  function (apiService, $location, $rootScope, $scope, $filter, $modal, $timeout, $log, $compile, $window, localStorageService, requestNotificationChannel, PlayerService) {
    requestNotificationChannel.requestStarted('list');
    $rootScope.lang = 'en-US';
    $scope.search = '';
    $scope.searchSelect2Options = {};
    $scope.currentPage = 1;
    $scope.maxSize = 5;
    var request = {
        'filter:tagsMultiLikeOr': 'studio_v2',
        'filter:orderBy': '-updatedAt',
        'filter:objTypeEqual': '16',
        'filter:objectType': 'KalturaUiConfFilter',
        'filter:creationModeEqual': '3',
        'ignoreNull': '1',
        'page:objectType': 'KalturaFilterPager',
        'pager:pageIndex': '1',
        'pager:pageSize': '25',
        'service': 'uiConf',
        'action': 'list'
      };
    apiService.doRequest(request).then(function (data) {
      if (data.objects && data.objects.length == 1) {
        $scope.UIConf = angular.fromJson(data.objects[0].config);
        console.log('got version ' + $scope.UIConf.version);
      } else {
        $log.error('Error retrieving studio UICONF');
      }
    });
    var request = {
        'filter:tagsMultiLikeOr': 'kdp3',
        'filter:orderBy': '-updatedAt',
        'filter:objTypeEqual': '1',
        'filter:objectType': 'KalturaUiConfFilter',
        'filter:creationModeEqual': '2',
        'ignoreNull': '1',
        'page:objectType': 'KalturaFilterPager',
        'pager:pageIndex': '1',
        'pager:pageSize': '999',
        'service': 'uiConf',
        'action': 'list'
      };
    apiService.doRequest(request).then(function (data) {
      $scope.data = data.objects;
      $scope.calculateTotalItems();
      PlayerService.cachePlayers(data.objects);
    });
    $scope.filtered = $filter('filter')($scope.data, $scope.search) || [];
    $scope.requiredVersion = PlayerService.getRequiredVersion();
    $scope.calculateTotalItems = function () {
      if ($scope.filtered)
        $scope.totalItems = $scope.filtered.length;
      else if ($scope.data) {
        $scope.totalItems = $scope.data.length;
        return $scope.totalItems;
      }
    };
    $scope.checkVersionNeedsUpgrade = function (itemVersion) {
      if (!itemVersion) {
        return false;
      }
      itemVersion = itemVersion.replace(/\./g, '');
      if (itemVersion >= $scope.requiredVersion)
        return false;
      else
        return true;
    };
    $scope.showSubTitle = true;
    $scope.getThumbnail = function (item) {
      if (typeof item.thumbnailUrl != 'undefined')
        return item.thumbnailUrl;
      else
        return $scope.defaultThumbnailUrl;
    };
    $scope.defaultThumbnailUrl = 'img/mockPlayerThumb.png';
    $scope.$watch('search', function (newValue, oldValue) {
      $scope.showSubTitle = newValue;
      if (newValue.length > 0) {
        $scope.title = $filter('i18n')('search for') + ' "' + newValue + '"';
      } else {
        if (oldValue)
          $scope.title = $filter('i18n')('Players list');
      }
      $timeout(function () {
        $scope.calculateTotalItems();
      }, 100);
    });
    $scope.oldVersionEditText = $filter('i18n')('Warning this player is out of date. \n' + 'Saving changes to this player upgrade, some features and \n' + 'design may be lost. (read more about upgrading players)');
    $scope.goToEditPage = function (item, $event) {
      $event.preventDefault();
      if (!$scope.checkVersionNeedsUpgrade(item.version)) {
        $location.path('/edit/' + item.id);
        return false;
      } else {
        var msgText = $scope.oldVersionEditText;
        var modal = $modal.open({
            templateUrl: 'template/dialog/message.html',
            controller: 'ModalInstanceCtrl',
            resolve: {
              settings: function () {
                return {
                  'title': 'Edit confirmation',
                  'message': msgText
                };
              }
            }
          });
        modal.result.then(function (result) {
          if (result) {
            return $location.url('edit/' + item.id);
          }
        }, function () {
          return $log.info('edit when outdated modal dismissed at: ' + new Date());
        });
      }
    };
    $scope.newPlayer = function () {
      $location.path('/new');
    };
    $scope.duplicate = function (item) {
      var newclone = PlayerService.clonePlayer(item);
      newclone.then(function (data) {
        $location.url('edit/' + data[1].id);
      });
    };
    $scope.deletePlayer = function (item) {
      var modal = $modal.open({
          templateUrl: 'template/dialog/message.html',
          controller: 'ModalInstanceCtrl',
          resolve: {
            settings: function () {
              return {
                'title': 'Delete confirmation',
                'message': 'Are you sure you want to delete the player?'
              };
            }
          }
        });
      modal.result.then(function (result) {
        if (result)
          PlayerService.deletePlayer(item.id).then(function () {
            $scope.data.splice($scope.data.indexOf(item), 1);
          }, function (reason) {
            $modal.open({
              templateUrl: 'template/dialog/message.html',
              controller: 'ModalInstanceCtrl',
              resolve: {
                settings: function () {
                  return {
                    'title': 'Delete failure',
                    'message': reason
                  };
                }
              }
            });
          });
      }, function () {
        $log.info('Delete modal dismissed at: ' + new Date());
      });
    };
    $scope.update = function (player) {
      PlayerService.playerUpdate(player);
    };
  }
]);
;
'use strict';
var KMCServices = angular.module('KMC.services', []);
KMCServices.config([
  '$httpProvider',
  function ($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  }
]);
KMCServices.factory('playerCache', [
  '$cacheFactory',
  function ($cacheFactory) {
    return $cacheFactory('playerCache', { capacity: 10 });
  }
]);
KMCServices.factory('sortSvc', [function () {
    var containers = {};
    var sorter = {};
    var Container = function Container(name) {
      this.name = name;
      this.elements = [];
      containers[name] = this;
    };
    Container.prototype.addElement = function (model) {
      this.elements.push(model);
    };
    Container.prototype.callObjectsUpdate = function () {
      angular.forEach(this.elements, function (model) {
        cl(model.sortVal + ' ' + model.model);
      });
    };
    Container.prototype.removeElement = function (model) {
      var index = this.elements.indexOf(model);
      if (index != -1)
        this.elements.splice(index, 1);
    };
    sorter.sortScope = '';
    sorter.register = function (containerName, model) {
      var container = typeof containers[containerName] == 'undefined' ? new Container(containerName) : containers[containerName];
      container.addElement(model);
    };
    sorter.update = function (newVal, oldVal, model) {
      var oldContainer = containers[oldVal];
      var newContainer = !containers[newVal] ? new Container(newVal) : containers[newVal];
      if (oldContainer) {
        oldContainer.removeElement(model);
      }
      newContainer.addElement(model);
      if (typeof sorter.sortScope == 'object') {
        sorter.sortScope.$broadcast('sortContainersChanged');
      }
    };
    sorter.getObjects = function () {
      return containers;
    };
    sorter.saveOrder = function (containersObj) {
      containers = containersObj;
      angular.forEach(containers, function (container) {
        container.callObjectsUpdate();
      });
    };
    return sorter;
  }]);
KMCServices.factory('PlayerService', [
  '$http',
  '$modal',
  '$log',
  '$q',
  'apiService',
  '$filter',
  function ($http, $modal, $log, $q, apiService, $filter) {
    var playersCache = [];
    var currentPlayer = {};
    var previewEntry = '0_ji4qh61l';
    var playersService = {
        'setPreviewEntry': function (id) {
          previewEntry = id;
        },
        'renderPlayer': function () {
          if (currentPlayer && typeof kWidget != 'undefined') {
            var flashvars = $('html').hasClass('IE8') ? { 'wmode': 'transparent' } : {};
            kWidget.embed({
              'targetId': 'kVideoTarget',
              'wid': '_' + currentPlayer.partnerId,
              'uiconf_id': currentPlayer.id,
              'flashvars': flashvars,
              'entry_id': previewEntry
            });
          }
        },
        playerRefresh: function (option) {
          if (option == 'aspectToggle') {
            $('#spacer').toggleClass('narrow');
          }
          playersService.renderPlayer();
        },
        newPlayer: function () {
          var deferred = $q.defer();
          var request = {
              'service': 'uiConf',
              'action': 'add',
              'uiConf:objectType': 'KalturaUiConf',
              'uiConf:objType': 1,
              'uiConf:creationMode': 2
            };
          apiService.doRequest(request).then(function (data) {
            deferred.resolve(data);
          }, function (reason) {
            deferred.reject(reason);
          });
          return deferred.promise;
        },
        clonePlayer: function (srcUi) {
          var deferred = $q.defer();
          var request = {
              service: 'multirequest',
              'action': null,
              '1:service': 'uiconf',
              '1:action': 'clone',
              '1:id': srcUi.id,
              '2:service': 'uiconf',
              '2:action': 'update',
              '2:id': '{1:result:id}',
              '2:uiConf:name': 'Copy of ' + srcUi.name,
              '2:uiConf:objectType': 'KalturaUiConf'
            };
          apiService.doRequest(request).then(function (data) {
            deferred.resolve(data);
          }, function (reason) {
            deferred.reject(reason);
          });
          return deferred.promise;
        },
        'getPlayer': function (id) {
          var cache = false;
          var deferred = $q.defer();
          if (typeof currentPlayer.id != 'undefined') {
            if (currentPlayer.id == id || id == 'currentEdit') {
              deferred.resolve(currentPlayer);
              cache = true;
            }
          }
          if (!cache) {
            for (var i = 0; i < playersCache.length; i++)
              if (playersCache[i].id == id) {
                deferred.resolve(playersCache[i]);
                currentPlayer = playersCache[i];
                cache = true;
              }
          }
          if (!cache) {
            var request = {
                'service': 'uiConf',
                'action': 'get',
                'id': id
              };
            apiService.doRequest(request).then(function (result) {
              deferred.resolve(result);
              currentPlayer = result;
            });
          }
          return deferred.promise;
        },
        cachePlayers: function (playersList) {
          if ($.isArray(playersList))
            playersCache = playersCache.concat(playersList);
          else
            playersCache.push(playersList);
        },
        'deletePlayer': function (id) {
          var deferred = $q.defer();
          var rejectText = $filter('i18n')('Delete action was rejected at API level, perhaps a permission problem?');
          if (typeof id == 'undefined' && currentPlayer)
            id = currentPlayer.id;
          if (id) {
            var request = {
                'service': 'uiConf',
                'action': 'delete',
                'id': id
              };
            apiService.doRequest(request).then(function (result) {
              deferred.resolve(result);
            }, function () {
              deferred.reject(rejectText);
            });
          } else {
            deferred.reject(rejectText);
          }
          return deferred.promise;
        },
        'getRequiredVersion': function () {
          return 2;
        },
        'getPlayers': function () {
          return $http.get('js/services/allplayers.json');
        },
        'playerUpdate': function (playerObj) {
          var text = '<span>Updating the player -- TEXT MISSING -- current version </span>';
          var modal = $modal.open({
              templateUrl: 'template/dialog/message.html',
              controller: 'ModalInstanceCtrl',
              resolve: {
                settings: function () {
                  return {
                    'title': 'Update confirmation',
                    'message': text + playerObj.version
                  };
                }
              }
            });
          modal.result.then(function (result) {
            if (result) {
              $log.info('update modal confirmed for item version ' + playerObj.version + 'at: ' + new Date());
            }
          }, function () {
            $log.info('update modal dismissed at: ' + new Date());
          });
        }
      };
    return playersService;
  }
]);
;
KMCServices.factory('requestNotificationChannel', [
  '$rootScope',
  function ($rootScope) {
    var _START_REQUEST_ = '_START_REQUEST_';
    var _END_REQUEST_ = '_END_REQUEST_';
    var obj = { 'customStart': null };
    obj.requestStarted = function (customStart) {
      $rootScope.$broadcast(_START_REQUEST_);
      if (customStart) {
        obj.customStart = customStart;
      }
    };
    obj.requestEnded = function (customStart) {
      if (obj.customStart) {
        if (customStart == obj.customStart) {
          $rootScope.$broadcast(_END_REQUEST_);
          obj.customStart = null;
        } else
          return;
      } else
        $rootScope.$broadcast(_END_REQUEST_);
    };
    obj.onRequestStarted = function ($scope, handler) {
      $scope.$on(_START_REQUEST_, function (event) {
        handler();
      });
    };
    obj.onRequestEnded = function ($scope, handler) {
      $scope.$on(_END_REQUEST_, function (event) {
        handler();
      });
    };
    return obj;
  }
]);
KMCServices.directive('loadingWidget', [
  'requestNotificationChannel',
  function (requestNotificationChannel) {
    return {
      restrict: 'EA',
      scope: {},
      replace: true,
      template: '<div class=\'loadingOverlay\'><a><div id=\'spinWrapper\'></div></a></div>',
      controller: [
        '$scope',
        '$element',
        function ($scope, $element) {
          $scope.spinner = null;
          $scope.spinRunning = false;
          $scope.opts = {
            lines: 15,
            length: 27,
            width: 8,
            radius: 60,
            corners: 1,
            rotate: 0,
            direction: 1,
            color: '#000',
            speed: 0.6,
            trail: 24,
            shadow: true,
            hwaccel: true,
            className: 'spinner',
            zIndex: 2000000000,
            top: 'auto',
            left: 'auto'
          };
          var initSpin = function () {
            $scope.spinner = new Spinner($scope.opts).spin();
          };
          $scope.endSpin = function () {
            if ($scope.spinner)
              $scope.spinner.stop();
            $scope.spinRunning = false;
          };
          $scope.spin = function () {
            if ($scope.spinRunning)
              return;
            var target = $element.find('#spinWrapper');
            if ($scope.spinner == null)
              initSpin();
            $scope.spinner.spin(target[0]);
            $scope.spinRunning = true;
          };
        }
      ],
      link: function (scope, element) {
        element.hide();
        var startRequestHandler = function () {
          element.show();
          scope.spin();
        };
        var endRequestHandler = function () {
          element.hide();
          scope.endSpin();
        };
        requestNotificationChannel.onRequestStarted(scope, startRequestHandler);
        requestNotificationChannel.onRequestEnded(scope, endRequestHandler);
      }
    };
  }
]);
;
KMCServices.factory('editableProperties', [
  '$http',
  function ($http) {
    return $http.get('js/services/editableProperties.json');
  }
]);
KMCServices.factory('apiService', [
  '$q',
  '$timeout',
  '$location',
  'localStorageService',
  'playerCache',
  'requestNotificationChannel',
  function ($q, $timeout, $location, localStorageService, playerCache, requestNotificationChannel) {
    return {
      apiObj: null,
      getClient: function () {
        if (!this.apiObj) {
          kWidget.api.prototype.type = 'POST';
          this.apiObj = new kWidget.api();
        }
        return this.apiObj;
      },
      unSetks: function () {
        delete this.apiObj;
      },
      setKs: function (ks) {
        this.getClient().setKs(ks);
      },
      setWid: function (wid) {
        this.getClient().wid = wid;
      },
      getKey: function (params) {
        var key = '';
        for (var i in params) {
          key += params[i] + '_';
        }
        return key;
      },
      listMedia: function () {
        var request = {
            'service': 'media',
            'action': 'list'
          };
        return this.doRequest(request);
      },
      doRequest: function (params) {
        var deferred = $q.defer();
        requestNotificationChannel.requestStarted();
        var params_key = this.getKey(params);
        if (playerCache.get(params_key)) {
          deferred.resolve(playerCache.get(params_key));
        } else {
          this.getClient().doRequest(params, function (data) {
            $timeout(function () {
              if (data.code) {
                if (data.code == 'INVALID_KS') {
                  localStorageService.remove('ks');
                  $location.path('/login');
                }
                requestNotificationChannel.requestEnded();
                deferred.reject(data.code);
              } else {
                playerCache.put(params_key, data);
                requestNotificationChannel.requestEnded();
                deferred.resolve(data);
              }
            }, 0);
          });
        }
        return deferred.promise;
      }
    };
  }
]);
KMCServices.factory('playerTemplates', [
  '$http',
  function ($http) {
    return {
      'listSystem': function () {
        return $http.get('http://mrjson.com/data/5263e32d85f7fef869f2a63b/template/list.json');
      },
      'listUser': function () {
        return $http.get('http://mrjson.com/data/5263e32d85f7fef869f2a63b/userTemplates/list.json');
      }
    };
  }
]);