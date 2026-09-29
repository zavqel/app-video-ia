const imageInput = document.getElementById("imageInput");
const uploadArea = document.querySelector(".upload-area");
const promptInput = document.getElementById("prompt");
const generateButton = document.getElementById("generateButton");

const API_URL = "https://app-video-ia-api.app-video-ia.workers.dev";

let selectedImage = null;


// ==========================================
// MOSTRAR VÍDEO
// ==========================================

function mostrarVideo(videoURL) {

    // Remove vídeo anterior, se existir
    const videoAnterior =
        document.querySelector(".video-resultado");

    if (videoAnterior) {
        videoAnterior.remove();
    }


    // Cria o player
    const video = document.createElement("video");

    video.className = "video-resultado";

    video.src = videoURL;

    video.controls = true;

    video.autoplay = false;

    video.playsInline = true;


    // Estilo do vídeo
    video.style.width = "100%";
    video.style.maxWidth = "500px";
    video.style.maxHeight = "650px";
    video.style.display = "block";
    video.style.margin = "25px auto 0";
    video.style.borderRadius = "15px";


    // Coloca o vídeo na página
    document.querySelector(".generator")
        .appendChild(video);
}


// ==========================================
// SELEÇÃO DA IMAGEM
// ==========================================

imageInput.addEventListener("change", function () {

    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    selectedImage = file;

    const imageURL = URL.createObjectURL(file);

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
});


// ==========================================
// GERAR VÍDEO
// ==========================================

generateButton.addEventListener("click", async function () {

    if (!selectedImage) {
        alert("Escolha uma imagem primeiro.");
        return;
    }

    const prompt = promptInput.value.trim();

    if (!prompt) {
        alert("Descreva o que você quer que aconteça no vídeo.");
        return;
    }

    try {

        generateButton.disabled = true;
        generateButton.textContent = "⏳ Enviando imagem...";


        // ==========================================
        // 1. ENVIA A IMAGEM PARA O R2
        // ==========================================

        const uploadResponse = await fetch(
            `${API_URL}/upload`,
            {
                method: "POST",
                headers: {
                    "Content-Type": selectedImage.type
                },
                body: selectedImage
            }
        );

        const uploadData = await uploadResponse.json();

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
        // 3. ENVIA PROMPT + IMAGEM PARA O WORKER
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

                    body: JSON.stringify({

                        prompt: prompt,

                        imageKey: imageKey

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
        // AGUARDAR O VÍDEO FICAR PRONTO
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
        // FUNÇÃO PARA CONSULTAR O STATUS
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

            if (status === "completed") {

                generateButton.textContent =
                    "🎬 Vídeo pronto!";


                // Busca o vídeo pelo nosso Worker
                const videoURL =
                    `${API_URL}/video?requestId=${encodeURIComponent(requestId)}`;


                // Mostra o vídeo
                mostrarVideo(videoURL);


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

        console.error(error);


        generateButton.disabled =
            false;


        generateButton.textContent =
            "✨ Gerar vídeo";


        alert(
            "Ocorreu um erro:\n\n" +
            error.message
        );

    }

});


// ==========================================
// CARREGAR ÚLTIMO VÍDEO AO ABRIR A PÁGINA
// ==========================================

async function carregarUltimoVideo() {

    try {

        const response =
            await fetch(
                `${API_URL}/latest`
            );


        const data =
            await response.json();


        console.log(
            "Última geração:",
            data
        );


        if (
            !response.ok ||
            !data.sucesso ||
            !data.geracao
        ) {

            return;

        }


        if (
            data.geracao.status !== "completed" ||
            !data.geracao.video_url ||
            !data.geracao.request_id
        ) {

            return;

        }


        const videoURL =
            `${API_URL}/video?requestId=${encodeURIComponent(
                data.geracao.request_id
            )}`;


        mostrarVideo(videoURL);


    } catch (error) {

        console.error(
            "Não foi possível carregar o último vídeo:",
            error
        );

    }

}


// ==========================================
// CARREGAR AUTOMATICAMENTE AO ABRIR O SITE
// ==========================================

carregarUltimoVideo();
