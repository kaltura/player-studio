<!DOCTYPE html>
<html id="ng-app" lang="en" ng-app="KMCModule" xmlns:ng="http://angularjs.org">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <base href="<?php
    $dir = $_SERVER['REQUEST_URI'];
    $dir = str_replace('\\', '/', $dir);
    if ($dir != '/') $dir .= '/';
    echo $dir;
    ?>"/>
    <script type="text/javascript" src="lib/modernizer.min.js"></script>
    <!-- HTML5 shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
    <script>
        document.documentElement.className += " IE8";
    </script>
    <script type="text/javascript" src="bower_components/jquery/jquery-1.10.2.min.js"></script>
    <script type="text/javascript" src="lib/html5shiv.js"></script>
    <script type="text/javascript" src="lib/respond.min.js"></script>
    <script type="text/javascript" src="lib/es5-shim.min.js"></script>
    <![endif]-->
    <!--[if gte IE 9]><!-->
    <script type="text/javascript" src="bower_components/jquery/jquery.min.js"></script>
    <!--<![endif]-->
    <title>Player Studio - JS Version</title>
    <!--[if gte IE 9]>
    <style type="text/css">
        .gradient {
            filter: none;
        }
    </style>
    <![endif]-->
    <script type="text/javascript" src="http://kgit.html5video.org/pulls/500/mwEmbedLoader.php?debug=true"></script>
    <!--    app stylesheet-->
    <link rel="stylesheet" href="css/studio.css"/>
    <link rel="stylesheet" href="css/vendor.css"/>
    <!--    app  external resources - should be minified & concated or copied to _dist-->
    <!-- from bower (you have config in bowe.json)-->
    <script type="text/javascript" src="bower_components/jquery-ui/ui/minified/jquery.ui.core.min.js"></script>
    <script type="text/javascript" src="bower_components/jquery-ui/ui/minified/jquery.ui.widget.min.js"></script>
    <script type="text/javascript" src="bower_components/jquery-ui/ui/minified/jquery.ui.mouse.min.js"></script>
    <script type="text/javascript" src="bower_components/jquery-ui/ui/minified/jquery.ui.sortable.min.js"></script>
    <script type="text/javascript" src="bower_components/select2/select2.min.js"></script>
    <script type="text/javascript" src="bower_components/angular/angular.min.js"></script>
    <script type="text/javascript" src="bower_components/angular-route/angular-route.min.js"></script>
    <script type="text/javascript" src="bower_components/angular-sanitize/angular-sanitize.min.js"></script>
    <script type="text/javascript" src="bower_components/angular-animate/angular-animate.min.js"></script>
    <script type="text/javascript" src="bower_components/angular-ui-sortable/src/sortable.min.js"></script>
    <script type="text/javascript" src="bower_components/angular-ui-select2/src/select2.min.js"></script>
    <!-- extrnal lib -->
    <script type="text/javascript" src="lib/malihu_custon_scrollbar/jquery.mousewheel.min.js"></script>
    <script type="text/javascript" src="lib/malihu_custon_scrollbar/jquery.mCustomScrollbar.js"></script>
    <script type="text/javascript" src="lib/localStorage/angular-local-storage.js"></script>
    <script type="text/javascript" src="lib/angular-ui-bootstrap/ui-bootstrap-tpls-0.7.0.js"></script>
    <script type="text/javascript" src="lib/spinedit/js/bootstrap-spinedit.js"></script>
    <script type="text/javascript" src="lib/colorpicker/js/bootstrap-colorpicker-module.js"></script>
    <!-- min extrnal lib -->
    <script type="text/javascript" src="lib/libs.min.js"></script>
    <!-- min internal scripts -->
    <script type="text/javascript" src="main.min.js"></script>
    <script type="text/javascript" src="templates.js"></script>
</head>
<loading-widget></loading-widget>
<div class="section relative" ng-view></div>
</body>
</html>
