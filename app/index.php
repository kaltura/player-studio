<!doctype html>
<html id="ng-app" lang="en" ng-app="KMCModule">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <base href="<?php
    $dir = $_SERVER['REQUEST_URI'];
    $dir = str_replace('\\', '/', $dir);
    if ($dir != '/') $dir .= '/';
    if (strpos($dir, '/app') > 0) {
        // remove every after /app/ to work with url actions - NOTICE "/app" does not exist if using virtual host directly to the app directory
        $dirParts = explode('/app', $dir);
        echo $dirParts[0] . '/app/';
    } else echo "/";
    ?>"/>
    <!--[if lte IE 9]>
    <script type="text/javascript" src="bower_components/jquery/jquery-1.10.2.js"></script>
    <![endif]-->
    <!--[if gte IE 9]><!-->
    <script type="text/javascript" src="bower_components/jquery/jquery.js"></script>
    <!--<![endif]-->
    <!-- HTML5 shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
    <script type="text/javascript" src="lib/html5shiv.js"></script>
    <script type="text/javascript" src="lib/respond.min.js"></script>
    <![endif]-->
    <title>Player Studio - JS Version</title>
    <!-- Latest compiled and minified CSS -->
    <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css">
    <!-- Optional theme -->
    <!--    <link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap-theme.min.css">-->
    <!-- Latest compiled and minified JavaScript -->
    <script src="//netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js"></script>
    <link rel='stylesheet' href='lib/colorpicker/css/colorpicker.css'/>
    <link rel='stylesheet' href='lib/spinedit/css/bootstrap-spinedit.css'/>
    <link rel='stylesheet' href='lib/malihu_custon_scrollbar/jquery.mCustomScrollbar.css'/>
    <!--[if gte IE 9]>
    <style type="text/css">
        .gradient {
            filter: none;
        }
    </style>
    <![endif]-->
    <!-- TODO move to ini file -->
    <script type="text/javascript" src="http://kgit.html5video.org/tags/v2.0.0.rc7/mwEmbedLoader.php"></script>
    <link rel="stylesheet" href="bower_components/select2/select2.css">
    <link rel="stylesheet" href="lib/prettycheckable/dist/prettyCheckable.css">
    <!--    app stylesheets - should be loaded in the views...-->
    <link rel="stylesheet" href="css/app.css"/>
    <link rel="stylesheet" href="css/edit.css"/>
    <link rel="stylesheet" href="css/new.css"/>
    <link rel="stylesheet" href="css/list.css"/>
    <link rel="stylesheet" href="css/icons.css"/>
    <script type="text/javascript"
            src="lib/malihu_custon_scrollbar/jquery.mousewheel.min.js"></script>
    <script type="text/javascript" src="bower_components/jquery-ui/ui/jquery.ui.core.js"></script>
    <script type="text/javascript" src="bower_components/jquery-ui/ui/jquery.ui.widget.js"></script>
    <script type="text/javascript" src="bower_components/jquery-ui/ui/jquery.ui.mouse.js"></script>
    <script type="text/javascript" src="bower_components/jquery-ui/ui/jquery.ui.sortable.js"></script>
    <script type="text/javascript"
            src="lib/malihu_custon_scrollbar/jquery.mCustomScrollbar.js"></script>
    <script type="text/javascript" src="bower_components/select2/select2.js"></script>
    <script type="text/javascript" src="bower_components/angular/angular.js"></script>
    <script type="text/javascript" src="bower_components/angular-route/angular-route.js"></script>
    <script type="text/javascript" src="bower_components/angular-sanitize/angular-sanitize.js"></script>
    <script type="text/javascript" src="bower_components/angular-animate/angular-animate.js"></script>
    <script type="text/javascript" src="bower_components/angular-ui-sortable/src/sortable.js"></script>
    <script type="text/javascript" src="bower_components/angular-ui-select2/src/select2.js"></script>
    <script type="text/javascript" src="lib/sprintf.js"></script>
    <script type="text/javascript" src="lib/localize.js"></script>
    <script type="text/javascript" src="lib/spin.min.js"></script>
    <script type="text/javascript" src="lib/angular-ui-bootstrap/ui-bootstrap-tpls-0.7.0.js"></script>
    <script type="text/javascript" src="lib/spinedit/js/bootstrap-spinedit.js"></script>
    <script type="text/javascript" src="lib/colorpicker/js/bootstrap-colorpicker-module.js"></script>
    <script type="text/javascript" src="lib/localStorage/angular-local-storage.js"></script>
    <script type="text/javascript" src="lib/jquery.timeago.js"></script>
    <script type="text/javascript" src="lib/jquery.animate-colors-min.js"></script>
    <script type="text/javascript" src="js/app.js"></script>
    <script type="text/javascript" src="js/menu.js"></script>
    <script type="text/javascript" src="js/filters.js"></script>
    <script type="text/javascript" src="js/controllers/controllers.js"></script>
    <script type="text/javascript" src="js/directives.js"></script>
    <script type="text/javascript" src="js/services/services.js"></script>
    <script type="text/javascript" src="js/controllers/playerListCtrl.js"></script>
    <script type="text/javascript" src="js/controllers/playerEditCtrl.js"></script>
    <script type="text/javascript" src="js/controllers/LoginCtrl.js"></script>
    <script type="text/javascript" src="js/controllers/playerCreateCtrl.js"></script>
</head>
<body>
<loading-widget></loading-widget>
<section class="relative" ng-view></section>
<!--[if lte IE 9]>
<script>
    window.myCustomTags = [ 'featureMenu', 'highlight', 'navmenu', 'menuSearchCtl', 'menuLevel', 'menuHead'
        'mcustomScrollbar', 'timeago', 'modelRadio', 'modelColor', 'modelText', 'select2Data', 'modelEdit', 'modelTags',
        'modelSelect', 'parentContainer', 'sortOrder', 'infoAction', 'modelCheckbox', 'readOnly', 'modelButton',
        'modelNumber', 'loadingWidget']; // any E type directive needs to be here for IE8 compatibility
</script>
<script src="bower_components/angular-ui-utils/modules/ie-shiv/ie-shiv.js"></script>
<![endif]-->
</body>
</html>
