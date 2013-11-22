/**
 * @Author: Oprea Andrei
 * @Date: November 2013
 */

(function (angular, $) {

    'use strict';

    function Config(src) {
        repair(this);
        src && this.extend(repair(src));
    }

    Config.prototype.extend = function (src) {
        this.actions.default = this.actions.default.concat(src.actions.default);
        angular.extend(this.actions.custom, src.actions.custom);
        angular.extend(this.options, src.options);
        return this;
    };

    var repair = function (config) {
        var baseConfig = model();
        config.actions = config.actions || baseConfig.actions;
        config.actions.default = config.actions.default || baseConfig.actions.default;
        config.actions.custom = config.actions.custom || baseConfig.actions.custom;
        config.options = config.options || baseConfig.options;
        return config;
    };

    Config.base = function () {
        return new Config(model());
    };

    Config.merge = function (dest, src) {
        return Config.base().extend(dest).extend(src);
    };

    var model = function () {
        return {
            actions: {
                default: [],
                custom: {}
            },
            options: {

            }
        }
    };

    var aoc = angular.module('aoc', [], function () {
    });

    var GENERAL_CONFIGS = {};
    var SPECIFIC_CONFIGS = {};

    function configureGeneral(component, config) {
        GENERAL_CONFIGS[component] = config;
    }

    function configureSpecific(component, config, selector) {
        SPECIFIC_CONFIGS[component] = SPECIFIC_CONFIGS[component] || [];
        SPECIFIC_CONFIGS[component].push({selector: selector, config: config});
    }

    function configure(component, config, selector) {
        if (selector)
            configureSpecific(component, config, selector);
        else
            configureGeneral(component, config);
    }

    function extractOptions(scope, attrs) {
        var ePattern = /^optionE[A-Z][A-Za-z]*$/,
            argPattern = /^optionE/,
            optionPattern = /^option/,
            allPattern = /^option[A-Z][a-zA-Z]*$/,
            options = {},
            attr;

        function name(pattern, attr) {
            var rName = attr.replace(pattern, "");
            return rName[0].toLowerCase() + rName.substr(1);
        }

        for (attr in attrs) {
            if (!attrs.hasOwnProperty(attr) || !allPattern.test(attr))continue;
            if (ePattern.test(attr))
                options[name(argPattern, attr)] =
                    (function (atr) {
                        return function () {
                            return scope.$eval(attrs[atr]);
                        }
                    })(attr);
            else options[name(optionPattern, attr)] = attrs[attr];

        }
        return options;
    }


    function registerComponent(component, id, container, controller) {
        if (!container.hasOwnProperty('components'))
            container.components = {};
        if (!container.components.hasOwnProperty(component))
            container.components[component] = {};
        container.components[component][id] = controller;
    }

    function extractConfig(element, component, scope, controller) {
        var generalConfigs = new Config(GENERAL_CONFIGS[component].call(Function.caller, scope, controller)),
            specificConfigs = ((SPECIFIC_CONFIGS[component] || []).map(function (c) {
                if (element.is(c.selector))
                    return new Config(c.config.call(Function.caller, scope, controller));
                return new Config();
            }));
        return [generalConfigs].concat(specificConfigs).reduce(Config.merge, Config.base());
    }

    function Controller(component, element, ioc) {

        this._getComponent = function () {
            return component;
        };
        this._getElement = function () {
            return element
        };
        this._getWidget = function () {
            return element[component]('widget');
        };
        this._setWidgetOption = function (option, value) {
            return this._getElement()[this._getComponent()]('option', option, value);
        };

        var widgetCreatedCallbacks = [];
        this._onWidgetCreated = function (fn) {
            widgetCreatedCallbacks.push(fn);
        };
        var _this = this;
        ioc.triggerWidgetCreated = function () {
            for (var fn in widgetCreatedCallbacks) {
                if (!widgetCreatedCallbacks.hasOwnProperty(fn))continue;
                widgetCreatedCallbacks[fn].call(_this, _this);
            }
        };
    }

    Controller.calibrate = function (instance, scope, config) {
        var action,
            proxyInScope = function (fn) {
                if (!scope.$$phase) {
                    scope.$apply(function () {
                        fn();
                    });
                } else {
                    fn();
                }
            },
            setDefaultFunction = function (action) {
                instance[action] = function () {
                    var _args = Array.prototype.slice.call(arguments);
                    proxyInScope(function () {
                        instance._getElement()[instance._getComponent()].apply(instance._getElement(), [action].concat(_args));
                    });
                }
            },
            setCustomAction = function (action) {
                instance[action] = function () {
                    var args = Array.prototype.slice.call(arguments);
                    proxyInScope(function () {
                        config.actions.custom[action].apply(instance, args);
                    });
                }
            };

        for (action in config.actions.default) {
            if (!config.actions.default.hasOwnProperty(action))continue;
            setDefaultFunction(config.actions.default[action]);
        }
        for (action in config.actions.custom) {
            if (!config.actions.custom.hasOwnProperty(action))continue;
            setCustomAction(action);
        }
    };

    aoc.directive('aoc', function ($compile) {
        return {
            scope: true,
            link: function (scope, element, attr) {
                var component = attr.component,
                    id = attr.id,
                    trigger = {},
                    controller = new Controller(component, element, trigger),
                    config = extractConfig(element, component, scope, controller),
                    options = angular.extend(config.options, extractOptions(scope, attr));
                $(element)[component](options);
                Controller.calibrate(controller, scope, config);
                registerComponent(component, id, scope.$parent, controller);
                trigger.triggerWidgetCreated();
            }
        }
    });

    aoc.configure = configure;

})(angular, jQuery);