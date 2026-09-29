const imageInput = document.getElementById("imageInput");
const uploadArea = document.querySelector(".upload-area");
const promptInput = document.getElementById("prompt");
const generateButton = document.getElementById("generateButton");

const API_URL = "https://app-video-ia-api.app-video-ia.workers.dev";

let selectedImage = null;


// ==========================================
// MOSTRAR VÍDEO INDIVIDUAL
// ==========================================

function mostrarVideo(videoURL) {

    // Remove vídeo de resultado anterior
    const videoAnterior =
        document.querySelector(".video-resultado");

    if (videoAnterior) {
        videoAnterior.remove();
    }


    // Cria o player
    const video =
        document.createElement("video");

    video.className =
        "video-resultado";

    video.src =
        videoURL;

    video.controls =
        true;

    video.autoplay =
        false;

    video.playsInline =
        true;


    // Estilo
    video.style.width =
        "100%";

    video.style.maxWidth =
        "500px";

    video.style.maxHeight =
        "650px";

    video.style.display =
        "block";

    video.style.margin =
        "25px auto 0";

    video.style.borderRadius =
        "15px";


    // Coloca na página
    document
        .querySelector(".generator")
        .appendChild(video);
}


// ==========================================
// CRIAR PLAYER PARA O HISTÓRICO
// ==========================================

function criarVideoHistorico(videoURL) {

    const video =
        document.createElement("video");

    video.src =
        videoURL;

    video.controls =
        true;

    video.autoplay =
        false;

    video.playsInline =
        true;


    video.style.width =
        "100%";

    video.style.maxWidth =
        "500px";

    video.style.maxHeight =
        "650px";

    video.style.display =
        "block";

    video.style.margin =
        "0 auto";

    video.style.borderRadius =
        "15px";


    return video;
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
            // 1. ENVIA A IMAGEM
            // ==========================================

            const uploadResponse =
                await fetch(
                    `${API_URL}/upload`,
                    {
                        method: "POST",

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
            // 2. PEGA A CHAVE DA IMAGEM
            // ==========================================

            const imageKey =
                uploadData.arquivo;


            console.log(
                "Imagem salva:",
                imageKey
            );


            // ==========================================
            // 3. ENVIA PROMPT + IMAGEM
            // ==========================================

            generateButton.textContent =
                "💾 Salvando geração...";


            const generationResponse =
                await fetch(
                    `${API_URL}/generate`,
                    {
                        method: "POST",

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
                        `${API_URL}/status?requestId=${encodeURIComponent(requestId)}`
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
                // VÍDEO PRONTO
                // ==========================================

                if (
                    status === "completed"
                ) {

                    generateButton.textContent =
                        "🎬 Vídeo pronto!";


                    const videoURL =
                        `${API_URL}/video?requestId=${encodeURIComponent(requestId)}`;


                    // Mostra o vídeo recém-gerado
                    mostrarVideo(
                        videoURL
                    );


                    // Atualiza o histórico
                    await carregarHistorico();


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
                // AINDA PROCESSANDO
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
// CARREGAR HISTÓRICO COMPLETO
// ==========================================

async function carregarHistorico() {

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


        if (
            videos.length === 0
        ) {

            console.log(
                "Nenhum vídeo encontrado no histórico."
            );

            return;
        }


        // ==========================================
        // PROCURA A ÁREA DO HISTÓRICO
        // ==========================================

        let historico =
            document.getElementById(
                "historicoVideos"
            );


        // ==========================================
        // CRIA A ÁREA SE NÃO EXISTIR
        // ==========================================

        if (!historico) {

            historico =
                document.createElement(
                    "section"
                );


            historico.id =
                "historicoVideos";


            historico.style.marginTop =
                "40px";


            document
                .querySelector(".generator")
                .appendChild(
                    historico
                );
        }


        // ==========================================
        // LIMPA O HISTÓRICO ANTERIOR
        // ==========================================

        historico.innerHTML = `
            <h2
                style="
                    margin-bottom: 20px;
                    text-align: center;
                "
            >
                🎬 Meus vídeos
            </h2>
        `;


        // ==========================================
        // ADICIONA TODOS OS VÍDEOS
        // ==========================================

        videos.forEach(
            function (item) {

                // Precisamos do Request ID
                if (
                    !item.request_id
                ) {

                    console.warn(
                        "Vídeo sem request_id:",
                        item
                    );

                    return;
                }


                // Container de cada vídeo
                const videoContainer =
                    document.createElement(
                        "div"
                    );


                videoContainer.style.marginBottom =
                    "35px";


                // URL passa pelo nosso Worker
                const videoURL =
                    `${API_URL}/video?requestId=${encodeURIComponent(
                        item.request_id
                    )}`;


                // Cria o player
                const video =
                    criarVideoHistorico(
                        videoURL
                    );


                videoContainer.appendChild(
                    video
                );


                historico.appendChild(
                    videoContainer
                );

            }
        );


    } catch (error) {

        console.error(
            "Erro ao carregar histórico:",
            error
        );
    }
}


// ==========================================
// CARREGAR HISTÓRICO AO ABRIR O SITE
// ==========================================

carregarHistorico();
