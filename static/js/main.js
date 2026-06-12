// Configurar Day.js
dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);
dayjs.tz.setDefault('America/Lima');

// Función normalizadora de fechas
function normalizeDate(dateStr) {
    if (!dateStr) return null;
    if (typeof dateStr === 'string') {
        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
        const d = dayjs(dateStr);
        if (d.isValid()) return d.format('YYYY-MM-DD');
    }
    return null;
}

const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const globalData = ref(null);
        const currentPage = ref('page1');
        const loading = ref(true);
        const DATA_URL = "https://script.google.com/macros/s/AKfycbyXfOalvYH-ZAUgyicbwk5hKbp35HBHskKH8npZwvjvu1vjnuXgIQe5CgxzdINBU0JUPQ/exec";

        const tabs = [
            { id: 'page1', label: '📅 Programación' },
            { id: 'page2', label: '📚 Historial de Clases' },
            { id: 'page3', label: '👧 Consejeras' }
        ];

        // Computed properties
        const weekendGroups = computed(() => globalData.value?.weekendProgram?.classGroups || []);
        const classHistoryList = computed(() => globalData.value?.classHistory || []);
        const counselorsList = computed(() => globalData.value?.counselors || []);

        // Mapas de colores
        const classColorMap = computed(() => {
            const map = {};
            weekendGroups.value.forEach(group => {
                map[group.className] = group.color;
            });
            return map;
        });

        const getClassColor = (className) => {
            return classColorMap.value[className] || '#cccccc';
        };

        // Métodos auxiliares
        const formatDate = (dateStr) => {
            const norm = normalizeDate(dateStr);
            if (!norm) return '';
            const d = dayjs.tz(norm, 'America/Lima');
            return d.isValid() ? d.format('DD [de] MMMM [de] YYYY') : norm;
        };

        // Calcular días hasta cumpleaños usando fecha normalizada
        const daysUntilBirthday = (birthDateStr) => {
            const now = dayjs().startOf('day');
            const birthDate = dayjs(birthDateStr);
            
            let nextBirthday = birthDate.year(now.year()).startOf('day');

            if (nextBirthday.isBefore(now)) {
                nextBirthday = nextBirthday.add(1, 'year');
            }

            return nextBirthday.diff(now, 'day');
        };

        const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
        const formatClassName = (className) => className.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        const getCounselorName = (id) => {
            const c = counselorsList.value.find(c => c.id === id);
            return c ? `${c.firstName} ${c.lastName}` : `ID ${id}`;
        };
        const getCounselorClass = (id) => {
            const c = counselorsList.value.find(c => c.id === id);
            return c ? c.class : '';
        };

        const fetchData = async () => {
            loading.value = true;
            try {
                const res = await fetch(DATA_URL);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                console.log("Datos cargados correctamente");
                globalData.value = data;
            } catch (err) {
                console.error(err);
                alert("Error cargando datos. Verifica la URL.");
                globalData.value = null;
            } finally {
                loading.value = false;
            }
        };

        const switchToPage = (pageId) => { currentPage.value = pageId; };

        onMounted(() => fetchData());

        return {
            tabs, currentPage, loading,
            weekendGroups, classHistoryList, counselorsList,
            formatDate, daysUntilBirthday, capitalize,
            formatClassName, getCounselorName, getCounselorClass,
            getClassColor, switchToPage
        };
    }
}).mount('#app');