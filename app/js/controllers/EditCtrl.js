var KMCMenu = angular.module('KMCmenu', ['ui.bootstrap', 'ngSanitize', 'ui.select2', 'angularSpectrumColorpicker']);

KMCMenu.directive('bindOnce', function() {
    return {
        scope: true,
        link: function( $scope ) {
            setTimeout(function() {
                $scope.$destroy();
            }, 0);
        }
    }
});

KMCMenu.controller('EditCtrl', ['$scope','$http', '$timeout','PlayerData','PlayerService', 'apiService', 'editableProperties', 'localStorageService',
	function ($scope, $http, $timeout, PlayerData, PlayerService, apiService, editableProperties, localStorageService) {

	// get the player data
	$scope.playerData = PlayerData;
    // set IE8 flash for color picker
    $scope.isIE8 = window.ie8;
    // array of invalid properties
    $scope.invalidProps = [];
	// flag if the player data was changed so we can issue an alert if returning to list without saving
	$scope.dataChanged = false;
	// set aspect ratio to wide screen
	$scope.aspectRatio = 9/16;

    // load user entries data
    $scope.userEntries = [];
	$scope.selectedEntry = '';
	apiService.listMedia().then(function(data) {
		for (var i=0; i < data.objects.length; i++){
			$scope.userEntries.push({'id': data.objects[i].id, 'text': data.objects[i].name});
		}
		// set default entry
		$timeout(function(){
			$scope.selectedEntry = localStorageService.get('defaultEntry') ? localStorageService.get('defaultEntry') : $scope.userEntries[0].id;
		},0,true)
	});

    // load menu data and parse it
    editableProperties.then(function(data) {

	    // merge data with player data
	    $scope.mergePlayerData(data);

        // convert data to a menu array.
        $scope.templatesToLoad = 0;   // used to detect when all the menu was loaded
        $scope.propertiesSearch = []; // prepare an array for all properties to be used in search

        // add search section to the menu data
        $scope.menuData = [{'label': 'Menu Search', 'description': 'Search for menu property', 'icon': 'TabSearch', 'properties':[{'type':'search','model':'menuProperties'}]}];
        var categoryIndex = 0; // for search indexing

        for (var cat in data){
            categoryIndex++;             // used for search indexing
            $scope.templatesToLoad += 2; // for each category we load 2 templates: one for the icon and one for the data
            var category = {'label': data[cat].label, 'description': data[cat].description, 'icon': data[cat].icon};
            var plugs = data[cat].children;
            if (plugs.length != undefined){
                // array means properties and not nested plugins - we can add the templates for the properties directly
                category.properties = [];
                for (var i=0; i<plugs.length; i++){
                    $scope.templatesToLoad++;
                    $scope.propertiesSearch.push({'label':plugs[i].label,'categoryIndex':categoryIndex, 'accIndex': -1, 'id': 'prop'+$scope.templatesToLoad});  // search indexing
                    category.properties.push($.extend(plugs[i],{'id':'prop'+$scope.templatesToLoad}));
                }
            }else{
                // nested plugins - create an accordion for the plugins
                var plugins = [];
                var pluginIndex = -1; // for search indexing
                for (var plug in plugs){
                    pluginIndex++;
                    var p = plugs[plug];
                    $scope.propertiesSearch.push({'label': p.label,'categoryIndex':categoryIndex, 'accIndex': pluginIndex, 'id': 'accHeader'+categoryIndex + "_"  +pluginIndex}); // add accordion header to the search indexing
                    var plugin = {'enabled': p.enabled, 'label': p.label, 'description':p.description, 'isopen': false, 'id': 'accHeader'+categoryIndex + "_" + pluginIndex};
                    plugin.properties = [];
                    // check for tabs
                    if (p.sections){ // tabs found - create tabs
                        var tabObj = {'type':'tabs', 'children':[]}; // create tab object
                        $scope.templatesToLoad++; // count tabs template
                        for (var tab=0; tab < p.sections.tabset.length; tab++){
                            tabObj.children.push(p.sections.tabset[tab]);
                        }
                    }
                    for (var i=0; i<p.children.length; i++){
                        $scope.templatesToLoad++;
                        if (p.sections && p.children[i].section){ // property should be put in the correct tab
                            for (var tab=0; tab < tabObj.children.length; tab++){
                                if (p.children[i].section == tabObj.children[tab].key){
                                    tabObj.children[tab].children.push($.extend(p.children[i],{'id':'prop'+$scope.templatesToLoad}));
                                    $scope.propertiesSearch.push({'label':p.children[i].label + ' ('+ p.label +')','categoryIndex':categoryIndex, 'accIndex': pluginIndex, 'tabIndex': tab, 'id': 'prop'+$scope.templatesToLoad}); // add property to search indexing
                                }
                            }
                        } else { // no tabs - add property to the plugin root
                            $scope.propertiesSearch.push({'label':p.children[i].label + ' ('+ p.label +')','categoryIndex':categoryIndex, 'accIndex': pluginIndex, 'id': 'prop'+$scope.templatesToLoad}); // add property to search indexing
                            plugin.properties.push($.extend(p.children[i],{'id':'prop'+$scope.templatesToLoad}));
                        }
                    }
                    if (p.sections){ // add tabs object
                        plugin.properties.push(tabObj);
                    }
                    plugins.push(plugin);
                }
                category.plugins = plugins;
            }
            $scope.menuData.push(category);
        }
        $scope.selectedCategory = $scope.menuData[1].label;
    })

    // set selected category when clicking on a category icon
    $scope.categorySelected = function(category){
        $scope.selectedCategory = category;
    }

    // detect when the menu finished loading
    $scope.templatesLoaded = 0;
    $scope.$on('$includeContentLoaded', function(event) {
        $scope.templatesLoaded++;
        if ($scope.templatesLoaded == $scope.templatesToLoad){
            $(".numeric").numeric({'decimal': false, 'negative': false}); // set integer number fields to accept only numbers
            $(".float").numeric({'decimal': '.', 'negative': false}); // set float number fields to accept only floating numbers
            console.log("menu loaded");
	        $scope.refreshPlayer();
            //$("#debugger").show();
        }
    });

    // toggle plugin enable / disable
    $scope.togglePlugin = function(plugin, $event){
        $event.stopPropagation();
	    if (plugin.enabled){
		    // since we are getting the event before the value is changed - enabled means that the plugin is going to be disabled - remove validation
		    $scope.removeValidation(plugin);
	    }else{
		    $scope.addValidation(plugin);
	    }
        $scope.refreshPlayer();
    }

	// remove validation for disabled plugins
	$scope.removeValidation = function(plugin){
		for (var i=0; i<plugin.properties.length; i++){
			delete plugin.properties[i].invalidTooltip
			var id = plugin.properties[i].id;
			if ($.inArray(id, $scope.invalidProps) != -1)
				$scope.invalidProps.splice($scope.invalidProps.indexOf(id), 1);
		}
	}

	// revalidate enabled plugins
	$scope.addValidation = function(plugin){
		for (var i=0; i<plugin.properties.length; i++)
			$scope.validate(plugin.properties[i]);
	}

    // properties search
    $scope.searchProperty = function($item, $model, $label){
        $scope.selectedCategory = $scope.menuData[$item.categoryIndex].label; // set category
        if ($item.accIndex!=-1){ // open accordion if needed
            $scope.menuData[$item.categoryIndex].plugins[$item.accIndex].isopen = true;
        }
        // if we have tabs - locate within the tabs
        if ($item.tabIndex && $item.tabIndex!=-1){
            // find the tab object and open the correct tab
            var props = $scope.menuData[$item.categoryIndex].plugins[$item.accIndex].properties;
            for (var i=0; i<props.length; i++){
                if (props[i].type == "tabs")
                    props[i].children[$item.tabIndex].active = true;
            }
        }

        // blink selected property
        $("#"+$item.id).fadeTo(250, 0.1).fadeTo(250, 1.0).fadeTo(250, 0.1).fadeTo(250, 1.0).fadeTo(250, 0.1).fadeTo(250, 1.0);
    }

    // handle refresh
    $scope.refreshNeeded = false;
    $scope.propertyChanged = function(property){
	    if (property.selectedEntry){ // this is a preview entry change
		    $scope.selectedEntry = property.selectedEntry;
		    localStorageService.set('defaultEntry', property.selectedEntry);
		    $scope.refreshPlayer();
		    return;
	    }
	    $scope.dataChanged = true;
        $scope.validate(property);
        if (property['player-refresh'] != false){
            $scope.refreshNeeded = true;
        }
	    if (property['player-refresh'] == 'aspectToggle'){ // handle aspect ratio change
		    $scope.aspectRatio = property.initvalue == 'wide' ? 9/16 : 3/4;
		    $scope.refreshPlayer();
	    }
    }

    // validation
    $scope.validate = function(property){
        // clear invalid tooltip
        if (property.invalidTooltip)
            delete property.invalidTooltip;
        // clear this property from the invalid properties array
        if ($.inArray(property.id, $scope.invalidProps) != -1)
            $scope.invalidProps.splice($scope.invalidProps.indexOf(property.id), 1);

        // validate
        if (property.min && property.initvalue <  property.min)
            property.invalidTooltip = "Value must be equal or bigger than "+property.min;
        if (property.max && parseInt(property.initvalue) >  parseInt(property.max))
            property.invalidTooltip = "Value must be equal or less than "+property.max;
        if (property.require && property.initvalue == "")
            property.invalidTooltip = "This field is required";

        // if not valid - add the invalid tooltip to this field and add this property to the invalid properties array
        if (property.invalidTooltip){
            $scope.isValid = false;
            $scope.invalidProps.push(property.id);
        }
    }

    $scope.checkPlayerRefresh = function(){
        return $scope.refreshNeeded;
    }

    $scope.refreshPlayer = function(){
        $scope.refreshNeeded = false;
	    if ($scope.selectedEntry != ''){ // entries were already loaded - load the player
		    $scope.renderPlayer();
	    }else{ // wait for entries to load
		    $scope.intervalID = setInterval(function(){
			    if ($scope.selectedEntry != ''){
				    clearInterval($scope.intervalID);
				    $scope.renderPlayer(); // load the player and stop waiting...
			    }
		    },100);
	    }
    }

	$scope.renderPlayer = function(){
		// calculate player size according to aspect ratio
		var playerWidth = $scope.aspectRatio == 9/16 ? '100%' : '70%';
		$("#kVideoTarget").width(playerWidth);
		$("#kVideoTarget").height($("#kVideoTarget").width()*$scope.aspectRatio+40);
		//var data2Save = angular.copy(currentPlayer.config);
		//data2Save.plugins = playersService.preparePluginsDataForRender(data2Save.plugins);
		var flashvars = {};//{'jsonConfig': angular.toJson(data2Save)}; // update the player with the new configuration
		if ($scope.isIE8) {                      // for IE8 add transparent mode
			angular.extend(flashvars, {'wmode': 'transparent'});
		}
		// clear companion divs
		$("#Companion_300x250").empty();
		$("#Companion_728x90").empty();
		window.mw.setConfig('forceMobileHTML5', true);
		window.mw.setConfig('Kaltura.EnableEmbedUiConfJs', true);
		kWidget.embed({
			"targetId": 'kVideoTarget',
			"wid": "_" + $scope.playerData.partnerId, //$scope.data.partnerId,
			"uiconf_id": $scope.playerData.id,// $scope.data.id,
			"flashvars": flashvars,
			"entry_id": $scope.selectedEntry,
			"readyCallback": function(playerId) {
				document.getElementById(playerId).kBind("layoutBuildDone", function() {
					if (typeof callback == 'function') {
						callback();
					}
				});
			}
		});

	}

	$scope.save = function(){
		if ($scope.invalidProps.length > 0){
			alert("Some properties are invalid");
		}else{
			$scope.dataChanged = false;
		}
	}
	$scope.backToList = function(){
		if ($scope.dataChanged){
			confirm("data changed. Are you sure?");
		}
	}

	// merge the player data with the menu data
	$scope.mergePlayerData = function(data){
		for (var cat in data){
			var properties = data[cat].children;
			if ($.isArray(properties)){ // flat properties for basic display
				$scope.getPlayerProperties(properties);
			}else{ // plugin
				for (var plug in properties){
					// check plugin enabled
					if ($scope.playerData.config.plugins[plug]){
						properties[plug].enabled = true;
					}else{
						properties[plug].enabled = false;;
					}
					// get plugin properties from player data
					$scope.getPlayerProperties(properties[plug].children);
				}
			}
		}
	}

	$scope.getPlayerProperties = function(properties){
		for (var i=0; i<properties.length; i++){
			if (properties[i].model && properties[i].model.indexOf("~")==-1){
				var dataForModel = $scope.getDataForModel($scope.playerData, properties[i].model);
				if (dataForModel !== false){
					properties[i].initvalue = dataForModel;
				}
			}
		}
	}

	$scope.getDataForModel = function(data, model){
		var val = angular.copy(data);
		var modelArr = model.split(".");
		for (var i=0; i < modelArr.length; i++){
			if (val[modelArr[i]] != undefined){
				val = val[modelArr[i]];
			}else{
				return false;
			}
		}
		return val;
	}
}]);