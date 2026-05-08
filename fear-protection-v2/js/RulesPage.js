/**
 * RulesPage class for displaying Fear Protection rules
 */
class RulesPage {
    constructor() {
        this.init();
    }

    init() {
        this.renderRules();
        this.setupNavigation();
    }

    renderRules() {
        const content = document.getElementById('rules-content');
        
        // Server Rules Section
        let serverRulesHTML = `
            <section id="server-rules" class="rules-section active">
                <h1 class="section-title">Правила игровых серверов Fear</h1>
        `;
        
        // Render each category
        for (const [category, rules] of Object.entries(RULES_DATA)) {
            const categoryId = this.getCategoryId(category);
            serverRulesHTML += `<h2 class="subsection-title" id="${categoryId}">${category}</h2>`;
            
            rules.forEach(([number, text, punishment]) => {
                serverRulesHTML += `
                    <div class="rule-item" data-category="${category}">
                        <div class="rule-number">${number}</div>
                        <div class="rule-text">${text}</div>
                        ${punishment ? `<div class="rule-punishment"><strong>Наказание:</strong> ${punishment}</div>` : ''}
                    </div>
                `;
            });
        }
        
        serverRulesHTML += `</section>`;
        
        // Warnings Section
        let warningsHTML = `
            <section id="warnings" class="rules-section">
                <h1 class="section-title">Система снятия выговоров Fear</h1>
                <h2 class="subsection-title">Условия снятия выговоров</h2>
        `;
        
        WARNINGS_DATA.forEach(([number, text]) => {
            warningsHTML += `
                <div class="rule-item">
                    <div class="rule-number">${number}</div>
                    <div class="rule-text">${text}</div>
                </div>
            `;
        });
        
        warningsHTML += `
                <h2 class="subsection-title">Важная информация</h2>
                <div class="rule-item" style="border-left-color: #ffa500;">
                    <div class="rule-text">
                        <strong>⚠️ Обратите внимание:</strong><br><br>
                        • Выговоры, которые снимаются по решению старшей администрации, могут быть сняты позже указанного срока; это зависит от тяжести нарушения.<br><br>
                        • Снятие выговора по решению Ст.Администрации должно быть согласовано с Главным Администратором.<br><br>
                        • При наличии 3 и более активных выговоров админ права замораживаются, а наборная модерация в таком случае снимается с должности и заносится в ЧСА.
                    </div>
                </div>
            </section>
        `;
        
        content.innerHTML = serverRulesHTML + warningsHTML;
    }

    getCategoryId(category) {
        const idMap = {
            'Основные': 'osnovnye',
            'Общение': 'obshchenie',
            'Игровой процесс': 'igrovoy-process',
            'Никнеймы и аватарки': 'nikneymy',
            'Прочее': 'prochee',
            'Для администрации': 'dlya-admin',
            'Условия проверки': 'usloviya-proverki'
        };
        return idMap[category] || category.toLowerCase().replace(/\s+/g, '-');
    }

    setupNavigation() {
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        const sections = document.querySelectorAll('.rules-section');
        const subsections = document.querySelectorAll('.sidebar-subsection');
        const quickNavigation = document.getElementById('quick-navigation');
        
        // Main navigation
        sidebarItems.forEach(item => {
            item.addEventListener('click', function() {
                const sectionId = this.getAttribute('data-section');
                
                // Update active sidebar item
                sidebarItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                // Show corresponding section
                sections.forEach(section => {
                    if (section.id === sectionId) {
                        section.classList.add('active');
                    } else {
                        section.classList.remove('active');
                    }
                });
                
                // Show/hide quick navigation based on section
                if (sectionId === 'server-rules') {
                    quickNavigation.style.display = 'block';
                } else {
                    quickNavigation.style.display = 'none';
                }
                
                // Scroll to top for all sections (including warnings)
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
        
        // Quick navigation to subsections
        subsections.forEach(item => {
            item.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                
                // Update active subsection
                subsections.forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                
                // Make sure server-rules section is active
                sidebarItems.forEach(i => i.classList.remove('active'));
                document.querySelector('[data-section="server-rules"]').classList.add('active');
                
                sections.forEach(section => {
                    if (section.id === 'server-rules') {
                        section.classList.add('active');
                    } else {
                        section.classList.remove('active');
                    }
                });
                
                // Scroll to target subsection
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
}
