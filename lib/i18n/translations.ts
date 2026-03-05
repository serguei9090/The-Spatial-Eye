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
      tools: {
        add_node: "Adding component",
        add_edge: "Connecting elements",
        clear_diagram: "Clearing canvas",
        delete_node: "Removing component",
        update_node: "Modifying component",
        remove_edge: "Removing connection",
        track_and_highlight: "Highlighting object",
        clear_spatial_highlights: "Clearing highlights",
      },
    },
    toasts: {
      authRequired: "Sign in required before connecting.",
      authTokenMissing: "Cannot connect: No auth token available.",
      connectionInterrupted:
        "The connection was briefly interrupted. Resuming...",
      reconnecting: "Connection lost. Reconnecting (Attempt {attempt}/3)...",
      reconnectFailed: "Could not reconnect to the server.",
      serverError: "Gemini Server Error",
      deadlineExceeded:
        "The Gemini API operation timed out (Deadline Expired).",
      connectionAbnormal: "Connection was lost abnormally.",
      relayError: "Connection error to local relay.",
      accessDenied: "Access denied — billing may be disabled for this model.",
    },
    system: {
      resumeAction:
        "Please resume what you were doing exactly where you left off.",
      resumeWaiting: "I am back online. Await my specific instructions.",
      resumeStory:
        "Please continue the story or narrative from where it stopped.",
      resumeArchitecture:
        "We are building an architecture diagram. Please continue the design.",
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
      tools: {
        add_node: "Agregando componente",
        add_edge: "Conectando elementos",
        clear_diagram: "Limpiando lienzo",
        delete_node: "Eliminando componente",
        update_node: "Modificando componente",
        remove_edge: "Eliminando conexión",
        track_and_highlight: "Resaltando objeto",
        clear_spatial_highlights: "Limpiando resaltados",
      },
    },
    toasts: {
      authRequired: "Se requiere iniciar sesión antes de conectar.",
      authTokenMissing:
        "No se puede conectar: token de autenticación no disponible.",
      connectionInterrupted:
        "La conexión se interrumpió brevemente. Reanudando...",
      reconnecting: "Conexión perdida. Reconectando (Intento {attempt}/3)...",
      reconnectFailed: "No se pudo reconectar con el servidor.",
      serverError: "Error del Servidor Gemini",
      deadlineExceeded:
        "La operación de la API de Gemini expiró (Tiempo agotado).",
      connectionAbnormal: "La conexión se perdió de forma anormal.",
      relayError: "Error de conexión con el relay local.",
      accessDenied:
        "Acceso denegado — la facturación podría estar desactivada para este modelo.",
    },
    system: {
      resumeAction:
        "Por favor, continúa lo que estabas haciendo exactamente donde lo dejaste.",
      resumeWaiting: "Estoy de vuelta. Espera mis instrucciones específicas.",
      resumeStory:
        "Por favor, continúa la historia o narrativa desde donde se detuvo.",
      resumeArchitecture:
        "Estamos construyendo un diagrama de arquitectura. Por favor, continúa el diseño.",
    },
  },
};
