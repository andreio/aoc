/**
 * Created by andrei on 21/11/13.
 */

function ExampleController($scope, personService) {
    personService.load();
    $scope.refresh = function () {
        $scope.persons = personService.all();
    }

    $scope.refresh();
}

var aoc = angular.module('aoc');

aoc.configure('slider', function () {
    return {
        actions: {
            default: ['value']
        }
    }
})

aoc.configure('dialog', function (aocCompile, element) {
    return{
        actions: {
            default: ['open', 'close', 'destroy']
        },
        options: {
            autoOpen: false,
            resizable: false,
            modal: true,
            appendTo:'[ng-view]'
        },
        events: {
            'controlCreated': function () {
                var uiDialog = element.parent();
                aocCompile(uiDialog.find('.ui-dialog-titlebar,.ui-dialog-buttonpane'));
            }

        }
    }
});

aoc.configure('dialog', function (scope, control, personService) {
    var saveClicked;
    return {
        actions: {
            custom: {
                insert: function () {
                    this.open();
                    scope.title = "Inserting new person..."
                    scope.person = {age: 0};
                    saveClicked = function () {
                        personService.insert(scope.person);
                        this.close();
                    }
                },
                edit: function (id) {
                    this.open();
                    scope.person = personService.one(id);
                    scope.title = "Editing " + scope.person.name;
                    saveClicked = function () {
                        personService.update(scope.person);
                        this.close();
                    }
                }
            }
        },
        options: {
            buttons: [
                {text: "Save", click: function (a, b) {
                    saveClicked.call(control());
                }},
                {text: 'Cancel', click: function (a, b) {
                    control().close();
                }}
            ]
        }}
}, '#personDialog');

aoc.configure('dialog', function (scope, control, personService) {
    var saveClicked;
    return {
        actions: {
            custom: {
                confirm: function (id) {
                    this.open();
                    scope.person = personService.one(id);
                    saveClicked = function () {
                        personService.remove(id);
                        this.close();
                    }
                }

            }
        },
        options: {
            buttons: [
                {text: "Save", click: function (a, b) {
                    saveClicked.call(control());
                }},
                {text: 'Cancel', click: function (a, b) {
                    control().close();
                }}
            ]
        }

    }
}, '#deletePersonDialog');
