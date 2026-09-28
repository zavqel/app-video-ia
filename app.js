const imageInput = document.getElementById("imageInput");
const uploadArea = document.querySelector(".upload-area");
const promptInput = document.getElementById("prompt");
const generateButton = document.getElementById("generateButton");

let selectedImage = null;


// ================================
// SELEÇÃO DA IMAGEM
// ================================

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


// ================================
// BOTÃO GERAR VÍDEO
// ================================

generateButton.addEventListener("click", function () {

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

    generateButton.textContent = "⏳ Preparando seu vídeo...";

    setTimeout(function () {

        generateButton.disabled = false;

        generateButton.textContent = "✨ Gerar vídeo";

        alert(
            "Tudo certo! A imagem e a descrição foram recebidas.\n\n" +
            "A próxima etapa será conectar a inteligência artificial."
        );

    }, 2000);

});
