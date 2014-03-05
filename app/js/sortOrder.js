'use strict';
var KMCSort = angular.module('KMC.sort', ['ui.sortable']);
KMCSort.factory('sortSvc', [function () {
    var containers = {};
    var sorter = {};
    var Container = function Container(name) {
        if (typeof name == 'string') {
            this.name = name;
            this.sides = {right: [], left: []};
            containers[name] = this;
        }
    };
    Container.prototype.addElement = function (model, side) {
        side = (side) ? side : 'left';
        this.sides[side].push(model);
    };
    Container.prototype.callObjectsUpdate = function () {
        angular.forEach(this.sides, function (side, sideKey) {
            cl(sideKey + ': ');
            angular.forEach(side, function (model) {
                cl(model.sortVal + ' ' + model.model);
            });
        });
    };
    Container.prototype.hasElement = function (modelObj) {
        var returnVal = false;
        var _this = this;
        angular.forEach(this.sides, function (side) {
            if (side.indexOf(modelObj) != -1) {
                returnVal = _this;
            }
        });
        return returnVal;
    }
    Container.prototype.removeElement = function (modelObj) {
        angular.forEach(this.sides, function (side) {
            var index = side.indexOf(modelObj);
            if (index != -1)
                side.splice(index, 1);
        });
    };
    Container.prototype.setSides = function (modelObj, targetSide) {
        var origin = (this.sides.left.indexOf(modelObj) != -1) ? "left" : null;
        if (!origin)
            origin = (this.sides.right.indexOf(modelObj) != -1) ? "right" : null;
        if (!origin) return false; // model not found in container
        var target = (origin == 'left') ? 'right' : 'left';
        if (targetSide == origin) return true;
        this.sides[origin].splice(origin, 1); // remove from origin
        this.sides[target].push(modelObj); // add to target;
        return true;
    };
    sorter.sortScope = '';
    sorter.register = function (containerName, modelObj, side) {
        var container = (typeof  containers[containerName] == 'undefined') ? new Container(containerName) : containers[containerName];
        container.addElement(modelObj, side);
    };

    sorter.findModelObjbyModelStr = function (modelStr) {
        var keepGoing = true;
        var returnVal = false;
        angular.forEach(containers, function (container) {
            if (keepGoing)
                angular.forEach(container.sides, function (side) {
                    if (keepGoing)
                        angular.forEach(side, function (object) {
                            if (keepGoing)
                                if (object.model == modelStr) {
                                    returnVal = object;
                                    keepGoing = false;
                                }
                        });
                });
        });
        return returnVal;
    };

    sorter.setSortVal = function (modelStr, sortVal) {
        var object = sorter.findModelObjbyModelStr(modelStr);
        if (object) {
            object.sortVal = sortVal;
        }
    };
    sorter.setSides = function (modelStr, sideStr) {
        var modelObj = sorter.findModelObjbyModelStr(modelStr);
        if (modelObj) {
            containers[modelObj.container].setSides(modelObj, sideStr)
        }
    };
    sorter.updateContainer = function (newVal, oldVal, modelObj) {
        var oldContainer = containers[oldVal];
        var newContainer = (!containers[newVal]) ? new Container(newVal) : containers[newVal];
        if (oldContainer) {
            oldContainer.removeElement(modelObj);
        }
        modelObj.container = newVal;
        newContainer.addElement(modelObj);
        if (typeof  sorter.sortScope == 'object') {
            sorter.sortScope.$broadcast('sortContainersChanged');
        }
    };
    sorter.getObjects = function () {
        return containers;
    };
    return sorter;
}]
);

KMCSort.directive('sortAlignment', ['sortSvc', 'menuSvc', function (sortSvc, menuSvc) {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attrs) {
            var model = $attrs.model;
            var parentModel = model.substr(0, model.lastIndexOf('.'));
            $scope.$watch(function () {
                return menuSvc.menuScope.$eval(model); // modelValue
            }, function (newVal, oldVal) {
                if (newVal != oldVal && newVal) {
                    cl('swap');
                    sortSvc.setSides(parentModel, newVal);
                }
            });

        }
    };
}]);
KMCSort.directive('parentContainer', ['sortSvc', 'menuSvc', function (sortSvc, menuSvc) {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attrs) {
            var model = $attrs.model;
            var watchOnce = $scope.$watch(function () {
                return menuSvc.menuScope.$eval(model); // modelValue
            }, function (newVal) { // when modelValue is defined
                if (typeof newVal != 'undefined') {
                    var parent = $attrs.model.substr(0, $attrs.model.lastIndexOf('.'));
                    var parentObj = menuSvc.menuScope.$eval(parent);
                    var pubObj = {
                        model: parent,
                        label: menuSvc.getControlData(parent).label,
                        sortVal: (typeof parentObj != 'undefined' && typeof parentObj.order == "number") ? parentObj.order : 0,
                        side: (typeof parentObj != 'undefined' && (parentObj.align == "left" || parentObj.align == "right" )) ? parentObj.align : 'left',
                        container: newVal
                    };
                    sortSvc.register(newVal, pubObj, pubObj.side);
                    $scope.$watch(function () {
                        return menuSvc.menuScope.$eval(model);
                    }, function (newVal, oldVal) {
                        if (newVal != oldVal) {
                            sortSvc.updateContainer(newVal, oldVal, pubObj);
                        }
                    });
                    watchOnce();//remove the original watcher.
                }
            });

        }
    };
}]);
KMCSort.directive('sortOrder', ['menuSvc',
    'sortSvc',
    function (menuSvc, sortSvc) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'template/formcontrols/sortOrder.html',
            controller: ['$scope', function ($scope) {
                $scope.saveOrder = function () {
                    angular.forEach($scope.containers, function (container, containerKey) {
                        angular.forEach(container.sides, function (side, sideKey) {
                            angular.forEach(side, function (object, index) {
                                var modelStr = object.model;
                                var modelObj = menuSvc.menuScope.$eval(modelStr);
                                if (modelObj) {
                                    modelObj.container = containerKey;
                                    modelObj.order = index;
                                    modelObj.align = sideKey;
                                }
                            });
                        });
                    });
                }
                $scope.getObjects = function () {
                    $scope.containers = sortSvc.getObjects();
                };
                sortSvc.sortScope = $scope;
                $scope.sortOpts = {options: {
                    "connectWith": '.sortableList',
                    "placeholder": 'sortObj',
                    "containment": '.sortOrder',
                    "dropOnEmpty": true
                }
                };
            }],
            link: function ($scope, element, attrs) {
                $scope.getObjects();
                $scope.$on('sortContainersChanged', function () {
                    $scope.getObjects();
                });
                $scope.$watch('containers', function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        $scope.saveOrder();
                    }
                }, true);
            }
        };
    }
]);