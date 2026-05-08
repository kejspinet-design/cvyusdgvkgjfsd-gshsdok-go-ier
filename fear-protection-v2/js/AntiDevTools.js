/**
 * Anti-DevTools Protection
 * Защита от кражи кода через F12 и DevTools
 */

(function() {
    'use strict';
    
    // Отключаем контекстное меню (правый клик)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Отключаем горячие клавиши DevTools
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+I (DevTools)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+S (Save Page)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+A (Select All) - опционально
        if (e.ctrlKey && e.keyCode === 65) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+C (Copy) - опционально
        if (e.ctrlKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
    });
    
    // Отключаем выделение текста
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Отключаем копирование
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Детект открытия DevTools по размеру окна
    let devtoolsOpen = false;
    const threshold = 160;
    
    const detectDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                handleDevToolsOpen();
            }
        } else {
            devtoolsOpen = false;
        }
    };
    
    // Детект через debugger
    const detectDebugger = () => {
        const start = performance.now();
        debugger;
        const end = performance.now();
        
        if (end - start > 100) {
            handleDevToolsOpen();
        }
    };
    
    // Детект через console
    const detectConsole = () => {
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                handleDevToolsOpen();
                throw new Error('DevTools detected');
            }
        });
        console.log(element);
    };
    
    // Обработчик открытия DevTools
    function handleDevToolsOpen() {
        // Редирект на главную или показ предупреждения
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #0f1419;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: 'Calluna', 'Times New Roman', serif;
            ">
                <div style="
                    text-align: center;
                    color: white;
                    max-width: 600px;
                    padding: 40px;
                ">
                    <h1 style="
                        font-size: 48px;
                        margin-bottom: 20px;
                        color: #ef4444;
                    ">⚠️ Доступ запрещён</h1>
                    <p style="
                        font-size: 18px;
                        margin-bottom: 30px;
                        color: rgba(255, 255, 255, 0.7);
                    ">Обнаружена попытка несанкционированного доступа к коду.</p>
                    <p style="
                        font-size: 14px;
                        color: rgba(255, 255, 255, 0.5);
                    ">Закройте инструменты разработчика и обновите страницу.</p>
                </div>
            </div>
        `;
        
        // Очищаем все скрипты
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }
    
    // Запускаем детекты
    setInterval(detectDevTools, 1000);
    setInterval(detectDebugger, 2000);
    
    // Защита от iframe
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }
    
    // Очистка console методов
    if (typeof console !== 'undefined') {
        const noop = function() {};
        const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp', 'context', 'memory'];
        
        methods.forEach(method => {
            if (console[method]) {
                console[method] = noop;
            }
        });
    }
    
    // Защита от сохранения страницы
    window.addEventListener('beforeunload', function(e) {
        // Очищаем localStorage и sessionStorage при закрытии
        // (опционально, раскомментируйте если нужно)
        // localStorage.clear();
        // sessionStorage.clear();
    });
    
    // Обфускация текста на странице (опционально)
    const obfuscateText = () => {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue && node.nodeValue.trim()) {
                // Добавляем невидимые символы для защиты от копирования
                // node.nodeValue = node.nodeValue.split('').join('\u200B');
            }
        }
    };
    
    // Запускаем обфускацию после загрузки (опционально)
    // window.addEventListener('load', obfuscateText);
    
    console.log('%c⚠️ ВНИМАНИЕ', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%cЭто консоль браузера для разработчиков.', 'font-size: 18px;');
    console.log('%cЕсли кто-то попросил вас скопировать/вставить что-то сюда, это мошенничество.', 'font-size: 16px; color: yellow;');
    console.log('%cВставка кода может дать злоумышленникам доступ к вашему аккаунту.', 'font-size: 16px; color: red;');
    
})();
