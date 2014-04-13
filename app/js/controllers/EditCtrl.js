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

KMCMenu.directive('onFinishRender', function ($timeout) {
	return {
		restrict: 'A',
		link: function (scope, element, attr) {
			if (scope.$last === true) { // accordion section finished loading - init jQuery plugins after 3 seconds to allow menu items to render first
				$timeout(function(){
					$(".numeric").numeric({'decimal': false, 'negative': false}); // set integer number fields to accept only numbers
					$(".float").numeric({'decimal': '.', 'negative': false});     // set float number fields to accept only floating numbers
				},3000);
			}
		}
	}
});

KMCMenu.controller('EditCtrl', ['$scope','$http', '$timeout','PlayerData','PlayerService', 'apiService', 'editableProperties', 'localStorageService','$routeParams','$modal', 'PlayerService','$location','requestNotificationChannel',
	function ($scope, $http, $timeout, PlayerData, PlayerService, apiService, editableProperties, localStorageService, $routeParams, $modal, PlayerService, $location, requestNotificationChannel) {

	$scope.playerData = angular.copy(PlayerData);   // get the player data
    $scope.isIE8 = window.ie8;                      // set IE8 flash for color picker
    $scope.invalidProps = [];                       // array of invalid properties
	$scope.dataChanged = false;                     // flag if the player data was changed so we can issue an alert if returning to list without saving
	$scope.aspectRatio = 9/16;                      // set aspect ratio to wide screen
	$scope.newPlayer = !$routeParams.id;            // New player flag

    // load user entries data
    $scope.userEntries = [];
	$scope.selectedEntry = '';
	apiService.listMedia().then(function(data) {
		for (var i=0; i < data.objects.length; i++){
			$scope.userEntries.push({'id': data.objects[i].id, 'text': data.objects[i].name});
		}
		// set default entry
		$timeout(function(){
			$scope.selectedEntry = localStorageService.get('defaultEntry') ? localStorageService.get('defaultEntry') : $scope.userEntries[0];
		},0,true)
	});
	// set user entries select2 options and query
	$scope.entriesSelectBox = {
		allowClear: true,
		width: '100%',
		initSelection : function (element, callback) {
			callback($(element).data('$ngModelController').$modelValue);
		},
		query: function (query) {
			var timeVar = null;
			if (query.term) {
				var data = {results: []};
				if (timeVar) {
					$timeout.cancel(timeVar);
				}
				timeVar = $timeout(function() {
					apiService.searchMedia(query.term).then(function(results) {
						angular.forEach(results.objects, function(entry) {
							data.results.push({id: entry.id, text: entry.name});
						});
						timeVar = null;
						return query.callback(data);
					});
				}, 200);
			}
			else{
				return query.callback({results: $scope.userEntries});
			}
			query.callback(data);
		}
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
                    var plugin = {'enabled': p.enabled, 'label': p.label, 'description':p.description, 'isopen': false, 'model': p.model, 'id': 'accHeader'+categoryIndex + "_" + pluginIndex};
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
	                    if (p.children[i].filter != undefined) // apply filter if exists
		                    p.children[i].initvalue = $scope.getFilter(p.children[i].initvalue, p.children[i].filter);

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

	    // to boost performances - don't render all categories now, only search and basic display
	    for (var i=2; i<$scope.menuData.length; i++){
		    $scope.menuData[i].pluginsNotLoaded = angular.copy($scope.menuData[i].plugins);
		    delete $scope.menuData[i].plugins;
	    }
        $scope.selectedCategory = $scope.menuData[1].label;
	    requestNotificationChannel.requestEnded('edit'); // hide spinner
	    $scope.refreshPlayer();
    })

    // set selected category when clicking on a category icon
    $scope.categorySelected = function(category){
        $scope.selectedCategory = category;
	    // for search - load all categories so we can display search results. use timeout to display the search screen before loading the categories (blocking code)
	    if (category == "Menu Search"){
		    $timeout(function(){
			    for (var i=2; i<$scope.menuData.length; i++)
				    if ($scope.menuData[i].pluginsNotLoaded != undefined){
					    $scope.menuData[i].plugins = angular.copy($scope.menuData[i].pluginsNotLoaded);
					    delete $scope.menuData[i].pluginsNotLoaded;
				    }
		    },50,true);
	    }
	    // if this category menu wasn't rendered yet - render it now
	    for (var i=2; i<$scope.menuData.length; i++)
		    if ($scope.menuData[i].label == category && $scope.menuData[i].pluginsNotLoaded != undefined){
			    $scope.menuData[i].plugins = angular.copy($scope.menuData[i].pluginsNotLoaded);
			    delete $scope.menuData[i].pluginsNotLoaded;
		    }
    }

    // detect when the menu finished loading
	$scope.menuLoaded = false;
    $scope.templatesLoaded = 0;
    $scope.$on('$includeContentLoaded', function(event) {
        $scope.templatesLoaded++;
        if ($scope.templatesLoaded == $scope.templatesToLoad){
	        $scope.menuLoaded = true;
            //$("#debugger").show();
        }
    });

    // toggle plugin enable / disable
    $scope.togglePlugin = function(plugin, $event){
        $event.stopPropagation();
	    if (plugin.enabled){
		    // since we are getting the event before the value is changed - enabled means that the plugin is going to be disabled - remove validation
		    $scope.removeValidation(plugin);
		    delete $scope.playerData.config.plugins[plugin.model]; // remove the plugin from the player data
	    }else{
		    $scope.addValidation(plugin);
	    }
	    $timeout(function(){$scope.refreshPlayer();},0,true);

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
	    if (property.selectedEntry && property.selectedEntry.id){ // this is a preview entry change
		    $scope.selectedEntry = property.selectedEntry.id;
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
		$scope.updatePlayerData(); // update the player data from the menu data
		// calculate player size according to aspect ratio
		var playerWidth = $scope.aspectRatio == 9/16 ? '100%' : '70%';
		$("#kVideoTarget").width(playerWidth);
		$("#kVideoTarget").height($("#kVideoTarget").width()*$scope.aspectRatio+40);
		var flashvars = {'jsonConfig': angular.toJson($scope.playerData.config)}; // update the player with the new configuration
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
			"entry_id": $scope.selectedEntry.id ? $scope.selectedEntry.id : $scope.selectedEntry,
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
			$modal.open({ templateUrl: 'template/dialog/message.html',
				controller: 'ModalInstanceCtrl',
				resolve: {
					settings: function() {
						return {
							'title': 'Save Player Settings',
							'message': 'Some plugin features values are invalid. The player cannot be saved.',
							buttons: [
								{result: true, label: 'OK', cssClass: 'btn-primary'}
							]
						};
					}
				}
			});
		}else{
			$scope.updatePlayerData();
			$scope.dataChanged = false;
			PlayerService.savePlayer($scope.playerData).then(function(value) {
					localStorageService.remove('tempPlayerID'); // remove temp player from storage (used for deleting unsaved players)
					apiService.setCache(false);                 // prevent the list controller from using the cache the next time the list loads
					$modal.open({ templateUrl: 'template/dialog/message.html',
						controller: 'ModalInstanceCtrl',
						resolve: {
							settings: function() {
								return {
									'title': 'Save Player Settings',
									'message': 'Player Saved Successfully',
									buttons: [
										{result: true, label: 'OK', cssClass: 'btn-primary'}
									]
								};
							}
						}
					});
				},
				function(msg) {
					$modal.open({ templateUrl: 'template/dialog/message.html',
						controller: 'ModalInstanceCtrl',
						resolve: {
							settings: function() {
								return {
									'title': 'Player save failure',
									'message': msg
								};
							}
						}
					});
				}
			);
		}
	}

	$scope.backToList = function(){
		if (!$scope.dataChanged) {
			$location.url('/list');
		}
		else {
			var modal = $modal.open(
				{ templateUrl: 'template/dialog/message.html',
					controller: 'ModalInstanceCtrl',
					resolve: {
						settings: function() {
							return {
								'title': 'Navigation confirmation',
								message: 'You are about to leave this page without saving, are you sure you want to discard the changes?'
							};
						}

					}});
			modal.result.then(function(result) {
				if (result) {
					$location.url('/list');
				}
			});
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
					// save plugin name in a model
					properties[plug].model = plug;
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
				var dataForModel = $scope.getDataForModel($scope.playerData, properties[i].model, properties[i].filter);
				if (dataForModel !== false){
					properties[i].initvalue = dataForModel;
				}
			}
		}
	}

	$scope.getDataForModel = function(data, model, filter){
		var val = angular.copy(data);
		var modelArr = model.split(".");
		for (var i=0; i < modelArr.length; i++){
			if (val[modelArr[i]] != undefined){
				val = val[modelArr[i]];
			}else{
				return false;
			}
		}
		return filter ?  $scope.getFilter(val, filter) : val;
	}

	$scope.getFilter = function(val, filter){
		if (filter == "companions" && !$.isArray(val)){
			var companions = val.split(";");
			val =[];
			for (var i=0; i<companions.length; i++)
				if (companions[i].indexOf(":") != -1)
					val.push({"label": companions[i].substr(0,companions[i].indexOf(":"))});
		}
		return val;
	}

	$scope.updatePlayerData = function(){
		for (var category=1; category < $scope.menuData.length; category++){ // we start at index=1 to skip the search category
			if ($scope.menuData[category].properties != undefined){ // flat properties: basic properties
				$scope.setPlayerProperties($scope.menuData[category].properties);
			}else{ // plugins
				var pluginsStr = $scope.menuData[category]['plugins'] != undefined ? 'plugins' : 'pluginsNotLoaded'; // support plugins that we didn't render the menu for yet
				for (var plug=0; plug < $scope.menuData[category][pluginsStr].length; plug++)
					if ($scope.menuData[category][pluginsStr][plug].enabled === true) {// get only enabled plugins
						$scope.setPlayerProperties($scope.menuData[category][pluginsStr][plug].properties);
					}
			}
		}
	}

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
	}

	$scope.setDataForModel = function(data){
		if (data.model && data.model.indexOf("~")==-1 && data.type != 'readonly'){
			var objArr = data.model.split(".");  // break the model path to array
			var pData = $scope.playerData;
			for (var j=0; j<objArr.length; j++){  // go through the object names in the model path
				var prop = objArr[j];
				if (j == objArr.length-1 && data.initvalue != undefined){  // last object in model path - this is the value property
					pData[prop] = data.filter ? $scope.setFilter(data.initvalue, data.filter) : data.initvalue; // set the data in this property
				}else{
					if (j == objArr.length-2 && !pData[prop]){ // object path doesn't exist - create is (add plugin that was enabled)
						pData[prop] = {'enabled':true};
					}
					pData = pData[prop];   // go to the next object in the object path
				}
			}
		}
	}

	$scope.setFilter = function(data, filter){
		var res = "";
		if (filter == "companions"){
			for (var i=0; i<data.length; i++){
				var size = data[i].label.substr(data[i].label.lastIndexOf("_")+1).split("x");
				res += data[i].label + ":" + size[0] + ":" + size[1] + ";";
			}
			return res.substr(0, res.length - 1);
		}
	}

}]);