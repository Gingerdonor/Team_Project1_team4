document.addEventListener('DOMContentLoaded', () => {

    // 1. 필요한 HTML 요소들을 가져옵니다.
    const deckView = document.getElementById('card-deck');
    const effectView = document.getElementById('card-effect');
    const resultView = document.getElementById('card-result');
    const drawButton = document.getElementById('draw-button');
    const effectSound = document.getElementById('card-effect-sound');
    const dynamicEffectContainer = document.getElementById('dynamic-card-effect-container');

    // drawButton이 없으면 스크립트 실행 중단
    if (!drawButton) return;

    const apiUrl = drawButton.dataset.apiUrl;

    // 결과 카드 상세 정보
    const detailedMbti = document.getElementById('detailed-mbti');
    const detailedColor = document.getElementById('detailed-color');
    const detailedCeleb = document.getElementById('detailed-celeb');

    // 결과 카드 디자인 요소
    const resultMbtiCircle = document.getElementById('result-mbti'); // MBTI 원형 텍스트
    const personalColorDisplay = document.getElementById('personal-color-display'); // 색상 원
    const resultColorText = document.getElementById('result-color-text'); // 퍼스널 컬러 텍스트
    const resultCelebImage = document.getElementById('result-celeb-image'); // 유명인 이미지
    const resultCelebText = document.getElementById('result-celeb-text'); // 유명인 텍스트

    // 이미지 저장 및 공유 버튼
    const saveButton = document.getElementById('save-image-btn');
    const shareButton = document.getElementById('share-btn');
    const cardContent = document.getElementById('result-card-content');

    // 초기 상태: 카드 덱만 보여주기
    deckView.classList.add('active');

    /**
     * 특정 시각 효과를 동적으로 컨테이너에 추가하고 보여주는 함수
     * @param {string} effectType - "lightning", "shuffle" 등 효과 타입
     */
    function showDynamicEffect(effectType) {
        // 컨테이너 초기화
        dynamicEffectContainer.innerHTML = ''; 

        switch (effectType) {
            case 'lightning':
                // 번개 효과 엘리먼트 추가
                const lightningFlash = document.createElement('div');
                lightningFlash.classList.add('lightning-effect');
                dynamicEffectContainer.appendChild(lightningFlash);

                // 선택 사항: 더 복잡한 번개 선 추가
                // for (let i = 1; i <= 3; i++) {
                //     const lightningLine = document.createElement('div');
                //     lightningLine.classList.add(`lightning-line-${i}`);
                //     lightningLine.style.setProperty('--delay', `${i * 0.1}s`); // 애니메이션 지연 시간 변수 설정
                //     dynamicEffectContainer.appendChild(lightningLine);
                // }
                break;
            case 'shuffle':
                // 기존 셔플 애니메이션 엘리먼트 추가 (HTML에서 미리 정의된 것 가져옴)
                const card1 = document.createElement('div'); card1.classList.add('anim-card', 'card-1');
                const card2 = document.createElement('div'); card2.classList.add('anim-card', 'card-2');
                const card3 = document.createElement('div'); card3.classList.add('anim-card', 'card-3');
                dynamicEffectContainer.appendChild(card1);
                dynamicEffectContainer.appendChild(card2);
                dynamicEffectContainer.appendChild(card3);
                // (CSS에 .anim-card, @keyframes shuffle 스타일이 다시 추가되어야 함)
                break;
            default:
                // 기본 로딩 스피너 (폴백)
                const spinner = document.createElement('div');
                spinner.classList.add('loader-spinner');
                dynamicEffectContainer.appendChild(spinner);
                break;
        }
    }

    // 2. '카드 뽑기' 버튼에 클릭 이벤트 리스너를 추가합니다.
    drawButton.addEventListener('click', function() {
        // 1단계: 덱 숨기고, 로딩(효과) 보여주기
        deckView.classList.remove('active');
        effectView.classList.add('active');

        // --- 시각 효과 선택 및 재생 ---
        // 여기서 어떤 효과를 보여줄지 결정합니다.
        // 예를 들어, 사용자 설정이나 API 응답에서 받은 'effect_item_id' 등을 사용할 수 있습니다.
        const selectedEffect = 'lightning'; // 임시로 'lightning' 효과를 사용

        showDynamicEffect(selectedEffect); // 동적 효과 표시

        // --- 효과음 재생 ---
        if (effectSound) {
            effectSound.currentTime = 0; // 사운드를 처음부터 다시 재생
            effectSound.play();
        }

        // 2단계: 백그라운드에서 서버 API 호출
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // body: JSON.stringify({}) // 필요시 서버로 보낼 데이터 추가
        })
        .then(response => {
            if (!response.ok) {
                // 서버 오류 발생 시
                return response.json().then(err => { throw new Error(err.message || '서버 응답 오류'); });
            }
            return response.json();
        })
        .then(data => {
            // 3단계: API 성공. 로딩(효과) 숨기기
            effectView.classList.remove('active');
            
            // 4단계: JSON 데이터로 결과 카드 채우기
            // 상세 정보 업데이트
            detailedMbti.textContent = data.mbti || 'N/A';
            detailedColor.textContent = data.personal_color || 'N/A';
            detailedCeleb.textContent = data.celebrity || 'N/A';

            // 시각적 요소 업데이트
            resultMbtiCircle.textContent = data.mbti || 'MBTI';
            resultColorText.textContent = data.personal_color || '퍼스널 컬러';
            resultCelebText.textContent = data.celebrity || '유명인';

            // 퍼스널 컬러 원형 배경색 설정 (API 응답에 personal_color_code가 있다고 가정)
            if (data.personal_color_code) {
                personalColorDisplay.style.backgroundColor = data.personal_color_code;
            } else {
                personalColorDisplay.style.backgroundColor = '#ccc'; // 기본 회색
            }

            // 유명인 이미지 설정 (API 응답에 celebrity_image_url이 있다고 가정)
            if (data.celebrity_image_url) {
                resultCelebImage.src = data.celebrity_image_url;
            } else {
                resultCelebImage.src = "/static/images/default_celeb.png";
            }


            // 5단계: 결과 카드 보여주기
            resultView.classList.add('active');
        })
        .catch(error => {
            // 6단계: API 실패. 로딩(효과) 숨기고 다시 덱 보여주기
            console.error('카드 생성 실패:', error);
            // --- 실패 시 효과음 즉시 중지 ---
            if (effectSound) {
                effectSound.pause();
                effectSound.currentTime = 0;
            }
            effectView.classList.remove('active');
            deckView.classList.add('active'); // 에러 시 처음 화면으로 복귀
            alert(`카드 생성 중 오류가 발생했습니다: ${error.message}. 다시 시도해주세요.`);
        });
    });

    // --- 4. 이미지 저장 및 공유 기능 ---
    
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            // html2canvas 라이브러리가 로드되었다면 아래 코드 사용 가능
            // HTML2Canvas는 DOM을 캡처하여 이미지로 변환해주는 라이브러리입니다.
            html2canvas(cardContent, { 
                scale: 2, // 고해상도 이미지 생성을 위해 스케일 조정 (필요시)
                useCORS: true // 외부 이미지 (유명인 사진 등) 로드 시 필요
            }).then(canvas => {
                let a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = 'my_destina_card.png';
                document.body.appendChild(a); // 파이어폭스 등에서 필요
                a.click();
                document.body.removeChild(a); // 다운로드 후 요소 제거
                alert('카드가 이미지로 저장되었습니다!');
            }).catch(error => {
                console.error('이미지 저장 실패:', error);
                alert('이미지 저장에 실패했습니다. (외부 이미지 로딩 문제일 수 있습니다.)');
            });
        });
    }

    if (shareButton) {
        shareButton.addEventListener('click', function() {
            // Web Share API (주로 모바일에서 작동, HTTPS 필요)
            if (navigator.share) {
                navigator.share({
                    title: 'My Destina 카드',
                    text: `방금 생성된 제 운명 카드를 확인해보세요! MBTI: ${resultMbtiCircle.textContent}, 퍼스널 컬러: ${resultColorText.textContent}`,
                    url: window.location.href
                })
                .then(() => console.log('공유 성공'))
                .catch((error) => console.error('공유 실패:', error));
            } else {
                // Web Share API를 지원하지 않는 브라우저 (주로 PC)
                // 현재 페이지 URL을 클립보드에 복사
                navigator.clipboard.writeText(window.location.href)
                    .then(() => {
                        alert('현재 페이지 링크가 클립보드에 복사되었습니다.');
                    })
                    .catch(err => {
                        console.error('클립보드 복사 실패:', err);
                        alert('공유하기 기능이 지원되지 않는 브라우저입니다.');
                    });
            }
        });
    }
});