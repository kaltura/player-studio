<!DOCTYPE html>
<html id="ng-app" lang="en" ng-app="KMCModule" xmlns:ng="http://angularjs.org">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <base href="<?php
    $dir = $_SERVER['REQUEST_URI'];
    $dir = str_replace('\\', '/', $dir);
    $dirArr = explode('/', $dir);
    if (count($dirArr) > 1) {
        while (!file_exists($dir . 'index.php')) {
            array_pop($dirArr);
            $dir = implode('/', $dirArr);
        }
    }
    if ($dir != '/') $dir .= '/';
    echo $dir;
    ?>"/>
    <!-- HTML5 shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
    <script>
        document.documentElement.className += " IE8";
    </script>
    <script type="text/javascript" src="vendor/jquery-1.10.2.min.js"></script>
    <script type="text/javascript" src="lib/html5shiv.js"></script>
    <script type="text/javascript" src="lib/respond.min.js"></script>
    <script type="text/javascript" src="lib/es5-shim.min.js"></script>
    <![endif]-->
    <!--[if gte IE 9]><!-->

    <!--<![endif]-->
    <title>Player Studio</title>
    <!--[if gte IE 9]>
    <style type="text/css">
        .gradient {
            filter: none;
        }
    </style>
    <![endif]-->
    
    <!-- HTML5 library -->
    <script type="text/javascript" src="../../../../html5/html5lib/v2.1/mwEmbedLoader.php"></script>
    
    <!--  app stylesheet-->
    <link rel="stylesheet" href="css/studio.css"/>
    <link rel="stylesheet" href="css/vendor.css"/>
    
    <!-- min vendor lib -->
    <script type="text/javascript" src="vendor/vendor.min.js"></script>

    <!-- min extrnal lib -->
    <script type="text/javascript" src="lib/libs.min.js"></script>

    <!-- min internal scripts -->
    <script type="text/javascript" src="main.min.js"></script>

    <!--  Angular templates -->
    <script type="text/javascript" src="templates.js"></script>

</head>
<loading-widget></loading-widget>
<div class="section relative" ng-view></div>
</body>
</html>
