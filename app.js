const imageInput = document.getElementById("imageInput");
const uploadArea = document.querySelector(".upload-area");

imageInput.addEventListener("change", function () {

    const file = imageInput.files[0];

    if (!file) {
        return;
    }

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
