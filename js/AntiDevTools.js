/**
 * AntiDevTools - Console Blocker
 * Blocks console access everywhere
 */

(function() {
    'use strict';
    
    // Блокируем все методы консоли
    const noop = function() {};
    const consoleMethods = ['log', 'debug', 'info', 'warn', 'error', 'dir', 'dirxml', 'trace', 'profile', 'profileEnd', 'table', 'clear', 'assert', 'count', 'countReset', 'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'timeLog', 'timeStamp'];
    
    consoleMethods.forEach(method => {
        try {
            console[method] = noop;
        } catch (e) {
            // Игнорируем ошибки
        }
    });
    
    // Переопределяем console полностью
    try {
        Object.defineProperty(window, 'console', {
            value: new Proxy(console, {
                get: function() {
                    return noop;
                }
            }),
            writable: false,
            configurable: false
        });
    } catch (e) {
        // Игнорируем ошибки
    }
    
    // Блокируем debugger
    setInterval(function() {
        (function() {
            return false;
        })['constructor']('debugger')();
    }, 50);
    
})();
