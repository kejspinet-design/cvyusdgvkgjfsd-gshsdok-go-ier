/**
 * AntiDevTools - Console Blocker & DevTools Prevention
 * Blocks console access and prevents DevTools from opening
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
    
    // Блокируем горячие клавиши для DevTools
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Ctrl+Shift+I (DevTools)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Ctrl+S (Save Page)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    
    // Блокируем правый клик
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);
    
    // Блокируем выделение текста
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    }, true);
    
    // Блокируем копирование
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        return false;
    }, true);
    
    // Детект открытия DevTools через размер окна
    const devtools = {
        isOpen: false,
        orientation: null
    };
    
    const threshold = 160;
    
    const emitEvent = (isOpen, orientation) => {
        if (devtools.isOpen !== isOpen || devtools.orientation !== orientation) {
            devtools.isOpen = isOpen;
            devtools.orientation = orientation;
            
            if (isOpen) {
                // DevTools открыты - перезагружаем страницу
                window.location.reload();
            }
        }
    };
    
    setInterval(() => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        const orientation = widthThreshold ? 'vertical' : 'horizontal';
        
        if (widthThreshold || heightThreshold) {
            emitEvent(true, orientation);
        } else {
            emitEvent(false, null);
        }
    }, 500);
    
    // Блокируем debugger
    setInterval(function() {
        (function() {
            return false;
        })['constructor']('debugger')();
    }, 50);
    
    // Детект через console.log
    let devtoolsOpen = false;
    const element = new Image();
    Object.defineProperty(element, 'id', {
        get: function() {
            devtoolsOpen = true;
            window.location.reload();
        }
    });
    
    setInterval(function() {
        devtoolsOpen = false;
        console.log(element);
        console.clear();
    }, 1000);
    
})();
