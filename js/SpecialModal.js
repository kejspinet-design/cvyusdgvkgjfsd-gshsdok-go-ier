/**
 * SpecialModal - Специальное модальное окно
 */

(function() {
    'use strict';
    
    // Показываем модальное окно через 3 секунды после загрузки страницы
    setTimeout(() => {
        showSpecialModal();
    }, 3000);
    
    function showSpecialModal() {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.5s ease;
        `;
        
        // Создаем контент модального окна
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 60px 80px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 100px rgba(102, 126, 234, 0.5);
            text-align: center;
            animation: scaleIn 0.5s ease;
            border: 3px solid rgba(255, 255, 255, 0.3);
        `;
        
        // Создаем текст
        const text = document.createElement('h1');
        text.textContent = 'ХРИЛОК ГАНДОН';
        text.style.cssText = `
            font-size: 72px;
            font-weight: 900;
            color: white;
            margin: 0;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3);
            letter-spacing: 5px;
            animation: pulse 2s ease-in-out infinite;
        `;
        
        // Создаем кнопку закрытия
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.5);
            color: white;
            font-size: 32px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        `;
        
        closeBtn.onmouseover = () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
            closeBtn.style.transform = 'rotate(90deg) scale(1.1)';
        };
        
        closeBtn.onmouseout = () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
            closeBtn.style.transform = 'rotate(0deg) scale(1)';
        };
        
        closeBtn.onclick = () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };
        
        // Добавляем стили анимации
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes scaleIn {
                from { transform: scale(0.5); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);
        
        // Собираем модальное окно
        content.appendChild(closeBtn);
        content.appendChild(text);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Закрытие по клику вне модального окна
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        };
        
        // Закрытие по Escape
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                modal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                }, 300);
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
    
})();
