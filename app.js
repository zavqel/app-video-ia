const imageInput = document.getElementById("imageInput");
const uploadArea = document.querySelector(".upload-area");
const promptInput = document.getElementById("prompt");
const generateButton = document.getElementById("generateButton");

let selectedImage = null;


// ==========================================
// CONFIGURAÇÃO
// ==========================================

const WORKER_URL =
    "https://app-video-ia-api.app-video-ia.workers.dev";


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
// BOTÃO GERAR VÍDEO
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

    generateButton.disabled = true;
    generateButton.textContent = "☁️ Enviando imagem...";

    try {

        // ==========================================
        // ENVIA A IMAGEM PARA O WORKER
        // ==========================================

        const response = await fetch(
            `${WORKER_URL}/upload`,
            {
                method: "POST",
                headers: {
                    "Content-Type": selectedImage.type
                },
                body: selectedImage
            }
        );

        const resultado = await response.json();

        // ==========================================
        // VERIFICA RESPOSTA
        // ==========================================

        if (!response.ok || !resultado.sucesso) {
            throw new Error(
                resultado.erro || "Erro ao enviar a imagem."
            );
        }

        console.log("Upload realizado:", resultado);

        generateButton.textContent = "✅ Imagem enviada!";

        alert(
            "Imagem enviada com sucesso! 🚀\n\n" +
            "Arquivo salvo no R2:\n" +
            resultado.arquivo
        );

    } catch (erro) {

        console.error("Erro no upload:", erro);

        alert(
            "Não foi possível enviar a imagem.\n\n" +
            "Erro: " + erro.message
        );

    } finally {

        generateButton.disabled = false;
        generateButton.textContent = "✨ Gerar vídeo";

    }

});
