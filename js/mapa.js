// ═══════════════════════════════════════
// js/mapa.js — MAPA LEAFLET FUNCIONANDO
// ═══════════════════════════════════════

const MAPA_MOD = {
  map: null,
  markers: [],

  init() {},

  render() {
    const container = document.getElementById("svgMapContainer");
    const listEl    = document.getElementById("estadosList");
    if (!container || !listEl) return;

    if (this.map) {
      this.map.remove();
      this.map     = null;
      this.markers = [];
    }

    container.innerHTML = "";
    const mapDiv = document.createElement("div");
    mapDiv.id = "mapBrasil";
    mapDiv.style.cssText =
      "width:100%;height:580px;min-height:580px;border-radius:12px;overflow:hidden;";
    container.appendChild(mapDiv);

    this.map = L.map("mapBrasil", {
      zoomControl:     true,
      scrollWheelZoom: true,
    }).setView([-14.235, -51.925], 4);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom:     18,
      attribution: "MotoFleet",
    }).addTo(this.map);

    // whenReady é garantido pelo Leaflet — sempre dispara
    this.map.whenReady(() => {
      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
        this._renderDados();
      }, 200);
    });
  },

  _renderDados() {
    const listEl = document.getElementById("estadosList");
    if (!listEl || !this.map) return;

    const motos = (typeof getMotos === "function" ? getMotos() : []) || [];

    const por = {};
    ESTADOS.forEach(e => (por[e.uf] = []));
    motos.forEach(m => {
      if (m.estado && por[m.estado] !== undefined) por[m.estado].push(m);
    });

    listEl.innerHTML = ESTADOS.map(e => `
      <div class="estado-item" onclick="MAPA_MOD.openDetalhe('${e.uf}')">
        <span>${e.nome}</span>
        <span class="count">${por[e.uf].length}</span>
      </div>
    `).join("");

    this.markers.forEach(m => this.map && this.map.removeLayer(m));
    this.markers = [];

    motos.forEach(moto => {
      const coord = this.getCoordEstado(moto.estado);
      if (!coord) return;

      const lat = coord[0] + (Math.random() - 0.5) * 0.9;
      const lng = coord[1] + (Math.random() - 0.5) * 0.9;
      const cor = this.getColor(moto.status);

      const marker = L.circleMarker([lat, lng], {
        radius:      10,
        fillColor:   cor,
        color:       "#fff",
        weight:      2,
        fillOpacity: 0.95,
      }).addTo(this.map);

      const slaInfo =
        typeof slaHoras === "function" && moto.dataManut
          ? (typeof slaLabel === "function"
              ? slaLabel(slaHoras(moto.dataManut))
              : slaHoras(moto.dataManut) + "h")
          : "-";

      marker.bindPopup(`
        <div style="min-width:230px;font-family:inherit;line-height:1.7">
          <div style="font-size:15px;font-weight:700;margin-bottom:2px">${moto.placa || "-"}</div>
          <div style="color:#666;margin-bottom:8px">${moto.modelo || "-"}</div>
          <div><b>Condutor:</b> ${moto.condutorNome || "-"}</div>
          <div><b>Status:</b> <span style="color:${cor};font-weight:600">${moto.status || "-"}</span></div>
          <div><b>Cidade:</b> ${moto.cidade || "-"}</div>
          <div><b>Estado:</b> ${moto.estado || "-"}</div>
          <div><b>SLA:</b> ${slaInfo}</div>
          ${moto.obs ? `<div style="margin-top:6px;font-size:12px;color:#888"><b>Obs:</b> ${moto.obs}</div>` : ""}
        </div>
      `);

      this.markers.push(marker);
    });
  },

  refresh() {
    this.render();
  },

  getColor(status) {
    const map = {
      "Em manutenção":          "#ef4444",
      "Aguardando guincho":     "#f59e0b",
      "Pronta":                 "#3b82f6",
      "Disponível":             "#22c55e",
      "Agendado":               "#facc15",
      "Em uso":                 "#8b5cf6",
      "Aguardando agendamento": "#f97316",
      "Inativa":                "#9ca3af",
    };
    return map[status] || "#6366f1";
  },

  getCoordEstado(uf) {
    const coords = {
      AC:[-9.97,-67.81],  AL:[-9.66,-35.73],  AP:[0.03,-51.05],
      AM:[-3.10,-60.02],  BA:[-12.97,-38.50], CE:[-3.71,-38.54],
      DF:[-15.79,-47.88], ES:[-20.31,-40.33], GO:[-16.68,-49.25],
      MA:[-2.53,-44.30],  MG:[-19.92,-43.94], MS:[-20.47,-54.62],
      MT:[-15.60,-56.09], PA:[-1.45,-48.49],  PB:[-7.11,-34.86],
      PE:[-8.05,-34.88],  PI:[-5.09,-42.80],  PR:[-25.42,-49.27],
      RJ:[-22.90,-43.20], RN:[-5.79,-35.21],  RO:[-8.76,-63.90],
      RR:[2.82,-60.67],   RS:[-30.03,-51.23], SC:[-27.59,-48.54],
      SE:[-10.91,-37.07], SP:[-23.55,-46.63], TO:[-10.18,-48.33],
    };
    return coords[uf] || null;
  },

  openDetalhe(uf) {
    const motos  = (typeof getMotos === "function" ? getMotos() : []).filter(m => m.estado === uf);
    const estado = ESTADOS.find(e => e.uf === uf);

    const titleEl = document.getElementById("modalMapaTitle");
    if (titleEl) titleEl.textContent = `${estado?.nome || uf} — ${motos.length} moto(s)`;

    const body = document.getElementById("modalMapaBody");
    if (!body) return;

    body.innerHTML = motos.length
      ? `<table class="data-table">
           <thead>
             <tr><th>Placa</th><th>Modelo</th><th>Condutor</th><th>Status</th></tr>
           </thead>
           <tbody>
             ${motos.map(m => `
               <tr>
                 <td>${m.placa}</td>
                 <td>${m.modelo}</td>
                 <td>${m.condutorNome || "-"}</td>
                 <td>${m.status}</td>
               </tr>
             `).join("")}
           </tbody>
         </table>`
      : `<p style="padding:30px;text-align:center">Nenhuma moto neste estado.</p>`;

    if (typeof openModal === "function") openModal("modalMapa");
    setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 300);
  },
};
