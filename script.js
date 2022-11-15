const tieneSoporteUserMedia = () =>
  !!(
    navigator.getUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.mediaDevices.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.msGetUserMedia
  );

if (tieneSoporteUserMedia()) {
  const videoElement = document.querySelector("#video");
  const videoSelect = document.querySelector("select#lista-dispositivos");
  const canvas = document.querySelector("#canvas");
  const tomarFotoBoton = document.querySelector("#tomar-foto");
  const transformarFotoBoton = document.querySelector("#transformar-foto");
  const cancelarBoton = document.querySelector("#cancelar");
  const seccionTomarFoto = document.querySelector("#seccion-tomar-foto");
  const seccionFotoTomada = document.querySelector("#seccion-foto-tomada");

  videoSelect.onchange = getStream;

  getStream().then(getDevices).then(gotDevices);

  function reset() {
    contadorPuntosCanvas = 0;
    transformarFotoBoton.setAttribute("disabled", "");
    seccionFotoTomada.classList.toggle("oculto");
    seccionTomarFoto.classList.toggle("oculto");
    videoElement.play();
  }

  function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    console.log("x: " + x + " y: " + y);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00fff1";
    ctx.stroke();
    contadorPuntosCanvas++;
  }

  let contadorPuntosCanvas = 0;

  canvas.addEventListener("mousedown", function (e) {
    if (contadorPuntosCanvas < 4) {
      getCursorPosition(canvas, e);
    }

    if (transformarFotoBoton.disabled && contadorPuntosCanvas === 4) {
      transformarFotoBoton.removeAttribute("disabled");
    }
  });

  tomarFotoBoton.addEventListener("click", function () {
    //Pausar reproducción
    videoElement.pause();

    //Obtener contexto del canvas y dibujar sobre él
    let contexto = canvas.getContext("2d");

    if (window.innerWidth <= 600) {
      canvas.width = videoElement.videoWidth / 2;
      canvas.height = videoElement.videoHeight / 2;
    } else {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
    }

    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    let foto = canvas.toDataURL(); //Esta es la foto, en base 64

    let enlace = document.createElement("a"); // Crear un <a>
    enlace.download = "imagen.png";
    enlace.href = foto;
    //enlace.click();
    //Reanudar reproducción
    //$video.play();

    seccionTomarFoto.classList.toggle("oculto");
    seccionFotoTomada.classList.toggle("oculto");
  });

  cancelarBoton.addEventListener("click", function () {
    reset();
  });

  transformarFotoBoton.addEventListener("click", function () {
    transformarFotoBoton.textContent("Enviando...");
    transformarFotoBoton.setAttribute("disabled", "");

    // hacer fetch
    fetch("", {
      method: "post",
    })
      .then(() => {
        // mirar si descargar la imagen transformada
        resetear();
      })
      .catch((error) => {
        console.log("error", error);
      })
      .finally(() => {
        transformarFotoBoton.textContent("Enviando...");
        transformarFotoBoton.removeAttribute();
      });
  });

  function getDevices() {
    // AFAICT in Safari this only gets default devices until gUM is called :/
    return navigator.mediaDevices.enumerateDevices();
  }

  function gotDevices(deviceInfos) {
    window.deviceInfos = deviceInfos; // make available to console

    for (const deviceInfo of deviceInfos) {
      const option = document.createElement("option");
      option.value = deviceInfo.deviceId;
      if (deviceInfo.kind === "videoinput") {
        option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
        videoSelect.appendChild(option);
      }
    }
  }

  function getStream() {
    if (window.stream) {
      window.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    const videoSource = videoSelect.value;
    const constraints = {
      video: { deviceId: videoSource ? { exact: videoSource } : undefined },
    };

    return navigator.mediaDevices
      .getUserMedia(constraints)
      .then(gotStream)
      .catch(handleError);
  }

  function gotStream(stream) {
    window.stream = stream; // make stream available to console

    const videoTracks = stream.getVideoTracks();
    const videoTrackCameraBack = videoTracks.filter((videoTrack) => videoTrack.label.includes('back'));

    videoSelect.selectedIndex = [...videoSelect.options].findIndex(
      (option) => option.text === videoTrackCameraBack ? videoTrackCameraBack.label : stream.getVideoTracks()[0].label
    );
    videoElement.srcObject = stream;
    videoElement.play();
    tomarFotoBoton.removeAttribute("disabled");
  }

  function handleError(error) {
    console.error("Error: ", error);
  }
} else {
  alert("Parece que tu navegador no soporta esta característica. Intenta actualizarlo.");
}
