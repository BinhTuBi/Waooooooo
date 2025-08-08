// Đợi cho đến khi toàn bộ cấu trúc HTML được tải xong
document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // KHAI BÁO CÁC BIẾN VÀ LẤY CÁC PHẦN TỬ GIAO DIỆN (DOM ELEMENTS)
    // =================================================================

    // Đồng hồ và Ngày tháng chính
    const timeDisplay = document.getElementById('time-display');
    const secondsDisplay = document.getElementById('seconds-display');
    const dateDisplay = document.getElementById('date-display');

    // Các Widget
    const alarmBtn = document.getElementById('alarm-btn');
    const weatherBtn = document.getElementById('weather-btn');
    const healthBtn = document.getElementById('health-btn');
    const stopwatchBtn = document.getElementById('stopwatch-btn');
    const alarmStatusWidget = document.getElementById('alarm-status');

    // Các Cửa sổ Modal
    const allModals = document.querySelectorAll('.modal-overlay');
    const alarmModal = document.getElementById('alarm-modal');
    const weatherModal = document.getElementById('weather-modal');
    const healthModal = document.getElementById('health-modal');
    const stopwatchModal = document.getElementById('stopwatch-modal');
    const alarmAlertModal = document.getElementById('alarm-alert-modal');

    // Các phần tử của Modal Báo thức
    const saveAlarmBtn = document.getElementById('save-alarm-btn');
    const alarmHourInput = document.getElementById('alarm-hour');
    const alarmMinuteInput = document.getElementById('alarm-minute');
    const alarmLabelInput = document.getElementById('alarm-label');
    const alarmListElement = document.getElementById('alarm-list');

    // Các phần tử của Modal Cảnh báo Báo thức
    const stopAlarmBtn = document.getElementById('stop-alarm-btn');
    const alertTimeSpan = document.getElementById('alert-time');
    const alarmSound = document.getElementById('alarm-sound');

    // Các phần tử của Modal Đồng hồ bấm giờ
    const swStartBtn = document.getElementById('sw-start-btn');
    const swStopBtn = document.getElementById('sw-stop-btn');
    const swResetBtn = document.getElementById('sw-reset-btn');
    const swDisplayWidget = document.getElementById('stopwatch-display');
    const swDisplayModal = {
        mins: document.getElementById('sw-minutes'),
        secs: document.getElementById('sw-seconds'),
        ms: document.getElementById('sw-milliseconds')
    };

    // BIẾN TRẠNG THÁI (STATE VARIABLES)
    let alarms = JSON.parse(localStorage.getItem('alarmXAlarms')) || [];
    let isAlarmRinging = false;
    let stopwatchInterval = null;
    let stopwatchTime = 0; // Lưu dưới dạng milliseconds

    // =================================================================
    // 1. CHỨC NĂNG CỐT LÕI: ĐỒNG HỒ VÀ GIAO TIẾP VỚI SERVER
    // =================================================================

    /**
     * Cập nhật đồng hồ thời gian thực và kiểm tra báo thức mỗi giây.
     */
    function updateClockAndCheckAlarms() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        // Cập nhật giao diện đồng hồ
        timeDisplay.textContent = `${hours}:${minutes}`;
        secondsDisplay.textContent = `:${seconds}`;

        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        dateDisplay.textContent = `${days[now.getDay()]}, ${now.toLocaleDateString('vi-VN')}`;

        // Kiểm tra xem có báo thức nào đến hạn không
        checkAlarms(hours, minutes);
    }

    /**
     * Lấy dữ liệu từ API backend và cập nhật các widget Sức khỏe, Thời tiết.
     */
    async function fetchDataAndUpdateWidgets() {
        try {
            const response = await fetch('/api/dashboard-data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Cập nhật Sức khỏe
            document.getElementById('heart-rate').textContent = data.heartRate;
            document.getElementById('health-hr-modal').textContent = data.heartRate;
            document.getElementById('health-steps-modal').textContent = data.steps;
            document.getElementById('health-distance-modal').textContent = `${data.distance} km`;
            document.getElementById('health-calories-modal').textContent = `${data.calories} kcal`;

            // Cập nhật Thời tiết
            const weather = data.weather;
            document.querySelector('#weather-btn .widget-icon i').className = `fas ${weather.icon}`;
            document.getElementById('weather-temp').textContent = `${weather.temperature}°C`;
            document.getElementById('weather-icon-large').className = `fas ${weather.icon} weather-icon-large`;
            document.getElementById('weather-desc').textContent = weather.description;
            document.getElementById('weather-temp-large').textContent = `${weather.temperature}°C`;
            document.getElementById('weather-feels-like').textContent = `${weather.feelsLike}°C`;
            document.getElementById('weather-humidity').textContent = `${weather.humidity}%`;

        } catch (error) {
            console.error("Could not fetch data from server:", error);
        }
    }

    // =================================================================
    // 2. HỆ THỐNG QUẢN LÝ CỬA SỔ MODAL
    // =================================================================

    /** Mở một cửa sổ modal cụ thể */
    const openModal = (modalElement) => modalElement.classList.remove('hidden');

    /** Đóng tất cả các cửa sổ modal đang mở */
    const closeModal = () => allModals.forEach(modal => modal.classList.add('hidden'));

    // Gắn sự kiện mở modal cho các nút widget
    alarmBtn.addEventListener('click', (e) => { e.preventDefault(); renderAlarmsUI(); openModal(alarmModal); });
    weatherBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(weatherModal); });
    healthBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(healthModal); });
    stopwatchBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(stopwatchModal); });

    // Gắn sự kiện đóng modal cho các nút 'x' và khi click ra ngoài
    allModals.forEach(modal => {
        if (modal.id === 'alarm-alert-modal') return; // Không cho đóng modal cảnh báo
        modal.querySelector('.close-button')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
    });

    // =================================================================
    // 3. LOGIC CHỨC NĂNG BÁO THỨC (ALARM FUNCTIONALITY)
    // =================================================================

    /**
     * Lưu danh sách báo thức hiện tại vào Local Storage của trình duyệt.
     */
    function saveAlarmsToStorage() {
        localStorage.setItem('alarmXAlarms', JSON.stringify(alarms));
    }

    /**
     * Hiển thị (render) danh sách báo thức ra giao diện từ mảng `alarms`.
     */
    function renderAlarmsUI() {
        alarmListElement.innerHTML = '';
        if (alarms.length === 0) {
            alarmListElement.innerHTML = '<li><span style="color: #888;">Chưa có báo thức nào</span></li>';
            alarmStatusWidget.textContent = 'OFF';
            alarmStatusWidget.classList.remove('active');
        } else {
            alarms.sort((a, b) => a.time.localeCompare(b.time));
            alarms.forEach((alarm, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="alarm-details">
                        <span class="alarm-time-display">${alarm.time}</span>
                        <span class="alarm-label-display">${alarm.label || 'Báo thức'}</span>
                    </div>
                    <button class="delete-alarm-btn" data-index="${index}" title="Xóa báo thức">×</button>
                `;
                alarmListElement.appendChild(li);
            });
            const activeAlarms = alarms.filter(a => !a.triggered).length;
            alarmStatusWidget.textContent = `${activeAlarms} Active`;
            alarmStatusWidget.classList.add('active');
        }
    }

    /**
     * Xử lý sự kiện khi người dùng nhấn nút "Lưu Báo Thức".
     */
    function handleSaveAlarm() {
        const hour = alarmHourInput.value;
        const minute = alarmMinuteInput.value;
        const label = alarmLabelInput.value.trim();

        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && hour !== '' && minute !== '') {
            const newAlarmTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            if (alarms.some(alarm => alarm.time === newAlarmTime)) {
                alert('Báo thức tại thời điểm này đã tồn tại!');
                return;
            }
            alarms.push({ time: newAlarmTime, label: label, triggered: false });

            // Xóa trường nhập liệu và cập nhật giao diện, lưu trữ
            alarmHourInput.value = '';
            alarmMinuteInput.value = '';
            alarmLabelInput.value = '';
            renderAlarmsUI();
            saveAlarmsToStorage();
        } else {
            alert('Vui lòng nhập giờ và phút hợp lệ (HH: 0-23, MM: 0-59)!');
        }
    }

    /**
     * Xử lý sự kiện khi người dùng nhấn nút xóa trên một báo thức.
     */
    function handleDeleteAlarm(event) {
        if (event.target.classList.contains('delete-alarm-btn')) {
            const indexToDelete = parseInt(event.target.getAttribute('data-index'));
            alarms.splice(indexToDelete, 1);
            renderAlarmsUI();
            saveAlarmsToStorage();
        }
    }

    /**
     * Kiểm tra mỗi giây xem có báo thức nào đến hạn không.
     */
    function checkAlarms(currentHours, currentMinutes) {
        if (isAlarmRinging) return;

        const currentTimeString = `${currentHours}:${currentMinutes}`;

        alarms.forEach(alarm => {
            if (alarm.time === currentTimeString && !alarm.triggered) {
                triggerAlarm(alarm);
            }
        });
    }

    /**
     * Kích hoạt giao diện và âm thanh báo thức.
     */
    function triggerAlarm(alarm) {
        isAlarmRinging = true;
        alarm.triggered = true; // Đánh dấu đã reo để không reo lại trong cùng một phút

        alertTimeSpan.textContent = alarm.time;
        alarmAlertModal.querySelector('p').innerHTML = `Đã đến giờ báo thức bạn đặt lúc <strong>${alarm.time}</strong><br>${alarm.label || ''}`;

        openModal(alarmAlertModal);
        alarmSound.play().catch(e => console.error("Lỗi khi phát âm thanh:", e));
    }

    /**
     * Xử lý sự kiện khi người dùng nhấn nút "TẮT BÁO THỨC".
     */
    function handleStopAlarm() {
        alarmSound.pause();
        alarmSound.currentTime = 0;
        isAlarmRinging = false;
        closeModal();

        // Sau khi báo thức reo và bị tắt, chúng ta xóa nó khỏi danh sách
        // Logic này có thể thay đổi (ví dụ: chỉ vô hiệu hóa thay vì xóa)
        const ringingTime = alertTimeSpan.textContent;
        alarms = alarms.filter(alarm => alarm.time !== ringingTime);

        // Reset cờ 'triggered' cho các báo thức còn lại để chúng có thể reo vào ngày mai
        alarms.forEach(alarm => alarm.triggered = false);

        renderAlarmsUI();
        saveAlarmsToStorage();
    }

    // =================================================================
    // 4. LOGIC CHỨC NĂNG BẤM GIỜ (STOPWATCH FUNCTIONALITY)
    // =================================================================

    function startStopwatch() {
        if (stopwatchInterval) return;
        const startTime = Date.now() - stopwatchTime;
        stopwatchInterval = setInterval(() => {
            stopwatchTime = Date.now() - startTime;
            updateStopwatchDisplay();
        }, 10);
    }

    function stopStopwatch() {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
    }

    function resetStopwatch() {
        stopStopwatch();
        stopwatchTime = 0;
        updateStopwatchDisplay();
    }

    function updateStopwatchDisplay() {
        const ms = String(Math.floor((stopwatchTime % 1000) / 10)).padStart(2, '0');
        const secs = String(Math.floor((stopwatchTime / 1000) % 60)).padStart(2, '0');
        const mins = String(Math.floor(stopwatchTime / 60000)).padStart(2, '0');
        swDisplayModal.mins.textContent = mins;
        swDisplayModal.secs.textContent = secs;
        swDisplayModal.ms.textContent = ms;
        swDisplayWidget.textContent = `${mins}:${secs}`;
    }

    // =================================================================
    // 5. KHỞI CHẠY ỨNG DỤNG VÀ GẮN CÁC SỰ KIỆN
    // =================================================================

    // Gắn sự kiện cho các nút trong modal báo thức
    saveAlarmBtn.addEventListener('click', handleSaveAlarm);
    alarmListElement.addEventListener('click', handleDeleteAlarm);
    stopAlarmBtn.addEventListener('click', handleStopAlarm);

    // Gắn sự kiện cho các nút của đồng hồ bấm giờ
    swStartBtn.addEventListener('click', startStopwatch);
    swStopBtn.addEventListener('click', stopStopwatch);
    swResetBtn.addEventListener('click', resetStopwatch);

    // Thiết lập các vòng lặp cập nhật
    setInterval(updateClockAndCheckAlarms, 1000); // Cập nhật đồng hồ mỗi giây
    setInterval(fetchDataAndUpdateWidgets, 5000); // Lấy dữ liệu từ server mỗi 5 giây

    // Chạy các hàm khởi tạo giao diện lần đầu tiên khi tải trang
    updateClockAndCheckAlarms();
    fetchDataAndUpdateWidgets();
    renderAlarmsUI();
    updateStopwatchDisplay();
});