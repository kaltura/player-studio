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
KMCServices.factory('requestNotificationChannel', [
  '$rootScope',
  function ($rootScope) {
    var _START_REQUEST_ = '_START_REQUEST_';
    var _END_REQUEST_ = '_END_REQUEST_';
    var obj = { customStart: null };
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
]).factory('editableProperties', [
  '$http',
  function ($http) {
    return $http.get('js/services/editableProperties.json');
  }
]).factory('apiService', [
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
]).factory('playerTemplates', [
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