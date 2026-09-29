const imageInput = document.getElementById("imageInput");
const uploadArea = document.querySelector(".upload-area");
const promptInput = document.getElementById("prompt");
const generateButton = document.getElementById("generateButton");

const API_URL = "https://app-video-ia-api.app-video-ia.workers.dev";

let selectedImage = null;


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

        console.log("Resposta do upload:", uploadData);


        if (!uploadResponse.ok || !uploadData.sucesso) {

            throw new Error(
                uploadData.erro || "Não foi possível enviar a imagem."
            );

        }


        // ==========================================
        // 2. PEGA A CHAVE DA IMAGEM
        // ==========================================

        const imageKey = uploadData.arquivo;


        console.log("Imagem salva:", imageKey);


        // ==========================================
        // 3. ENVIA PROMPT + IMAGEM PARA O WORKER
        // ==========================================

        generateButton.textContent = "💾 Salvando geração...";


        const generationResponse = await fetch(
            `${API_URL}/test-db`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
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
                generationData.erro ||
                "Não foi possível salvar a geração."
            );

        }


        // ==========================================
        // SUCESSO
        // ==========================================

        generateButton.disabled = false;

        generateButton.textContent = "✨ Gerar vídeo";


        alert(
            "Tudo certo! 🚀\n\n" +
            "Imagem salva no R2.\n" +
            "Prompt salvo no D1.\n\n" +
            "Agora temos os dados necessários para chamar a IA."
        );


    } catch (error) {

        console.error(error);

        generateButton.disabled = false;

        generateButton.textContent = "✨ Gerar vídeo";


        alert(
            "Ocorreu um erro:\n\n" +
            error.message
        );

    }

});
