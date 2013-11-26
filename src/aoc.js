/**
 * @Author: Andrei Oprea Constantin
 * @Date: November 2013
 */

(function (angular) {

    'use strict';

    var aoc = angular.module('aoc', [], function () {
    });

// ********** CONFIG SECTION ************
    var configs = {};

    function Config(general) {
        this.general = general;
        this.specific = [];
        this.setGeneral = function (config) {
            this.general = config;
        };
        this.addSpecific = function (config, id) {
            this.specific.push({config: config, id: id});
        };
        this.filterSpecific = function (filterFn) {
            var configs = [];
            angular.forEach(this.specific, function (e) {
                if (filterFn(e.id))
                    configs.push(e.config);
            });
            return configs;
        };
        this.aggregate = function (reduceFn, baseConfig, filterFn) {
            return [this.general].concat(this.filterSpecific(filterFn || function () {
                return true;
            })).reduce(reduceFn, baseConfig);
        }
    }

    function AocConfig(scope, controlName, element, invokeFunction) {
        var config = evaluateConfig(configs[controlName] || new Config(function () {
            return {};
        }), element, function (config) {
            return invokeFunction.call(this, config);
        });
        angular.extend(this, config);
        this.element = element;
        this.controlName = controlName;
        this.scope = scope;
    }


    function configure(controlName, configuration, selector) {
        var config = (configs[controlName] || (configs[controlName] = new Config(function () {
            return {}
        })));
        selector ? config.addSpecific(configuration, selector) : config.setGeneral(configuration);
    }

    aoc.configure = configure;

    function evaluateConfig(config, element, invokeFunction) {
        return config.aggregate(
            function (prevConfig, thisConfig) {
                thisConfig = invokeFunction(thisConfig);
                var retConfig = {};
                angular.extend(retConfig, prevConfig);
                (thisConfig.actions) && (retConfig.actions.default = retConfig.actions.default.concat(thisConfig.actions.default || []));
                (thisConfig.actions) && (angular.extend(retConfig.actions.custom, thisConfig.actions.custom || {}));
                (thisConfig.actions) && (retConfig.actions.defaultInvoker = (thisConfig.actions.defaultInvoker || retConfig.actions.defaultInvoker));
                (thisConfig.options) && (angular.extend(retConfig.options, thisConfig.options));
                (thisConfig.events) && (angular.extend(retConfig.events, thisConfig.events));
                (thisConfig.createFn) && (retConfig.createFn = thisConfig.createFn);
                return retConfig;
            }, {
                actions: {
                    default: [],
                    custom: {},
                    defaultInvoker: function (element, controlName, args) {
                        if (!element[controlName]) {
                            console.error('defaultInvoker: invalid control name: ' + controlName + ". If this is not a jQuery Widget style component in the form of 'element['controlName'](options)' with the method accessing format'element[control](methodName,arguments)' consider setting a custom defaultInvoker function and createFn function respectively in the configuration of the control with the same control name ");
                            return
                        }
                        ;
                        element[controlName].apply(element, args);
                    }
                },
                options: {},
                events: {},
                createFn: function (element, controlName, options) {
                    if (!element[controlName]) {
                        console.error('defaultInvoker: invalid control name: ' + controlName + ". If this is not a jQuery Widget style component in the form of 'element['controlName'](options)' with the method accessing format'element[control](methodName,arguments)' consider setting a custom defaultInvoker function and createFn function respectively in the configuration of the control with the same control name ");
                        return;
                    }
                    return element[controlName](options);
                }
            }, function (selector) {
                return element.is(selector);
            }
        )
    }

//************** CONTROL SECTION ***********************

    function proxyInScope(scope, fn) {
        if (!scope.$$phase) {
            scope.$apply(function () {
                fn();
            });
        } else {
            fn();
        }
    }

    function aocBind(scope, element, event, fn, context) {
        element.bind(event,
            function () {
                var args = Array.prototype.slice.call(arguments);
                proxyInScope(scope, function () {
                    fn.apply(context || element, args);
                });

            });
    }

    function Control(config) {
        (!config.element[0].aoc) && (config.element[0].aoc = {});
        (!config.element[0].aoc.controls) && (config.element[0].aoc.controls = {});
        config.element[0].aoc.controls[config.controlName] = this;

        var control = this;
        this._getConfig = function () {
            return config;
        };

        this._getControlName = function () {
            return config.controlName;
        };
        this._getElement = function () {
            return config.element;
        };
        this._bind = function (event, fn) {
            aocBind(config.scope, config.element, event, fn, control);
        };
        this._trigger = function (event) {
            config.element.trigger(event);
        };

        this._addDefaultAction = function (action) {
            this[action] = function () {
                var args = [action].concat(Array.prototype.slice.call(arguments));
                proxyInScope(config.scope, function () {
                    config.actions.defaultInvoker.call(control, config.element, config.controlName, args);
                });
            };
        };
        this._addCustomAction = function (action, fn) {
            this[action] = function () {
                var args = Array.prototype.slice.call(arguments);
                proxyInScope(config.scope, function () {
                    fn.apply(control, args);
                });
            }
        };

        angular.forEach(config.actions.default, function (action) {
            control._addDefaultAction(action);
        });
        angular.forEach(config.actions.custom, function (fn, action) {
            control._addCustomAction(action, fn);
        });
        angular.forEach(config.events, function (fn, event) {
            control._bind(event, fn);
        });
    }

    Control.initControl = function (instance) {
        var config = instance._getConfig(),
            options = config.options;
        (config.element[0].aoc.options) && (angular.extend(options, config.element[0].aoc.options[config.controlName] || {}));///options directive used
        var widget = config.createFn.call(instance, config.element, config.controlName, options);
        instance._trigger('controlCreated', {widget: widget, control: instance});
        return widget;
    };


    //**************** EVALUATOR *********************

    function Evaluator(scope) {
        this.eFunction = function (expression, locals) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                proxyInScope(scope, function () {
                    var ret, argsVar = "$args";
                    scope[argsVar] = args;
                    angular.forEach(locals, function (local, name) {
                        scope["$" + name] = local;
                    });
                    ret = scope.$eval(expression);
                    delete scope[argsVar];
                    angular.forEach(locals, function (local, name) {
                        delete scope["$" + name];
                    });
                    return ret;
                });
            }
        };
        this.eValue = function (expression) {
            return scope.$eval(expression);
        };
    }

// ************** AOC DIRECTIVE SECTION ***************** //

    aoc.directive('aoc', function ($compile, $injector, $timeout) {
        return{
            priority: 500,
            require: ['?ngModel' ],
            link: function (scope, element, attrs) {
                var controls = attrs.aoc.split(' '),
                    control, externalScope = attrs.$attr.scope ? scope.$parent : scope;
                (!externalScope.$aoc) && (externalScope.$aoc = function (selector) {
                    var element = angular.element(selector);
                    if (!(element.length && element[0].aoc.controls))return;
                    return element[0].aoc.controls;
                });
                angular.forEach(controls, function (controlName) {
                    control = new Control(new AocConfig(scope, controlName, element, function (configFn) {
                        return $injector.invoke(configFn, this, {scope: scope, aocCompile: function (element) {
                            $compile(element)(scope);
                        }})
                    }));
                    (function (control) {
                        $timeout(function () {
                            Control.initControl(control);
                        });
                    }(control))

                });

            }
        }
    });

// **************** SCOPE DIRECTIVE SECTION **************************

    aoc.directive('scope', function () {
        return{
            priority: 100,
            scope: true,
            link: function () {
            }
        }
    });
// **************** EVENTS DIRECTIVE SECTION *************************

    aoc.directive('events', function () {
        return{
            priority: 999,
            link: function (scope, element, attr) {
                var eventPrefix = attr.events,
                    eventsPattern = new RegExp('^' + eventPrefix + '[A-Z][A-Za-z]*$'),
                    eventPattern = new RegExp('^' + eventPrefix),
                    evaluator = new Evaluator(scope), eventFn, eventName;
                (!element[0].aoc) && (element[0].aoc = {});
                angular.forEach(attr, function (expr, event) {
                    if (!eventsPattern.test(event)) return;
                    eventFn = evaluator.eFunction(expr, {controls: element[0].aoc.controls});
                    eventName = event.replace(eventPattern, "");
                    eventName = eventName[0].toLowerCase() + eventName.substr(1);
                    aocBind(scope, element, eventName, eventFn);

                })
            }
        }
    });

// ************** OPTIONS DIRECTIVE SECTION ********************************
    aoc.directive('options', function () {
        return {
            priority: 999,
            link: function (scope, element, attr) {
                var evaluator = new Evaluator(scope),
                    prefixes = evaluator.eValue(attr.options),
                    optionsPrefix, optionPrefix, optionName, optionValue, control;
                (!element[0].aoc) && (element[0].aoc = {});
                (!element[0].aoc.options) && (element[0].aoc.options = {});
                angular.forEach(prefixes, function (prefix, comp) {
                    optionsPrefix = new RegExp('^' + prefix + '[A-Z][A-Za-z]*$');
                    optionPrefix = new RegExp('^' + prefix);
                    (element[0].aoc.controls) && (control = element[0].aoc.controls[comp]);
                    element[0].aoc.options[comp] = {};
                    angular.forEach(attr, function (expr, option) {
                        if (!optionsPrefix.test(option))return;
                        optionName = option.replace(optionPrefix, "");
                        optionName = optionName[0].toLowerCase() + optionName.substr(1);
                        switch (expr[0]) {
                            case '*':
                                optionValue = '{{' + expr.substr(1) + "}}";
                                break;
                            case '+':
                                optionValue = evaluator.eFunction(expr.substr(1), control);
                                break;
                            case '=':
                                optionValue = evaluator.eValue(expr.substr(1));
                                break;
                            default:
                                optionValue = expr;
                                break;
                        }
                        element[0].aoc.options[comp][optionName] = optionValue;
                    });

                })

            }
        }
    })
})
    (angular);