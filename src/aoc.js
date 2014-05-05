/**
 * Angular optimized controls 0.4
 * @Author: Andrei Oprea Constantin
 * @Date: December 2013

 Copyright (c) 2014 Andrei Oprea Constantin
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

(function (angular) {

    'use strict';

    var aoc = angular.module('aoc', ['aocTools'], function () {
        }),
        EVENT_PREFIX = 'aocEvent',
        AOC_PREFIX = 'aoc',
        BINDING_PREFIX = '@',
        FN_PREFIX = '&';

    function evalAttribute(attrValue, scope, locals) {
        var modifier = attrValue[0],
            modifiedValue = attrValue.substr(1);
        if (modifier === BINDING_PREFIX)
            return '{{' + modifiedValue + '}}';
        if (modifier === FN_PREFIX)
            return argumentedCallInScope(scope)((function (args) {
                return scope.$eval(modifiedValue, angular.extend({}, locals, enumerateArr(args, '$arg')));
            }));
        return scope.$eval(attrValue, locals);
    }


    function parseAttributes(attrs, identifier, scope, locals, valueModifier, keyModifier, filter) {
        return objectMapper(attrs,
            valueModifier || function (value) {
                return evalAttribute(value, scope, locals);
            },
            keyModifier || preciseCamelReplace(identifier),
            filter || function (value, key) {
                return startsWith(key, identifier);
            });
    }

    function parseControls(attrs) {
        return parseAttributes(attrs, AOC_PREFIX, undefined, undefined, function (value) {
            return value;
        }, undefined, function (value, key) {
            return (!(key === AOC_PREFIX || startsWith(key, EVENT_PREFIX)) && startsWith(key, AOC_PREFIX));
        })
    }

    function parseEvents(attrs, scope, locals) {
        return parseAttributes(attrs, EVENT_PREFIX, scope, locals, function (value) {
            return evalAttribute(FN_PREFIX + value, scope, locals);
        });
    }

    function parseOptions(attrs, alias, scope, locals) {
        return parseAttributes(attrs, alias, scope, locals);
    }

    var configs = {};

    aoc.service('aocConfigure', function () {
        return function (config) {
            angular.forEach(config, function (cfg, control) {
                configs[control] = cfg;
            });
        }
    });

    function getConfigs(control, element) {
        var configObj;
        if (angular.isDefined(configObj = configs[control])) {
            return angular.isFunction(configObj) ?
                [configObj] :
                flattenKeyValue(configObj).filter(function (v) {
                    return v.key === 'default' || element.is(v.key);
                }).map(function (v) {
                        return v.value;
                    });
        }
        return [];
    }

    function defaultConfig() {
        return {
            actions: {
                'default': [],
                custom: {},
                defaultActionsInvoker: function (action, controlName, element, args) {
                    return element[controlName].apply(element, [action].concat(args));
                }

            },
            options: {},
            events: [],
            createFn: function (controlName, element, options) {
                return element[controlName](options);
            }
        }
    }


    function evaluateConfigs(configs, $injector, locals) {
        return configs.reduce(function (last, cur) {
            var evConfig = $injector.invoke(cur, undefined, locals);
            if (!evConfig.actions)
                evConfig.actions = last.actions;
            else {
                evConfig.actions['default'] = last.actions['default'].concat(evConfig.actions['default'] || []);
                evConfig.actions.custom = angular.extend(last.actions.custom, evConfig.actions.custom || {});
                evConfig.actions.defaultActionsInvoker = evConfig.actions.defaultActionsInvoker || last.actions.defaultActionsInvoker;
            }
            evConfig.options = angular.extend(last.options, evConfig.options || {});
            evConfig.events = last.events.concat(flattenKeyValue(evConfig.events));
            evConfig.createFn = evConfig.createFn || last.createFn;
            return evConfig;
        }, defaultConfig());
    }


    function applyInScope(fn, scope) {
        if (!(scope.$$phase || scope.$root.$$phase)) {
            return scope.$apply(function () {
                return fn();
            });
        }
        else return fn();
    }


    function argumentedCallInScope(scope, context) {
        return argumentedBindInScope(argumentizeCall, scope, context);
    }

    function argumentedBindInScope(bindFn, scope, context) {
        return function (fn, prepend, append) {
            return bindFn(function (args) {
                return applyInScope(function () {
                    return fn.apply(context, args);
                }, scope);
            }, undefined, prepend, append);
        }
    }

    function argumentedApplyInScope(scope, context) {
        return argumentedBindInScope(argumentizeApply, scope, context);
    }

    function ProxyControl(control) {
        angular.forEach(control, function (fn, action) {
            this[action] =
                function () {
                    return sanitizeHTMLReturn(fn.apply(control, sliceArguments(arguments)));
                }
        }, this);
    }

    var allControls = {};

    aoc.directive('aoc', function ($parse, $injector) {
            return{
                require: '?ngModel',
                link: function (scope, el, attrs, ngModel) {

                    var id, controls = {},
                        controlNames = parseControls(attrs),
                        controlLocals = {'$all': allControls};

                    (id = ( attrs.aoc || attrs.id || attrs.name)) && (allControls[id] = {});


                    angular.forEach(parseEvents(attrs, scope, controlLocals), function (fn, e) {
                        el.on(e, argumentizeApply(fn.apply, fn, [el]));
                    });
                    angular.forEach(controlNames, function (alias, controlName) {

                        var control = (controls[controlName] = {}),
                            config = evaluateConfigs(getConfigs(controlName, el), $injector,
                                {control: control, element: el, controlName: controlName, scope: scope}),
                            controlCall = argumentedCallInScope(scope, control),
                            controlApply = argumentedApplyInScope(scope, control);

                        angular.forEach(config.events, function (event) {
                            el.on(event.key, controlCall(event.value));
                        });

                        angular.forEach(config.actions['default'], function (action) {
                            control[action] = controlCall(config.actions.defaultActionsInvoker, [action, controlName, el]);
                        });
                        angular.forEach(config.actions.custom, function (fn, action) {
                            control[action] = controlApply(fn);
                        });

                        controlLocals['$' + controlName] = new ProxyControl(control);
                        allControls[id] && (allControls[id][controlName] = controlLocals['$' + controlName]);
                        config.createFn.call(control, controlName, el, angular.extend({}, config.options, parseOptions(attrs, alias || controlName, scope, controlLocals)));
                        el.triggerHandler('controlCreated', controlName);
                    });

                    if (ngModel) {
                        scope.$watch(attrs.ngModel, function (newValue, oldValue) {
                            if (newValue === oldValue && ngModel.$dirty)return;
                            el.trigger('modelChanged', {'newValue': newValue, 'oldValue': oldValue});
                        });
                    }
                    el.data('aocControls', controls);
                }
            }
        }
    )
    ;

    aoc.directive('scope', function () {
        return {
            scope: true
        }
    });

    aoc.factory('aocControls', function () {
        return function (aocId) {
            return allControls[aocId];
        }
    });

    function camelReplace(inThisString, thisString, withThisString) {
        var result = inThisString.replace(thisString, withThisString);
        return  result[0].toLowerCase() + result.substring(1);
    }

    function preciseCamelReplace(thisString) {
        return function (inThisString) {
            return camelReplace(inThisString, thisString, '');
        }
    }

    function startsWith(str, str2) {
        return str.indexOf(str2) == 0;
    }

    function enumerateArr(arr, key) {
        return objectMapper(arr, null, function (i) {
            return key + i
        });
    }

    function sanitizeHTMLReturn(ret) {
        return ret instanceof angular.element ? ret.text() : ret;
    }

    function objectMapper(obj, valueModifier, keyModifier, filter) {
        var ret = {};
        angular.forEach(obj, function (value, key) {
            if (filter && !filter(value, key))return;
            ret[keyModifier ? keyModifier(key, value) : key] = valueModifier ? valueModifier(value, key) : value;
        });
        return ret;
    }

    function flatten(obj, flatFn) {
        var ret = [];
        angular.forEach(obj, function (v, k) {
            ret.push(flatFn(v, k));
        });
        return ret;
    }


    function flattenKeyValue(obj) {
        return flatten(obj, function (v, k) {
            return {key: k, value: v};
        });
    }

    function argumentize(fn, invokeFn, context, prepend, append) {
        return function () {
            var args = (prepend || []).concat([sliceArguments(arguments)]).concat(append || []);
            return invokeFn.call(fn, context, args);
        }
    }

    function argumentizeApply(fn, context, prepend, append) {
        return argumentize(fn, Function.prototype.apply, context, prepend, append);
    }

    function argumentizeCall(fn, context, prepend, append) {
        return argumentize(fn, Function.prototype.call, context, prepend, append);
    }

    function sliceArguments(args) {
        return Array.prototype.slice.call(args);
    }


    aoc.constant('aocTools', {
        camelReplace: camelReplace,
        preciseCamelReplace: preciseCamelReplace,
        startsWith: startsWith,
        enumerateArr: enumerateArr,
        sanitizeHTMLReturn: sanitizeHTMLReturn,
        objectMapper: objectMapper,
        flatten: flatten,
        flattenKeyValue: flattenKeyValue,
        argumentizeCall: argumentizeCall,
        argumentizeApply: argumentizeApply,
        argumentize: argumentize,
        sliceArguments: sliceArguments
    });

})(angular);
