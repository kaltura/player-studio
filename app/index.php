<!doctype html>
<html lang="en" ng-app="KMCModule">
<head>
    <meta charset="utf-8">
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
    <script type="text/javascript" src="bower_components/jquery/jquery.js"></script>
    <!--change this base tag to the root of your app URL-->
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
    <script type="text/javascript"
            src="lib/malihu_custon_scrollbar/jquery.mCustomScrollbar.js"></script>
    <script type="text/javascript" src="bower_components/select2/select2.js"></script>
    <script type="text/javascript" src="bower_components/angular/angular.js"></script>
    <script type="text/javascript" src="bower_components/angular-route/angular-route.js"></script>
    <script type="text/javascript" src="bower_components/angular-sanitize/angular-sanitize.js"></script>
    <script type="text/javascript" src="bower_components/angular-animate/angular-animate.js"></script>
    <script type="text/javascript" src="bower_components/angular-ui-select2/src/select2.js"></script>
    <script src="lib/sprintf.js"></script>
    <script src="lib/localize.js"></script>
    <script src="lib/spin.min.js"></script>
    <script src="lib/angular-ui-bootstrap/ui-bootstrap-tpls-0.7.0.js"></script>
    <script src="lib/spinedit/js/bootstrap-spinedit.js"></script>
    <script src="lib/colorpicker/js/bootstrap-colorpicker-module.js"></script>
    <script src="lib/localStorage/angular-local-storage.js"></script>
    <script src="lib/jquery.timeago.js"></script>
    <script src="lib/jquery.animate-colors-min.js"></script>
    <script src="js/app.js"></script>
    <script src="js/menu.js"></script>
    <script src="js/filters.js"></script>
    <script src="js/controllers/controllers.js"></script>
    <script src="js/directives.js"></script>
    <script src="js/services/services.js"></script>
    <script src="js/controllers/playerListCtrl.js"></script>
    <script src="js/controllers/playerEditCtrl.js"></script>
    <script src="js/controllers/LoginCtrl.js"></script>
    <script src="js/controllers/playerCreateCtrl.js"></script>
</head>
<body>
<loading-widget></loading-widget>
<section class="relative" ng-view></section>
</body>
</html>
