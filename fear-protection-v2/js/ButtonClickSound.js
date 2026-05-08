/**
 * ButtonClickSound.js
 * Добавляет звук клика ТОЛЬКО на иконку логотипа Fear Protection
 */

(function() {
    'use strict';
    
    // Создаём аудио элемент для звука клика
    const clickSound = new Audio('музыка/button-click.ogg');
    clickSound.volume = 0.5; // Громкость 50%
    
    // Функция воспроизведения звука
    function playClickSound(event) {
        // Клонируем аудио для возможности быстрых повторных кликов
        const sound = clickSound.cloneNode();
        sound.volume = 0.5;
        sound.play().catch(err => {
            // Игнорируем ошибки (например, если браузер блокирует автовоспроизведение)
            console.debug('[ButtonClickSound] Play prevented:', err.message);
        });
    }
    
    // Добавляем обработчик на иконку логотипа при загрузке страницы
    function attachLogoClickSound() {
        // Находим иконку логотипа (класс .header-logo или img в .logo-container)
        const logoIcon = document.querySelector('.header-logo, .logo-container img');
        
        if (logoIcon && !logoIcon.hasAttribute('data-click-sound')) {
            logoIcon.setAttribute('data-click-sound', 'true');
            
            // Добавляем обработчик на click
            logoIcon.addEventListener('click', playClickSound, { passive: true });
            
            // Делаем курсор pointer для иконки
            logoIcon.style.cursor = 'pointer';
            
            console.log('[ButtonClickSound] ✓ Attached to logo icon');
        }
    }
    
    // Запускаем при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachLogoClickSound);
    } else {
        attachLogoClickSound();
    }
    
    console.log('[ButtonClickSound] ✓ Initialized (logo only)');
})();
