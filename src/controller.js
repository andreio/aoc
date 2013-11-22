/**
 * Created by andrei on 21/11/13.
 */

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

aoc.configure('dialog',function(scope,controller){
    return {
        actions: {
            custom: {
                'edit': function (person) {
                    controller.open();
                    scope.person = person;
                }
            }
        },
        options: {
            buttons: [
                {text: "Close",
                    click: function () {
                        controller.close();
                    }
                }
            ]
        }
    }
},'#alert');

aoc.configure('dialog',function(){

    return {
        options:{
            autoOpen:true
        }
    }
},
'#custom');

aoc.configure('tabs',function(){
    return {
        actions:{
            default:['enable','disable']
        }

    }

});