let intervaloCountdown = null;

async function cargarHorario() {

  const res = await fetch("/data/horario.json");
  const data = await res.json();

  // 👇 Solo mostramos lunes a sábado en el front
  const diasVisibles = ["lunes","martes","miercoles","jueves","viernes","sabado"];
  const diasAbreviados = ["Lun","Mar","Mie","Jue","Vie","Sab"];

  const nav = document.getElementById("dias-nav");
  const tabla = document.getElementById("tabla-horario");
  const claseActual = document.getElementById("clase-actual");
  const countdownEl = document.getElementById("countdown");

  // Crear navegación (SIN domingo)
  diasVisibles.forEach((dia, i) => {
    const li = document.createElement("li");
    li.textContent = diasAbreviados[i];
    li.dataset.dia = dia;
    li.addEventListener("click", () => mostrarDia(dia));
    nav.appendChild(li);
  });

  // Día actual real
  const mapaDias = {
    0: "domingo",
    1: "lunes",
    2: "martes",
    3: "miercoles",
    4: "jueves",
    5: "viernes",
    6: "sabado"
  };

  const hoyReal = mapaDias[new Date().getDay()];
  const diaInicial = hoyReal === "domingo" ? "lunes" : hoyReal;

  mostrarDia(diaInicial);
  actualizarEstado();

  function mostrarDia(dia) {
    tabla.innerHTML = "";

    if (!data[dia]) return;

    data[dia].forEach(clase => {
      const card = document.createElement("div");
      card.classList.add("clase");

      card.innerHTML = `
        <div><strong>🥊 Disciplina:</strong> ${clase.disciplina}</div>
        <div><strong>⏳ Inicio:</strong> ${clase.inicio}</div>
        <div><strong>⌛ Final:</strong> ${clase.fin}</div>
        <div><strong>🏅 Nivel:</strong> ${clase.nivel}</div>
        <div><strong>🥋 Vestimenta:</strong> ${clase.vestimenta || "---"}</div>
        <div><strong>👤 Entrenador:</strong> ${clase.entrenador}</div>
      `;

      card.style.borderLeft = `5px solid var(--${clase.colorKey}-color)`;
      tabla.appendChild(card);
    });

    // Resaltar nav
    nav.querySelectorAll("li").forEach(li => li.classList.remove("activo"));
    const activo = nav.querySelector(`li[data-dia="${dia}"]`);
    if (activo) activo.classList.add("activo");
  }

  function actualizarEstado() {
    const ahora = new Date();
    let diaHoy = mapaDias[ahora.getDay()];

    // 🔴 Domingo → considerar lunes
    if (diaHoy === "domingo") {
      const clasesLunes = data["lunes"] || [];
      if (clasesLunes.length > 0) {
        const primeraClase = clasesLunes[0];
        const [hIni, mIni] = primeraClase.inicio.split(":");
        const fechaLunes = new Date();
        fechaLunes.setDate(fechaLunes.getDate() + 1);
        fechaLunes.setHours(hIni, mIni, 0);

        claseActual.textContent = "🔒 Cerrado 🔒";
        iniciarCountdown(fechaLunes, primeraClase.disciplina, "inicio", countdownEl, primeraClase.colorKey);
      }
      return;
    }

    // 🔵 Días normales
    const clasesHoy = data[diaHoy] || [];
    let claseActiva = null;
    let siguienteClase = null;

    for (let clase of clasesHoy) {
      const [hIni, mIni] = clase.inicio.split(":");
      const [hFin, mFin] = clase.fin.split(":");

      const inicio = new Date();
      inicio.setHours(hIni, mIni, 0);

      const fin = new Date();
      fin.setHours(hFin, mFin, 0);

      if (ahora >= inicio && ahora <= fin) {
        claseActiva = clase;
        break;
      }

      if (ahora < inicio && !siguienteClase) {
        siguienteClase = clase;
      }
    }

    if (claseActiva) {
      claseActual.textContent =
        `${claseActiva.inicio} - ${claseActiva.fin} ${claseActiva.disciplina}`;

      const [hFin, mFin] = claseActiva.fin.split(":");
      const fechaFin = new Date();
      fechaFin.setHours(hFin, mFin, 0);

      iniciarCountdown(
        fechaFin,
        claseActiva.disciplina,
        "fin",
        countdownEl,
        claseActiva.colorKey
      );

    } else if (siguienteClase) {
      claseActual.textContent = "🔒 Cerrado 🔒";

      const [hIni, mIni] = siguienteClase.inicio.split(":");
      const fechaIni = new Date();
      fechaIni.setHours(hIni, mIni, 0);

      iniciarCountdown(
        fechaIni,
        siguienteClase.disciplina,
        "inicio",
        countdownEl,
        siguienteClase.colorKey
      );

    } else {
      claseActual.textContent = "🔒 Cerrado 🔒";
      countdownEl.textContent = "";
    }
  }

  setInterval(actualizarEstado, 60000);
}

// 🔥 Countdown con color de disciplina desde CSS
function iniciarCountdown(fechaObjetivo, texto, modo, countdownEl, colorKey) {

  if (intervaloCountdown) clearInterval(intervaloCountdown);

  function actualizar() {
    const ahora = new Date();
    const diferencia = fechaObjetivo - ahora;

    if (diferencia <= 0) {
      clearInterval(intervaloCountdown);
      return;
    }

    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    // 🔹 Obtener valor real de la variable CSS
    const rootStyles = getComputedStyle(document.documentElement);
    const colorVariable = rootStyles.getPropertyValue(`--${colorKey}-color`).trim();

    if (modo === "fin") {
      countdownEl.innerHTML =
        `🔥 En curso: <strong style="color:${colorVariable}">${texto}</strong><br>
         ⏳ Termina en <span>${horas}h ${minutos}m ${segundos}s</span>`;
    } else {
      countdownEl.innerHTML =
        `⏳ Próxima clase: <strong style="color:${colorVariable}">${texto}</strong><br>
         Empieza en <span>${horas}h ${minutos}m ${segundos}s</span>`;
    }
  }

  actualizar();
  intervaloCountdown = setInterval(actualizar, 1000);
}

cargarHorario();
