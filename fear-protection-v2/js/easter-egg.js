/**
 * Easter Egg - 5 clicks on logo icon
 */

let logoClickCount = 0;
let logoClickTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
    const logoImg = document.querySelector('.logo-container img');
    const easterEggModal = document.getElementById('easterEggModal');
    const easterEggAudio = document.getElementById('easterEggAudio');
    
    if (logoImg) {
        logoImg.style.cursor = 'pointer';
        logoImg.addEventListener('click', (e) => {
            e.preventDefault();
            logoClickCount++;
            
            // Reset counter after 2 seconds of inactivity
            clearTimeout(logoClickTimeout);
            logoClickTimeout = setTimeout(() => {
                logoClickCount = 0;
            }, 2000);
            
            // Show easter egg after 5 clicks
            if (logoClickCount === 5) {
                easterEggModal.classList.add('active');
                easterEggAudio.play();
                logoClickCount = 0;
            }
        });
    }
});

function closeEasterEgg() {
    const easterEggModal = document.getElementById('easterEggModal');
    const easterEggAudio = document.getElementById('easterEggAudio');
    easterEggModal.classList.remove('active');
    easterEggAudio.pause();
    easterEggAudio.currentTime = 0;
}
