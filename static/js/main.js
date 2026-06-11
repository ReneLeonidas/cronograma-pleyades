// Configurar Day.js (zona horaria Lima)
dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);
dayjs.tz.setDefault('America/Lima');

// Función auxiliar para normalizar fecha a YYYY-MM-DD sin zona horaria
function normalizeDate(dateStr) {
    if (!dateStr) return null;
    // Si es string ISO con T, tomar solo la parte de fecha
    if (typeof dateStr === 'string') {
        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
        // Fallback: intentar convertir con dayjs y extraer
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

        const tabs = [
            { id: 'page1', label: 'Programación' },
            { id: 'page2', label: 'Historial de Clases' },
            { id: 'page3', label: 'Consejeras' }
        ];

        const DATA_URL = "https://script.google.com/macros/s/AKfycbyXfOalvYH-ZAUgyicbwk5hKbp35HBHskKH8npZwvjvu1vjnuXgIQe5CgxzdINBU0JUPQ/exec";

        const weekendGroups = computed(() => globalData.value?.weekendProgram?.classGroups || []);
        const classHistoryList = computed(() => globalData.value?.classHistory || []);
        const counselorsList = computed(() => globalData.value?.counselors || []);

        // Formatear fecha para mostrar
        const formatDate = (dateStr) => {
            const normalized = normalizeDate(dateStr);
            if (!normalized) return '';
            const d = dayjs.tz(normalized, 'America/Lima');
            return d.isValid() ? d.format('DD [de] MMMM [de] YYYY') : normalized;
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

        const capitalize = (str) => {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        };

        const formatClassName = (className) => {
            return className.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        };

        const getCounselorName = (counselorId) => {
            const counselor = counselorsList.value.find(c => c.id === counselorId);
            return counselor ? `${counselor.firstName} ${counselor.lastName}` : `ID ${counselorId}`;
        };

        const getCounselorClass = (counselorId) => {
            const counselor = counselorsList.value.find(c => c.id === counselorId);
            return counselor ? counselor.class : '';
        };

        const fetchData = async () => {
            loading.value = true;
            try {
                const response = await fetch(DATA_URL);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                console.log("Datos cargados correctamente.");
                globalData.value = data;
            } catch (error) {
                console.error("Error cargando datos:", error);
                alert("No se pudo cargar la base de datos. Verifica la URL.");
                globalData.value = null;
            } finally {
                loading.value = false;
            }
        };

        const switchToPage = (pageId) => {
            currentPage.value = pageId;
        };

        onMounted(() => {
            fetchData();
        });

        return {
            tabs,
            currentPage,
            loading,
            weekendGroups,
            classHistoryList,
            counselorsList,
            formatDate,
            daysUntilBirthday,
            capitalize,
            formatClassName,
            getCounselorName,
            getCounselorClass,
            switchToPage
        };
    }
}).mount('#app');