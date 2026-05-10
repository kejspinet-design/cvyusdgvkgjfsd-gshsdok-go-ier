/**
 * Google Apps Script для логирования авторизаций Fear Protection
 * 
 * ИНСТРУКЦИЯ ПО НАСТРОЙКЕ:
 * 
 * 1. Создайте новую Google Таблицу: https://sheets.google.com
 * 2. Назовите её "Fear Protection - Auth Logs"
 * 3. Откройте Расширения → Apps Script
 * 4. Вставьте этот код
 * 5. Нажмите "Развернуть" → "Новое развертывание"
 * 6. Выберите тип: "Веб-приложение"
 * 7. Настройки:
 *    - Описание: "Fear Protection Auth Logger"
 *    - Запуск от имени: "Меня"
 *    - У кого есть доступ: "Все"
 * 8. Нажмите "Развернуть"
 * 9. Скопируйте URL веб-приложения
 * 10. Вставьте URL в AuthManager.js в переменную GOOGLE_SHEETS_WEBHOOK
 */

function doPost(e) {
  try {
    // Получаем активную таблицу
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Если это первый запуск, создаём заголовки
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Дата и время',
        'Steam ID',
        'Никнейм',
        'Роль',
        'Токен (сокращённый)',
        'Главный админ'
      ]);
      
      // Форматируем заголовки
      const headerRange = sheet.getRange(1, 1, 1, 6);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#667eea');
      headerRange.setFontColor('#ffffff');
    }
    
    // Парсим данные из запроса
    const data = JSON.parse(e.postData.contents);
    
    // Форматируем дату
    const date = new Date(data.timestamp);
    const formattedDate = Utilities.formatDate(date, 'Europe/Moscow', 'dd.MM.yyyy HH:mm:ss');
    
    // Добавляем строку с данными
    sheet.appendRow([
      formattedDate,
      data.steamId,
      data.nickname,
      data.role,
      data.token,
      data.isMainAdmin ? 'ДА' : 'Нет'
    ]);
    
    // Автоматически подстраиваем ширину колонок
    sheet.autoResizeColumns(1, 6);
    
    // Возвращаем успешный ответ
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Auth logged successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Логируем ошибку
    Logger.log('Error: ' + error.toString());
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Тестовая функция для проверки
function testLogger() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        steamId: '76561199524780327',
        nickname: 'TestUser',
        role: 'Админ',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        isMainAdmin: true
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}
