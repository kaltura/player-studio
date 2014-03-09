'use strict';
var KMCSort = angular.module('KMC.sort', ['ui.sortable'])
KMCSort.factory('SortObj', ['menuSvc', function(menuSvc) {
    var SortObj = function SortObj(modelStr) { // invoked with model of the parent container for the plugin
        var modelValue = menuSvc.getModelData(modelStr); // which container
        var parent = modelStr.substr(0, modelStr.lastIndexOf('.'));
        var parentObj = menuSvc.getModelData(parent);// the object
        if (parentObj && parentObj._featureEnabled) {
            this.model = parent;
            this.label = menuSvc.getControlData(parent).label;
            this.sortVal = (typeof parentObj != 'undefined' && typeof parentObj.order == "number") ? parentObj.order : 0;
            this.side = (typeof parentObj != 'undefined' && (parentObj.align == "left" || parentObj.align == "right" )) ? parentObj.align : 'left';
            this.container = modelValue;
            return this;
        } else
            return null;
    }
    SortObj.prototype.setSides = function(targetSide) {
        if (targetSide == 'left' || targetSide == 'right')
            this.side = targetSide;
    };

    return SortObj;
}])
;
KMCSort.factory('Container', [function() {
    function Container(name) {
        if (typeof name == 'string') {
            this.name = name;
            this.elements = [];
            return this;
        }
    };
    Container.prototype.addElement = function(model) {
        this.elements.push(model);
    };
    Container.prototype.removeElement = function(modelObj) {
        var index = this.elements.indexOf(modelObj);
        if (index != -1)
            this.elements.splice(index, 1);
    };
    return Container;
}]);
KMCSort.factory('sortSvc', ['menuSvc', 'SortObj', 'Container', '$rootScope', function(menuSvc, SortObj, Container, $rootScope) {
    var containers = {};
    var sorter = {};
    var asyncContainers = menuSvc.sortObj2register;
    $rootScope.$on('menuInitDone', function() {
        angular.forEach(asyncContainers, function(sortContainerModel) {
            sorter.asyncRegister(sortContainerModel);
        });
    });
    sorter.sortScope = {}; // temporary, later become the directive scope
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
    sorter.register = function(containerModelStr, containerName) {
        var modelObj = new SortObj(containerModelStr);
        if (modelObj) {
            var container = (typeof  containers[containerName] == 'undefined') ? new Container(containerName) : containers[containerName];
            if (typeof containers[containerName] == 'undefined') {
                containers[containerName] = container;
            }
            container.addElement(modelObj);
        } else
            return false;
    };

    sorter.findModelObjByModelStr = function(modelStr) {
        var keepGoing = true;
        var returnVal = false;
        angular.forEach(containers, function(container) {
            if (keepGoing)
                angular.forEach(container.elements, function(element) {
                    if (keepGoing)
                        if (element.model == modelStr) {
                            returnVal = element;
                            keepGoing = false;
                        }
                });
        });
        return returnVal;
    };
    sorter.setSortVal = function(modelStr, sortVal) {
        var object = sorter.findModelObjByModelStr(modelStr);
        if (object) {
            object.sortVal = sortVal;
        }
    };
    sorter.setSides = function(modelStr, sideStr) {
        var modelObj = sorter.findModelObjByModelStr(modelStr);
        if (modelObj) {
            modelObj.setSides(sideStr)
        }
    };
    sorter.updateContainer = function(modelStr, newVal, oldVal) {
        var modelObj = sorter.findModelObjByModelStr(modelStr);
        if (modelObj) { // already registered.
            var oldContainer = containers[oldVal];
            if (!containers[newVal]) {
                var newContainer = new Container(newVal);
                containers[newVal] = newContainer;
            }
            else {
                var newContainer = containers[newVal];
            }
            if (oldContainer) {
                oldContainer.removeElement(modelObj);
            }
            modelObj.container = newVal;
            newContainer.addElement(modelObj);
            if (typeof  sorter.sortScope == 'object' && typeof sorter.sortScope.$broadcast == 'function') {
                sorter.sortScope.$broadcast('sortContainersChanged');
            }
        } else {
            sorter.register(modelStr, newVal);
        }
    };
    sorter.getContainers = function() {
        return containers;
    };
    sorter.saveOrder = function(saveContainers) {
        angular.forEach(saveContainers, function(container, containerKey) {
            angular.forEach(container.elements, function(object, index) {
                var modelStr = object.model;
                var modelObj = menuSvc.getModelData(modelStr);
                if (modelObj) {
                    modelObj.parent = containerKey; // or object.container;
                    modelObj.order = index; //or object.sortVal
                    modelObj.align = object.side;
                }
            });
        });
    }
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
            var model = $attrs.model;
            var parentModel = model.substr(0, model.lastIndexOf('.'));
            $scope.$watch(function() {
                return menuSvc.getModelData(model);
            }, function(newVal, oldVal) {
                if (newVal != oldVal) {
                    sortSvc.updateContainer(parentModel, newVal, oldVal);
                }
            });
        }
    };
}]);
KMCSort.directive('sortOrder', ['menuSvc',
    'sortSvc', '$timeout',
    function(menuSvc, sortSvc, $timeout) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'template/formcontrols/sortOrder.html',
            controller: ['$scope', function($scope) {
                sortSvc.sortScope = $scope;
                $scope.getContainers = function() {// prepares the different containers for left and right
                    $scope.containers = sortSvc.getContainers();
                    angular.forEach($scope.containers, function(container) {
                        container.sides = {left: [], right: []};
                        angular.forEach(container.elements, function(sortObj) {
                            container.sides[sortObj.side].push(sortObj);
                        });
                    });
                };
                $scope.saveOrder = function() {
                    var saveContainers = {};
                    angular.forEach($scope.containers, function(container, containerKey) {
                        angular.forEach(container.sides, function(side, sideKey) {
                            angular.forEach(side, function(object, index) {
                                object.container = containerKey;
                                object.sortVal = index;
                                object.side = sideKey;
                            });
                        });
                        saveContainers[containerKey] = {name: containerKey, elements: container.sides.left.concat(container.sides.right)};
                    });
                    sortSvc.saveOrder(saveContainers);
                }
                $scope.sortOpts = {options: {
                    "connectWith": '.sortableList',
                    "placeholder": 'sortObj',
                    "containment": '.sortOrder',
//                    "over": function(e, ui) {
                    //nice way to do it but there are weird bugs so reveted to make different arrays.
                    //    ui.item.scope().obj.setSides($(e.target).attr('side'));
                    //   ui.item.scope().obj.container = $(e.target).attr('container');
//                    },
                    "dropOnEmpty": true,
                    update: function(e, ui) {
                        $timeout(function() {// important!!
                            $scope.saveOrder();
                        }, 100);

                    }
                }
                };
            }],
            link: function($scope) {
                $timeout(function(){
                    $scope.getContainers();
                },500);
                $scope.$on('sortContainersChanged', function() {
                    $scope.getContainers();
                });

            }
        };
    }
]);