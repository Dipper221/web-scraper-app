// Элементы UI
const searchBtn = document.getElementById('searchBtn');
const keywordInput = document.getElementById('keywordInput');
const urlList = document.getElementById('urlList');
const downloadSection = document.getElementById('downloadSection');
const selectedUrlSpan = document.getElementById('selectedUrl');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const storageList = document.getElementById('storageList');
const contentViewer = document.getElementById('contentViewer');
const refreshStorageBtn = document.getElementById('refreshStorageBtn');
const clearStorageBtn = document.getElementById('clearStorageBtn');

// ==========================================
// 1. ПОИСК
// ==========================================
searchBtn.addEventListener('click', async () => {
    const keyword = keywordInput.value.trim();
    if (!keyword) return alert('Введите ключевое слово!');

    try {
        // Запрос к нашему серверу
        const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
        const data = await res.json();

        urlList.innerHTML = ''; // Очистка списка
        
        if (data.success && data.urls.length > 0) {
            data.urls.forEach(url => {
                const item = document.createElement('div');
                item.className = 'list-item';
                item.textContent = url;
                // При клике начинаем загрузку
                item.onclick = () => startDownload(url);
                urlList.appendChild(item);
            });
        } else {
            urlList.innerHTML = '<div style="padding:10px; color:red;">Ничего не найдено. Попробуйте: js, text, html</div>';
        }
    } catch (e) {
        console.error(e);
        alert('Ошибка соединения с сервером');
    }
});

// ==========================================
// 2. ЗАГРУЗКА (AJAX / XMLHttpRequest)
// ==========================================
function startDownload(url) {
    downloadSection.style.display = 'block';
    selectedUrlSpan.textContent = url;
    
    // Сброс UI прогресса
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    statusText.textContent = 'Подключение...';
    contentViewer.textContent = 'Загрузка...';

    // Используем XMLHttpRequest, так как у него есть удобный onprogress
    const xhr = new XMLHttpRequest();
    // Запрос идет на наш прокси-сервер
    xhr.open('GET', `/api/fetch?url=${encodeURIComponent(url)}`, true);
    
    // Отслеживание прогресса
    xhr.onprogress = (event) => {
        if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            const loadedKB = (event.loaded / 1024).toFixed(2);
            const totalKB = (event.total / 1024).toFixed(2);
            
            progressBar.style.width = percentComplete + '%';
            progressBar.textContent = percentComplete + '%';
            statusText.textContent = `Загружено: ${loadedKB} KB из ${totalKB} KB`;
        } else {
            // Если сервер не отдал Content-Length
            const loadedKB = (event.loaded / 1024).toFixed(2);
            progressBar.style.width = '100%';
            progressBar.textContent = 'Загрузка...';
            statusText.textContent = `Скачано: ${loadedKB} KB (общий размер неизвестен)`;
        }
    };

    // Завершение загрузки
    xhr.onload = () => {
        if (xhr.status === 200) {
            statusText.textContent = 'Загрузка завершена!';
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';
            
            const content = xhr.responseText;
            // Показываем контент
            contentViewer.textContent = content;
            // Сохраняем
            saveToLocalStorage(url, content);
        } else {
            statusText.textContent = 'Ошибка сервера: ' + xhr.status;
            alert('Не удалось скачать файл');
        }
    };

    xhr.onerror = () => {
        statusText.textContent = 'Ошибка сети';
        alert('Произошла сетевая ошибка');
    };

    xhr.send();
}

// ==========================================
// 3. LOCAL STORAGE
// ==========================================
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, data);
        renderStorageList();
        // Подсветим статус зеленым
        statusText.innerHTML += ' <b style="color:green">(Сохранено)</b>';
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('Ошибка: Место в браузере (LocalStorage) закончилось! Удалите старые файлы.');
        } else {
            alert('Ошибка сохранения: ' + e.message);
        }
    }
}

function renderStorageList() {
    storageList.innerHTML = '';
    
    if (localStorage.length === 0) {
        storageList.innerHTML = '<div style="color:#777; padding:10px;">Список пуст</div>';
        return;
    }

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = key; // URL как название
        
        // Кнопка удаления конкретного элемента
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Удалить';
        delBtn.className = 'delete-item-btn';
        delBtn.onclick = (e) => {
            e.stopPropagation(); // Чтобы не сработал клик по строке
            localStorage.removeItem(key);
            renderStorageList();
            contentViewer.textContent = 'Файл удален.';
        };

        // Клик по строке открывает контент
        item.onclick = () => {
            const savedContent = localStorage.getItem(key);
            contentViewer.textContent = savedContent;
            // Скролл к просмотру
            contentViewer.scrollIntoView({behavior: "smooth"});
        };

        item.appendChild(delBtn);
        storageList.appendChild(item);
    }
}

// Кнопки управления хранилищем
refreshStorageBtn.addEventListener('click', renderStorageList);

clearStorageBtn.addEventListener('click', () => {
    if(confirm('Вы уверены, что хотите удалить ВСЕ сохраненные файлы?')) {
        localStorage.clear();
        renderStorageList();
        contentViewer.textContent = 'Хранилище очищено.';
    }
});

// Запуск при старте
renderStorageList();