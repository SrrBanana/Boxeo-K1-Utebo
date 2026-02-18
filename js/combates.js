async function cargarFightBar() {
  const res = await fetch("/data/combates.json");
  const combates = await res.json();

  if (!combates.length) return;

  const hoy = new Date();

  const futuros = combates
    .map(c => ({
      ...c,
      fechaObj: new Date(c.fecha + "T" + c.hora)
    }))
    .filter(c => c.fechaObj >= hoy)
    .sort((a, b) => a.fechaObj - b.fechaObj);

  if (!futuros.length) return;

  let index = 0;
  const container = document.getElementById("fight-bar-container");

  function renderCombate(combate) {
    const ahora = new Date();
    const diff = combate.fechaObj - ahora;

    let estado = "PRÓXIMA PELEA";
    let countdownHTML = "";

    if (diff <= 0 && diff > -86400000) {
      estado = "🔥 HOY HAY COMBATE 🔥";
    } else {
      countdownHTML = `<span class="fight-countdown" id="countdown"></span>`;
    }

    const fechaTexto = combate.fechaObj.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long"
    });

    container.innerHTML = `
      <div class="fight-bar">
        <a href="#cartelera" class="fight-link">
          <span class="fight-label">${estado}</span>
          <span class="fight-main">
            ${combate.peleador} vs ${combate.rival}
          </span>
          <span class="fight-extra">
            📍 ${combate.lugar} · 🗓️ ${fechaTexto} · 🕘 ${combate.hora}
          </span>
          ${countdownHTML}
        </a>
      </div>
    `;

    document.getElementById("cartelera-img").src = combate.cartelera;

    if (diff > 0) iniciarCountdown(combate.fechaObj);
  }

  function iniciarCountdown(fechaObjetivo) {
    const el = document.getElementById("countdown");
    if (!el) return;

    function actualizar() {
      const ahora = new Date();
      const diff = fechaObjetivo - ahora;

      if (diff <= 0) {
        el.innerHTML = "🔥 EN CURSO 🔥";
        return;
      }

      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutos = Math.floor((diff / (1000 * 60)) % 60);
      const segundos = Math.floor((diff / 1000) % 60);

      el.innerHTML = `⏳ ${dias}d ${horas}h ${minutos}m ${segundos}s`;
    }

    actualizar();
    setInterval(actualizar, 1000);
  }

  renderCombate(futuros[index]);

  // Carrusel automático cada 6 segundos
  if (futuros.length > 1) {
    setInterval(() => {
      index = (index + 1) % futuros.length;
      renderCombate(futuros[index]);
    }, 8000);
  }
}

cargarFightBar();
