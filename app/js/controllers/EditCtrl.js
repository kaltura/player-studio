var KMCMenu = angular.module('KMCmenu', ['ui.bootstrap', 'ngSanitize', 'ui.select2', 'angularSpectrumColorpicker']);

KMCMenu.controller('EditCtrl', ['$scope','$http', '$timeout','PlayerData','PlayerService', 'apiService', 'editableProperties', 'localStorageService','$routeParams','$modal', '$location','requestNotificationChannel', 'select2Svc', 'utilsSvc',
	function ($scope, $http, $timeout, PlayerData, PlayerService, apiService, editableProperties, localStorageService, $routeParams, $modal, $location, requestNotificationChannel, select2Svc, utilsSvc) {

	$scope.playerData = angular.copy(PlayerData);   // get the player data
	$scope.isIE8 = window.ie8;                      // set IE8 flash for color picker
    $scope.invalidProps = [];                       // array of invalid properties
	$scope.dataChanged = false;                     // flag if the player data was changed so we can issue an alert if returning to list without saving
	var playerRatio = ($scope.playerData.height / $scope.playerData.width);
	$scope.aspectRatio = playerRatio == (9/16) ? "wide" : playerRatio == (3/4) ? "narrow" : "custom";  // set aspect ratio to wide screen
	$scope.newPlayer = !$routeParams.id;            // New player flag
	$scope.menuOpen = true;

	$scope.setInitialConfig = function () {
		$scope.playerData.config.playlist = $scope.playerData.config.playlist || {options: {}, countdown: {}};
	};
	$scope.setInitialConfig();

		try {
		var confVarsObj = JSON.parse($scope.playerData.confVars);
		if (confVarsObj) {
			var playerName = confVarsObj[PlayerService.KALTURA_PLAYER] ? PlayerService.KALTURA_PLAYER : PlayerService.KALTURA_PLAYER_OTT;
			var playerVersion = confVarsObj[playerName] === "{beta}" ? 'beta' : 'latest';
			var autoUpdate = (confVarsObj[playerName] === "{beta}" || confVarsObj[playerName] === "{latest}");
			$scope.playerData['playerVersion'] = playerVersion;
			$scope.playerData['autoUpdate'] = autoUpdate;
			for (var key in confVarsObj) {
				if (confVarsObj[key] !== '{beta}' && confVarsObj[key] !== '{latest}') {
					$scope.playerData.freezeVersions = $scope.playerData.freezeVersions || {};
					$scope.playerData.freezeVersions[key] = confVarsObj[key];
				}
				if (key !== playerName) {
					$scope.playerData.externals = $scope.playerData.externals || {};
					$scope.playerData.externals[key] = {active: true};
				}
			}
		}
	} catch (e) {
		logTime(e);
	}
		// auto preview flag
	$scope.autoPreview = localStorageService.get('autoPreview') ? localStorageService.get('autoPreview')=='true' : false;
	$scope.setAutoPreview = function(){
		localStorageService.set('autoPreview', !$scope.autoPreview);
	};
	$scope.setSimulateMobile = function(){
		window.KalturaPlayer = null;
		$("#" + PlayerService.PLAYER_ID).empty();
		setTimeout(function(){
			$scope.refreshPlayer();
		},0);
	};
	if (window.parent.kmc && window.parent.kmc.vars.studioV3.showFlashStudio === false){
		$(".menuFooter").css("bottom","1px");
	}
	window.parent.studioDataChanged = false; // used when navigating away from studio
    // load user entries data
    $scope.userEntries = [];
	$scope.selectedEntry = '';
	$scope.entriesTypeSelector = 'Entries';
	apiService.listMedia().then(function(data) {
		for (var i=0; i < data.objects.length; i++){
			$scope.userEntries.push({'id': data.objects[i].id, 'text': data.objects[i].name});
		}
		// set default entry
		if ($scope.playerData.tags.indexOf("player") !== -1){
			$scope.selectDefaultEntry($scope.userEntries);
		}
	});
	$scope.entriesSelectBox = select2Svc.getConfig($scope.userEntries, apiService.searchMedia); // set user entries select2 options and query

	// load user playlists data
	$scope.userPlaylists = [];
	apiService.listPlaylists().then(function(data) {
		for (var i=0; i < data.objects.length; i++){
			$scope.userPlaylists.push({'id': data.objects[i].id, 'text': data.objects[i].name});
		}
		if ($scope.playerData.tags.indexOf("playlist") !== -1){
			$scope.selectDefaultEntry($scope.userPlaylists);
			$scope.entriesTypeSelector = 'Playlist';
		}
	});
	$scope.playlistSelectBox = select2Svc.getConfig($scope.userPlaylists, apiService.searchPlaylists); // set user playlists select2 options and query

	$scope.setEntriesType = function(entriesType)	{
		$scope.entriesTypeSelector = entriesType;
		if (entriesType === 'Entries'){
			$scope.selectDefaultEntry($scope.userEntries);
		}else{
			$scope.selectDefaultEntry($scope.userPlaylists);
		}
		$scope.refreshPlayer();
	};

	$scope.selectDefaultEntry = function(entriesArr, callback){
		// get the preview entry: check if exists in cache and if so - check if exists in the entries list from server. If not found - use first entry from the list
		if (localStorageService.get('defaultEntry')){
			var previewEntry = localStorageService.get('defaultEntry');
			var found = false;
			for (var i=0; i<entriesArr.length; i++){
				if (entriesArr[i].id == previewEntry.id){
					found = true;
					$scope.selectedEntry = previewEntry;
				}
			}
			if (!found){
				$scope.selectedEntry = entriesArr[0];
			}
		}else{
			$scope.selectedEntry = entriesArr[0];
		}
		if (callback){
			callback();
		}
	};

	$scope.toggleMenu = function(){
		$scope.menuOpen = !$scope.menuOpen;
	};
    // load menu data and parse it
    editableProperties.then(function(data) {
		data=angular.copy(data); // prevent changing original data
	    // merge data with player data
	    $scope.mergePlayerData(data);

        // convert data to a menu array.
        $scope.templatesToLoad = 0;   // used to detect when all the menu was loaded
        $scope.propertiesSearch = []; // prepare an array for all properties to be used in search

        // add search section to the menu data
        $scope.menuData = [{'label': 'Menu Search', 'description': 'Search allows you to find any plugin property within the menu.', 'icon': 'TabSearch', 'properties':[{'type':'search','model':'menuProperties'}]}];
        var categoryIndex = 0; // for search indexing

        for (var cat in data){
            categoryIndex++;             // used for search indexing
            //$scope.templatesToLoad += 2; // for each category we load 2 templates: one for the icon and one for the data. currently removed to support IE8
            var category = {'label': data[cat].label, 'description': data[cat].description, 'icon': data[cat].icon, properties:[]};
            var plugs = data[cat].children;

            var plugins = [];
            var pluginIndex = -1; // for search indexing
            for (var plug in plugs){
                var p = plugs[plug];
                if (p.children === undefined){ // this is a flat object like a Flashvar and not a plugin
	                $scope.addPropertyToCategory(category, categoryIndex, p);
                }else{ // plugin
	                pluginIndex++;
	                $scope.propertiesSearch.push({'label': p.label,'categoryIndex':categoryIndex, 'accIndex': pluginIndex, 'id': 'accHeader'+categoryIndex + "_"  +pluginIndex}); // add accordion header to the search indexing
	                var plugin = {'enabled': p.enabled, 'label': p.label, 'description':p.description, 'isopen': !!p.isOpen, 'model': p.model, 'id': 'accHeader'+categoryIndex + "_" + pluginIndex, 'componentName': p.componentName, 'kalturaPlayerMinVersion': p.kalturaPlayerMinVersion};
	                plugin.properties = [];
	                // check for tabs
	                var tabObj = {'type':'tabs', 'children':[]}; // create tab object
	                if (p.sections){ // tabs found - create tabs
	                    $scope.templatesToLoad++; // count tabs template
	                    for (var tab=0; tab < p.sections.tabset.length; tab++){
	                        tabObj.children.push(p.sections.tabset[tab]);
	                    }
	                }
	                for (var i=0; i<p.children.length; i++){
	                    if (p.children[i].filter !== undefined) // apply filter if exists
		                    p.children[i].initvalue = $scope.getFilter(p.children[i].initvalue, p.children[i].filter);

	                    $scope.templatesToLoad++;
	                    if (p.sections && p.children[i].section){ // property should be put in the correct tab
	                        for (var t=0; t < tabObj.children.length; t++){
	                            if (p.children[i].section == tabObj.children[t].key){
	                                tabObj.children[t].children.push($.extend(p.children[i],{'id':'prop'+$scope.templatesToLoad}));
	                                $scope.propertiesSearch.push({'label':p.children[i].label + ' ('+ p.label +')','categoryIndex':categoryIndex, 'accIndex': pluginIndex, 'tabIndex': t, 'id': 'prop'+$scope.templatesToLoad}); // add property to search indexing
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
            }
            category.plugins = plugins;

            $scope.menuData.push(category);
        }

	    // add support for custom plugins
	    for (var pl in $scope.playerData.config.player.plugins ){
		    var custom_plugin = angular.copy($scope.playerData.config.player.plugins[pl]);
		    if ( custom_plugin.custom ){
			    delete custom_plugin.custom;
			    delete custom_plugin.enabled;
			    delete custom_plugin.plugin;
			    $scope.addCustomPlugin(pl, custom_plugin);
		    }
	    }

	    // to boost performances - don't render all categories now, only search and basic display
	    for (var j=2; j<$scope.menuData.length; j++){
		    $scope.menuData[j].pluginsNotLoaded = angular.copy($scope.menuData[j].plugins);
		    delete $scope.menuData[j].plugins;
	    }
        $scope.selectedCategory = $scope.menuData[1].label;
	    requestNotificationChannel.requestEnded('edit'); // hide spinner
	    $scope.refreshPlayer();
    });

	$scope.addPropertyToCategory = function(category, categoryIndex, property)	{
		$scope.templatesToLoad++;
		$scope.propertiesSearch.push({'label':property.label,'categoryIndex':categoryIndex, 'accIndex': -1, 'id': 'prop'+$scope.templatesToLoad});  // search indexing
		category.properties.push($.extend(property,{'id':'prop'+$scope.templatesToLoad}));
	};

    // set selected category when clicking on a category icon
    $scope.categorySelected = function(category){
	    if (category === "Advanced Settings") {
			$scope.updatePlayerData();
	    }
	    $scope.playerData.updateData = category !== "Advanced Settings";
        $scope.selectedCategory = category;
	    // for search - load all categories so we can display search results. use timeout to display the search screen before loading the categories (blocking code)
	    if (category == "Menu Search"){
		    $timeout(function(){
			    $("#searchField").focus();
			    for (var i=2; i<$scope.menuData.length; i++)
				    if ($scope.menuData[i].pluginsNotLoaded !== undefined){
					    $scope.menuData[i].plugins = angular.copy($scope.menuData[i].pluginsNotLoaded);
					    delete $scope.menuData[i].pluginsNotLoaded;
				    }
		    },50,true);
	    }
	    // if this category menu wasn't rendered yet - render it now
	    $timeout(function(){ // use a timeout to display the loading message
	    for (var i=2; i<$scope.menuData.length; i++)
		    if ($scope.menuData[i].label == category && $scope.menuData[i].pluginsNotLoaded !== undefined){
			    $scope.menuData[i].plugins = angular.copy($scope.menuData[i].pluginsNotLoaded);
			    delete $scope.menuData[i].pluginsNotLoaded;
		    }
	    },50,true);
    };

    // detect when the menu finished loading
	$scope.menuLoaded = false;
    $scope.templatesLoaded = 0;
    $scope.$on('$includeContentLoaded', function(event) {
        $scope.templatesLoaded++;
        if ($scope.templatesLoaded == $scope.templatesToLoad){
	        $scope.menuLoaded = true;
	        $timeout(function(){
		        $("#searchField").focus();
	        },100);

            //$("#debugger").show();
        }
    });

    // toggle plugin enable / disable
    $scope.togglePlugin = function(plugin, $event){
        $event.stopPropagation();
	    if (plugin.enabled){
		    // since we are getting the event before the value is changed - enabled means that the plugin is going to be disabled - remove validation
		    $scope.removeValidation(plugin);
		    delete $scope.playerData.config.player.plugins[plugin.model]; // remove the plugin from the player data
	    }else{
			if (plugin.componentName) {
			    window.KalturaPlayer = null;
		    }
		    $scope.addValidation(plugin);
	    }
	    if (plugin.model == "playlistAPI"){
		    if (plugin.enabled) {
			    $scope.entriesTypeSelector = "Entries";
			    $scope.selectDefaultEntry($scope.userEntries);
		    }else{
			    $scope.entriesTypeSelector = "Playlist";
			    $scope.selectDefaultEntry($scope.userPlaylists);
		    }
	    }

        if (this.category.label === "Cast") {
          $scope.toggleCastPlugins(plugin, this.category.plugins);
        }

	    $scope.refreshNeeded = true;
	    $scope.dataChanged = true;
	    window.parent.studioDataChanged = true; // used when navigating away from studio
    };

	$scope.toggleCastPlugins = function (plugin, plugins) {
		var senderElement = document.querySelector('#_' + plugins[0].id);
		var receiverElement = document.querySelector('#_' + plugins[1].id);
		var willActive = !plugin.enabled;
		var senderPlugin = plugins[0];
		var receiverPlugin = plugins[1];
		$scope.playerData.externals = $scope.playerData.externals || {};
		if (plugin.label === "Sender") {
			if (willActive) {
				receiverPlugin.enabled = false;
				receiverElement.classList.add('disabled');
                delete $scope.playerData.externals[receiverPlugin.componentName];
			} else {
				receiverElement.classList.remove('disabled');
			}
		} else {
			if (willActive) {
				$scope.playerData.externals[plugin.componentName] = {
					kalturaPlayerMinVersion: plugin.kalturaPlayerMinVersion,
					active: true
				};
				senderPlugin.enabled = false;
				senderElement.classList.add('disabled');
				delete $scope.playerData.config.cast;
                delete $scope.playerData.externals[senderPlugin.componentName];
			} else {
				senderElement.classList.remove('disabled');
                delete $scope.playerData.externals[plugin.componentName];
			}
		}
	};

	// remove validation for disabled plugins
	$scope.removeValidation = function(plugin){
		for (var i=0; i<plugin.properties.length; i++){
			delete plugin.properties[i].invalidTooltip;
			var id = plugin.properties[i].id;
			if ($.inArray(id, $scope.invalidProps) != -1)
				$scope.invalidProps.splice($scope.invalidProps.indexOf(id), 1);
		}
	};

	// revalidate enabled plugins
	$scope.addValidation = function(plugin){
		for (var i=0; i<plugin.properties.length; i++)
			$scope.validate(plugin.properties[i]);
	};

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
		var counter=0;
	    var blinkID = setInterval(function(){
		    var visible = $("#"+$item.id).css("visibility") == "visible" ? "hidden" : "visible";
		    $("#"+$item.id).css("visibility", visible);
		    counter++;
		    if (counter == 6)
		        clearInterval(blinkID);
	    },250);
    };

    // handle refresh
	$scope.lastRefreshID = ''; // used to prevent refresh on blur after refresh on enter
    $scope.propertyChanged = function(property, checkAutoRefresh){
	    if (property.resetKalturaPlayer){
		    window.KalturaPlayer = null;
	    }
	    if (property.model === "playerVersion" || property.model === "config.player.playback.textLanguage"){ // handle player version and captions select
		    $scope.updatePlayerData(); // update the player data from the menu data
	    }
	    if (property.model === "languageKey"){ // handle captions input updated
		    $scope.playerData.languageKey = property.initvalue;
	    }
	    if (property.componentName){ // handle external bundles
		    $scope.playerData.externals = $scope.playerData.externals || {};
		    $scope.playerData.externals[property.componentName] = {
			    kalturaPlayerMinVersion: property.kalturaPlayerMinVersion,
			    active: property.initvalue
		    };
	    }
	    if (property.selectedEntry && property.selectedEntry.id && property.model.indexOf("~") === 0){ // this is a preview entry change
		    $scope.selectedEntry = property.selectedEntry;
		    localStorageService.set('defaultEntry', property.selectedEntry);
		    $scope.refreshPlayer();
		    return;
	    }
	    if (property['player-refresh'] && property['player-refresh'].indexOf(".") != -1) { // handle setKDPAttribute values
		    var obj = property['player-refresh'].split(".")[0];
		    var prop = property['player-refresh'].split(".")[1];
		    var kdp = document.getElementById('kVideoTarget');
		    kdp.setKDPAttribute(obj, prop, property.initvalue);
		    return;
	    }
	    $scope.dataChanged = true;
	    window.parent.studioDataChanged = true; // used when navigating away from studio
        $scope.validate(property);
	    if (property.aspectRatio && property.aspectRatio!=="custom"){
		    var aspect = property.aspectRatio == "wide" ? 9/16 : 3/4;
		    $scope.playerData.height = parseInt($scope.playerData.width * aspect);
	    }
	    $scope.refreshNeeded = (property['player-refresh'] !== false);
	    if (checkAutoRefresh !== false && $scope.refreshNeeded && $scope.autoPreview){
		    if (checkAutoRefresh == 'enter') // prevent refresh on blur after refresh on enter
			    $scope.lastRefreshID = property.id;
		    if (checkAutoRefresh == 'blur' && $scope.lastRefreshID == property.id){
			    $scope.lastRefreshID = '';
		    }else{
		        $scope.refreshPlayer();
		    }
	    }
    };

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
        if (property.require && property.initvalue === "")
            property.invalidTooltip = "This field is required";

        // if not valid - add the invalid tooltip to this field and add this property to the invalid properties array
        if (property.invalidTooltip){
            $scope.isValid = false;
            $scope.invalidProps.push(property.id);
        }
    };

    $scope.checkPlayerRefresh = function(){
        return $scope.refreshNeeded;
    };

    $scope.refreshPlayer = function(){
        $scope.refreshNeeded = false;
	    if ($scope.selectedEntry !== ''){ // entries were already loaded - load the player
		    $scope.renderPlayer();
	    }else{ // wait for entries to load
		    $scope.intervalID = setInterval(function(){
			    if ($scope.selectedEntry !== ''){
				    clearInterval($scope.intervalID);
				    $scope.renderPlayer(); // load the player and stop waiting...
			    }
		    },100);
	    }
    };

	$scope.renderPlayer = function(){
		$scope.updatePlayerData(); // update the player data from the menu data
		$scope.$broadcast('beforeRenderEvent'); // allow other controllers to update the player data if needed
		$(".onpagePlaylistInterface").remove(); // remove any playlist onpage containers that might exists from previous rendering

		var flashvars = {};
		if ($scope.playerData.config.enviornmentConfig && $scope.playerData.config.enviornmentConfig.localizationCode){ // support localizationCode
			angular.extend(flashvars, {'localizationCode': $scope.playerData.config.enviornmentConfig.localizationCode});
		}
		delete $scope.playerData.config.enviornmentConfig;
		angular.extend(flashvars,{'jsonConfig': angular.toJson($scope.playerData.config)}); // update the player with the new configuration
		if (window.parent.kmc && window.parent.kmc.vars.ks){
			angular.extend(flashvars, {'ks': window.parent.kmc.vars.ks}); // add ks if available
		}
		if ($scope.isIE8) {                      // for IE8 add transparent mode
			angular.extend(flashvars, {'wmode': 'transparent'});
		}
		var entryID = $scope.selectedEntry && $scope.selectedEntry.id ? $scope.selectedEntry.id : $scope.selectedEntry;
		requestNotificationChannel.requestStarted('edit'); // show spinner
		PlayerService.renderPlayer($scope.playerData, flashvars, entryID, function () {
			requestNotificationChannel.requestEnded('edit'); // hide spinner
		}, $scope.entriesTypeSelector === "Playlist");
	};

	// merge the player data with the menu data
	$scope.mergePlayerData = function(data){

		// support multiple playlists
		if ($scope.playerData.config.player.plugins && $scope.playerData.config.player.plugins.playlistAPI) {
			var playlistData = $scope.playerData.config.player.plugins.playlistAPI;
			var playlistMenuArr = data.lookAndFeel.children.playlistAPI.children;
			var playlistIndex = 1;
			while (playlistData["kpl" + playlistIndex + "Id"]) {
				// check if we need to add this to the menu
				var found = false;
				for (var j = 0; j < playlistMenuArr.length; j++) {
					if (playlistMenuArr[j].model.indexOf("kpl" + playlistIndex + "Id") !== -1) {
						found = true;
					}
				}
				if (!found) {
					playlistMenuArr.push({"model": "config.player.plugins.playlistAPI.kpl" + playlistIndex + "Id", "type": "hiddenValue"});
					playlistMenuArr.push({"model": "config.player.plugins.playlistAPI.kpl" + playlistIndex + "Name", "type": "hiddenValue"});
				}
				playlistIndex++;
			}
		}

		for (var cat in data){
			var properties = data[cat].children;
			if ($.isArray(properties)){ // flat properties for basic display
				$scope.getPlayerProperties(properties);
			}else{ // plugin
				for (var plug in properties){
					if (properties[plug].children){
						// save plugin name in a model
						properties[plug].model = plug;
						// check plugin enabled
						if ($scope.playerData.config[plug] || $scope.playerData.config.player.plugins[plug] || plug == "uiVars" || (plug === "receiver" && $scope.playerData.externals && $scope.playerData.externals[properties[plug].componentName])){
							properties[plug].enabled = true;
						}else{
							properties[plug].enabled = false;
						}
						// get plugin properties from player data
						$scope.getPlayerProperties(properties[plug].children);
					}else{ // Flashvar
						$scope.getPlayerProperties([properties[plug]]);
					}
				}
			}
		}
	};

	$scope.getPlayerProperties = function(properties){
		for (var i=0; i<properties.length; i++){
			if (properties[i].model && properties[i].model.indexOf("~")==-1){
				var dataForModel = $scope.getDataForModel($scope.playerData, properties[i].model, properties[i].filter);
				if (dataForModel !== null){
					properties[i].initvalue = dataForModel;
				}
			}
		}
	};

	$scope.getDataForModel = function(data, model, filter){
		var val = angular.copy(data);
		var modelArr = model.split(".");
		for (var i=0; i < modelArr.length; i++){
			if (val[modelArr[i]] !== undefined){
				val = val[modelArr[i]];
			}else{
				return null;
			}
		}
		return filter !== undefined ?  $scope.getFilter(val, filter) : val;
	};

	$scope.getFilter = function(val, filter){
		if (filter == "companions" && !$.isArray(val)){
			var res = [];
			$.each( val, function( key, value ) {
				res.push({"label": key,"width": value.width,"height": value.height});
			});
			return res;
		}
		if (filter == "not"){
			return !val;
		}
		if (filter == "preload"){
			return val === "auto";
		}
		if (filter == "defaultLanguage"){
			if (val === "off" || val === "auto"){
				return val;
			} else {
				$scope.playerData.languageKey = val;
				return "explicit";
			}
		}
		if (filter == "accountCode"){
			if (val && val.accountCode) {
				return val.accountCode;
			} else {
				return val;
			}
		}
		if (filter == "loadVideoTimeout"){
			if (val && val.loadVideoTimeout) {
				return val.loadVideoTimeout;
			} else {
				return val;
			}
		}
		return val;
	};

	$scope.updatePlayerData = function(){
		if ($scope.playerData.updateData === false) {
			return;
		}
		for (var category=1; category < $scope.menuData.length; category++){ // we start at index=1 to skip the search category
			if ($scope.menuData[category].properties !== undefined){ // flat properties: basic properties
				$scope.setPlayerProperties($scope.menuData[category].properties);
			}
			if ($scope.menuData[category]['plugins'] !== undefined || $scope.menuData[category]['pluginsNotLoaded'] !== undefined){ // plugins
				var pluginsStr = $scope.menuData[category]['plugins'] !== undefined ? 'plugins' : 'pluginsNotLoaded'; // support plugins that we didn't render the menu for yet
				for (var plug=0; plug < $scope.menuData[category][pluginsStr].length; plug++)
					if ($scope.menuData[category][pluginsStr][plug].enabled === true) {// get only enabled plugins
						var plugin = $scope.menuData[category][pluginsStr][plug];
						$scope.setPluginData(plugin);
						$scope.setPlayerProperties(plugin.properties);
						if (plugin.custom){
							$scope.updateCustomPlugins(plugin.model);
						}
					}
			}
		}
	};

	$scope.setPluginData = function(plugin){
		$scope.playerData.plugins = $scope.playerData.plugins || {};
        var modelArr = plugin.model.split('.');
        var model = modelArr.length > 1 ? modelArr[modelArr.length - 1] : modelArr[0];
		$scope.playerData.plugins[model] = {
			componentName: plugin.componentName,
			kalturaPlayerMinVersion: plugin.kalturaPlayerMinVersion
		};
	};

	$scope.setPlayerProperties = function(properties){
		for (var i=0; i<properties.length; i++){
			if (properties[i].type == "tabs"){ // support tabs
				for (var tab = 0; tab < properties[i].children.length; tab++)
					for (var prop = 0; prop < properties[i].children[tab].children.length; prop++){
						$scope.setDataForModel(properties[i].children[tab].children[prop]);
					}
			}else{
				$scope.setDataForModel(properties[i]);
			}
		}
	};

	$scope.setDataForModel = function(data){
		if (data.model && data.model.indexOf("~")==-1 && data.type != 'readonly'){
			var objArr = data.model.split(".");  // break the model path to array
			var pData = $scope.playerData;
			for (var j=0; j<objArr.length; j++){  // go through the object names in the model path
				var prop = objArr[j];
				if (j == objArr.length-1 && data.initvalue !== undefined){  // last object in model path - this is the value property
					pData[prop] = data.filter ? $scope.setFilter(data.initvalue, data.filter) : data.initvalue; // set the data in this property
				}else{
					if (j == objArr.length-2 && !pData[prop]){ // object path doesn't exist - create is (add plugin that was enabled)
						pData[prop] = data.custom ? {'custom':true, 'enabled':true} : {'enabled':true};
					}
					if (pData[prop]) {
						pData = pData[prop];   // go to the next object in the object path
					}
				}
			}
		}
	};

	$scope.setFilter = function(data, filter){
		if (filter == "companions") {
			var res = {};
			for (var i = 0; i < data.length; i++) {
				res[data[i].label] = {width: data[i].width, height: data[i].height};
			}
			return res;
		}
        if (filter == "advertising") {
            if (!data) {
                delete $scope.playerData.config.cast.advertising;
            }
        }
		if (filter == "entry") {
			return data.id ? data.id : data;
		}
		if (filter == "not") {
			return !data;
		}
		if (filter == "preload") {
			return data ? "auto" : "none";
		}
		if (filter == "defaultLanguage") {
			if (data === "explicit") {
				return $scope.playerData.languageKey;
			} else {
				return data;
			}
		}
		if (filter == "accountCode") {
			var youboraOptions = {};
			if ($scope.playerData.config && $scope.playerData.config.player.plugins && $scope.playerData.config.player.plugins.youbora) {
				youboraOptions = $scope.playerData.config.player.plugins.youbora.options || {};
			}
			youboraOptions.accountCode = data;
			return youboraOptions;
		}
		if (filter == "loadVideoTimeout"){
			var adsRenderingSettings = {};
			if ($scope.playerData.config && $scope.playerData.config.player.plugins && $scope.playerData.config.player.plugins.ima) {
				adsRenderingSettings = $scope.playerData.config.player.plugins.ima.adsRenderingSettings || {};
			}
			adsRenderingSettings.loadVideoTimeout = Number(data);
			return adsRenderingSettings;
		}
		if (filter == "noEmpty") {
			return data || undefined;
		}
		if (filter == "numberOnly"){
			return Number(data);
		}
		if (filter == "nullableNumber"){
			return data ? Number(data) : undefined;
		}
		return data;
	};

	$scope.backToList = function(){
		if (!$scope.dataChanged) {
			$location.url('/list');
		}
		else {
			var modal = utilsSvc.confirm('Navigation confirmation','You are about to leave this page without saving, are you sure you want to discard the changes?', 'Continue');
			modal.result.then(function(result) {
				if (result) {
					$location.url('/list');
				}
			});
		}
	};

	$scope.save = function(){
		if ($scope.invalidProps.length > 0){
			utilsSvc.alert('Save Player Settings','Some plugin features values are invalid. The player cannot be saved.');
		}else{
			var savePlayer = function () {
				PlayerService.savePlayer($scope.playerData).then(function(value) {
						localStorageService.remove('tempPlayerID'); // remove temp player from storage (used for deleting unsaved players)
						apiService.setCache(false);                 // prevent the list controller from using the cache the next time the list loads
						utilsSvc.alert('Save Player Settings','Player Saved Successfully');
					},
					function(msg) {
						utilsSvc.alert('Player save failure',msg);
					}
				);
			};
			$scope.updatePlayerData();
			$scope.dataChanged = false;
			window.parent.studioDataChanged = false; // used when navigating away from studio
			if ($scope.playerData.config.player.plugins.playlistAPI && $scope.playerData.config.player.plugins.playlistAPI.plugin){
				$scope.addTags(['html5studio','playlist']); // set playlist tag
			}else{
				$scope.setTags(['kalturaPlayerJs','player', PlayerService.getPartnerType($scope.playerData)]); // set player tag
			}
			savePlayer();
		}
	};

	$scope.addTags = function(tags){
		tags.forEach(function(tag){
			if ($scope.playerData.tags.indexOf(tag) === -1){
				$scope.playerData.tags = $scope.playerData.tags + "," + tag;
			}
		});
	};

	$scope.setTags = function(tags){
		$scope.playerData.tags = tags;
	};

	$scope.setPluginEnabled = function (model, enabled) {
		for (var cat in $scope.menuData) {
			var plugins = $scope.menuData[cat].pluginsNotLoaded ? $scope.menuData[cat].pluginsNotLoaded : $scope.menuData[cat].plugins;
			if (plugins && plugins.length > 0) {
				for (var i = 0; i < plugins.length; i++) {
					if (plugins[i].model === model) {
						plugins[i].enabled = enabled; // update menu data so the plugin checkbox will update
						if ($scope.playerData.config.player.plugins[model] && !enabled) {
							delete $scope.playerData.config.player.plugins[model]; // remove plugin from player data if enabled=false
						}
					}
				}
			}
		}
	};

	$scope.addPlugin = function(){
		var modal = utilsSvc.userInput('Add custom plugin','Plugin Name:', 'Add',{"width":"50%"});
		$timeout(function(){
			$(".userInput").alphanum({allowSpace: false});
		},50);
		modal.result.then(function(result) {
			if (result) {
				$scope.addCustomPlugin(result, {});
			}
		});
	};

	$scope.importPlugin = function(){
		var modal = utilsSvc.userInput('Import plugin','Plugin Configuration String:', 'Import',{"width":"100%"});
		var keyVal;
		modal.result.then(function(result) {
			if (result) {
				var arr = result.split("&"); // break config string to array
				if ( arr[0].indexOf("=") == -1 ){ // we have a plugin name, create a custom plugin
					var model = arr[0];           // the plugin name is the first item in the array
					var data = {};
					for ( var  i = 1; i < arr.length; i++ ){ // break each item in the array to key/value pair and add to data object
						keyVal = arr[i].split("=");
						data[keyVal[0]] = keyVal[1];
					}
					$scope.addCustomPlugin(model,data);
				}else{
					for ( var  inx = 0; inx < arr.length; inx++ ){ // break each item in the array to key/value pair and add to UIVars in menu data
						keyVal = arr[inx].split("=");
						for ( var j=0; j < $scope.menuData.length; j++ ){
							if ( $scope.menuData[j].label === "Plugins" ){
								for ( var k = 0; k < $scope.menuData[j].plugins.length; k++ ){
									if ( $scope.menuData[j].plugins[k].model === "uiVars" ){
										var vars = $scope.menuData[j].plugins[k].properties[0].initvalue;
										vars.push( {'label':keyVal[0], 'value': keyVal[1]} );
									}
								}
							}
						}
					}
				}
			}
		});
	};

	$scope.addCustomPlugin = function(model, data){
		for (var i=0; i < $scope.menuData.length; i++){
			if ( $scope.menuData[i].label === "Plugins" ){
				$scope.menuData[i].plugins.push({
					description: model + " custom plugin.",
					enabled: true,
					isopen: $.isEmptyObject(data) ? true: false,
					custom: true,
					label: model + " custom plugin",
					model: model,
					properties: [{
						initvalue: data,
						allowComplexTypes: false,
						custom: true,
						helpnote: "Configuration options",
						label: "Configuration options",
						model: "config.player.plugins." + model + ".config", // set config object to be edited by the json editor. Will be copied and removed when saving player data
						type: "json"
					}]
				});
			}
		}
	};

	$scope.updateCustomPlugins = function(plugin){
		if ($scope.playerData.config.player.plugins[plugin] && $scope.playerData.config.player.plugins[plugin]["config"]){
			var conf = $scope.playerData.config.player.plugins[plugin]["config"];
			$scope.playerData.config.player.plugins[plugin] = {'enabled': true, 'custom': true, 'plugin': true}; // clear previous properties
			for (var prop in conf){ // copy properties from config object to the plugin root
				$scope.playerData.config.player.plugins[plugin][prop] = conf[prop];
			}
			delete $scope.playerData.config.player.plugins[plugin].config; // delete config object
		}
	};

}]);
