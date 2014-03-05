'use strict';
var KMCSort = angular.module('KMC.sort', ['ui.sortable']);
KMCSort.factory('sortSvc', [function () {
    var containers = {};
    var sorter = {};

    var Container = function Container(name) {
        this.name = name;
        this.sides = {right: [], left: []};
        containers[name] = this;
    };
    Container.prototype.addElement = function (model, side) {
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
    Container.prototype.removeElement = function (model) {
        angular.forEach(this.sides, function (side, sideKey) {
            var index = side.indexOf(model);
            if (index != -1)
                side.splice(index, 1);
        });
    };
//    Container.prototype.swapSides =function(model){
//        angular.forEach(this.sides, function (side, sideKey) {
//            var index = side.indexOf(model);
//            if (index != -1)
//                side.splice(index, 1);
//        });
//    };
    sorter.sortScope = '';
    sorter.register = function (containerName, model) {
        var container = (typeof  containers[containerName] == 'undefined') ? new Container(containerName) : containers[containerName];
        container.addElement(model);
    };
    sorter.update = function (newVal, oldVal, model) {
        var oldContainer = containers[oldVal];
        var newContainer = (!containers[newVal]) ? new Container(newVal) : containers[newVal];
        if (oldContainer) {
            oldContainer.removeElement(model);
        }
        newContainer.addElement(model);
        if (typeof  sorter.sortScope == 'object') {
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
}]
);

//if (parentCntrl) {
//    var pubObj = {
//        model: $attrs.model,
//        label: $attrs.label.replace('Location', ''),
//        sortVal: menuSvc.getControlData($attrs.model).sortVal
//    };
//    parentCntrl.register($scope.model, pubObj);
//    $scope.$watch('model', function (newVal, oldVal) {
//        if (newVal != oldVal)
//            parentCntrl.update(newVal, oldVal, pubObj);
//    });
//}
KMCSort.directive('parentContainer', ['sortSvc', 'menuSvc', function (sortSvc, menuSvc) {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attrs) {
            var model = $attrs['model'];
            var modelValue = menuSvc.menuScope.$eval(model);
            if (modelValue)
                sortSvc.register(modelValue, model);
            $scope.$watch(function () {
                return menuSvc.menuScope.$eval(model);
            }, function (newVal, oldVal) {
                if (newVal != oldVal) {
                    if (!modelValue) {
                        sortSvc.register(newVal, model);
                    }
                    else {
                        sortSvc.updateContainer(newVal, oldVal, model);
                    }
                }
            });
        }
    };
}]);
KMCSort.directive('sortAlignment', ['sortSvc', function (sortSvc) {
    return {
        restrict: 'A',
        controller: function () {
            var cntrl = {
                register: function (side, model) {
                    sortSvc.register(side, model);
                },
                update: function (newVal, oldVal, model) {
                    sortSvc.updateSide(newVal, oldVal, model);
                }
            };
            return cntrl;
        }
    };
}]);
KMCSort.directive('sortOrder', [
    'sortSvc',
    function (sortSvc) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {},
            templateUrl: 'template/formcontrols/sortOrder.html',
            controller: ['$scope', function ($scope) {
                $scope.getObjects = function () {
                    $scope.containers = sortSvc.getObjects();
                }();
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
                    }
                };
            }],
            link: function (scope, element, attrs) {
            }
        };
    }
]);