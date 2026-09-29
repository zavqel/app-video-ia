const imageInput = document.getElementById("imageInput");
const uploadArea = document.querySelector(".upload-area");
const promptInput = document.getElementById("prompt");
const generateButton = document.getElementById("generateButton");

const API_URL =
    "https://app-video-ia-api.app-video-ia.workers.dev";

let selectedImage = null;


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
// URL DO VÍDEO
// ==========================================

function obterVideoURL(requestId) {

    return (
        `${API_URL}/video?requestId=` +
        encodeURIComponent(requestId)
    );
}


// ==========================================
// URL DA THUMBNAIL
// ==========================================

function obterThumbnailURL(thumbnailKey) {

    return (
        `${API_URL}/media?key=` +
        encodeURIComponent(thumbnailKey)
    );
}


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
// GERAR THUMBNAIL DO VÍDEO
// ==========================================

async function gerarThumbnail(
    requestId
) {

    console.log(
        "Gerando thumbnail:",
        requestId
    );


    return new Promise(
        function (resolve, reject) {

            const video =
                document.createElement(
                    "video"
                );


            // Muito importante para permitir
            // capturar o frame no canvas
            video.crossOrigin =
                "anonymous";


            video.muted =
                true;


            video.playsInline =
                true;


            video.preload =
                "auto";


            video.src =
                obterVideoURL(
                    requestId
                );


            video.style.position =
                "fixed";

            video.style.left =
                "-9999px";

            video.style.width =
                "1px";

            video.style.height =
                "1px";

            video.style.opacity =
                "0";


            document.body.appendChild(
                video
            );


            let finalizado =
                false;


            function limpar() {

                video.pause();

                video.removeAttribute(
                    "src"
                );

                video.load();

                video.remove();

            }


            function erro(
                mensagem
            ) {

                if (finalizado) {
                    return;
                }

                finalizado =
                    true;

                limpar();

                reject(
                    new Error(
                        mensagem
                    )
                );
            }


            video.addEventListener(
                "error",
                function () {

                    erro(
                        "Não foi possível carregar o vídeo para criar a thumbnail."
                    );

                },
                {
                    once: true
                }
            );


            video.addEventListener(
                "loadedmetadata",
                function () {

                    console.log(
                        "Metadados do vídeo carregados:",
                        video.videoWidth,
                        video.videoHeight
                    );


                    // Primeiro frame
                    video.currentTime =
                        0;

                },
                {
                    once: true
                }
            );


            video.addEventListener(
                "seeked",
                async function () {

                    if (finalizado) {
                        return;
                    }


                    try {

                        const largura =
                            video.videoWidth;

                        const altura =
                            video.videoHeight;


                        if (
                            !largura ||
                            !altura
                        ) {

                            throw new Error(
                                "O vídeo não possui dimensões válidas."
                            );

                        }


                        // Limita a thumbnail
                        // a no máximo 800px de largura
                        const larguraMaxima =
                            800;


                        const escala =
                            Math.min(
                                1,
                                larguraMaxima /
                                    largura
                            );


                        const canvas =
                            document.createElement(
                                "canvas"
                            );


                        canvas.width =
                            Math.round(
                                largura *
                                escala
                            );


                        canvas.height =
                            Math.round(
                                altura *
                                escala
                            );


                        const contexto =
                            canvas.getContext(
                                "2d"
                            );


                        contexto.drawImage(
                            video,
                            0,
                            0,
                            canvas.width,
                            canvas.height
                        );


                        const blob =
                            await new Promise(
                                function (
                                    resolve
                                ) {

                                    canvas.toBlob(
                                        resolve,
                                        "image/jpeg",
                                        0.82
                                    );

                                }
                            );


                        if (!blob) {

                            throw new Error(
                                "Não foi possível criar a imagem da thumbnail."
                            );

                        }


                        console.log(
                            "Thumbnail criada:",
                            blob.size,
                            "bytes"
                        );


                        // ==========================================
                        // ENVIA THUMBNAIL PARA O WORKER
                        // ==========================================

                        const response =
                            await fetch(
                                `${API_URL}/thumbnail?requestId=${encodeURIComponent(
                                    requestId
                                )}`,
                                {
                                    method:
                                        "POST",

                                    headers: {
                                        "Content-Type":
                                            "image/jpeg"
                                    },

                                    body:
                                        blob
                                }
                            );


                        const data =
                            await response.json();


                        console.log(
                            "Resposta da thumbnail:",
                            data
                        );


                        if (
                            !response.ok ||
                            !data.sucesso
                        ) {

                            throw new Error(
                                data.erro ||
                                "Não foi possível salvar a thumbnail."
                            );

                        }


                        finalizado =
                            true;


                        limpar();


                        resolve(
                            data.thumbnail_key
                        );


                    } catch (error) {

                        erro(
                            error.message
                        );

                    }

                },
                {
                    once: true
                }
            );

        }
    );
}


// ==========================================
// MOSTRAR VÍDEO DENTRO DO CARD
// ==========================================

function mostrarVideoNoCard(
    card,
    videoURL,
    botao
) {

    // Verifica se já existe
    let video =
        card.querySelector(
            ".video-card-player"
        );


    if (video) {

        if (
            video.paused
        ) {

            video.play()
                .catch(
                    function () {}
                );

        }

        return;
    }


    video =
        document.createElement(
            "video"
        );


    video.className =
        "video-card-player";


    video.src =
        videoURL;


    video.controls =
        true;


    video.playsInline =
        true;


    video.preload =
        "metadata";


    // Insere antes das informações
    const info =
        card.querySelector(
            ".video-card-info"
        );


    if (info) {

        card.insertBefore(
            video,
            info
        );

    } else {

        card.appendChild(
            video
        );

    }


    // Remove thumbnail visual
    const thumbnail =
        card.querySelector(
            ".video-card-thumbnail"
        );


    if (thumbnail) {

        thumbnail.style.display =
            "none";

    }


    // Troca botão
    if (botao) {

        botao.textContent =
            "⏸️ Ocultar";

    }


    video.addEventListener(
        "loadeddata",
        function () {

            video.play()
                .catch(
                    function () {}
                );

        },
        {
            once: true
        }
    );
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


    const videoURL =
        obterVideoURL(
            item.request_id
        );


    // ==========================================
    // CARD
    // ==========================================

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "video-card";


    if (ehNovo) {

        card.classList.add(
            "novo"
        );
    }


    // ==========================================
    // CABEÇALHO
    // ==========================================

    const topo =
        document.createElement(
            "div"
        );


    topo.className =
        "video-card-topo";


    const titulo =
        document.createElement(
            "div"
        );


    titulo.className =
        "video-card-titulo";


    titulo.textContent =
        "🎬 Vídeo gerado";


    topo.appendChild(
        titulo
    );


    if (ehNovo) {

        const etiqueta =
            document.createElement(
                "span"
            );


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
    // ÁREA DA THUMBNAIL
    // ==========================================

    const thumbnailArea =
        document.createElement(
            "div"
        );


    thumbnailArea.className =
        "video-card-thumbnail";


    // Imagem
    const thumbnail =
        document.createElement(
            "img"
        );


    thumbnail.alt =
        "Thumbnail do vídeo";


    thumbnail.loading =
        "lazy";


    thumbnail.decoding =
        "async";


    if (
        item.thumbnail_key
    ) {

        thumbnail.src =
            obterThumbnailURL(
                item.thumbnail_key
            );

    } else {

        // Placeholder enquanto a thumbnail
        // ainda está sendo criada

        thumbnail.src =
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="800"
                    height="600"
                    viewBox="0 0 800 600"
                >
                    <rect
                        width="800"
                        height="600"
                        fill="#111"
                    />
                    <text
                        x="400"
                        y="300"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        fill="#777"
                        font-family="Arial"
                        font-size="28"
                    >
                        Criando prévia...
                    </text>
                </svg>
            `);

    }


    thumbnailArea.appendChild(
        thumbnail
    );


    // Botão central
    const assistirCentral =
        document.createElement(
            "button"
        );


    assistirCentral.type =
        "button";


    assistirCentral.className =
        "video-thumbnail-play";


    assistirCentral.textContent =
        "▶";


    thumbnailArea.appendChild(
        assistirCentral
    );


    card.appendChild(
        thumbnailArea
    );


    // ==========================================
    // INFORMAÇÕES
    // ==========================================

    const info =
        document.createElement(
            "div"
        );


    info.className =
        "video-card-info";


    // Data
    const data =
        document.createElement(
            "div"
        );


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
            document.createElement(
                "details"
            );


        detalhes.className =
            "video-card-prompt";


        const summary =
            document.createElement(
                "summary"
            );


        summary.textContent =
            "📝 Ver prompt";


        const prompt =
            document.createElement(
                "p"
            );


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
        document.createElement(
            "div"
        );


    acoes.className =
        "video-card-acoes";


    // ==========================================
    // ASSISTIR
    // ==========================================

    const assistir =
        document.createElement(
            "button"
        );


    assistir.type =
        "button";


    assistir.textContent =
        "▶️ Assistir";


    assistir.addEventListener(
        "click",
        function () {

            const videoExistente =
                card.querySelector(
                    ".video-card-player"
                );


            if (
                videoExistente
            ) {

                if (
                    videoExistente.style.display ===
                    "none"
                ) {

                    videoExistente.style.display =
                        "block";

                    assistir.textContent =
                        "⏸️ Ocultar";

                } else {

                    videoExistente.style.display =
                        "none";

                    videoExistente.pause();

                    assistir.textContent =
                        "▶️ Assistir";

                }


                return;
            }


            mostrarVideoNoCard(
                card,
                videoURL,
                assistir
            );

        }
    );


    // ==========================================
    // ABRIR
    // ==========================================

    const abrir =
        document.createElement(
            "a"
        );


    abrir.href =
        videoURL;


    abrir.target =
        "_blank";


    abrir.rel =
        "noopener";


    abrir.textContent =
        "↗️ Abrir";


    // ==========================================
    // BAIXAR
    // ==========================================

    const baixar =
        document.createElement(
            "button"
        );


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
        assistir
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


    // ==========================================
    // CLICAR NA THUMBNAIL
    // ==========================================

    assistirCentral.addEventListener(
        "click",
        function () {

            mostrarVideoNoCard(
                card,
                videoURL,
                assistir
            );

        }
    );


    return card;
}


// ==========================================
// GARANTIR THUMBNAIL
// ==========================================

async function garantirThumbnail(
    item,
    card
) {

    // Já existe
    if (
        item.thumbnail_key
    ) {

        return;
    }


    if (
        !item.request_id
    ) {

        return;
    }


    try {

        const thumbnailKey =
            await gerarThumbnail(
                item.request_id
            );


        if (!thumbnailKey) {
            return;
        }


        console.log(
            "Thumbnail salva:",
            thumbnailKey
        );


        // Atualiza a imagem do card
        const thumbnail =
            card.querySelector(
                ".video-card-thumbnail img"
            );


        if (thumbnail) {

            thumbnail.src =
                obterThumbnailURL(
                    thumbnailKey
                );

        }


    } catch (error) {

        console.error(
            "Erro ao criar thumbnail:",
            error
        );

    }
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
                ${
                    videos.length === 1
                        ? "vídeo gerado"
                        : "vídeos gerados"
                }
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


        historico.appendChild(
            grid
        );


        // ==========================================
        // CRIA CARDS
        // ==========================================

        videos.forEach(
            function (item) {

                const ehNovo =
                    requestIdNovo &&
                    item.request_id ===
                        requestIdNovo;


                const card =
                    criarCardVideo(
                        item,
                        ehNovo
                    );


                if (!card) {
                    return;
                }


                grid.appendChild(
                    card
                );


                // Se não tem thumbnail,
                // cria automaticamente.
                if (
                    !item.thumbnail_key
                ) {

                    garantirThumbnail(
                        item,
                        card
                    );

                }

            }
        );


        // ==========================================
        // ROLAR ATÉ O NOVO
        // ==========================================

        if (
            requestIdNovo
        ) {

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
                // VÍDEO PRONTO
                // ==========================================

                if (
                    status === "completed"
                ) {

                    generateButton.textContent =
                        "🎬 Vídeo pronto!";


                    // Primeiro atualiza o histórico
                    await carregarHistorico(
                        requestId
                    );


                    // ==========================================
                    // CRIA THUMBNAIL DO NOVO VÍDEO
                    // ==========================================

                    try {

                        console.log(
                            "Criando thumbnail do novo vídeo..."
                        );


                        await gerarThumbnail(
                            requestId
                        );


                        // Recarrega o histórico para
                        // buscar a thumbnail salva
                        await carregarHistorico(
                            requestId
                        );


                    } catch (thumbnailError) {

                        console.error(
                            "Erro ao criar thumbnail do novo vídeo:",
                            thumbnailError
                        );

                    }


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
// CARREGAR HISTÓRICO AO ABRIR
// ==========================================

carregarHistorico();
