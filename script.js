// 전역 변수 - 항상 오늘 날짜로 초기화
let currentDate = new Date();
let reservations = JSON.parse(localStorage.getItem('reservations')) || {};
let currentReservation = null;
const MASTER_KEY = '1320';

const START_TIME = 8;
const END_TIME = 18;
const INTERVAL = 20; // 분
const MAX_DURATION = 100; // 분

function getTimeSlots() {
    const slots = [];
    for (let h = START_TIME; h < END_TIME; h++) {
        for (let m = 0; m < 60; m += INTERVAL) {
            const start = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            const endTime = new Date();
            endTime.setHours(h, m + MAX_DURATION, 0, 0);
            const end = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
            if (endTime.getHours() < END_TIME) {
                slots.push([start, end]);
            }
        }
    }
    return slots;
}

const TIME_SLOTS = getTimeSlots();

// ✅ 수정 1: window.load 제거, DOMContentLoaded만 사용
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM 완전히 로드됨 - initializeApp 호출');
    currentDate = new Date();
    initializeApp();
});

// 앱 초기화
function initializeApp() {
    console.log('앱 초기화 시작');
    setToday();
    setupEventListeners();
    renderAllPages();
    console.log('앱 초기화 완료 - 현재 날짜:', currentDate.toISOString().split('T')[0]);
}

// ✅ 수정 2: 중복 방지 플래그 추가
let listenersInitialized = false;

function setupEventListeners() {
    if (listenersInitialized) return;
    listenersInitialized = true;

    document.getElementById('prevDate').addEventListener('click', () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        currentDate = newDate;
        updateDateDisplay();
        renderAllPages();
        console.log('이전 날짜로 변경:', currentDate.toISOString().split('T')[0]);
    });

    document.getElementById('nextDate').addEventListener('click', () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        currentDate = newDate;
        updateDateDisplay();
        renderAllPages();
        console.log('다음 날짜로 변경:', currentDate.toISOString().split('T')[0]);
    });

    document.getElementById('todayBtn').addEventListener('click', () => {
        console.log('오늘 버튼 클릭됨');
        setToday();
    });

    document.getElementById('datePicker').addEventListener('change', (e) => {
        currentDate = new Date(e.target.value);
        renderAllPages();
        console.log('날짜 선택기 변경:', currentDate.toISOString().split('T')[0]);
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageIndex = btn.dataset.page;
            switchPage(pageIndex);
        });
    });

    document.getElementById('reservationForm').addEventListener('submit', handleReservationSubmit);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
            closePasswordModal();
        }
    });
}

// 오늘 날짜 설정
function setToday() {
    console.log('setToday() 호출됨');
    currentDate = new Date();
    updateDateDisplay();
    renderAllPages();
    console.log('오늘 날짜로 설정 완료:', currentDate.toISOString().split('T')[0]);
}

// 날짜 표시 업데이트
function updateDateDisplay() {
    const datePicker = document.getElementById('datePicker');
    const todayString = currentDate.toISOString().split('T')[0];
    datePicker.value = todayString;
    console.log('날짜 표시 업데이트:', todayString);
}

function switchPage(pageIndex) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    document.querySelector(`[data-page="${pageIndex}"]`).classList.add('active');
    document.getElementById(`page-${pageIndex}`).classList.add('active');
}

function renderAllPages() {
    const dateStr = currentDate.toISOString().split('T')[0];
    console.log('모든 페이지 렌더링 - 날짜:', dateStr);
    
    document.querySelectorAll('.time-slots').forEach(container => {
        const page = container.dataset.page;
        const room = container.dataset.room;
        renderTimeSlots(container, page, room, dateStr);
    });
}

function renderTimeSlots(container, page, room, dateStr) {
    container.innerHTML = '';
    
    TIME_SLOTS.forEach(([start, end]) => {
        const slot = document.createElement('button');
        slot.className = 'time-slot';
        
        const reservationKey = `${dateStr}_${page}_${room}_${start}_${end}`;
        const reservation = reservations[reservationKey];
        
        if (reservation) {
            slot.classList.add('reserved');
            slot.innerHTML = `
                <div class="slot-time">${start}-${end}</div>
                <div class="slot-reserver">${reservation.이름}</div>
            `;
            slot.title = `예약자: ${reservation.이름}\n인원: ${reservation.인원}명\n담당교사: ${reservation.담당교사}`;
        } else {
            slot.textContent = `${start}-${end}`;
            const today = new Date();
            const isToday = currentDate.toDateString() === today.toDateString();
            
            if (isToday) {
                const slotTime = new Date();
                const [hour, minute] = start.split(':');
                slotTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
                
                if (slotTime < today) {
                    slot.classList.add('disabled');
                    slot.disabled = true;
                }
            }
        }
        
        slot.addEventListener('click', () => {
            if (!slot.disabled) {
                handleSlotClick(page, room, start, end, reservation);
            }
        });
        
        container.appendChild(slot);
    });
}

function handleSlotClick(page, room, start, end, existingReservation) {
    if (existingReservation) {
        currentReservation = {
            key: `${currentDate.toISOString().split('T')[0]}_${page}_${room}_${start}_${end}`,
            reservation: existingReservation
        };
        showPasswordModal();
    } else {
        currentReservation = {
            key: `${currentDate.toISOString().split('T')[0]}_${page}_${room}_${start}_${end}`,
            page: page,
            room: room,
            start: start,
            end: end
        };
        showReservationModal();
    }
}

function showReservationModal() {
    document.getElementById('reservationModal').style.display = 'block';
    document.getElementById('reservationName').focus();
}

function closeModal() {
    document.getElementById('reservationModal').style.display = 'none';
    document.getElementById('reservationForm').reset();
    currentReservation = null;
}

function showPasswordModal() {
    document.getElementById('passwordModal').style.display = 'block';
    document.getElementById('deletePassword').focus();
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('deletePassword').value = '';
    currentReservation = null;
}

function handleReservationSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('reservationName').value.trim();
    const people = parseInt(document.getElementById('reservationPeople').value);
    const teacher = document.getElementById('reservationTeacher').value.trim();
    const password = document.getElementById('reservationPassword').value;
    const agreement = document.getElementById('teacherAgreement').checked;
    
    if (!name) {
        showToast('예약자 이름을 입력하세요.', 'error');
        return;
    }
    if (!people || people < 1) {
        showToast('사용 인원을 1명 이상으로 입력하세요.', 'error');
        return;
    }
    if (!teacher) {
        showToast('담당 교사명을 입력하세요.', 'error');
        return;
    }
    if (!/^\d{4}$/.test(password)) {
        showToast('비밀번호는 숫자 4자리로 입력하세요.', 'error');
        return;
    }
    if (!agreement) {
        showToast('담당 교사의 동의를 체크하세요.', 'error');
        return;
    }

    const reservation = {
        이름: name,
        인원: people,
        담당교사: teacher,
        비밀번호: password,
        예약시간: new Date().toISOString()
    };
    
    reservations[currentReservation.key] = reservation;
    saveReservations();
    showToast('예약이 완료되었습니다!', 'success');
    
    closeModal();
    renderAllPages();
}

function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const password = document.getElementById('deletePassword').value;
    
    if (!/^\d{4}$/.test(password)) {
        showToast('비밀번호는 숫자 4자리로 입력하세요.', 'error');
        return;
    }
    
    const reservation = currentReservation.reservation;
    
    if (password === reservation.비밀번호 || password === MASTER_KEY) {
        delete reservations[currentReservation.key];
        saveReservations();
        showToast('예약이 삭제되었습니다.', 'success');
        
        closePasswordModal();
        renderAllPages();
    } else {
        showToast('비밀번호가 일치하지 않습니다.', 'error');
    }
}

function saveReservations() {
    try {
        localStorage.setItem('reservations', JSON.stringify(reservations));
        console.log('예약 데이터가 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('예약 데이터 저장 실패:', error);
        showToast('데이터 저장에 실패했습니다.', 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function isReserved(date, page, room, start, end) {
    const key = `${date}_${page}_${room}_${start}_${end}`;
    return reservations[key] !== undefined;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatTime(time) {
    return time.toString().padStart(2, '0');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closePasswordModal();
    }
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const form = e.target.closest('form');
        if (form) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    }
});

if ('ontouchstart' in window) {
    document.addEventListener('touchstart', function() {}, { passive: true });
}

window.addEventListener('online', () => {
    showToast('인터넷 연결이 복구되었습니다.', 'success');
});

window.addEventListener('offline', () => {
    showToast('인터넷 연결이 끊어졌습니다. 오프라인 모드로 작동합니다.', 'warning');
});

window.addEventListener('beforeunload', (e) => {
    if (Object.keys(reservations).length > 0) {
        e.preventDefault();
        e.returnValue = '저장되지 않은 예약이 있을 수 있습니다. 정말 나가시겠습니까?';
    }
});

setInterval(() => {
    if (Object.keys(reservations).length > 0) {
        saveReservations();
    }
}, 5 * 60 * 1000);

window.addEventListener('load', () => {
    const savedReservations = localStorage.getItem('reservations');
    if (savedReservations) {
        try {
            const parsed = JSON.parse(savedReservations);
            if (Object.keys(parsed).length > 0) {
                showToast(`${Object.keys(parsed).length}개의 예약이 로드되었습니다.`, 'info');
            }
        } catch (e) {
            console.error('예약 데이터 로드 실패:', e);
            showToast('예약 데이터 로드에 실패했습니다.', 'error');
        }
    }
});

// ✅ 마지막 오늘 날짜 강제 설정 유지
setTimeout(() => {
    if (currentDate.toDateString() !== new Date().toDateString()) {
        console.log('날짜 불일치 감지 - 강제 수정');
        setToday();
    }
}, 100);
