/**
 * CheckPage class for managing the check page
 */
class CheckPage {
    constructor() {
        console.info('[CheckPage] Starting initialization...');
        
        // Check if required classes are available
        if (typeof APIClient === 'undefined') {
            console.error('[CheckPage] APIClient is not defined');
            return;
        }
        
        if (typeof ModalManager === 'undefined') {
            console.error('[CheckPage] ModalManager is not defined');
            return;
        }
        
        if (typeof ConfigChecker === 'undefined') {
            console.error('[CheckPage] ConfigChecker is not defined');
            return;
        }
        
        try {
            this.apiClient = new APIClient({
                steamApiKey: 'E060AF2E30A53F487CD115E1067F9983',
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiI3NjU2MTE5OTUyNDc4MDMyNyIsImlhdCI6MTc3NjI2MzY4MiwiZXhwIjoxNzc4ODU1NjgyfQ.TdgSNRkzoVN2a7ysy4QPNcv7S_wFQ9WpiPwcb6C2D84',
                cookieDomain: '.fearproject.ru'
            });
            
            this.modalManager = new ModalManager();
            this.configChecker = new ConfigChecker(this.apiClient);
            
            console.info('[CheckPage] Initialized successfully');
        } catch (error) {
            console.error('[CheckPage] Initialization error:', error);
            this.showError('Ошибка инициализации приложения');
        }
    }

    /**
     * Initialize check page
     */
    init() {
        console.info('[CheckPage] Config.vdf checker ready');
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create error modal
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #ff4757 0%, #ff6348 100%); color: white; padding: 40px; border-radius: 20px; text-align: center; max-width: 500px; width: 90%;">
                <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                <h2 style="margin: 0 0 20px 0; font-size: 24px;">${message}</h2>
                <p style="margin: 20px 0; font-size: 16px;">
                    Проверьте консоль (F12) для подробной информации об ошибке.
                </p>
                <button onclick="location.reload()" style="background: white; color: #ff4757; border: none; padding: 12px 30px; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 20px;">
                    Перезагрузить страницу
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Initialize check page when DOM is ready
// Note: Loading screen handles initialization