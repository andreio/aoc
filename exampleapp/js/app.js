/**
 * Created by andrei on 11/16/13.
 */

var app = angular.module('app', ['aoc', 'ngRoute'], function () {
});

app.config(function ($routeProvider) {
    $routeProvider.when('/intro', {templateUrl: 'exampleapp/intro.html', controller: 'IntroController'})
        .when('/example', {templateUrl: 'exampleapp/example.html', controller: 'ExampleController'})
        .otherwise({redirectTo: '/intro'})


});

function MainController($scope) {
    $scope.log = function () {
        console.log("something");
    }

}

app.controller("IntroController", function () {
});

app.factory("personService", function () {
    var persons = {};
    var personId = 0;
    return {
        all: function () {
            var copy = {};
            angular.forEach(persons, function (person) {
                copy[person.id] = angular.extend({}, person);
            });
            return copy;
        },
        insert: function (person) {
            personId++;
            persons[personId] = {age: person.age, id: personId, name: person.name, location: person.location};
        },
        remove: function (personId) {
            delete persons[personId];
        },
        one: function (personId) {
            return angular.extend({}, persons[personId]);
        },
        update: function (person) {
            var _person = persons[person.id];
            if (!_person)return;
            _person.age = person.age;
            _person.name = person.name;
            _person.location = person.location;
        },
        load: function () {
            persons = [];
            personId = 0;
            this.insert({name: 'Andrei', location: 'Krakow', age: 23});
            this.insert({name: 'Alex', location: 'Bucharest', age: 28});
            this.insert({name: 'Ioana', location: 'Aarhus', age: 22});
        }


    }

});