aoc
====

Angular optimized components


Usage
----


    <element aoc aoc-comp1 aoc-comp2>

    </element>

It's as simple as adding two attributes to the root element of the component:

*   `aoc` Marks the element.
*   `aoc-[component-name]` Specifies the component(s) that will be instantiated on element. Multiple component can be used at the same time.

With the default 'initializer' the preceding code is behaviorally equivalent to:

    $('element').comp1(); $('element').comp2();


Basic Configuration
----

The components can be configured in two ways. Inline as attributes on the element or, supporting more advanced, in JS.
The most popular configurable things are component `options` and `events`.

Inline
---

    <div aoc aoc-dialog
        dialog-modal="true"
        dialog-width="500"
        dialog-close-text="'Close me'"
        dialog-close="onDialogClose();"
        event-focus="onFocus($arg1,$arg2)">
    </div>

Setting up options for the component is done by adding attributes in the form of `[component-name]-[option-name]="optionValue"`.
Generally option values are evaluated in a manner similar to `{{someValue}}` in angular attributes and then passed to the options set of the component. Note that strings have to be enclosed in double quotes.

Events can also be set in a similar manner `[component-name]-[event-name]="onEvent($arg1,$arg2 ...)"`, with the difference that the value of the event is evaluated as a function at runtime, and has access to the event arguments.

Javascript
---

`<div aoc aoc-dialog></div>`


<pre> angular.module('myComponents',['aoc'])
        .run(function(aocConfigure){
            return {
                dialog:function(scope){
                    return {
                        options:{
                            modal:true,
                            width:500,
                            closeText:"Close me",
                            close:function(){scope.onDialogClose();
                            },
                        events:{
                            focus:scope.onFocus.bind(scope)
                        }
                    }
                 }
            }
        }})
</pre>