/*
    Tomar una fotografía y descargarla
	@date 2019-04-23
	@author parzibyte
	@web parzibyte.me/blog
*/
const tieneSoporteUserMedia = () =>
  !!(
    navigator.getUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.mediaDevices.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.msGetUserMedia
  );

const _getUserMedia = (...arguments) =>
  (
    navigator.getUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.mediaDevices.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.msGetUserMedia
  ).apply(navigator, arguments);

// Declaramos elementos del DOM
const $video = document.querySelector("#video"),
  $canvas = document.querySelector("#canvas"),
  $tomarFotoBoton = document.querySelector("#tomar-foto"),
  $transformarFotoBoton = document.querySelector("#transformar-foto"),
  $cancelarBoton = document.querySelector("#cancelar"),
  $seccionTomarFoto = document.querySelector("#seccion-tomar-foto"),
  $seccionFotoTomada = document.querySelector("#seccion-foto-tomada"),
  $listaDeDispositivos = document.querySelector("#lista-dispositivos");

const limpiarSelect = () => {
  for (let x = $listaDeDispositivos.options.length - 1; x >= 0; x--) {
    $listaDeDispositivos.remove(x);
  }
};

const obtenerDispositivos = () => navigator.mediaDevices.enumerateDevices();

// La función que es llamada después de que ya se dieron los permisos
// Lo que hace es llenar el select con los dispositivos obtenidos
let dispositivoSeleccionadoId = null;

const llenarSelectConDispositivosDisponibles = () => {
  // limpiarSelect();

  /* const option = document.createElement("option");
  option.value = "test";
  option.text = "---";
  $listaDeDispositivos.appendChild(option); */

  obtenerDispositivos().then((dispositivos) => {
    // Vamos a filtrarlos y guardar aquí los de vídeo
    const dispositivosDeVideo = [];

    // Recorrer y filtrar
    dispositivos.forEach(function (dispositivo) {
      if (dispositivo.kind === "videoinput") {
        dispositivosDeVideo.push(dispositivo);
      }
    });

    // Vemos si encontramos algún dispositivo, y en caso de que si, entonces llamamos a la función
    // y le pasamos el id de dispositivo
    if (dispositivosDeVideo.length > 0) {
      // Llenar el select
      dispositivoSeleccionadoId = dispositivosDeVideo[0].deviceId;

      dispositivosDeVideo.forEach((dispositivo) => {
        const option = document.createElement("option");
        option.value = dispositivo.deviceId;
        option.text = dispositivo.label;

        if (dispositivo.label.includes("back")) {
          dispositivoSeleccionadoId = option.value;
          option.selected = "selected";
        }

        $listaDeDispositivos.appendChild(option);
      });
    }
  });
};

const mostrarStream = (idDeDispositivo) => {
  _getUserMedia(
    {
      video: {
        // Justo aquí indicamos cuál dispositivo usar
        deviceId: idDeDispositivo,
      },
    },
    (streamObtenido) => {
      // Aquí ya tenemos permisos, ahora sí llenamos el select,
      // pues si no, no nos daría el nombre de los dispositivos

      if (!dispositivoSeleccionadoId) {
        llenarSelectConDispositivosDisponibles();
      }

      // Escuchar cuando seleccionen otra opción y entonces llamar a esta función

      // Simple asignación
      stream = streamObtenido;

      // Mandamos el stream de la cámara al elemento de vídeo
      $video.srcObject = stream;
      $video.play().then(() => $tomarFotoBoton.removeAttribute("disabled"));

      //Escuchar el click del botón para tomar la foto
    },
    (error) => {
      console.log("Permiso denegado o error: ", error);
      /* $estado.innerHTML =
        "No se puede acceder a la cámara, o no diste permiso."; */
    }
  );
};

const getCursorPosition = (canvas, event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  console.log("x: " + x + " y: " + y);
  const ctx = $canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, 2 * Math.PI);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#00fff1";
  ctx.stroke();
  contadorPuntosCanvas++;
};

let contadorPuntosCanvas = 0;
$canvas.addEventListener("mousedown", function (e) {
  if (contadorPuntosCanvas < 4) {
    getCursorPosition($canvas, e);
  }

  if ($transformarFotoBoton.disabled && contadorPuntosCanvas === 4) {
    $transformarFotoBoton.removeAttribute("disabled");
  }
});

const resetear = () => {
  contadorPuntosCanvas = 0;
  $transformarFotoBoton.setAttribute("disabled", "");
  $seccionFotoTomada.classList.toggle("oculto");
  $seccionTomarFoto.classList.toggle("oculto");
  $video.play();
};

//Aquí guardaremos el stream globalmente
let stream;

$listaDeDispositivos.onchange = () => {
  // Detener el stream
  if (stream) {
    stream.getTracks().forEach(function (track) {
      track.stop();
    });
  }
  // Mostrar el nuevo stream con el dispositivo seleccionado
  mostrarStream($listaDeDispositivos.value);
};

(function () {
  // Comenzamos viendo si tiene soporte, si no, nos detenemos
  if (!tieneSoporteUserMedia()) {
    alert("Lo sentimos. Tu navegador no soporta esta característica");
    $estado.innerHTML =
      "Parece que tu navegador no soporta esta característica. Intenta actualizarlo.";
    return;
  }

  llenarSelectConDispositivosDisponibles();
  let changeEvent = new Event("change");
  $listaDeDispositivos.dispatchEvent(changeEvent);

  $tomarFotoBoton.addEventListener("click", function () {
    //Pausar reproducción
    $video.pause();

    //Obtener contexto del canvas y dibujar sobre él
    let contexto = $canvas.getContext("2d");

    if (window.innerWidth <= 600) {
      $canvas.width = $video.videoWidth / 2;
      $canvas.height = $video.videoHeight / 2;
    } else {
      $canvas.width = $video.videoWidth;
      $canvas.height = $video.videoHeight;
    }

    contexto.drawImage($video, 0, 0, $canvas.width, $canvas.height);

    let foto = $canvas.toDataURL(); //Esta es la foto, en base 64

    let enlace = document.createElement("a"); // Crear un <a>
    enlace.download = "imagen.png";
    enlace.href = foto;
    //enlace.click();
    //Reanudar reproducción
    //$video.play();

    $seccionTomarFoto.classList.toggle("oculto");
    $seccionFotoTomada.classList.toggle("oculto");
  });

  $cancelarBoton.addEventListener("click", function () {
    resetear();
  });

  $transformarFotoBoton.addEventListener("click", function () {
    $transformarFotoBoton.textContent("Enviando...");
    $transformarFotoBoton.setAttribute("disabled", "");

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
        $transformarFotoBoton.textContent("Enviando...");
        $transformarFotoBoton.removeAttribute();
      });
  });
})();
