# Инструкция по обновлению layout

## Новая структура

```html
<body>
    <!-- Header (сверху) -->
    <header class="page-header">
        <div class="header-content">
            <div class="logo-container">...</div>
            <a href="admin-panel.html" class="profile-button">...</a>
        </div>
    </header>
    
    <!-- Content Wrapper (sidebar + main content) -->
    <div class="content-wrapper">
        <!-- Sidebar (слева) -->
        <div class="sidebar">
            <div class="sidebar-menu">...</div>
        </div>
        
        <!-- Main Content (справа) -->
        <div class="main-content">
            <div class="container">
                <!-- Контент страницы -->
            </div>
        </div>
    </div>
</body>
```

## CSS изменения

```css
body {
    display: flex;
    flex-direction: column; /* вертикальная компоновка */
    min-height: 100vh;
}

.page-header {
    /* хедер сверху */
    flex-shrink: 0;
}

.content-wrapper {
    display: flex; /* горизонтальная компоновка */
    flex: 1;
    overflow: hidden;
}

.sidebar {
    width: 280px;
    flex-shrink: 0;
    overflow-y: auto;
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.container {
    flex: 1;
    overflow-y: auto;
    width: 100%;
}
```

## Страницы для обновления

- [x] admin-panel.html
- [ ] tickets.html
- [ ] my-tickets.html
- [ ] admins-list.html
- [ ] discord-search.html
- [ ] ban-goals.html
- [ ] ticket-view.html (особый случай - без sidebar)
