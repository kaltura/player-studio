'use strict';
var KMCSort = angular.module('KMC.sort', ['ui.sortable'])
KMCSort.factory('SortObj', ['menuSvc', function(menuSvc) {
    return function SortObj(modelStr) { // invoked with model of the parent container for the plugin
        var modelValue = menuSvc.getModelData(modelStr); // which container
        var parent = modelStr.substr(0, modelStr.lastIndexOf('.'));
        var parentObj = menuSvc.getModelData(parent);// the object
        if (parentObj && parentObj._featureEnabled) {
            return {
                model: parent,
                label: menuSvc.getControlData(parent).label,
                sortVal: (typeof parentObj != 'undefined' && typeof parentObj.order == "number") ? parentObj.order : 0,
                side: (typeof parentObj != 'undefined' && (parentObj.align == "left" || parentObj.align == "right" )) ? parentObj.align : 'left',
                container: modelValue
            };
        }
        return null;
    }
}]);
KMCSort.factory('Container', [function() {
    function Container(name) {
        if (typeof name == 'string') {
            this.name = name;
            this.sides = {right: [], left: []};
            return this;
        }
    };
    Container.prototype.addElement = function(model, side) {
        side = (side) ? side : 'left';
        this.sides[side].push(model);
    };
    Container.prototype.callObjectsUpdate = function() {
        angular.forEach(this.sides, function(side, sideKey) {
            cl(sideKey + ': ');
            angular.forEach(side, function(model) {
                cl(model.sortVal + ' ' + model.model);
            });
        });
    };
    Container.prototype.hasElement = function(modelObj) {
        var returnVal = false;
        var _this = this;
        angular.forEach(this.sides, function(side) {
            if (side.indexOf(modelObj) != -1) {
                returnVal = _this;
            }
        });
        return returnVal;
    }
    Container.prototype.removeElement = function(modelObj) {
        angular.forEach(this.sides, function(side) {
            var index = side.indexOf(modelObj);
            if (index != -1)
                side.splice(index, 1);
        });
    };
    Container.prototype.setSides = function(modelObj, targetSide) {
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
    return Container;
}]);
KMCSort.factory('sortSvc', ['menuSvc', 'SortObj', 'Container', function(menuSvc, SortObj, Container) {
    var containers = {};
    var sorter = {};

    sorter.sortScope = {}; // temporary
    sorter.asyncRegister = function(containerModelStr) {
        var watchOnce = menuSvc.menuScope.$watch(function() {
            return menuSvc.getModelData(containerModelStr); // modelValue
        }, function(newVal) {
            if (typeof newVal != 'undefined') {
                watchOnce();
                sorter.register(containerModelStr, newVal);
            }
        });
    };
    sorter.register = function(containerModelStr, containerName, side) {
        var modelObj = SortObj(containerModelStr);
        if (modelObj) {
            var container = (typeof  containers[containerName] == 'undefined') ? new Container(containerName) : containers[containerName];
            if (typeof containers[containerName] == 'undefined') {
                containers[containerName] = container;
            }
            container.addElement(modelObj, side);
        } else
            return false;
    };

    sorter.findModelObjbyModelStr = function(modelStr) {
        var keepGoing = true;
        var returnVal = false;
        angular.forEach(containers, function(container) {
            if (keepGoing)
                angular.forEach(container.sides, function(side) {
                    if (keepGoing)
                        angular.forEach(side, function(object) {
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

    sorter.setSortVal = function(modelStr, sortVal) {
        var object = sorter.findModelObjbyModelStr(modelStr);
        if (object) {
            object.sortVal = sortVal;
        }
    };
    sorter.setSides = function(modelStr, sideStr) {
        var modelObj = sorter.findModelObjbyModelStr(modelStr);
        if (modelObj) {
            containers[modelObj.container].setSides(modelObj, sideStr)
        }
    };
    sorter.updateContainer = function(modelStr, newVal, oldVal) {
        var modelObj = sorter.findModelObjbyModelStr(modelStr);
        if (modelObj) { // already registered.
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
        } else {
            sorter.register(modelStr, newVal);
        }
    };
    sorter.getObjects = function() {
        return containers;
    };
    return sorter;
}]
);

KMCSort.directive('sortAlignment', ['sortSvc', 'menuSvc', function(sortSvc, menuSvc) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            var model = $attrs.model;
            var parentModel = model.substr(0, model.lastIndexOf('.'));
            $scope.$watch(function() {
                return menuSvc.getModelData(model); // modelValue
            }, function(newVal, oldVal) {
                if (newVal != oldVal && newVal) {
                    sortSvc.setSides(parentModel, newVal);
                }
            });

        }
    };
}]);
KMCSort.directive('parentContainer', ['sortSvc', 'menuSvc', function(sortSvc, menuSvc) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            var model = $attrs.model.substr(0, $attrs.model.lastIndexOf('.'));// plugin model
            $scope.$watch(function() {
                return menuSvc.getModelData(model);
            }, function(newVal, oldVal) {
                if (newVal != oldVal) {
                    sortSvc.updateContainer(model, newVal, oldVal);
                }
            });
        }
    };
}]);
KMCSort.directive('sortOrder', ['menuSvc',
    'sortSvc',
    function(menuSvc, sortSvc) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'template/formcontrols/sortOrder.html',
            controller: ['$scope', function($scope) {
                sortSvc.sortScope = $scope;
                $scope.saveOrder = function() {
                    angular.forEach($scope.containers, function(container, containerKey) {
                        angular.forEach(container.sides, function(side, sideKey) {
                            angular.forEach(side, function(object, index) {
                                var modelStr = object.model;
                                var modelObj = menuSvc.getModelData(modelStr);
                                if (modelObj) {
                                    modelObj.parent = containerKey;
                                    modelObj.order = index;
                                    modelObj.align = sideKey;
                                }
                            });
                        });
                    });
                }
                $scope.getObjects = function() {
                    $scope.containers = sortSvc.getObjects();
                };
                $scope.sortOpts = {options: {
                    "connectWith": '.sortableList',
                    "placeholder": 'sortObj',
                    "containment": '.sortOrder',
                    "dropOnEmpty": true, update: function(e, ui) {
                        cl($scope.containers);
                    }

                }
                };
            }],
            link: function($scope) {
                var asyncContainers = menuSvc.sortObj2register;
                angular.forEach(asyncContainers, function(sortContainerModel) {
                    sortSvc.asyncRegister(sortContainerModel);
                });
                $scope.getObjects();
                $scope.$on('sortContainersChanged', function() {
                    $scope.getObjects();
                });
                $scope.$watch('containers', function(newVal, oldVal) {
                    if (newVal != oldVal) {
                        $scope.saveOrder();
                    }
                }, true);
            }
        };
    }
]);