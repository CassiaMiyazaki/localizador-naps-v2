// ==============================
// MAPA
// ==============================

const mapa = L.map("mapa").setView([-22.5, -48.5], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
}).addTo(mapa);

// ==============================
// VARIÁVEIS
// ==============================

let listaNaps = [];

// ==============================
// DISTÂNCIA (HAVERSINE)
// ==============================

function calcularDistancia(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ==============================
// MOSTRAR RESULTADO
// ==============================

function mostrarResultado(nap, distancia = null) {

    document.getElementById("dadosResultado").innerHTML = `
        <h4>${nap.nome}</h4>

        <p><strong>📍 Cidade:</strong> ${nap.cidade}</p>

        ${distancia !== null ? `<p><strong>📏 Distância:</strong> ${distancia.toFixed(2)} km</p>` : ""}

        <p><strong>🏠 Endereço:</strong> ${nap.endereco}, ${nap.numero}</p>

        <p><strong>☎ Telefone:</strong> ${nap.telefone}</p>

        <p><strong>✉ E-mail:</strong> ${nap.email}</p>
    `;
}

// ==============================
// ENCONTRAR NAPS MAIS PRÓXIMO
// ==============================

function localizarMaisProximo(latitude, longitude) {

    mapa.setView([latitude, longitude], 14);

    L.marker([latitude, longitude])
        .addTo(mapa)
        .bindPopup("📍 Sua localização")
        .openPopup();

    let menor = Number.MAX_VALUE;
    let melhor = null;

    listaNaps.forEach(nap => {

        const d = calcularDistancia(
            latitude,
            longitude,
            nap.latitude,
            nap.longitude
        );

        if (d < menor) {
            menor = d;
            melhor = nap;
        }

    });

    mostrarResultado(melhor, menor);
}

// ==============================
// BOTÃO LOCALIZAÇÃO
// ==============================

document.getElementById("btnLocalizacao").addEventListener("click", () => {

    navigator.geolocation.getCurrentPosition(pos => {

        localizarMaisProximo(
            pos.coords.latitude,
            pos.coords.longitude
        );

    }, () => {

        alert("Não foi possível obter sua localização.");

    });

});

// ==============================
// CARREGA O JSON
// ==============================

fetch("dados/naps.json")
.then(r => r.json())
.then(dados => {

    listaNaps = dados;

    listaNaps.forEach(nap => {

        const marcador = L.marker([
            nap.latitude,
            nap.longitude
        ]).addTo(mapa);

        marcador.bindPopup(`
            <strong>${nap.nome}</strong><br>
            ${nap.cidade}
        `);

        marcador.on("click", () => {
            mostrarResultado(nap);
        });

    });

})
.catch(err => console.error(err));


// ==============================
// BUSCA POR CEP
// ==============================

document.getElementById("btnBuscar").addEventListener("click", async () => {

    const cep = document.getElementById("cep").value.replace(/\D/g, "");

    if (cep.length !== 8) {
        alert("Digite um CEP válido.");
        return;
    }

    try {

        // ViaCEP
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const endereco = await resposta.json();

        if (endereco.erro) {
            alert("CEP não encontrado.");
            return;
        }

        // Nominatim
        const busca = `${endereco.logradouro}, ${endereco.localidade}, SP`;

        const geo = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(busca)}`
        );

        const local = await geo.json();

        if (local.length === 0) {
            alert("Não foi possível localizar esse CEP.");
            return;
        }

        localizarMaisProximo(
            parseFloat(local[0].lat),
            parseFloat(local[0].lon)
        );

    } catch (e) {

        console.error(e);
        alert("Erro ao pesquisar o CEP.");

    }

});