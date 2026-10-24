// =====================================================
//  CEREBRO DEL DRAGÓN  (aquí vive la "IA" del juego)
//  1) analizarSentimiento -> ¿el mensaje es amable o grosero?
//  2) detectarIntencion   -> ¿qué quiere decir el jugador?
// =====================================================

// ---------- Paso 2: análisis de sentimiento ----------
// Un "léxico": diccionario de palabras con un puntaje.
const LEXICO = {
  // positivas
  gracias: 2, favor: 1, hermoso: 3, hermosa: 3, genial: 3,
  grande: 1, poderoso: 3, increible: 3, amigo: 2, amable: 2, valiente: 2,
  admiro: 3, respeto: 2, bonito: 2, bueno: 2, buena: 2, quiero: 1,
  ayuda: 1, ayudar: 1, feliz: 2, gusto: 2, encanta: 3, amo: 3, mejor: 2,
  // negativas
  feo: -3, fea: -3, tonto: -3, estupido: -4, idiota: -4, odio: -4,
  malo: -2, mala: -2, miedo: -1, mata: -3, matar: -3, muere: -3,
  basura: -4, aburrido: -3, gordo: -3, inutil: -3, cobarde: -3,
  callate: -3, horrible: -3, asco: -3, peor: -2, nunca: -1, robar: -3
};

const NEGADORES = ["no", "nunca", "jamas", "tampoco"];

// Quita tildes y signos para comparar palabras fácilmente.
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zñ\s]/g, " ")
    .trim();
}

// Devuelve un número: positivo = amable, negativo = grosero.
function analizarSentimiento(texto) {
  const palabras = normalizar(texto).split(/\s+/);
  let puntaje = 0;

  palabras.forEach((palabra, i) => {
    let valor = LEXICO[palabra] || 0;
    // Si una de las 2 palabras anteriores es una negación, se invierte ("no eres feo")
    if (valor !== 0 && (NEGADORES.includes(palabras[i - 1]) || NEGADORES.includes(palabras[i - 2]))) valor = -valor;
    puntaje += valor;
  });

  if (texto.includes("!") && puntaje < 0) puntaje -= 1; // gritar empeora
  return puntaje;
}

// ---------- Paso 4: IA real en la nube (API de NVIDIA) ----------
// El navegador NO habla directo con NVIDIA (la clave es secreta).
// Le pide al servidor (server.js) que lo haga y le devuelva:
//   { sentimiento: -10..10, respuesta: "texto del dragón" }
// Si algo falla, devuelve null y el juego usa el diccionario.
async function consultarDragonIA(texto, historial) {
  try {
    const respuesta = await fetch("/api/dragon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: texto, historial }),
      signal: AbortSignal.timeout(20000)
    });
    if (!respuesta.ok) return null;
    return await respuesta.json();
  } catch (error) {
    console.warn("No se pudo usar la IA, se usa el diccionario:", error);
    return null;
  }
}
// ---------- Paso 3: intenciones del chatbot ----------
// Cada intención tiene palabras clave. Es el "flujo conversacional".
const INTENCIONES = [
  { nombre: "saludo",  claves: ["hola", "buenas", "saludos", "hey", "buenos"] },
  { nombre: "llave",   claves: ["llave", "puerta", "abrir", "tesoro", "castillo"] },
  { nombre: "nombre",  claves: ["nombre", "llamas", "quien"] },
  { nombre: "chiste",  claves: ["chiste", "gracioso", "risa", "broma"] },
  { nombre: "comida",  claves: ["comida", "hambre", "comer", "pizza", "oveja"] },
  { nombre: "despedida", claves: ["adios", "chao", "bye", "hasta"] }
];

function detectarIntencion(texto) {
  const palabras = normalizar(texto).split(/\s+/);
  for (const intencion of INTENCIONES) {
    if (intencion.claves.some(c => palabras.includes(c))) return intencion.nombre;
  }
  return "desconocida";
}

// Respuestas del dragón por intención (una según su humor).
const RESPUESTAS = {
  saludo: {
    bien: "¡Saludos, viajero! Hacía siglos que nadie me hablaba con respeto.",
    mal:  "Grrr... ¿Qué quieres, pequeño humano?"
  },
  llave: {
    bien: "¿La llave? Me caes bien... pero demuéstrame que eres de fiar.",
    mal:  "¡La llave es MÍA! Vuelve cuando aprendas modales."
  },
  nombre: {
    bien: "Me llaman Ignis el Paciente. ¿Y tú?",
    mal:  "Mi nombre es 'Aléjate'."
  },
  chiste: {
    bien: "¿Por qué el dragón no usa WiFi? ¡Porque quema la conexión! Ja, ja.",
    mal:  "No estoy de humor para chistes. Tu cara ya es suficiente broma."
  },
  comida: {
    bien: "Mmm, oveja asada... Hace tiempo que no como bien. Qué amable eres.",
    mal:  "¿Comida? Estoy pensando en comerte A TI."
  },
  despedida: {
    bien: "Vuelve pronto, viajero. Tienes buena energía.",
    mal:  "¡Largo de aquí!"
  },
  desconocida: {
    bien: "No te entendí del todo, pero tu tono es agradable. Prueba otra cosa.",
    mal:  "No entiendo nada de lo que dices. Y no me gusta tu tono."
  }
};



