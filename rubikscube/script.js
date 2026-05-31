// id=cube要素を取得
const cube = document.getElementById('cube');
// cubie間の間隔
const gap = 60; 
// cubieデータを格納する配列
const cubies = [];
// cubeを構築
for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
            // 中央にcubieを置かない
            if (x === 0 && y === 0 && z === 0) continue;
            // cubie用のHTML要素を作成
            const cubie = document.createElement('div');
            // cubieにcubieクラスを追加
            cubie.classList.add('cubie');
            // cubieの初期配置
            const baseTransform = `translate3d(${x * gap}px, ${y * gap}px, ${z * gap}px)`;
            // cubieのスタイルに初期配置を適用
            cubie.style.transform = baseTransform;
            // 各面の色を決定 (内側は黒，外側は各色を設定)
            const facesList = [
                { name: 'front',  color: z ===  1 ? 'red'    : '#111' },
                { name: 'back',   color: z === -1 ? 'orange' : '#111' },
                { name: 'right',  color: x ===  1 ? 'blue'   : '#111' },
                { name: 'left',   color: x === -1 ? 'green'  : '#111' },
                { name: 'top',    color: y === -1 ? 'white'  : '#111' },
                { name: 'bottom', color: y ===  1 ? 'yellow' : '#111' }
            ];
            // cubieに各面の要素を作成して追加
            facesList.forEach(face => {
                // 面のHTML要素を作成
                const faceEl = document.createElement('div');
                // 面のクラスとスタイルを設定
                faceEl.classList.add('face', face.name);
                faceEl.style.backgroundColor = face.color;
                // 面のデータ属性に面の名前と色を保存
                faceEl.dataset.faceName = face.name; 
                faceEl.dataset.colorName = face.color;
                // cubieに面の要素を追加
                cubie.appendChild(faceEl);
            });
            // cubieをキューブに追加
            cube.appendChild(cubie);
            // cubieのデータをcubies配列に保存
            cubies.push({
                element: cubie,
                x: x, y: y, z: z,
                transformString: baseTransform,
                // 各面がどの方向を向いているかを表すベクトル
                normals: {
                    front:  { x: 0, y: 0, z: 1 },
                    back:   { x: 0, y: 0, z:-1 },
                    right:  { x: 1, y: 0, z: 0 },
                    left:   { x:-1, y: 0, z: 0 },
                    top:    { x: 0, y:-1, z: 0 },
                    bottom: { x: 0, y: 1, z: 0 }
                }
            });
        }
    }
}

// ========================
// cube全体の回転処理
// ========================

// グローバルなドラッグ状態と位置を管理する変数
let isGlobalDragging = false;
let globalPreviousPos = { x: 0, y: 0 };
let currentRotation = { x: -30, y: -45 };

// cube要素はドラッグしない
function onGlobalPointerDown(e) {
    if (e.target.closest('#cube')) return;
    isGlobalDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    globalPreviousPos = { x: clientX, y: clientY };
}

// ドラッグ移動でcube全体を回転
function onGlobalPointerMove(e) {
    if (!isGlobalDragging) return;
    // タッチイベント時スクロール防止
    if (e.touches && e.cancelable) e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - globalPreviousPos.x;
    const dy = clientY - globalPreviousPos.y;

    currentRotation.y += dx * 0.5;
    currentRotation.x -= dy * 0.5;
    cube.style.transform = `rotateX(${currentRotation.x}deg) rotateY(${currentRotation.y}deg)`;
    
    globalPreviousPos = { x: clientX, y: clientY };
}

// ドラッグ終了
function onGlobalPointerUp() {
    isGlobalDragging = false;
}

// マウスとタッチの両方に対応するイベントリスナー
document.addEventListener('mousedown', onGlobalPointerDown);
document.addEventListener('mousemove', onGlobalPointerMove);
document.addEventListener('mouseup', onGlobalPointerUp);
document.addEventListener('touchstart', onGlobalPointerDown, {passive: false});
document.addEventListener('touchmove', onGlobalPointerMove, {passive: false});
document.addEventListener('touchend', onGlobalPointerUp);

// ========================
// 各ブロックの回転処理
// ========================
let isBlockDragging = false;
let blockStartPos = { x: 0, y: 0 };
let clickedFaceName = null;
let clickedCubieData = null;
let isAnimating = false;

function onBlockPointerDown(e) {
    if (isAnimating) return; 
    const faceEl = e.target.closest('.face');
    if (!faceEl) return;

    isBlockDragging = true;
    clickedFaceName = faceEl.dataset.faceName; 
    const cubieEl = faceEl.parentElement;
    clickedCubieData = cubies.find(c => c.element === cubieEl);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    blockStartPos = { x: clientX, y: clientY };
}

function onBlockPointerMove(e) {
    if (!isBlockDragging || isAnimating || !clickedCubieData) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - blockStartPos.x;
    const dy = clientY - blockStartPos.y;

    // スワイプ判定のしきい値を少し下げて反応を良くする
    if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
        isBlockDragging = false;
        handleSwipe(dx, dy, clickedFaceName, clickedCubieData);
    }
}

function onBlockPointerUp() {
    isBlockDragging = false;
    clickedCubieData = null;
}

cube.addEventListener('mousedown', onBlockPointerDown);
document.addEventListener('mousemove', onBlockPointerMove);
document.addEventListener('mouseup', onBlockPointerUp);
cube.addEventListener('touchstart', onBlockPointerDown, {passive: false});
document.addEventListener('touchmove', onBlockPointerMove, {passive: false});
document.addEventListener('touchend', onBlockPointerUp);

function handleSwipe(dx, dy, faceName, cubie) {
    // クリックした面が「現在」どちらを向いているか (バグ修正の要)
    const n = cubie.normals[faceName];
    
    // 回転可能な軸の候補（クリックした面と垂直な2軸）
    let axes = [];
    if (Math.abs(n.x) > 0.5) axes = [{name: 'y', vec: {x:0, y:1, z:0}}, {name: 'z', vec: {x:0, y:0, z:1}}];
    else if (Math.abs(n.y) > 0.5) axes = [{name: 'x', vec: {x:1, y:0, z:0}}, {name: 'z', vec: {x:0, y:0, z:1}}];
    else axes = [{name: 'x', vec: {x:1, y:0, z:0}}, {name: 'y', vec: {x:0, y:1, z:0}}];

    // 3Dベクトルを現在のカメラ角度に合わせて画面(2D)上に投影する関数
    function project(vec) {
        const rx = currentRotation.x * Math.PI / 180;
        const ry = currentRotation.y * Math.PI / 180;
        const x1 = vec.x * Math.cos(ry) + vec.z * Math.sin(ry);
        const y1 = vec.y;
        const z1 = -vec.x * Math.sin(ry) + vec.z * Math.cos(ry);
        const x2 = x1;
        const y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx);
        return { x: x2, y: y2 };
    }

    let bestAxis = null;
    let bestDir = 0;
    let maxDot = -Infinity;

    axes.forEach(a => {
        // 対象の軸を中心に+90度回転した時に、クリックした面がどちらに動くか (外積)
        const cross = {
            x: a.vec.y * n.z - a.vec.z * n.y,
            y: a.vec.z * n.x - a.vec.x * n.z,
            z: a.vec.x * n.y - a.vec.y * n.x
        };
        
        const proj = project(cross);
        // 画面上でのドラッグ方向との一致度を計算
        const dot = proj.x * dx + proj.y * dy;
        
        if (Math.abs(dot) > maxDot) {
            maxDot = Math.abs(dot);
            bestAxis = a.name;
            bestDir = dot > 0 ? 1 : -1;
        }
    });

    const sliceValue = cubie[bestAxis];

    if (isPlaying) {
        moveCount++;
        updateStatusDisplay();
    }

    rotateLayer(bestAxis, sliceValue, bestDir, 300, () => {
        // アニメーション完了・座標更新後にクリア判定を行う
        if (isPlaying && checkSolved()) {
            isPlaying = false;
            if (timerInterval) clearInterval(timerInterval);
            
            setTimeout(() => {
                alert(`CLEARED\nTime: ${timerDisplay.textContent}\nMoves: ${moveCount}`);
                scrambleBtn.textContent = "scramble (again)";
            }, 50); 
        }
    });
}

function rotateLayer(axis, sliceValue, dir, duration = 300, onComplete = null) {
    isAnimating = true;

    const movingCubies = cubies.filter(c => c[axis] === sliceValue);

    // アニメーション用に専用の「層」ラッパーを作成する
    const layerEl = document.createElement('div');
    layerEl.classList.add('layer');
    // スピードをカスタマイズできるようにする
    layerEl.style.transition = `transform ${duration}ms ease-in-out`;
    cube.appendChild(layerEl);

    // 動かすブロックを一旦ラッパーにまとめる
    movingCubies.forEach(c => {
        layerEl.appendChild(c.element);
    });

    // ブラウザにDOMの変更を認識させてからアニメーション開始 (リフロー強制)
    layerEl.getBoundingClientRect();

    // ラッパーをごと回転させる（CSSのアニメーションが美しく効く）
    layerEl.style.transform = `rotate${axis.toUpperCase()}(${dir * 90}deg)`;

    // アニメーション完了後に元のキューブに戻し、各ブロック自身のTransformに回転を焼き付ける
    layerEl.addEventListener('transitionend', function handler(e) {
        if (e.target !== layerEl) return;
        layerEl.removeEventListener('transitionend', handler);

        movingCubies.forEach(c => {
            c.transformString = `rotate${axis.toUpperCase()}(${dir * 90}deg) ` + c.transformString;
            c.element.style.transform = c.transformString;
            cube.appendChild(c.element); // キューブに戻す
            
            // CSS回転後の論理的な論理座標 (x, y, z) を更新 
            let nx = c.x, ny = c.y, nz = c.z;
            if (axis === 'x') {
                ny = dir === 1 ? -c.z : c.z;
                nz = dir === 1 ? c.y : -c.y;
            } else if (axis === 'y') {
                nx = dir === 1 ? c.z : -c.z;
                nz = dir === 1 ? -c.x : c.x;
            } else if (axis === 'z') {
                nx = dir === 1 ? -c.y : c.y;
                ny = dir === 1 ? c.x : -c.x;
            }
            c.x = Math.round(nx);
            c.y = Math.round(ny);
            c.z = Math.round(nz);

            // 各面がどちらを向いているか (normals) の情報も更新
            for (const key in c.normals) {
                let vec = c.normals[key];
                let vnx = vec.x, vny = vec.y, vnz = vec.z;
                if (axis === 'x') {
                    vny = dir === 1 ? -vec.z : vec.z;
                    vnz = dir === 1 ? vec.y : -vec.y;
                } else if (axis === 'y') {
                    vnx = dir === 1 ? vec.z : -vec.z;
                    vnz = dir === 1 ? -vec.x : vec.x;
                } else if (axis === 'z') {
                    vnx = dir === 1 ? -vec.y : vec.y;
                    vny = dir === 1 ? vec.x : -vec.x;
                }
                c.normals[key] = { x: Math.round(vnx), y: Math.round(vny), z: Math.round(vnz) };
            }
        });

        layerEl.remove(); // アニメーション用ラッパーを削除
        isAnimating = false;
        if (onComplete) onComplete();
    });
}

// ========================
// ゲーム進行
// ========================
const scrambleBtn = document.getElementById('scrambleBtn');
const timerDisplay = document.getElementById('timerDisplay');
const moveCountDisplay = document.getElementById('moveCountDisplay');

let isPlaying = false;
let startTime = null;
let timerInterval = null;
let moveCount = 0;

scrambleBtn.addEventListener('click', () => {
    if (isAnimating) return;
    
    // スクラブル開始時にタイマーと状態をリセット
    isPlaying = false;
    if (timerInterval) clearInterval(timerInterval);
    timerDisplay.textContent = "00:00";
    moveCount = 0;
    moveCountDisplay.textContent = "0";

    performScramble(20); // 20回ランダムに回す
});

function startTimer() {
    isPlaying = true;
    startTime = Date.now();
    moveCount = 0;
    updateStatusDisplay();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        updateStatusDisplay();
    }, 1000);
}

function updateStatusDisplay() {
    if (!isPlaying) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
    moveCountDisplay.textContent = moveCount;
}

function performScramble(movesLeft) {
    if (movesLeft <= 0) {
        scrambleBtn.disabled = false;
        scrambleBtn.textContent = "scramble";
        startTimer(); // スクランブル完了時にタイマー開始
        return;
    }

    scrambleBtn.disabled = true;
    scrambleBtn.textContent = `scrambling... (${movesLeft})`;

    const axes = ['x', 'y', 'z'];
    const slices = [-1, 0, 1];
    const dirs = [1, -1];

    const randomAxis = axes[Math.floor(Math.random() * axes.length)];
    const randomSlice = slices[Math.floor(Math.random() * slices.length)];
    const randomDir = dirs[Math.floor(Math.random() * dirs.length)];

    // アニメーション時間を100msにして高速に回す
    rotateLayer(randomAxis, randomSlice, randomDir, 100, () => {
        performScramble(movesLeft - 1);
    });
}

// ========================
// クリア判定
// ========================
function checkSolved() {
    const directions = [
        { axis: 'z', val: 1, vec: {x:0, y:0, z:1} },
        { axis: 'z', val:-1, vec: {x:0, y:0, z:-1} },
        { axis: 'x', val: 1, vec: {x:1, y:0, z:0} },
        { axis: 'x', val:-1, vec: {x:-1, y:0, z:0} },
        { axis: 'y', val:-1, vec: {x:0, y:-1, z:0} }, // top
        { axis: 'y', val: 1, vec: {x:0, y:1, z:0} }   // bottom
    ];

    for (let d of directions) {
        const faceCubies = cubies.filter(c => c[d.axis] === d.val);
        let firstColor = null;

        for (let c of faceCubies) {
            let facingName = null;
            for (let name in c.normals) {
                let n = c.normals[name];
                if (n.x === d.vec.x && n.y === d.vec.y && n.z === d.vec.z) {
                    facingName = name;
                    break;
                }
            }
            
            const faceEl = Array.from(c.element.children).find(el => el.dataset.faceName === facingName);
            const color = faceEl.dataset.colorName;

            if (color === '#111') return false; // 黒(内部)が外を向いていたら不正解

            if (firstColor === null) {
                firstColor = color;
            } else if (firstColor !== color) {
                return false; // 面の色が揃っていない
            }
        }
    }
    return true;
}
