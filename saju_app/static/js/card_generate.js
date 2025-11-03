document.addEventListener('DOMContentLoaded', () => {
    // 1. 필요한 HTML 요소들을 가져옵니다.
    const deckView = document.getElementById('card-deck');
    const effectView = document.getElementById('card-effect');
    const resultView = document.getElementById('card-result');
    const drawButton = document.getElementById('draw-button');

    // drawButton이 없으면 스크립트 실행 중단
    if (!drawButton) return;

    const apiUrl = drawButton.dataset.apiUrl;

    // 2. '카드 뽑기' 버튼에 클릭 이벤트 리스너를 추가합니다.
    drawButton.addEventListener('click', function() {
        
        // 1단계: 덱 숨기고, 로딩(효과) 보여주기
        deckView.classList.remove('active');
        effectView.classList.add('active');

        // 2단계: 백그라운드에서 서버 API 호출
        fetch(apiUrl, {
            method: 'POST'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('서버 응답 오류');
            }
            return response.json();
        })
        .then(data => {
            // 3단계: API 성공. 로딩(효과) 숨기기
            effectView.classList.remove('active');
            
            // 4단계: JSON 데이터로 결과 카드 채우기
            document.getElementById('result-mbti').textContent = data.mbti || 'N/A';
            document.getElementById('result-color').textContent = data.personal_color || 'N/A';
            document.getElementById('result-celeb').textContent = data.celebrity || 'N/A';

            // 5단계: 결과 카드 보여주기
            resultView.classList.add('active');
        })
        .catch(error => {
            // 6단계: API 실패. 로딩(효과) 숨기고 다시 덱 보여주기
            console.error('카드 생성 실패:', error);
            effectView.classList.remove('active');
            deckView.classList.add('active');
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        });
    });

    // --- TODO: 4. 이미지 저장 및 공유 기능 ---
    const saveButton = document.getElementById('save-image-btn');
    const shareButton = document.getElementById('share-btn');
    const cardContent = document.getElementById('result-card-content');
    
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            // 'html2canvas' 라이브러리가 필요합니다.
            alert('이미지 저장 기능 구현 필요 (html2canvas)');
            /* 
            // html2canvas 라이브러리가 로드되었다면 아래 코드 사용 가능
            html2canvas(cardContent).then(canvas => {
                let a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = 'my_destina_card.png';
                a.click();
            });
            */
        });
    }

    if (shareButton) {
        shareButton.addEventListener('click', function() {
            // Web Share API (주로 모바일에서 작동)
            if (navigator.share) {
                navigator.share({
                    title: 'My Destina 카드',
                    text: '방금 생성된 제 운명 카드를 확인해보세요!',
                    url: window.location.href
                }).catch(console.error);
            } else {
                alert('공유하기 기능이 지원되지 않는 브라우저입니다.');
            }
        });
    }
});