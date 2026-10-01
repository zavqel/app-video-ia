const imageInput = document.getElementById("imageInput");
const uploadArea = document.querySelector(".upload-area");
const promptInput = document.getElementById("prompt");
const generateButton = document.getElementById("generateButton");

const API_URL =
    "https://app-video-ia-api.app-video-ia.workers.dev";
const AUTH_TOKEN_KEY = "app_video_ia_token";
const AUTH_EMAIL_KEY = "app_video_ia_email";

function obterToken() {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function salvarToken(token) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

function removerToken() {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

async function fazerLogin(email, senha) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: senha
            })
        });

        const data = await response.json();

        if (!response.ok || !data.sucesso || !data.token) {
            return {
                sucesso: false,
                erro: data.erro || "E-mail ou senha incorretos."
            };
        }

        salvarToken(data.token);

        // Guarda apenas o e-mail desta sessão no navegador.
        // A autenticação real continua sendo feita pelo token do servidor.
        sessionStorage.setItem(
            AUTH_EMAIL_KEY,
            data.email || email
        );

        return {
            sucesso: true,
            email: data.email || email
        };
    } catch (error) {
        console.error("Erro ao fazer login:", error);

        return {
            sucesso: false,
            erro: "Não foi possível conectar ao servidor."
        };
    }
}

async function fetchAutenticado(url, options = {}) {
    const token = obterToken();

    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        removerToken();
        sessionStorage.removeItem(AUTH_EMAIL_KEY);
        mostrarTelaLogin();
        throw new Error("Sessão expirada.");
    }

    return response;
}

function mostrarTelaLogin() {
    let tela = document.getElementById("telaLogin");

    if (!tela) {
        tela = document.createElement("div");
        tela.id = "telaLogin";

        tela.innerHTML = `
            <div style="
                position:fixed;
                inset:0;
                background:#111;
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:99999;
                padding:20px;
            ">
                <div style="
                    width:100%;
                    max-width:380px;
                    background:#1c1c1c;
                    padding:30px;
                    border-radius:16px;
                    box-shadow:0 20px 60px rgba(0,0,0,.5);
                    text-align:center;
                ">
                    <h2 style="margin-top:0;color:white;">
                        🎬 AI Video
                    </h2>

                    <p style="color:#aaa;margin-bottom:25px;">
                        Entre na sua conta para acessar.
                    </p>

                    <input
                        id="emailLogin"
                        type="email"
                        placeholder="E-mail"
                        autocomplete="username"
                        style="
                            width:100%;
                            box-sizing:border-box;
                            padding:14px;
                            border-radius:8px;
                            border:1px solid #444;
                            background:#111;
                            color:white;
                            margin-bottom:12px;
                        "
                    >

                    <input
                        id="senhaLogin"
                        type="password"
                        placeholder="Senha"
                        autocomplete="current-password"
                        style="
                            width:100%;
                            box-sizing:border-box;
                            padding:14px;
                            border-radius:8px;
                            border:1px solid #444;
                            background:#111;
                            color:white;
                            margin-bottom:12px;
                        "
                    >

                    <button
                        id="botaoLogin"
                        style="
                            width:100%;
                            padding:14px;
                            border:none;
                            border-radius:8px;
                            cursor:pointer;
                            font-weight:bold;
                        "
                    >
                        Entrar
                    </button>

                    <div
                        id="erroLogin"
                        style="
                            color:#ff6b6b;
                            margin-top:15px;
                            min-height:20px;
                        "
                    ></div>
                </div>
            </div>
        `;

        document.body.appendChild(tela);

        document.getElementById("botaoLogin")
            .addEventListener("click", realizarLogin);

        document.getElementById("emailLogin")
            .addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    document.getElementById("senhaLogin").focus();
                }
            });

        document.getElementById("senhaLogin")
            .addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    realizarLogin();
                }
            });
    }

    tela.style.display = "block";

    const emailInput = document.getElementById("emailLogin");
    const senhaInput = document.getElementById("senhaLogin");
    const emailSalvo = sessionStorage.getItem(AUTH_EMAIL_KEY);

    setTimeout(() => {
        if (emailInput && emailSalvo) {
            emailInput.value = emailSalvo;
            if (senhaInput) senhaInput.focus();
        } else if (emailInput) {
            emailInput.focus();
        }
    }, 100);
}

function esconderTelaLogin() {
    const tela = document.getElementById("telaLogin");

    if (tela) {
        tela.style.display = "none";
    }
}

async function realizarLogin() {
    const emailInput = document.getElementById("emailLogin");
    const senhaInput = document.getElementById("senhaLogin");
    const botao = document.getElementById("botaoLogin");
    const erro = document.getElementById("erroLogin");

    const email = emailInput.value.trim().toLowerCase();
    const senha = senhaInput.value;

    if (!email) {
        erro.textContent = "Digite seu e-mail.";
        emailInput.focus();
        return;
    }

    if (!email.includes("@")) {
        erro.textContent = "Digite um e-mail válido.";
        emailInput.focus();
        return;
    }

    if (!senha) {
        erro.textContent = "Digite sua senha.";
        senhaInput.focus();
        return;
    }

    botao.disabled = true;
    botao.textContent = "Entrando...";
    erro.textContent = "";

    const resultado = await fazerLogin(email, senha);

    if (resultado.sucesso) {
        esconderTelaLogin();
        iniciarAplicativo();
        return;
    }

    erro.textContent = resultado.erro || "E-mail ou senha incorretos.";
    botao.disabled = false;
    botao.textContent = "Entrar";
    senhaInput.focus();
}

let selectedImage = null;


// ==========================================
// FORMATAR DATA
// ==========================================

function formatarData(data) {

    if (!data) {
        return "";
    }

    const dataObj = new Date(data);

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

        const file = imageInput.files[0];

        if (!file) {
            return;
        }

        selectedImage = file;

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
// PAINEL DE PROGRESSO
// ==========================================

let painelProgresso = null;
let progressoAtual = 0;

function criarPainelProgresso() {

    if (painelProgresso) {
        painelProgresso.remove();
    }

    painelProgresso =
        document.createElement("div");

    painelProgresso.id =
        "painelProgressoGeracao";

    painelProgresso.style.cssText = `
        width: 100%;
        margin: 18px 0 0 0;
        padding: 20px;
        box-sizing: border-box;
        background: #111;
        border: 1px solid #333;
        border-radius: 14px;
        text-align: center;
    `;

    painelProgresso.innerHTML = `
        <div
            style="
                display:flex;
                align-items:center;
                justify-content:center;
                gap:10px;
                font-size:18px;
                font-weight:600;
                margin-bottom:12px;
            "
        >
            <span
                id="iconeProgresso"
                style="
                    display:inline-block;
                    animation:girarProgresso 1s linear infinite;
                "
            >
                🔄
            </span>

            <span id="textoProgresso">
                Preparando...
            </span>
        </div>

        <div
            style="
                width:100%;
                height:18px;
                background:#2a2a2a;
                border-radius:999px;
                overflow:hidden;
                border:1px solid #3a3a3a;
            "
        >
            <div
                id="barraProgresso"
                style="
                    width:0%;
                    height:100%;
                    background:linear-gradient(
                        90deg,
                        #ffffff,
                        #bdbdbd
                    );
                    border-radius:999px;
                    transition:width .6s ease;
                "
            ></div>
        </div>

        <div
            style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-top:10px;
                font-size:14px;
                color:#aaa;
            "
        >
            <span id="detalheProgresso">
                Enviando imagem...
            </span>

            <strong
                id="porcentagemProgresso"
                style="
                    color:#fff;
                    font-size:16px;
                "
            >
                0%
            </strong>
        </div>

        <div
            style="
                margin-top:10px;
                font-size:12px;
                color:#777;
            "
        >
            Progresso estimado • A IA está processando sua imagem
        </div>
    `;

    const estiloAnimacao =
        document.createElement("style");

    estiloAnimacao.id =
        "estiloAnimacaoProgresso";

    estiloAnimacao.textContent = `
        @keyframes girarProgresso {
            from {
                transform: rotate(0deg);
            }

            to {
                transform: rotate(360deg);
            }
        }
    `;

    document.head.appendChild(
        estiloAnimacao
    );

    generateButton.parentNode.insertBefore(
        painelProgresso,
        generateButton.nextSibling
    );

    progressoAtual = 0;

    atualizarProgresso(
        0,
        "Preparando...",
        "Enviando imagem..."
    );
}


// ==========================================
// ATUALIZAR PROGRESSO
// ==========================================

function atualizarProgresso(
    porcentagem,
    texto,
    detalhe
) {

    if (!painelProgresso) {
        return;
    }

    progressoAtual =
        Math.max(
            progressoAtual,
            Math.min(100, porcentagem)
        );

    const barra =
        document.getElementById(
            "barraProgresso"
        );

    const porcentagemElemento =
        document.getElementById(
            "porcentagemProgresso"
        );

    const textoElemento =
        document.getElementById(
            "textoProgresso"
        );

    const detalheElemento =
        document.getElementById(
            "detalheProgresso"
        );

    if (barra) {

        barra.style.width =
            progressoAtual + "%";
    }

    if (porcentagemElemento) {

        porcentagemElemento.textContent =
            Math.round(progressoAtual) + "%";
    }

    if (textoElemento && texto) {

        textoElemento.textContent =
            texto;
    }

    if (detalheElemento && detalhe) {

        detalheElemento.textContent =
            detalhe;
    }
}


// ==========================================
// FINALIZAR PROGRESSO
// ==========================================

function finalizarProgresso(
    sucesso = true
) {

    if (!painelProgresso) {
        return;
    }

    if (sucesso) {

        atualizarProgresso(
            100,
            "🎬 Vídeo pronto!",
            "Sua geração foi concluída."
        );

        const icone =
            document.getElementById(
                "iconeProgresso"
            );

        if (icone) {

            icone.style.animation =
                "none";

            icone.textContent =
                "✅";
        }

    } else {

        const icone =
            document.getElementById(
                "iconeProgresso"
            );

        if (icone) {

            icone.style.animation =
                "none";

            icone.textContent =
                "❌";
        }
    }
}


// ==========================================
// REMOVER PAINEL DE PROGRESSO
// ==========================================

function removerPainelProgresso() {

    if (painelProgresso) {

        painelProgresso.remove();

        painelProgresso =
            null;
    }

    const estilo =
        document.getElementById(
            "estiloAnimacaoProgresso"
        );

    if (estilo) {
        estilo.remove();
    }
}


// ==========================================
// PROGRESSO ESTIMADO
// ==========================================

let intervaloProgresso = null;
let inicioGeracao = null;

function iniciarProgressoEstimado(
    progressoInicial = 25
) {

    inicioGeracao =
        Date.now();

    progressoAtual =
        progressoInicial;

    if (intervaloProgresso) {

        clearInterval(
            intervaloProgresso
        );
    }

    intervaloProgresso =
        setInterval(
            function () {

                if (!painelProgresso) {
                    return;
                }

                const tempoDecorrido =
                    Date.now() -
                    inicioGeracao;

                const progressoEstimado =
                    progressoInicial +
                    (
                        92 -
                        progressoInicial
                    ) *
                    (
                        1 -
                        Math.exp(
                            -tempoDecorrido /
                            90000
                        )
                    );

                atualizarProgresso(
                    progressoEstimado,
                    "⏳ Gerando vídeo...",
                    "A inteligência artificial está animando sua imagem..."
                );

            },
            2000
        );
}


function pararProgressoEstimado() {

    if (intervaloProgresso) {

        clearInterval(
            intervaloProgresso
        );

        intervaloProgresso =
            null;
    }
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
            await fetchAutenticado(
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
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

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
// GERAR THUMBNAIL
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

                        const response =
                            await fetchAutenticado(
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
// MOSTRAR VÍDEO NO CARD
// ==========================================

function mostrarVideoNoCard(
    card,
    videoURL,
    botao
) {

    let video =
        card.querySelector(
            ".video-card-player"
        );

    if (video) {

        if (video.paused) {

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

    const thumbnail =
        card.querySelector(
            ".video-card-thumbnail"
        );

    if (thumbnail) {

        thumbnail.style.display =
            "none";
    }

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
// CRIAR CARD
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
    // THUMBNAIL
    // ==========================================

    const thumbnailArea =
        document.createElement(
            "div"
        );

    thumbnailArea.className =
        "video-card-thumbnail";

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

    if (item.thumbnail_key) {

        thumbnail.src =
            obterThumbnailURL(
                item.thumbnail_key
            );

    } else {

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

            if (videoExistente) {

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

    if (item.thumbnail_key) {
        return;
    }

    if (!item.request_id) {
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
// CONSULTAR STATUS DE UMA GERAÇÃO
// ==========================================

async function consultarStatus(
    requestId
) {

    const response =
        await fetchAutenticado(
            `${API_URL}/status?requestId=${encodeURIComponent(
                requestId
            )}`
        );

    const data =
        await response.json();

    console.log(
        "Status da geração:",
        requestId,
        data
    );

    if (
        !response.ok ||
        !data.sucesso
    ) {

        throw new Error(
            data.erro ||
            "Não foi possível consultar o status do vídeo."
        );
    }

    return data.status;
}


// ==========================================
// ACOMPANHAR GERAÇÃO PENDENTE
// ==========================================

async function acompanharGeracaoPendente(
    requestId,
    mostrarProgresso = true
) {

    if (!requestId) {
        return;
    }

    console.log(
        "Retomando geração:",
        requestId
    );

    let painelCriado =
        false;

    if (mostrarProgresso) {

        criarPainelProgresso();

        atualizarProgresso(
            30,
            "🔄 Retomando geração...",
            "Encontramos um vídeo que ainda estava sendo processado."
        );

        iniciarProgressoEstimado(
            30
        );

        painelCriado =
            true;
    }

    try {

        while (true) {

            const status =
                await consultarStatus(
                    requestId
                );

            // ==========================================
            // COMPLETO
            // ==========================================

            if (
                status === "completed"
            ) {

                pararProgressoEstimado();

                if (painelCriado) {

                    atualizarProgresso(
                        96,
                        "🎬 Vídeo finalizado!",
                        "Preparando a prévia..."
                    );
                }

                // Atualiza histórico
                await carregarHistorico(
                    requestId
                );

                // ==========================================
                // CRIA THUMBNAIL
                // ==========================================

                try {

                    if (painelCriado) {

                        atualizarProgresso(
                            98,
                            "🖼️ Criando prévia...",
                            "Gerando a thumbnail do vídeo..."
                        );
                    }

                    await gerarThumbnail(
                        requestId
                    );

                } catch (thumbnailError) {

                    console.error(
                        "Erro ao criar thumbnail da geração retomada:",
                        thumbnailError
                    );
                }

                // Atualiza histórico novamente
                await carregarHistorico(
                    requestId
                );

                if (painelCriado) {

                    finalizarProgresso(
                        true
                    );

                    setTimeout(
                        function () {

                            removerPainelProgresso();

                        },
                        2500
                    );
                }

                return true;
            }


            // ==========================================
            // ERRO
            // ==========================================

            if (
                status === "failed" ||
                status === "nsfw"
            ) {

                throw new Error(
                    "A geração terminou com status: " +
                    status
                );
            }


            // ==========================================
            // AINDA PROCESSANDO
            // ==========================================

            if (painelCriado) {

                atualizarProgresso(
                    progressoAtual,
                    "⏳ Gerando vídeo...",
                    "A IA continua processando sua imagem..."
                );
            }

            console.log(
                "Geração ainda em processamento:",
                requestId
            );

            await new Promise(
                function (resolve) {

                    setTimeout(
                        resolve,
                        5000
                    );
                }
            );
        }

    } catch (error) {

        pararProgressoEstimado();

        console.error(
            "Erro ao acompanhar geração:",
            error
        );

        if (painelCriado) {

            finalizarProgresso(
                false
            );

            atualizarProgresso(
                progressoAtual,
                "❌ Não foi possível concluir",
                error.message
            );

            setTimeout(
                function () {

                    removerPainelProgresso();

                },
                3500
            );
        }

        return false;
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
            await fetchAutenticado(
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

        historico.innerHTML =
            "";

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

        const grid =
            document.createElement(
                "div"
            );

        grid.className =
            "historico-grid";

        historico.appendChild(
            grid
        );

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

                if (
                    !item.thumbnail_key &&
                    !ehNovo
                ) {

                    garantirThumbnail(
                        item,
                        card
                    );
                }
            }
        );

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
// PROCURAR GERAÇÕES PENDENTES AO ABRIR
// ==========================================

async function verificarGeracoesPendentes() {
    try {
        console.log("Procurando gerações pendentes...");

        const response = await fetchAutenticado(`${API_URL}/pending`);
        const data = await response.json();

        if (!response.ok || !data.sucesso) {
            console.error("Não foi possível verificar gerações pendentes.");
            return;
        }

        const pendentes = data.pendentes || [];

        console.log("Gerações pendentes encontradas:", pendentes.length);

        if (pendentes.length === 0) {
            return;
        }

        for (const geracao of pendentes) {
            if (!geracao.request_id) {
                continue;
            }

            console.log(
                "Retomando geração:",
                geracao.request_id
            );

            await acompanharGeracaoPendente(
                geracao.request_id,
                true
            );
        }

    } catch (error) {
        console.error(
            "Erro ao verificar gerações pendentes:",
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

            criarPainelProgresso();

            atualizarProgresso(
                5,
                "📤 Enviando imagem...",
                "Preparando sua imagem para a IA..."
            );

            generateButton.textContent =
                "⏳ Processando...";


            // ==========================================
            // 1. UPLOAD
            // ==========================================

            const uploadResponse =
                await fetchAutenticado(
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

            const imageKey =
                uploadData.arquivo;

            atualizarProgresso(
                15,
                "📤 Imagem enviada!",
                "Iniciando a geração do vídeo..."
            );


            // ==========================================
            // 2. GERAÇÃO
            // ==========================================

            atualizarProgresso(
                20,
                "🚀 Enviando solicitação...",
                "A IA está preparando a geração..."
            );

            const generationResponse =
                await fetchAutenticado(
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

            const requestId =
                generationData.requestId;

            if (!requestId) {

                throw new Error(
                    "A Higgsfield não retornou o Request ID."
                );
            }

            atualizarProgresso(
                25,
                "⏳ Gerando vídeo...",
                "A inteligência artificial começou a trabalhar."
            );

            iniciarProgressoEstimado(
                25
            );


            // ==========================================
            // 3. ACOMPANHAR GERAÇÃO
            // ==========================================

            const sucesso =
                await acompanharGeracaoPendente(
                    requestId,
                    false
                );

            if (!sucesso) {

                throw new Error(
                    "Não foi possível acompanhar a geração do vídeo."
                );
            }

            pararProgressoEstimado();

            finalizarProgresso(
                true
            );

            generateButton.disabled =
                false;

            generateButton.textContent =
                "✨ Gerar vídeo";

            setTimeout(
                function () {

                    removerPainelProgresso();

                },
                2500
            );

        } catch (error) {

            console.error(
                error
            );

            pararProgressoEstimado();

            finalizarProgresso(
                false
            );

            generateButton.disabled =
                false;

            generateButton.textContent =
                "✨ Gerar vídeo";

            if (painelProgresso) {

                atualizarProgresso(
                    progressoAtual,
                    "❌ Não foi possível concluir",
                    "Ocorreu um erro durante a geração."
                );

                setTimeout(
                    function () {

                        removerPainelProgresso();

                    },
                    3000
                );
            }

            alert(
                "Ocorreu um erro:\n\n" +
                error.message
            );
        }
    }
);


// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function iniciarAplicativo() {

    console.log(
        "Iniciando aplicativo..."
    );

    await carregarHistorico();

    await verificarGeracoesPendentes();

    console.log(
        "Aplicativo pronto."
    );
}


if (obterToken()) {
    iniciarAplicativo();
} else {
    mostrarTelaLogin();
}
