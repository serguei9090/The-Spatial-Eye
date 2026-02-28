export type Language = "en" | "es";

export const translations = {
  en: {
    modes: {
      live: "Live",
      storyteller: "Storyteller",
      itArchitecture: "IT Architecture",
    },
    status: {
      connecting: "Connecting...",
      ready: "Ready",
      live: "Live",
      aiAssistant: "AI Assistant",
    },
    controls: {
      start: "Start",
      stop: "Stop",
    },
    devices: {
      camera: "Camera",
      microphone: "Microphone",
      speaker: "Speaker",
    },
    settings: {
      title: "Settings",
      language: "Language",
      highlightDuration: "Highlight Duration",
      highlightType: "Highlight Type",
      durations: {
        short: "3 Seconds",
        medium: "5 Seconds",
        long: "10 Seconds",
        always: "Always On",
      },
      types: {
        circle: "Circle",
        rect: "Rounded Rect",
        fitted: "Fitted Circle (+10%)",
      },
    },
  },
  es: {
    modes: {
      live: "En Vivo",
      storyteller: "Cuentacuentos",
      itArchitecture: "Arquitectura TI",
    },
    status: {
      connecting: "Conectando...",
      ready: "Listo",
      live: "En Vivo",
      aiAssistant: "Asistente IA",
    },
    controls: {
      start: "Comenzar",
      stop: "Detener",
    },
    devices: {
      camera: "Cámara",
      microphone: "Micrófono",
      speaker: "Altavoz",
    },
    settings: {
      title: "Configuración",
      language: "Idioma",
      highlightDuration: "Duración del Resaltado",
      highlightType: "Tipo de Resaltado",
      durations: {
        short: "3 Segundos",
        medium: "5 Segundos",
        long: "10 Segundos",
        always: "Siempre Activo",
      },
      types: {
        circle: "Círculo",
        rect: "Rectángulo",
        fitted: "Círculo Ajustado (+10%)",
      },
    },
  },
};
