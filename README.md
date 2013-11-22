aoc
===

Angular optimized components

===

Description
---

This library intends to offer a more streamlined way to use jQuery Widget components inside the AngularJS framework environment.

Setting up
---

Reference jQuery, jQuery-ui, angular and aocWrapper.
Example: 'app/index.html'

'...
 <body ng-app="app" ng-controller="app">...</body>
 <script src="../bower_components/jquery/jquery.js"></script>
 <script src="../bower_components/jquery-ui/ui/jquery-ui.js"></script>
 <script src="../bower_components/angular/angular.js"></script>

 <script src="../src/app.js"></script>
 <script src="../src/aocWrapper.js"></script>
 <script src="../src/controller.js"></script>
 ...
'

Include 'aoc' module into you application module.
Example: 'src/app.js'

