'use strict';

/*
 * An AngularJS Localization Service
 *
 * Written by Jim Lavin
 * http://codingsmackdown.tv
 *
 */

angular.module('localization', [])
// localization service responsible for retrieving resource files from the server and
// managing the translation dictionary
    .factory('localize', ['$http', '$rootScope', '$window', '$filter',
        function ($http, $rootScope, $window, $filter) {
            var localize = {
                // use the $window service to get the language of the user's browser
                language: '',
                // array to hold the localized resource string entries
                dictionary: [],
                // location of the resource file
                url: undefined,
                // flag to indicate if the service hs loaded the resource file
                resourceFileLoaded: false,

                // success handler for all server communication
                successCallback: function (data) {
                    // store the returned array in the dictionary
                    localize.dictionary = data;
                    // set the flag that the resource are loaded
                    localize.resourceFileLoaded = true;
                    // broadcast that the file has been loaded
                    $rootScope.$broadcast('localizeResourcesUpdated');
                },

                // allows setting of language on the fly
                setLanguage: function (value) {
                    localize.language = value;
                    localize.initLocalizedResources();
                },

                // allows setting of resource url on the fly
                setUrl: function (value) {
                    localize.url = value;
                    localize.initLocalizedResources();
                },

                // builds the url for locating the resource file
                buildUrl: function () {
                    if (!localize.language) {
                        var lang, androidLang;
                        // works for earlier version of Android (2.3.x)
                        if ($window.navigator && $window.navigator.userAgent && (androidLang = $window.navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
                            lang = androidLang[1];
                        } else {
                            // works for iOS, Android 4.x and other devices
                            lang = $window.navigator.userLanguage || $window.navigator.language;
                        }
                        // set language
                        localize.language = lang;
                    }
                    return 'i18n/resources-locale_' + localize.language + '.json';
                },

                // loads the language resource file from the server
                initLocalizedResources: function () {
                    // build the url to retrieve the localized resource file
                    var url = localize.url || localize.buildUrl();
                    // request the resource file
                    return $http({
                        method: "GET",
                        url: url,
                        cache: false
                    }).success(localize.successCallback).error(function () {
                            // the request failed set the url to the default resource file
                            var url = '/i18n/resources-locale_en_US.json';
                            // request the default resource file
                            $http({
                                method: "GET",
                                url: url,
                                cache: false
                            }).success(localize.successCallback);
                        });
                },

                // checks the dictionary for a localized resource string
                getLocalizedString: function (value, SyncAction) {
                    //  Contextualize missing translation
                    var translated = '!' + value + '!';                        //  check to see if the resource file has been loaded
                    if (!localize.resourceFileLoaded && !SyncAction) {
                        //  call the init method
                        var promise = localize.initLocalizedResources();
                        //  set the flag to keep from looping in init
                        localize.resourceFileLoaded = true;
                        //  return the empty string
                        return promise.then(function () {
                            return localize.getLocalizedString(value)
                        });
                    }                        //  make sure the dictionary has valid data
                    if (typeof localize.dictionary === "object") {
                        var log_untranslated = false;
                        var placeholders = [];
                        for (var i = 1; i < arguments.length; i++) {
                            placeholders.push(arguments[i]);
                        }
                        var translate = function (value, placeholders) {
                            var placeholders = placeholders || null;
                            var translated = localize.dictionary[value];
                            if (translated === undefined) {
                                if (log_untranslated == true) {
                                    //  Log untranslated value
                                }
                                return sprintf(value, placeholders);
                            }
                            return sprintf(translated, placeholders);
                        };
                        var result = translate(value, placeholders);
                        if ((translated !== null) && (translated != undefined)) {
                            //  set the translated
                            translated = result;
                        }
                    }
                    //  add watcher on the item to get the new string
                    else {
                        return value;
                    }                        //  return the value to the call
                    return translated;
                }

            };                //  return the local instance when called

            // force the load of the resource file
            localize.initLocalizedResources();

            // return the local instance when called
            return localize;
        }
    ])
// simple translation filter
// usage {{ TOKEN | i18n }}
    .filter('i18n', ['localize',
        function (localize) {
            return function (input) {
                return localize.getLocalizedString(input, true);
            };
        }
    ])
// translation directive that can handle dynamic strings
// updates the text value of the attached element
// usage <span data-i18n="TOKEN" ></span>
// or
// <span data-i18n="TOKEN|VALUE1|VALUE2" ></span>
    .directive('i18n', ['localize',
        function (localize) {
            var i18nDirective = {
                restrict: "EAC",
                updateText: function (elm, token) {
                    var values = token.split('|');
                    if (values.length >= 1) {
                        // construct the tag to insert into the element
                        var tag = localize.getLocalizedString(values[0]);
                        // update the element only if data was returned
                        if ((tag !== null) && (tag !== undefined) && (tag !== '')) {
                            if (values.length > 1) {
                                for (var index = 1; index < values.length; index++) {
                                    var target = '{' + (index - 1) + '}';
                                    tag = tag.replace(target, values[index]);
                                }
                            }
                            // insert the text into the element
                            elm.text(tag);
                        }
                        ;
                    }
                },

                link: function (scope, elm, attrs) {
                    scope.$on('localizeResourcesUpdated', function () {
                        i18nDirective.updateText(elm, attrs.i18n);
                    });

                    attrs.$observe('i18n', function (value) {
                        i18nDirective.updateText(elm, attrs.i18n);
                    });
                }
            };

            return i18nDirective;
        }
    ])
// translation directive that can handle dynamic strings
// updates the attribute value of the attached element
// usage <span data-i18n-attr="TOKEN|ATTRIBUTE" ></span>
// or
// <span data-i18n-attr="TOKEN|ATTRIBUTE|VALUE1|VALUE2" ></span>
    .directive('i18nAttr', ['localize',
        function (localize) {
            var i18NAttrDirective = {
                restrict: "EAC",
                updateText: function (elm, token) {
                    var values = token.split('|');
                    // construct the tag to insert into the element
                    var tag = localize.getLocalizedString(values[0]);
                    // update the element only if data was returned
                    if ((tag !== null) && (tag !== undefined) && (tag !== '')) {
                        if (values.length > 2) {
                            for (var index = 2; index < values.length; index++) {
                                var target = '{' + (index - 2) + '}';
                                tag = tag.replace(target, values[index]);
                            }
                        }
                        // insert the text into the element
                        elm.attr(values[1], tag);
                    }
                },
                link: function (scope, elm, attrs) {
                    scope.$on('localizeResourcesUpdated', function () {
                        i18NAttrDirective.updateText(elm, attrs.i18nAttr);
                    });

                    attrs.$observe('i18nAttr', function (value) {
                        i18NAttrDirective.updateText(elm, value);
                    });
                }
            };

            return i18NAttrDirective;
        }
    ]);