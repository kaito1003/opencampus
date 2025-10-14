window.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("photo");
  const context = canvas.getContext("2d");
  const heartsContainer = document.getElementById("hearts");
  const starsContainer = document.getElementById("stars");
  const frameDiv = document.getElementById("frame");
  const captureBtn = document.getElementById("capture");
  const downloadLink = document.getElementById("download");
  const countdown = document.getElementById("countdown");

  let currentFrame = "none";
  let heartsEnabled = true;
  let starsEnabled = true;


  

  video.addEventListener("loadedmetadata", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  });

  function createHeart(x, y) {
    if (!heartsEnabled) return;
    const heart = document.createElement("div");
    heart.classList.add("heart");
    heart.textContent = "💗";
    heart.style.left = `${x - 12}px`;
    heart.style.top = `${y - 100}px`;
    heartsContainer.appendChild(heart);
    setTimeout(() => heart.remove(), 20000);
  }

  function updateStars(leftEye, rightEye) {
    starsContainer.innerHTML = "";
    if (!starsEnabled) return;

    const starL = document.createElement("div");
    const starR = document.createElement("div");
    starL.classList.add("star");
    starR.classList.add("star");
    starL.textContent = "✨";
    starR.textContent = "✨";

    const lx = canvas.width * (1 - leftEye.x);
    const rx = canvas.width * (1 - rightEye.x);
    const ly = canvas.height * leftEye.y + 10;
    const ry = canvas.height * rightEye.y + 10;

    starL.style.left = `${lx - 45}px`;
    starL.style.top = `${ly - 45}px`;
    starR.style.left = `${rx - 45}px`;
    starR.style.top = `${ry - 45}px`;

    starsContainer.appendChild(starL);
    starsContainer.appendChild(starR);
  }

  const hands = new Hands({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  const faceMesh = new FaceMesh({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults(results => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks?.length > 0) {
      const lm = results.multiHandLandmarks[0];
      if (!lm) return;
      const fingerTips = [4,8,12,16,20];
      const fingerPips = [3,6,10,14,18];
      let ext = 0;
      for (let i=0;i<5;i++){
        if(lm[fingerTips[i]].y < lm[fingerPips[i]].y-0.02) ext++;
      }
      if (ext>=4){
        const cx = canvas.width * (1-lm[0].x);
        const cy = canvas.height * lm[0].y;
        if (Math.random() < 0.4) createHeart(cx, cy);
      }
      
    }
  });

  faceMesh.onResults(results => {
    if (results.multiFaceLandmarks?.length>0){
      const face = results.multiFaceLandmarks[0];
      updateStars(face[159], face[386]);
    } else {
      starsContainer.innerHTML="";
    }
  });

  const camera = new Camera(video, {
    onFrame: async()=>{
      await hands.send({image:video});
      await faceMesh.send({image:video});
    },
    width:640,
    height:480
  });
  camera.start();

  captureBtn.addEventListener("click", () => {
  let count = 3;
  countdown.style.display = "flex";
  countdown.textContent = count;

  const interval = setInterval(() => {
    count--;
    if(count > 0){
      countdown.textContent = count;
    } else {
      clearInterval(interval);
      countdown.style.display = "none";

      html2canvas(document.getElementById("camera-container"), {scale: 1}).then(canvasCaptured => {
        const dataURL = canvasCaptured.toDataURL("image/png");

        // プレビュー画像にセット
        const previewImg = document.getElementById("preview");
        previewImg.src = dataURL;
        previewImg.style.display = "block"; // 撮影後に表示

        // OK! ボタンにクリックイベント設定
        const downloadBtn = document.getElementById("downloadBtn");
        downloadBtn.style.display = "inline-block"; // 撮影後に表示
        downloadBtn.onclick = () => {
          const link = document.createElement("a");
          link.href = dataURL;
          link.download = "purikura.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
      });
    }
  }, 1000);
});


  document.querySelectorAll(".frame-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".frame-btn").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      currentFrame = btn.dataset.frame;
      frameDiv.className="";
      frameDiv.id="frame";
      if(currentFrame!=="none") frameDiv.classList.add(`frame-${currentFrame}`);
    });
  });

  document.querySelectorAll(".heart-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".heart-btn").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      heartsEnabled = btn.dataset.state==="on";
    });
  });

  document.querySelectorAll(".star-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".star-btn").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      starsEnabled = btn.dataset.state==="on";
      if(!starsEnabled) starsContainer.innerHTML="";
    });
  });
});

