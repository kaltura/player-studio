'use strict';
/* Menu */
var KMCMenu = angular.module('KMC.menu', []);
KMCMenu.factory('menuSvc', ['editableProperties', '$rootScope', '$compile', function(editableProperties, $rootScope, $compile) {
    var menudata = null;
    var promise = editableProperties
        .success(function(data) {
            menudata = data;
        });
    var menuSVC = {
        promise: promise,
        get: function() {
            return menudata;
        },
        setMenu: function(setTo) {
            $rootScope.$broadcast('menuChange', setTo);
        },
        renderMenuItems: function(item, origin, BaseData, scope) {
            var originAppendPos = origin.find('ul[ng-transclude]:first');
            if (originAppendPos.length < 1)
                originAppendPos = origin;
            switch (item.type) {
                case  'menu':
                    var originModel = origin.attr('model') ? origin.attr('model') : BaseData;
                    var parent = renderFormElement(item, '<menu-level pagename=' + item.model + '/>', originAppendPos, originModel);
                    var modelStr = originModel + '.' + item.model;
                    for (var j = 0; j < item.children.length; j++) {
                        var subitem = item.children[j];
                        var subappendPos = parent.find('ul[ng-transclude]:first');
                        switch (subitem.type) {
                            case 'checkbox' :
                                renderFormElement(subitem, '<model-checbox/>', subappendPos, modelStr);
                                break;
                            case 'select' :
                                renderFormElement(subitem, '<model-select/>', subappendPos, modelStr);
                                break;
                            case 'color' :
                                renderFormElement(subitem, '<model-color/>', subappendPos, modelStr);
                                break;
                            case 'number':
                                renderFormElement(subitem, '<model-number/>', subappendPos, modelStr);
                                break;
                            case 'text':
                                renderFormElement(subitem, '<model-text/>', subappendPos, modelStr);
                                break;
                            case 'menu':
                                menuSVC.renderMenuItems(subitem, parent, BaseData, scope);
                                break;
                        }
                    }
                    break;
                case 'select' :
                    renderFormElement(item, '<model-select/>', originAppendPos);
                    break;
                case 'checkbox' :
                    renderFormElement(item, '<model-checbox/>', originAppendPos);
                    break;
                case 'color' :
                    renderFormElement(item, '<model-color/>', originAppendPos);
                    break;
                case 'text' :
                    renderFormElement(item, '<model-text/>', originAppendPos);
                    break;
                case 'number':
                    renderFormElement(item, '<model-number/>', originAppendPos);
                    break;
            }
            function renderFormElement(item, directive, appendTo, parentModel) {
                var elm = angular.element(directive);
                angular.forEach(item, function(value, key) {
                    if (key != 'model' && (typeof value == 'string' || typeof value == 'number')) {
                        elm.attr(key, value);
                    } else {
                        if (key == 'options' && typeof value == 'object')
                            if (Array.isArray(value))
                                elm.attr(key, JSON.stringify(value));
                    }
                });
                if (typeof parentModel != "undefined") {
                    var subModelStr = parentModel + '.' + item.model;
                    elm.attr('model', subModelStr);
                }
                else {
                    elm.attr('model', BaseData + '.' + item.model);
                }
                if (item.type != 'menu')
                    elm = $('<li/>').html(elm);
                var compiled = $compile(elm)(scope).appendTo(appendTo);
                return compiled;
            }
        }
    };
    return menuSVC;

}]);