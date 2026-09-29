const imageInput = document.getElementById("imageInput");
const uploadArea = document.querySelector(".upload-area");
const promptInput = document.getElementById("prompt");
const generateButton = document.getElementById("generateButton");

const API_URL =
    "https://app-video-ia-api.app-video-ia.workers.dev";

let selectedImage = null;


// ==========================================
// ESCAPAR TEXTO PARA HTML
// ==========================================

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto || "";

    return div.innerHTML;
}


// ==========================================
// FORMATAR DATA
// ==========================================

function formatarData(data) {

    if (!data) {
        return "";
    }

    const dataObj =
        new Date(data);

    if (isNaN(dataObj.getTime())) {
        return "";
    }

    return dataObj.toLocaleString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==========================================
// SELEÇÃO DA IMAGEM
// ==========================================

imageInput.addEventListener(
    "change",
    function () {

        const file =
            imageInput.files[0];

        if (!file) {
            return;
        }

        selectedImage =
            file;

        const imageURL =
            URL.createObjectURL(file);

        uploadArea.innerHTML = `
            <img
                src="${imageURL}"
                alt="Imagem selecionada"
                style="
                    max-width: 100%;
                    max-height: 350px;
                    border-radius: 12px;
                    object-fit: contain;
                "
            >

            <p style="margin-top: 15px;">
                Imagem selecionada!
            </p>
        `;
    }
);


// ==========================================
// BAIXAR VÍDEO
// ==========================================

async function baixarVideo(
    videoURL,
    botao
) {

    try {

        const textoOriginal =
            botao.textContent;

        botao.disabled =
            true;

        botao.textContent =
            "⏳ Baixando...";


        const response =
            await fetch(
                videoURL
            );


        if (!response.ok) {

            throw new Error(
                "Não foi possível baixar o vídeo."
            );
        }


        const blob =
            await response.blob();


        const blobURL =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");

        link.href =
            blobURL;

        link.download =
            "video-ia.mp4";


        document.body.appendChild(
            link
        );

        link.click();

        link.remove();


        URL.revokeObjectURL(
            blobURL
        );


        botao.textContent =
            "✅ Baixado!";


        setTimeout(
            function () {

                botao.textContent =
                    textoOriginal;

                botao.disabled =
                    false;

            },
            2000
        );


    } catch (error) {

        console.error(
            "Erro ao baixar vídeo:",
            error
        );


        botao.disabled =
            false;

        botao.textContent =
            "⬇️ Baixar";


        alert(
            "Não foi possível baixar o vídeo."
        );
    }
}


// ==========================================
// CRIAR CARD DO HISTÓRICO
// ==========================================

function criarCardVideo(
    item,
    ehNovo
) {

    if (!item.request_id) {

        console.warn(
            "Vídeo sem request_id:",
            item
        );

        return null;
    }


    // URL do nosso Worker
    const videoURL =
        `${API_URL}/video?requestId=${encodeURIComponent(
            item.request_id
        )}`;


    // Card
    const card =
        document.createElement("article");


    card.className =
        "video-card";


    if (ehNovo) {

        card.classList.add(
            "novo"
        );
    }


    // Cabeçalho
    const topo =
        document.createElement("div");

    topo.className =
        "video-card-topo";


    const titulo =
        document.createElement("div");

    titulo.className =
        "video-card-titulo";

    titulo.textContent =
        "🎬 Vídeo gerado";


    topo.appendChild(
        titulo
    );


    if (ehNovo) {

        const etiqueta =
            document.createElement("span");

        etiqueta.className =
            "video-card-novo";

        etiqueta.textContent =
            "✨ NOVO";

        topo.appendChild(
            etiqueta
        );
    }


    card.appendChild(
        topo
    );


    // ==========================================
    // PLAYER
    // ==========================================

    const video =
        document.createElement("video");

    video.src =
        videoURL;

    video.controls =
        true;

    video.preload =
        "metadata";

    video.playsInline =
        true;


    card.appendChild(
        video
    );


    // ==========================================
    // INFORMAÇÕES
    // ==========================================

    const info =
        document.createElement("div");

    info.className =
        "video-card-info";


    // Data
    const data =
        document.createElement("div");

    data.className =
        "video-card-data";

    data.textContent =
        "📅 " +
        formatarData(
            item.created_at
        );


    info.appendChild(
        data
    );


    // ==========================================
    // PROMPT
    // ==========================================

    if (item.prompt) {

        const detalhes =
            document.createElement("details");

        detalhes.className =
            "video-card-prompt";


        const summary =
            document.createElement("summary");

        summary.textContent =
            "📝 Ver prompt";


        const prompt =
            document.createElement("p");

        prompt.textContent =
            item.prompt;


        detalhes.appendChild(
            summary
        );

        detalhes.appendChild(
            prompt
        );

        info.appendChild(
            detalhes
        );
    }


    // ==========================================
    // BOTÕES
    // ==========================================

    const acoes =
        document.createElement("div");

    acoes.className =
        "video-card-acoes";


    // Abrir
    const abrir =
        document.createElement("a");

    abrir.href =
        videoURL;

    abrir.target =
        "_blank";

    abrir.rel =
        "noopener";

    abrir.textContent =
        "▶️ Abrir";


    // Baixar
    const baixar =
        document.createElement("button");

    baixar.type =
        "button";

    baixar.textContent =
        "⬇️ Baixar";


    baixar.addEventListener(
        "click",
        function () {

            baixarVideo(
                videoURL,
                baixar
            );

        }
    );


    acoes.appendChild(
        abrir
    );

    acoes.appendChild(
        baixar
    );


    info.appendChild(
        acoes
    );


    card.appendChild(
        info
    );


    return card;
}


// ==========================================
// CARREGAR HISTÓRICO
// ==========================================

async function carregarHistorico(
    requestIdNovo = null
) {

    try {

        console.log(
            "Buscando histórico de vídeos..."
        );


        const response =
            await fetch(
                `${API_URL}/history`
            );


        const data =
            await response.json();


        console.log(
            "Histórico recebido:",
            data
        );


        if (
            !response.ok ||
            !data.sucesso
        ) {

            console.error(
                "Não foi possível carregar o histórico."
            );

            return;
        }


        const videos =
            data.videos || [];


        // ==========================================
        // PROCURA / CRIA ÁREA
        // ==========================================

        let historico =
            document.getElementById(
                "historicoVideos"
            );


        if (!historico) {

            historico =
                document.createElement(
                    "section"
                );

            historico.id =
                "historicoVideos";


            document
                .querySelector(".generator")
                .appendChild(
                    historico
                );
        }


        // Limpa
        historico.innerHTML =
            "";


        // ==========================================
        // TÍTULO
        // ==========================================

        const titulo =
            document.createElement(
                "div"
            );

        titulo.className =
            "historico-titulo";


        titulo.innerHTML = `
            <h2>🎬 Meus vídeos</h2>
            <p>
                ${videos.length}
                ${videos.length === 1
                    ? "vídeo gerado"
                    : "vídeos gerados"}
            </p>
        `;


        historico.appendChild(
            titulo
        );


        // ==========================================
        // GRID
        // ==========================================

        const grid =
            document.createElement(
                "div"
            );

        grid.className =
            "historico-grid";


        // ==========================================
        // ADICIONA OS VÍDEOS
        // ==========================================

        videos.forEach(
            function (item, index) {

                const ehNovo =
                    requestIdNovo &&
                    item.request_id ===
                        requestIdNovo;


                const card =
                    criarCardVideo(
                        item,
                        ehNovo
                    );


                if (card) {

                    grid.appendChild(
                        card
                    );
                }

            }
        );


        historico.appendChild(
            grid
        );


        // ==========================================
        // ROLA ATÉ O NOVO VÍDEO
        // ==========================================

        if (requestIdNovo) {

            const cardNovo =
                grid.querySelector(
                    ".video-card.novo"
                );


            if (cardNovo) {

                setTimeout(
                    function () {

                        cardNovo.scrollIntoView(
                            {
                                behavior:
                                    "smooth",
                                block:
                                    "center"
                            }
                        );

                    },
                    200
                );
            }
        }


    } catch (error) {

        console.error(
            "Erro ao carregar histórico:",
            error
        );
    }
}


// ==========================================
// GERAR VÍDEO
// ==========================================

generateButton.addEventListener(
    "click",
    async function () {

        if (!selectedImage) {

            alert(
                "Escolha uma imagem primeiro."
            );

            return;
        }


        const prompt =
            promptInput.value.trim();


        if (!prompt) {

            alert(
                "Descreva o que você quer que aconteça no vídeo."
            );

            return;
        }


        try {

            generateButton.disabled =
                true;

            generateButton.textContent =
                "⏳ Enviando imagem...";


            // ==========================================
            // 1. UPLOAD
            // ==========================================

            const uploadResponse =
                await fetch(
                    `${API_URL}/upload`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                selectedImage.type
                        },

                        body:
                            selectedImage
                    }
                );


            const uploadData =
                await uploadResponse.json();


            console.log(
                "Resposta do upload:",
                uploadData
            );


            if (
                !uploadResponse.ok ||
                !uploadData.sucesso
            ) {

                throw new Error(
                    uploadData.erro ||
                    "Não foi possível enviar a imagem."
                );
            }


            // ==========================================
            // 2. CHAVE DA IMAGEM
            // ==========================================

            const imageKey =
                uploadData.arquivo;


            console.log(
                "Imagem salva:",
                imageKey
            );


            // ==========================================
            // 3. GERAÇÃO
            // ==========================================

            generateButton.textContent =
                "💾 Salvando geração...";


            const generationResponse =
                await fetch(
                    `${API_URL}/generate`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                prompt:
                                    prompt,

                                imageKey:
                                    imageKey

                            })
                    }
                );


            const generationData =
                await generationResponse.json();


            console.log(
                "Resposta do banco:",
                generationData
            );


            if (
                !generationResponse.ok ||
                !generationData.sucesso
            ) {

                throw new Error(
                    generationData.erro +
                    "\n\nDetalhes da Higgsfield:\n" +
                    JSON.stringify(
                        generationData.detalhes,
                        null,
                        2
                    )
                );
            }


            // ==========================================
            // REQUEST ID
            // ==========================================

            const requestId =
                generationData.requestId;


            if (!requestId) {

                throw new Error(
                    "A Higgsfield não retornou o Request ID."
                );
            }


            generateButton.textContent =
                "⏳ Gerando vídeo...";


            // ==========================================
            // CONSULTAR STATUS
            // ==========================================

            async function verificarStatus() {

                const statusResponse =
                    await fetch(
                        `${API_URL}/status?requestId=${encodeURIComponent(
                            requestId
                        )}`
                    );


                const statusData =
                    await statusResponse.json();


                console.log(
                    "Status da geração:",
                    statusData
                );


                if (
                    !statusResponse.ok ||
                    !statusData.sucesso
                ) {

                    throw new Error(
                        statusData.erro ||
                        "Não foi possível consultar o status do vídeo."
                    );
                }


                const status =
                    statusData.status;


                // ==========================================
                // PRONTO
                // ==========================================

                if (
                    status === "completed"
                ) {

                    generateButton.textContent =
                        "🎬 Vídeo pronto!";


                    // Recarrega todo o histórico
                    // e destaca o novo vídeo
                    await carregarHistorico(
                        requestId
                    );


                    generateButton.disabled =
                        false;

                    generateButton.textContent =
                        "✨ Gerar vídeo";


                    return;
                }


                // ==========================================
                // ERRO
                // ==========================================

                if (
                    status === "failed" ||
                    status === "nsfw"
                ) {

                    throw new Error(
                        "A geração do vídeo terminou com status: " +
                        status
                    );
                }


                // ==========================================
                // PROCESSANDO
                // ==========================================

                console.log(
                    "Vídeo ainda sendo processado..."
                );


                setTimeout(
                    verificarStatus,
                    5000
                );
            }


            verificarStatus();


        } catch (error) {

            console.error(
                error
            );


            generateButton.disabled =
                false;


            generateButton.textContent =
                "✨ Gerar vídeo";


            alert(
                "Ocorreu um erro:\n\n" +
                error.message
            );
        }

    }
);


// ==========================================
// CARREGAR HISTÓRICO AO ABRIR O SITE
// ==========================================

carregarHistorico();
