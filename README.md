aoc
===

Angular optimized components


Description
---

This library is intended to offer a more streamlined way to use jQuery Widget components inside the AngularJS framework environment.

Setting up
---

Reference jQuery, jQuery-ui, angular and aocWrapper.

Example: `app/index.html`

    ...
    <body ng-app="app" ng-controller="app">...</body
    <script src="../bower_components/jquery/jquery.js"></script>
    <script src="../bower_components/jquery-ui/ui/jquery-ui.js"></script>
    <script src="../bower_components/angular/angular.js"></script>
    <script src="../src/app.js"></script>
    <script src="../src/aocWrapper.js"></script>
    <script src="../src/controller.js"></script>
    ...


Include `aoc` module into you application module.

Example: `src/app.js`

    ...
    angular.module('app', ['aoc'], function () {});
    ...
    
That's it! Now we are ready to start using the library.

Usage
----

To use the library we first start by injecting the `aoc` module where it is required and then configuring whatever `jQuery Widget` components we want to use.

Example: `src/controller.js`

    var aoc = angular.module('aoc');
    aoc.configure('dialog', function (scope, controller) {
        controller._onWidgetCreated(function(controller){
            console.log(controller._getWidget());
        });
        return {
            actions: {
                default: ['open', 'destroy', 'close']
            },
            options: {
                autoOpen: false
            }
        }
    });

After setting the options for the components we need to use, we can use the `aoc` directive with the respective `component` attributes in our HTML pages.

Example: `app/index.html`

    <div aoc component="dialog" id="editPerson" option-e-modal="true" option-e-resizable="false" option-e-auto-open="true" option-e-width="250">
        <form name="person-form">
            <fieldset>
                <label>Name <input ng-model="person.name"></label>
                <label>Age<input ng-model="person.age" type="text"/></label>
                <label>Profession<input ng-model="person.profession" type="text"/></label>
            </fieldset>
        </form>
    </div>

API
----

The entry point for using the functionality of this library is the `configure()` function in the `aoc` angular module.
The definition of the function is:

    function configure(componentName, options, selector)

`componentName`
-
The name of the jQuery Widget.

`options` 
-
Options object to be passed to the jQuery Widget constructor.

Format:

    {
        actions: 
        {
            default: [],
            custom: {}
        },
        options: 
        {
        }
    }

- `default`: Array of  

`selector`
-
specifies that the options should only be applied to elements who match the selector.



    




