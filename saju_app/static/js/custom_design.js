document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.querySelector('.design-gallery');
    
    // gallery 요소가 없으면 스크립트 실행 중단
    if (!gallery) return;

    const setActiveUrl = gallery.dataset.setActiveUrl;

    document.querySelectorAll('.apply-btn').forEach(button => {
        button.addEventListener('click', function() {
            const designId = this.dataset.designId;
            
            // 1. API에 POST 요청
            fetch(setActiveUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ design_id: designId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 2. 성공 시, 페이지 새로고침
                    alert(data.message); // "적용했습니다" 알림
                    window.location.reload(); 
                } else {
                    // 3. 실패 시, 에러 메시지
                    alert('오류: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('네트워크 오류가 발생했습니다.');
            });
        });
    });
});