// 전역 변수 - 항상 오늘 날짜로 초기화
let currentDate = new Date();
let reservations = JSON.parse(localStorage.getItem('reservations')) || {};
let currentReservation = null;
const MASTER_KEY = '1320';

// 시간 슬롯 설정
const START_TIME = 8;
const END_TIME = 18;
const INTERVAL = 20; // 분
const MAX_DURATION = 100; // 분

// 시간 슬롯 생성
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

// 페이지 로드 시 즉시 실행
window.addEventListener('load', function() {
    console.log('페이지 로드됨 - 오늘 날짜로 초기화');
    // 강제로 오늘 날짜로 설정
    currentDate = new Date();
    initializeApp();
});

// DOM 로드 완료 후 초기화 (백업)
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 로드됨 - 오늘 날짜로 초기화');
    // 강제로 오늘 날짜로 설정
    currentDate = new Date();
    if (!document.getElementById('datePicker').value) {
        initializeApp();
    }
});

// 앱 초기화
function initializeApp() {
    console.log('앱 초기화 시작');
    setToday();
    setupEventListeners();
    renderAllPages();
    console.log('앱 초기화 완료 - 현재 날짜:', currentDate.toISOString().split('T')[0]);
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 날짜 선택
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

    // 탭 전환
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageIndex = btn.dataset.page;
            switchPage(pageIndex);
        });
    });

    // 예약 폼
    document.getElementById('reservationForm').addEventListener('submit', handleReservationSubmit);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);

    // 모달 외부 클릭으로 닫기
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
            closePasswordModal();
        }
    });
}

// 오늘 날짜 설정 - 강제로 오늘로 설정
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

// 페이지 전환
function switchPage(pageIndex) {
    // 모든 탭 비활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // 선택된 탭 활성화
    document.querySelector(`[data-page="${pageIndex}"]`).classList.add('active');
    document.getElementById(`page-${pageIndex}`).classList.add('active');
}

// 모든 페이지 렌더링
function renderAllPages() {
    const dateStr = currentDate.toISOString().split('T')[0];
    console.log('모든 페이지 렌더링 - 날짜:', dateStr);
    
    document.querySelectorAll('.time-slots').forEach(container => {
        const page = container.dataset.page;
        const room = container.dataset.room;
        renderTimeSlots(container, page, room, dateStr);
    });
}

// 시간 슬롯 렌더링
function renderTimeSlots(container, page, room, dateStr) {
    container.innerHTML = '';
    
    TIME_SLOTS.forEach(([start, end]) => {
        const slot = document.createElement('button');
        slot.className = 'time-slot';
        
        const reservationKey = `${dateStr}_${page}_${room}_${start}_${end}`;
        const reservation = reservations[reservationKey];
        
        if (reservation) {
            // 예약된 슬롯 - 예약자 이름 표시
            slot.classList.add('reserved');
            slot.innerHTML = `
                <div class="slot-time">${start}-${end}</div>
                <div class="slot-reserver">${reservation.이름}</div>
            `;
            slot.title = `예약자: ${reservation.이름}\n인원: ${reservation.인원}명\n담당교사: ${reservation.담당교사}`;
        } else {
            // 빈 슬롯
            slot.textContent = `${start}-${end}`;
            
            // 과거 시간은 비활성화 (오늘 날짜인 경우에만)
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

// 슬롯 클릭 처리
function handleSlotClick(page, room, start, end, existingReservation) {
    if (existingReservation) {
        // 기존 예약 삭제
        currentReservation = {
            key: `${currentDate.toISOString().split('T')[0]}_${page}_${room}_${start}_${end}`,
            reservation: existingReservation
        };
        showPasswordModal();
    } else {
        // 새 예약 생성
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

// 예약 모달 표시
function showReservationModal() {
    document.getElementById('reservationModal').style.display = 'block';
    document.getElementById('reservationName').focus();
}

// 예약 모달 닫기
function closeModal() {
    document.getElementById('reservationModal').style.display = 'none';
    document.getElementById('reservationForm').reset();
    currentReservation = null;
}

// 비밀번호 모달 표시
function showPasswordModal() {
    document.getElementById('passwordModal').style.display = 'block';
    document.getElementById('deletePassword').focus();
}

// 비밀번호 모달 닫기
function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('deletePassword').value = '';
    currentReservation = null;
}

// 예약 제출 처리
function handleReservationSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('reservationName').value.trim();
    const people = parseInt(document.getElementById('reservationPeople').value);
    const teacher = document.getElementById('reservationTeacher').value.trim();
    const password = document.getElementById('reservationPassword').value;
    const agreement = document.getElementById('teacherAgreement').checked;
    
    // 유효성 검사
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
    
    // 예약 저장
    const reservation = {
        이름: name,
        인원: people,
        담당교사: teacher,
        비밀번호: password,
        예약시간: new Date().toISOString() // 예약 생성 시간 추가
    };
    
    reservations[currentReservation.key] = reservation;
    
    // 즉시 저장 및 알림
    saveReservations();
    showToast('예약이 완료되었습니다!', 'success');
    
    closeModal();
    renderAllPages();
}

// 비밀번호 확인 처리
function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const password = document.getElementById('deletePassword').value;
    
    if (!/^\d{4}$/.test(password)) {
        showToast('비밀번호는 숫자 4자리로 입력하세요.', 'error');
        return;
    }
    
    const reservation = currentReservation.reservation;
    
    if (password === reservation.비밀번호 || password === MASTER_KEY) {
        // 예약 삭제
        delete reservations[currentReservation.key];
        
        // 즉시 저장 및 알림
        saveReservations();
        showToast('예약이 삭제되었습니다.', 'success');
        
        closePasswordModal();
        renderAllPages();
    } else {
        showToast('비밀번호가 일치하지 않습니다.', 'error');
    }
}

// 예약 데이터 저장
function saveReservations() {
    try {
        localStorage.setItem('reservations', JSON.stringify(reservations));
        console.log('예약 데이터가 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('예약 데이터 저장 실패:', error);
        showToast('데이터 저장에 실패했습니다.', 'error');
    }
}

// 토스트 알림 표시
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 예약 중복 확인
function isReserved(date, page, room, start, end) {
    const key = `${date}_${page}_${room}_${start}_${end}`;
    return reservations[key] !== undefined;
}

// 날짜 포맷팅
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// 시간 포맷팅
function formatTime(time) {
    return time.toString().padStart(2, '0');
}

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    // ESC로 모달 닫기
    if (e.key === 'Escape') {
        closeModal();
        closePasswordModal();
    }
    
    // Enter로 폼 제출
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const form = e.target.closest('form');
        if (form) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    }
});

// 터치 디바이스 지원
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', function() {}, {passive: true});
}

// 오프라인 지원
window.addEventListener('online', () => {
    showToast('인터넷 연결이 복구되었습니다.', 'success');
});

window.addEventListener('offline', () => {
    showToast('인터넷 연결이 끊어졌습니다. 오프라인 모드로 작동합니다.', 'warning');
});

// 페이지 새로고침 시 경고
window.addEventListener('beforeunload', (e) => {
    if (Object.keys(reservations).length > 0) {
        e.preventDefault();
        e.returnValue = '저장되지 않은 예약이 있을 수 있습니다. 정말 나가시겠습니까?';
    }
});

// 자동 저장 (5분마다)
setInterval(() => {
    if (Object.keys(reservations).length > 0) {
        saveReservations();
    }
}, 5 * 60 * 1000);

// 초기 로드 시 데이터 복원 확인
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

// 강제로 오늘 날짜 설정 (마지막 보장)
setTimeout(() => {
    if (currentDate.toDateString() !== new Date().toDateString()) {
        console.log('날짜 불일치 감지 - 강제 수정');
        setToday();
    }
}, 100);
