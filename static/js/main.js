// ================= CONFIGURATION =================
const DATA_URL = "https://script.google.com/macros/s/AKfycbyXfOalvYH-ZAUgyicbwk5hKbp35HBHskKH8npZwvjvu1vjnuXgIQe5CgxzdINBU0JUPQ/exec";
// =================================================

let globalData = null;
let attendanceState = {};

// ---------- Helper functions using Day.js ----------
function daysUntilBirthday(birthDateStr) {
    const now = dayjs().startOf('day');
    const birthDate = dayjs(birthDateStr);
    
    let nextBirthday = birthDate.year(now.year()).startOf('day');

    if (nextBirthday.isBefore(now)) {
        nextBirthday = nextBirthday.add(1, 'year');
    }

    return nextBirthday.diff(now, 'day');
}

function formatDate(dateStr) {
    // dateStr: "YYYY-MM-DD"
    if (!dateStr) return '';
    const d = dayjs.tz(dateStr, 'America/Lima');
    if (!d.isValid()) return dateStr;
    return d.format('DD [de] MMMM [de] YYYY');
}

async function fetchData() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log("Datos cargados correctamente", data);
        // initAttendance(data);  // <--- COMENTAR O ELIMINAR
        return data;
    } catch (error) {
        console.error("Error cargando datos:", error);
        alert("No se pudo cargar la base de datos.");
        return null;
    }
}

// ---------- PAGE 1 ----------
function renderWeekend(data) {
    const container = document.getElementById('weekendContainer');
    if (!data?.weekendProgram?.classGroups) {
        container.innerHTML = '<div class="loading">Datos de programación no disponibles</div>';
        return;
    }
    const groups = data.weekendProgram.classGroups;
    container.innerHTML = '';

    groups.forEach(group => {
        const className = group.className;
        const displayName = className.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        const saturday = group.saturday;
        const sunday = group.sunday;
        if (!saturday || !sunday) return;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'class-group';
        groupDiv.innerHTML = `<div class="group-header">🐝 ${displayName}</div>`;
        const weekendDiv = document.createElement('div');
        weekendDiv.className = 'weekend-row';

        // Helper para crear columna SIN botón de cambio
        const createDayColumn = (dayKey, dayInfo, dayTitle) => {
            const box = document.createElement('div');
            box.className = 'day-box';
            box.innerHTML = `<div class="day-title">📆 ${dayTitle}</div><div class="activity">🎯 Actividad: ${dayInfo.activity}</div>`;
            const listDiv = document.createElement('div');
            dayInfo.counselors.forEach(cid => {
                const counselor = data.counselors.find(c => c.id === cid);
                const name = counselor ? `${counselor.firstName} ${counselor.lastName}` : `ID ${cid}`;
                const counselorClass = counselor ? counselor.class : '';
                const line = document.createElement('div');
                line.className = 'counselor-line';
                line.innerHTML = `
                    <div><strong>${name}</strong><br><span style="font-size:0.7rem;">${counselorClass}</span></div>
                    <div>
                        <span class="status-badge presente">Presente</span>
                    </div>
                `;
                listDiv.appendChild(line);
            });
            box.appendChild(listDiv);
            return box;
        };

        weekendDiv.appendChild(createDayColumn('saturday', saturday, 'SÁBADO'));
        weekendDiv.appendChild(createDayColumn('sunday', sunday, 'DOMINGO'));
        groupDiv.appendChild(weekendDiv);
        container.appendChild(groupDiv);
    });
}

// ---------- PAGE 2 ----------
function renderHistory(data) {
    const tbody = document.getElementById('historyBody');
    if (!data) { tbody.innerHTML = '<tr><td colspan="4">Sin datos</td></tr>'; return; }
    tbody.innerHTML = '';
    data.classHistory.forEach(entry => {
        const formattedDate = formatDate(entry.date);
        const isActive = entry.status == 1;
        const statusText = isActive ? 'Activo' : 'Inactivo';
        const statusClass = isActive ? 'status-active' : 'status-inactive';
        const rowClass = isActive ? 'class-row-active' : '';
        
        const row = `
            <tr class="${rowClass}">
                <td><strong>${entry.className}</strong></td>
                <td>${formattedDate}</td>
                <td>${entry.topic}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </table>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}


// ---------- PAGE 3 ----------
function renderCounselors(data) {
    const container = document.getElementById('counselorsGrid');
    if (!data) { container.innerHTML = '<div class="loading">Error en datos</div>'; return; }
    container.innerHTML = '';
    data.counselors.forEach(c => {
        const days = daysUntilBirthday(c.birthDate);
        const birthFormatted = formatDate(c.birthDate);
        const classCapitalized = c.class.charAt(0).toUpperCase() + c.class.slice(1);
        const card = document.createElement('div');
        card.className = 'counselor-card';
        card.innerHTML = `
            <h3>${c.firstName} ${c.lastName}</h3>
            <span class="class-tag">${classCapitalized}</span>
            <div style="margin-top: 8px;">📅 Nac.: ${birthFormatted}</div>
            <div>🎂 Días para cumpleaños: <span class="birthday">${days === 0 ? '¡HOY ES SU DÍA!' : `${days} día${days !== 1 ? 's' : ''}`}</span></div>
        `;
        container.appendChild(card);
    });
}


// ---------- Navigation ----------
function switchToPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(pageId).classList.add('active-page');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-btn[data-page="${pageId}"]`).classList.add('active');
    if (globalData) {
        if (pageId === 'page1') renderWeekend(globalData);
        else if (pageId === 'page2') renderHistory(globalData);
        else if (pageId === 'page3') renderCounselors(globalData);
    }
}

// ---------- Initialize ----------
async function init() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchToPage(btn.getAttribute('data-page')));
    });
    const data = await fetchData();
    if (data) {
        globalData = data;
        renderWeekend(globalData);
        renderHistory(globalData);
        renderCounselors(globalData);
    } else {
        document.getElementById('counselorsGrid').innerHTML = '<div class="loading">❌ Error de conexión. Verifica URL.</div>';
    }
}

init();