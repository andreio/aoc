/**
 * Created by andrei on 21/11/13.
 */

var aoc = angular.module('aoc');
aoc.configure('progressbar',function(scope,controller){
    return {
        actions:{
            default:['value']
        }
    }
});